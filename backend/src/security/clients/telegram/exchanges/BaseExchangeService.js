// backend/clients/exchanges/BaseExchangeService.js - النسخة المتقدمة والمحسنة
const axios = require('axios');
const crypto = require('crypto');
const EventEmitter = require('events');
const { performance } = require('perf_hooks');

class BaseExchangeService extends EventEmitter {
    constructor(credentials, options = {}) {
        super();
        
        // تشفير البيانات الاعتمادية
        this.encryptedCredentials = credentials;
        this.credentials = this.decryptCredentials(credentials);
        
        this.options = {
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
            debug: false,
            enableCompression: true,
            enableCaching: true,
            cacheTTL: 30000,
            rateLimit: 10,
            circuitBreaker: {
                failureThreshold: 5,
                resetTimeout: 60000,
                halfOpenAttempts: 3
            },
            security: {
                enableIPWhitelist: true,
                enableRequestSigning: true,
                enableEncryption: true
            },
            ...options
        };
        
        this.name = 'Base Exchange';
        this.connected = false;
        this.lastPing = null;
        this.requestCount = 0;
        this.errorCount = 0;
        this.circuitBreaker = {
            failures: 0,
            state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
            nextAttempt: null,
            halfOpenSuccess: 0
        };
        
        // تخزين البيانات
        this.balances = new Map();
        this.orders = new Map();
        this.markets = new Map();
        this.positions = new Map();
        this.cache = new Map();
        this.rateLimiter = {
            tokens: this.options.rateLimit,
            lastRefill: Date.now(),
            refillRate: this.options.rateLimit / 1000 // tokens per ms
        };
        
        // الإحصائيات
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalResponseTime: 0,
            averageResponseTime: 0,
            lastError: null,
            healthScore: 100
        };
        
        this.initializeService();
    }

    // === التهيئة والإعداد ===
    initializeService() {
        this.setupAxiosInstance();
        this.setupRequestInterceptor();
        this.setupResponseInterceptor();
        this.setupHealthMonitoring();
        this.setupCacheCleanup();
        
        console.log(`🔧 تهيئة خدمة ${this.name}...`);
    }

    setupAxiosInstance() {
        this.axiosInstance = axios.create({
            timeout: this.options.timeout,
            headers: {
                'User-Agent': 'QuantumAITrader/2.0.0',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Accept-Encoding': this.options.enableCompression ? 'gzip, deflate' : 'identity'
            },
            httpsAgent: new (require('https').Agent)({
                keepAlive: true,
                maxSockets: 100,
                maxFreeSockets: 10,
                timeout: this.options.timeout
            })
        });
    }

    // === تشفير وفك تشفير البيانات الاعتمادية ===
    decryptCredentials(encryptedData) {
        try {
            const algorithm = 'aes-256-gcm';
            const key = crypto.scryptSync(process.env.EXCHANGE_ENCRYPTION_KEY || 'default-key', 'salt', 32);
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const authTag = Buffer.from(encryptedData.authTag, 'hex');
            
            const decipher = crypto.createDecipher(algorithm, key);
            decipher.setAAD(Buffer.from('additional-data'));
            decipher.setAuthTag(authTag);
            
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            this.emit('security_error', {
                type: 'DECRYPTION_FAILED',
                error: error.message,
                timestamp: new Date()
            });
            throw new Error('فشل فك تشفير البيانات الاعتمادية');
        }
    }

    encryptData(data) {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(process.env.EXCHANGE_ENCRYPTION_KEY || 'default-key', 'salt', 32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipher(algorithm, key);
        cipher.setAAD(Buffer.from('additional-data'));
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            algorithm
        };
    }

    // === معالجة الطلبات والاستجابات ===
    setupRequestInterceptor() {
        this.axiosInstance.interceptors.request.use(
            async (config) => {
                if (this.isCircuitBreakerOpen()) {
                    throw new Error(`القاطع الدائري مفتوح لـ ${this.name}`);
                }

                // التحقق من معدل الطلبات
                await this.checkRateLimit();

                // تسجيل الطلب
                this.logRequest(config.method?.toUpperCase(), config.url, this.sanitizeData(config.data));

                // تتبع الأداء
                config.metadata = { startTime: performance.now() };

                // إضافة التواقيع إذا لزم الأمر
                if (this.requiresAuthentication(config.url)) {
                    config.headers = {
                        ...config.headers,
                        ...await this.getAuthHeaders(config)
                    };
                }

                this.trackRequest('outgoing');
                return config;
            },
            (error) => {
                this.handleError('REQUEST_ERROR', error, null);
                return Promise.reject(error);
            }
        );
    }

    setupResponseInterceptor() {
        this.axiosInstance.interceptors.response.use(
            (response) => {
                const duration = performance.now() - response.config.metadata.startTime;
                
                this.logResponse(
                    response.config.method?.toUpperCase(),
                    response.config.url,
                    {
                        status: response.status,
                        duration: `${duration.toFixed(2)}ms`,
                        data: this.options.debug ? this.sanitizeData(response.data) : '***'
                    }
                );

                this.trackSuccess(duration);
                this.updateCircuitBreaker('success');

                // تخزين في الذاكرة المؤقتة إذا كان ذلك مناسباً
                if (this.shouldCacheResponse(response)) {
                    this.cacheResponse(response);
                }

                return response;
            },
            (error) => {
                const duration = error.config?.metadata ? 
                    performance.now() - error.config.metadata.startTime : 0;

                this.handleError('RESPONSE_ERROR', error, duration);
                this.updateCircuitBreaker('failure');

                // إعادة المحاولة إذا كان الخطأ قابلاً لإعادة المحاولة
                if (this.isRetryableError(error) && error.config) {
                    return this.retryRequest(error.config);
                }

                return Promise.reject(error);
            }
        );
    }

    // === إدارة القاطع الدائري ===
    isCircuitBreakerOpen() {
        if (this.circuitBreaker.state !== 'OPEN') return false;

        if (this.circuitBreaker.nextAttempt && Date.now() >= this.circuitBreaker.nextAttempt) {
            this.circuitBreaker.state = 'HALF_OPEN';
            this.circuitBreaker.halfOpenSuccess = 0;
            this.circuitBreaker.nextAttempt = null;
            return false;
        }

        return true;
    }

    updateCircuitBreaker(type) {
        if (type === 'success') {
            if (this.circuitBreaker.state === 'HALF_OPEN') {
                this.circuitBreaker.halfOpenSuccess++;
                if (this.circuitBreaker.halfOpenSuccess >= this.options.circuitBreaker.halfOpenAttempts) {
                    this.circuitBreaker.state = 'CLOSED';
                    this.circuitBreaker.failures = 0;
                    this.emit('circuit_breaker_closed', { exchange: this.name, timestamp: new Date() });
                }
            } else {
                this.circuitBreaker.failures = Math.max(0, this.circuitBreaker.failures - 1);
            }
        } else if (type === 'failure') {
            this.circuitBreaker.failures++;
            
            if (this.circuitBreaker.state === 'HALF_OPEN') {
                this.circuitBreaker.state = 'OPEN';
                this.circuitBreaker.nextAttempt = Date.now() + this.options.circuitBreaker.resetTimeout;
            } else if (this.circuitBreaker.failures >= this.options.circuitBreaker.failureThreshold) {
                this.circuitBreaker.state = 'OPEN';
                this.circuitBreaker.nextAttempt = Date.now() + this.options.circuitBreaker.resetTimeout;
                this.emit('circuit_breaker_opened', { 
                    exchange: this.name, 
                    failures: this.circuitBreaker.failures,
                    timestamp: new Date() 
                });
            }
        }
    }

    // === إدارة معدل الطلبات ===
    async checkRateLimit() {
        const now = Date.now();
        const elapsed = now - this.rateLimiter.lastRefill;
        
        // تجديد الرموز
        this.rateLimiter.tokens = Math.min(
            this.options.rateLimit,
            this.rateLimiter.tokens + elapsed * this.rateLimiter.refillRate
        );
        this.rateLimiter.lastRefill = now;

        if (this.rateLimiter.tokens < 1) {
            const waitTime = (1 - this.rateLimiter.tokens) / this.rateLimiter.refillRate;
            await this.delay(waitTime);
            return this.checkRateLimit();
        }

        this.rateLimiter.tokens -= 1;
        return true;
    }

    // === الدوال الأساسية التي يجب على جميع المنصات تنفيذها ===
    async connect() {
        throw new Error('يجب تطبيق دالة connect في الخدمة الفرعية');
    }

    async disconnect() {
        this.connected = false;
        this.emit('disconnected', { 
            exchange: this.name, 
            timestamp: new Date(),
            stats: this.getStats()
        });
    }

    async getBalance() {
        throw new Error('يجب تطبيق دالة getBalance في الخدمة الفرعية');
    }

    async createOrder(orderData) {
        throw new Error('يجب تطبيق دالة createOrder في الخدمة الفرعية');
    }

    async cancelOrder(orderId, symbol) {
        throw new Error('يجب تطبيق دالة cancelOrder في الخدمة الفرعية');
    }

    async getOrder(orderId, symbol) {
        throw new Error('يجب تطبيق دالة getOrder في الخدمة الفرعية');
    }

    async getOpenOrders(symbol = null) {
        throw new Error('يجب تطبيق دالة getOpenOrders في الخدمة الفرعية');
    }

    async getMarkets() {
        throw new Error('يجب تطبيق دالة getMarkets في الخدمة الفرعية');
    }

    async getTicker(symbol) {
        throw new Error('يجب تطبيق دالة getTicker في الخدمة الفرعية');
    }

    async getOrderBook(symbol, limit = 100) {
        throw new Error('يجب تطبيق دالة getOrderBook في الخدمة الفرعية');
    }

    async getTrades(symbol, since = null, limit = 100) {
        throw new Error('يجب تطبيق دالة getTrades في الخدمة الفرعية');
    }

    async getPositions(symbol = null) {
        throw new Error('يجب تطبيق دالة getPositions في الخدمة الفرعية');
    }

    // === الدوال المساعدة المحسنة ===
    async testConnection() {
        try {
            const startTime = performance.now();
            const balance = await this.getBalance();
            const duration = performance.now() - startTime;

            this.connected = true;
            this.lastPing = new Date();
            
            this.emit('connected', { 
                exchange: this.name, 
                timestamp: this.lastPing,
                balance: this.sanitizeData(balance),
                responseTime: duration
            });

            this.updateHealthScore(10); // زيادة درجة الصحة
            return true;

        } catch (error) {
            this.connected = false;
            this.updateHealthScore(-20); // خفض درجة الصحة
            this.handleError('CONNECTION_TEST_FAILED', error);
            throw error;
        }
    }

    async executeWithRetry(apiCall, context = 'API Call', options = {}) {
        const retryOptions = {
            attempts: options.attempts || this.options.retryAttempts,
            delay: options.delay || this.options.retryDelay,
            backoff: options.backoff || 'exponential',
            ...options
        };

        let lastError;
        
        for (let attempt = 1; attempt <= retryOptions.attempts; attempt++) {
            try {
                const result = await apiCall();
                return result;

            } catch (error) {
                lastError = error;
                
                if (this.isRetryableError(error) && attempt < retryOptions.attempts) {
                    const delay = retryOptions.backoff === 'exponential' 
                        ? retryOptions.delay * Math.pow(2, attempt - 1)
                        : retryOptions.delay;
                    
                    this.emit('retry_attempt', {
                        exchange: this.name,
                        context,
                        attempt,
                        maxAttempts: retryOptions.attempts,
                        delay,
                        error: error.message,
                        timestamp: new Date()
                    });

                    await this.delay(delay);
                    continue;
                }
                break;
            }
        }
        
        const finalError = new Error(
            `فشل ${context} بعد ${retryOptions.attempts} محاولات: ${lastError.message}`
        );
        finalError.originalError = lastError;
        finalError.attempts = retryOptions.attempts;
        
        this.handleError('RETRY_EXHAUSTED', finalError);
        throw finalError;
    }

    isRetryableError(error) {
        const retryableStatuses = [408, 429, 500, 502, 503, 504];
        const retryableMessages = [
            'timeout', 'rate limit', 'busy', 'overload', 'maintenance',
            'network', 'socket', 'connection'
        ];
        
        if (error.response && retryableStatuses.includes(error.response.status)) {
            return true;
        }
        
        if (retryableMessages.some(msg => error.message.toLowerCase().includes(msg))) {
            return true;
        }
        
        // أخطاء الشبكة
        if (error.code && ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].includes(error.code)) {
            return true;
        }
        
        return false;
    }

    async retryRequest(config) {
        // يمكن تطبيق منطق إعادة المحاولة المتقدم هنا
        return this.axiosInstance(config);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // === إدارة الطلبات والتتبع ===
    trackRequest(type = 'outgoing') {
        this.requestCount++;
        this.stats.totalRequests++;

        this.emit('api_request', {
            exchange: this.name,
            type,
            count: this.requestCount,
            timestamp: new Date()
        });
    }

    trackSuccess(duration) {
        this.stats.successfulRequests++;
        this.stats.totalResponseTime += duration;
        this.stats.averageResponseTime = this.stats.totalResponseTime / this.stats.successfulRequests;
        
        this.updateHealthScore(1); // زيادة طفيفة في درجة الصحة
    }

    trackFailure(error) {
        this.stats.failedRequests++;
        this.stats.lastError = {
            message: error.message,
            timestamp: new Date()
        };
        
        this.updateHealthScore(-5); // خفض درجة الصحة
    }

    updateHealthScore(delta) {
        this.stats.healthScore = Math.max(0, Math.min(100, this.stats.healthScore + delta));
        
        if (this.stats.healthScore < 50) {
            this.emit('health_degraded', {
                exchange: this.name,
                score: this.stats.healthScore,
                timestamp: new Date()
            });
        }
    }

    // === التسجيل والمراقبة ===
    logRequest(method, endpoint, data = null) {
        if (this.options.debug) {
            console.log(`📤 ${this.name} ${method} ${endpoint}`, data || '');
        }

        this.emit('request_log', {
            exchange: this.name,
            method,
            endpoint,
            data,
            timestamp: new Date()
        });
    }

    logResponse(method, endpoint, response) {
        if (this.options.debug) {
            console.log(`📥 ${this.name} ${method} ${endpoint}`, response);
        }

        this.emit('response_log', {
            exchange: this.name,
            method,
            endpoint,
            response,
            timestamp: new Date()
        });
    }

    // === معالجة التواقيع والأمان ===
    createSignature(data, secret) {
        return crypto
            .createHmac('sha256', secret)
            .update(data)
            .digest('hex');
    }

    createSignature256(data, secret) {
        return crypto
            .createHmac('sha256', secret)
            .update(data)
            .digest('hex');
    }

    async getAuthHeaders(config) {
        // يجب تطبيق هذا في الخدمات الفرعية
        return {};
    }

    requiresAuthentication(url) {
        const publicEndpoints = ['/ping', '/time', '/exchangeInfo', '/ticker/price', '/ticker/24hr'];
        return !publicEndpoints.some(endpoint => url.includes(endpoint));
    }

    // === إدارة الذاكرة المؤقتة ===
    shouldCacheResponse(response) {
        const cacheableMethods = ['GET'];
        const cacheableEndpoints = ['/exchangeInfo', '/ticker/24hr', '/depth'];
        
        return cacheableMethods.includes(response.config.method?.toUpperCase()) &&
               cacheableEndpoints.some(endpoint => response.config.url.includes(endpoint));
    }

    cacheResponse(response) {
        const cacheKey = `${response.config.method}:${response.config.url}`;
        const cacheData = {
            data: response.data,
            timestamp: Date.now(),
            ttl: this.options.cacheTTL
        };
        
        this.cache.set(cacheKey, cacheData);
    }

    getCachedResponse(method, url) {
        const cacheKey = `${method}:${url}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            return cached.data;
        }
        
        if (cached) {
            this.cache.delete(cacheKey); // تنظيف الذاكرة المؤقتة منتهية الصلاحية
        }
        
        return null;
    }

    setupCacheCleanup() {
        setInterval(() => {
            this.cleanupExpiredCache();
        }, 60000); // تنظيف كل دقيقة
    }

    cleanupExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > value.ttl) {
                this.cache.delete(key);
            }
        }
    }

    // === المراقبة الصحية ===
    setupHealthMonitoring() {
        setInterval(() => {
            this.performHealthCheck();
        }, 300000); // فحص الصحة كل 5 دقائق
    }

    async performHealthCheck() {
        try {
            await this.testConnection();
            this.emit('health_check', {
                exchange: this.name,
                status: 'healthy',
                score: this.stats.healthScore,
                timestamp: new Date()
            });
        } catch (error) {
            this.emit('health_check', {
                exchange: this.name,
                status: 'unhealthy',
                score: this.stats.healthScore,
                error: error.message,
                timestamp: new Date()
            });
        }
    }

    // === معالجة الأخطاء ===
    handleError(type, error, duration = null) {
        this.errorCount++;
        this.trackFailure(error);

        const errorInfo = {
            exchange: this.name,
            type,
            error: error.message,
            code: error.code,
            status: error.response?.status,
            duration,
            timestamp: new Date(),
            stack: this.options.debug ? error.stack : undefined
        };

        console.error(`❌ خطأ في ${this.name}:`, errorInfo);
        
        this.emit('error', errorInfo);
        
        // تسجيل الخطأ للأغراض الأمنية
        if (this.isSecurityError(error)) {
            this.emit('security_alert', {
                ...errorInfo,
                severity: 'HIGH',
                action: 'REVIEW_CREDENTIALS'
            });
        }
    }

    isSecurityError(error) {
        const securityMessages = [
            'invalid signature', 'api key', 'unauthorized', 'authentication',
            'permission denied', 'forbidden', 'ip whitelist'
        ];
        
        return securityMessages.some(msg => 
            error.message.toLowerCase().includes(msg)
        ) || error.response?.status === 401 || error.response?.status === 403;
    }

    // === أدوات المساعدة ===
    validateOrderData(orderData) {
        const required = ['symbol', 'side', 'type', 'quantity'];
        const missing = required.filter(field => !orderData[field]);
        
        if (missing.length > 0) {
            throw new Error(`بيانات الطلب ناقصة: ${missing.join(', ')}`);
        }

        if (orderData.type === 'limit' && !orderData.price) {
            throw new Error('سعر الطلب مطلوب لأوامر الحد');
        }

        if (orderData.quantity <= 0) {
            throw new Error('الكمية يجب أن تكون أكبر من الصفر');
        }

        if (orderData.price && orderData.price <= 0) {
            throw new Error('السعر يجب أن يكون أكبر من الصفر');
        }

        return true;
    }

    formatSymbol(symbol) {
        return symbol.replace('/', '').toUpperCase();
    }

    parseSymbol(symbol) {
        const match = symbol.match(/([A-Za-z]+)(USDT|BUSD|USDC|EUR|GBP|JPY|BTC|ETH)$/);
        if (match) {
            return `${match[1]}/${match[2]}`;
        }
        return symbol;
    }

    calculateAmount(quantity, price, precision = 8) {
        const amount = quantity * price;
        return this.roundToPrecision(amount, precision);
    }

    roundToPrecision(value, precision) {
        const factor = Math.pow(10, precision);
        return Math.round(value * factor) / factor;
    }

    sanitizeData(data) {
        if (!data || typeof data !== 'object') return data;
        
        const sensitiveFields = ['apiKey', 'secret', 'passphrase', 'signature', 'token'];
        const sanitized = { ...data };
        
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '***';
            }
        }
        
        return sanitized;
    }

    // === إدارة الحالة ===
    updateBalance(asset, amount) {
        this.balances.set(asset, amount);
        this.emit('balance_updated', {
            exchange: this.name,
            asset,
            amount,
            timestamp: new Date()
        });
    }

    updateOrder(order) {
        this.orders.set(order.orderId, order);
        this.emit('order_updated', {
            exchange: this.name,
            orderId: order.orderId,
            status: order.status,
            symbol: order.symbol,
            timestamp: new Date()
        });
    }

    // === الإحصائيات ===
    getStats() {
        return {
            exchange: this.name,
            connected: this.connected,
            requestCount: this.requestCount,
            errorCount: this.errorCount,
            successRate: this.stats.totalRequests > 0 ? 
                (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) : 0,
            averageResponseTime: this.stats.averageResponseTime.toFixed(2),
            lastPing: this.lastPing,
            healthScore: this.stats.healthScore,
            circuitBreaker: { ...this.circuitBreaker },
            cacheSize: this.cache.size,
            balances: Object.fromEntries(this.balances),
            activeOrders: this.orders.size,
            uptime: this.lastPing ? Date.now() - this.lastPing.getTime() : 0
        };
    }

    getDetailedStats() {
        const basicStats = this.getStats();
        return {
            ...basicStats,
            rateLimiter: { ...this.rateLimiter },
            performance: {
                totalResponseTime: this.stats.totalResponseTime,
                successfulRequests: this.stats.successfulRequests,
                failedRequests: this.stats.failedRequests
            },
            lastError: this.stats.lastError
        };
    }

    // === التنظيف ===
    async cleanup() {
        this.connected = false;
        this.balances.clear();
        this.orders.clear();
        this.markets.clear();
        this.positions.clear();
        this.cache.clear();
        
        this.emit('cleanup', {
            exchange: this.name,
            timestamp: new Date(),
            finalStats: this.getStats()
        });
    }

    // === الاسترداد ===
    async reconnect() {
        try {
            await this.disconnect();
            await this.delay(1000);
            await this.connect();
            
            this.emit('reconnected', {
                exchange: this.name,
                timestamp: new Date()
            });
            
            return true;
        } catch (error) {
            this.handleError('RECONNECTION_FAILED', error);
            throw error;
        }
    }
}

module.exports = BaseExchangeService;