// backend/clients/exchanges/ExchangeFactory.js - النسخة المتقدمة والمحسنة
const axios = require('axios');
const crypto = require('crypto');
const EventEmitter = require('events');
const { performance } = require('perf_hooks');

class ExchangeFactory extends EventEmitter {
    constructor() {
        super();
        
        this.supportedExchanges = new Map();
        this.exchangeConfigs = new Map();
        this.connectionPool = new Map();
        this.rateLimiters = new Map();
        this.healthStatus = new Map();
        this.performanceMetrics = new Map();
        this.circuitBreakers = new Map();
        
        this.encryptionKey = process.env.EXCHANGE_ENCRYPTION_KEY || crypto.randomBytes(32);
        this.maxConnectionsPerExchange = 10;
        this.connectionTimeout = 30000;
        
        this.initializeSupportedExchanges();
        this.initializeHealthMonitoring();
        this.initializePerformanceTracking();
        
        console.log('🚀 نظام إدارة منصات التداول المتقدم جاهز للعمل');
    }

    // تهيئة المنصات المدعومة مع تحسينات الأمان
    initializeSupportedExchanges() {
        const exchanges = {
            'mexc': {
                name: 'MEXC Global',
                service: require('./exchanges/MEXCService'),
                requires: ['apiKey', 'secret'],
                supportedAssets: ['crypto', 'spot', 'future', 'margin'],
                features: ['spot', 'future', 'margin', 'staking', 'savings'],
                rateLimit: 20,
                precision: 8,
                baseUrl: 'https://api.mexc.com',
                version: 'v3',
                status: 'active',
                supportedPairs: 1500,
                volumeRank: 8,
                security: {
                    requiresWhitelist: false,
                    supportsIPRestriction: true,
                    maxAPIKeys: 5
                }
            },
            'binance': {
                name: 'Binance',
                service: require('./exchanges/BinanceService'),
                requires: ['apiKey', 'secret'],
                supportedAssets: ['crypto', 'spot', 'future', 'margin', 'defi', 'options'],
                features: ['spot', 'future', 'margin', 'options', 'staking', 'earn', 'mining'],
                rateLimit: 30,
                precision: 8,
                baseUrl: 'https://api.binance.com',
                version: 'v3',
                status: 'active',
                supportedPairs: 1800,
                volumeRank: 1,
                security: {
                    requiresWhitelist: true,
                    supportsIPRestriction: true,
                    maxAPIKeys: 5
                }
            },
            'kucoin': {
                name: 'KuCoin',
                service: require('./exchanges/KucoinService'),
                requires: ['apiKey', 'secret', 'passphrase'],
                supportedAssets: ['crypto', 'spot', 'future', 'margin'],
                features: ['spot', 'future', 'margin', 'staking', 'lending'],
                rateLimit: 18,
                precision: 8,
                baseUrl: 'https://api.kucoin.com',
                version: 'v1',
                status: 'active',
                supportedPairs: 1200,
                volumeRank: 5,
                security: {
                    requiresWhitelist: true,
                    supportsIPRestriction: true,
                    maxAPIKeys: 3
                }
            },
            'bybit': {
                name: 'Bybit',
                service: require('./exchanges/BybitService'),
                requires: ['apiKey', 'secret'],
                supportedAssets: ['crypto', 'spot', 'future', 'options', 'derivatives'],
                features: ['spot', 'future', 'options', 'copy_trading', 'earn'],
                rateLimit: 15,
                precision: 8,
                baseUrl: 'https://api.bybit.com',
                version: 'v5',
                status: 'active',
                supportedPairs: 800,
                volumeRank: 4,
                security: {
                    requiresWhitelist: false,
                    supportsIPRestriction: true,
                    maxAPIKeys: 5
                }
            },
            'okx': {
                name: 'OKX',
                service: require('./exchanges/OKXService'),
                requires: ['apiKey', 'secret', 'passphrase'],
                supportedAssets: ['crypto', 'spot', 'future', 'options', 'defi', 'staking'],
                features: ['spot', 'future', 'options', 'earn', 'defi', 'staking'],
                rateLimit: 12,
                precision: 8,
                baseUrl: 'https://www.okx.com',
                version: 'v5',
                status: 'active',
                supportedPairs: 1600,
                volumeRank: 3,
                security: {
                    requiresWhitelist: true,
                    supportsIPRestriction: true,
                    maxAPIKeys: 5
                }
            },
            'gateio': {
                name: 'Gate.io',
                service: require('./exchanges/GateioService'),
                requires: ['apiKey', 'secret'],
                supportedAssets: ['crypto', 'spot', 'future', 'margin'],
                features: ['spot', 'future', 'margin', 'staking', 'lending'],
                rateLimit: 10,
                precision: 8,
                baseUrl: 'https://api.gateio.ws',
                version: 'v4',
                status: 'active',
                supportedPairs: 1400,
                volumeRank: 6,
                security: {
                    requiresWhitelist: false,
                    supportsIPRestriction: true,
                    maxAPIKeys: 5
                }
            },
            'huobi': {
                name: 'Huobi Global',
                service: require('./exchanges/HuobiService'),
                requires: ['apiKey', 'secret'],
                supportedAssets: ['crypto', 'spot', 'future', 'margin'],
                features: ['spot', 'future', 'margin', 'staking', 'mining'],
                rateLimit: 10,
                precision: 8,
                baseUrl: 'https://api.huobi.pro',
                version: 'v1',
                status: 'active',
                supportedPairs: 1000,
                volumeRank: 7,
                security: {
                    requiresWhitelist: true,
                    supportsIPRestriction: true,
                    maxAPIKeys: 5
                }
            }
        };

        // تحميل التكوينات في الخرائط
        Object.entries(exchanges).forEach(([key, config]) => {
            this.supportedExchanges.set(key, config.service);
            this.exchangeConfigs.set(key, config);
        });
    }

    // إنشاء خدمة منصة محسنة مع إدارة اتصالات متقدمة
    async createExchangeService(exchangeName, credentials, options = {}) {
        const startTime = performance.now();
        
        try {
            if (!this.supportedExchanges.has(exchangeName)) {
                throw new Error(`المنصة ${exchangeName} غير مدعومة`);
            }

            // التحقق من حالة القاطع الدائري
            if (this.isCircuitBreakerOpen(exchangeName)) {
                throw new Error(`المنصة ${exchangeName} معطلة مؤقتاً بسبب كثرة الأخطاء`);
            }

            // التحقق من حدود الاتصالات
            this.validateConnectionLimits(exchangeName);

            // التحقق من صحة البيانات الاعتمادية
            this.validateCredentials(exchangeName, credentials);

            // تشفير البيانات الاعتمادية
            const encryptedCredentials = this.encryptCredentials(credentials);

            const ExchangeClass = this.supportedExchanges.get(exchangeName);
            const exchangeInstance = new ExchangeClass(encryptedCredentials, {
                timeout: this.connectionTimeout,
                retryAttempts: 3,
                retryDelay: 1000,
                ...options
            });

            // إعداد المراقبة
            await this.setupMonitoring(exchangeName, exchangeInstance);

            // إنشاء اتصال
            const connection = await this.createConnection(exchangeName, exchangeInstance, credentials);

            // تحديث المقاييس
            this.recordPerformanceMetric(exchangeName, 'connection_time', performance.now() - startTime);

            this.emit('exchange_connected', {
                exchange: exchangeName,
                connectionId: connection.connectionId,
                timestamp: new Date(),
                performance: performance.now() - startTime
            });

            console.log(`✅ تم إنشاء خدمة منصة ${exchangeName} بنجاح (${performance.now() - startTime}ms)`);
            return exchangeInstance;

        } catch (error) {
            this.handleConnectionError(exchangeName, error, performance.now() - startTime);
            throw error;
        }
    }

    // إنشاء اتصال آمن
    async createConnection(exchangeName, instance, credentials) {
        const connectionId = this.generateConnectionId(exchangeName, credentials);
        
        const connection = {
            connectionId,
            instance,
            exchange: exchangeName,
            credentials: this.maskCredentials(credentials),
            encryptedCredentials: this.encryptCredentials(credentials),
            createdAt: new Date(),
            lastActivity: new Date(),
            status: 'connected',
            requestCount: 0,
            errorCount: 0,
            totalResponseTime: 0,
            metadata: {
                ip: credentials.ip || 'unknown',
                userAgent: credentials.userAgent || 'unknown',
                clientVersion: credentials.clientVersion || '1.0.0'
            }
        };

        this.connectionPool.set(connectionId, connection);
        return connection;
    }

    // تشفير البيانات الاعتمادية
    encryptCredentials(credentials) {
        const algorithm = 'aes-256-gcm';
        const iv = crypto.randomBytes(16);
        const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
        
        const cipher = crypto.createCipher(algorithm, key);
        cipher.setAAD(Buffer.from('additional-data'));
        
        let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            algorithm
        };
    }

    // فك تشفير البيانات الاعتمادية
    decryptCredentials(encryptedData) {
        try {
            const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const authTag = Buffer.from(encryptedData.authTag, 'hex');
            
            const decipher = crypto.createDecipher(encryptedData.algorithm, key);
            decipher.setAAD(Buffer.from('additional-data'));
            decipher.setAuthTag(authTag);
            
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            throw new Error('فشل فك تشفير البيانات الاعتمادية');
        }
    }

    // إعداد المراقبة المتقدمة
    async setupMonitoring(exchangeName, instance) {
        // مراقبة الأخطاء
        instance.on('error', (error) => {
            this.handleExchangeError(exchangeName, error);
        });

        // مراقبة النشاط
        instance.on('activity', (data) => {
            this.recordActivity(exchangeName, data);
        });

        // مراقبة الأداء
        instance.on('performance', (data) => {
            this.recordPerformanceMetric(exchangeName, data.metric, data.value);
        });

        // فحص الصحة الأولي
        await this.performHealthCheck(exchangeName, instance);
    }

    // إدارة أخطاء المنصة
    handleExchangeError(exchangeName, error) {
        console.error(`❌ خطأ في منصة ${exchangeName}:`, error);
        
        // تحديث حالة الصحة
        this.healthStatus.set(exchangeName, 'unhealthy');
        
        // تحديث عداد الأخطاء للقاطع الدائري
        this.updateCircuitBreaker(exchangeName, 'error');
        
        this.emit('exchange_error', {
            exchange: exchangeName,
            error: error.message,
            timestamp: new Date(),
            severity: this.determineErrorSeverity(error)
        });
    }

    // تحديد شدة الخطأ
    determineErrorSeverity(error) {
        if (error.message.includes('rate limit') || error.message.includes('429')) {
            return 'medium';
        }
        if (error.message.includes('timeout') || error.message.includes('network')) {
            return 'low';
        }
        if (error.message.includes('authentication') || error.message.includes('401')) {
            return 'high';
        }
        if (error.message.includes('balance') || error.message.includes('insufficient')) {
            return 'medium';
        }
        return 'low';
    }

    // القاطع الدائري لمنع الانهيار
    updateCircuitBreaker(exchangeName, type) {
        if (!this.circuitBreakers.has(exchangeName)) {
            this.circuitBreakers.set(exchangeName, {
                failureCount: 0,
                successCount: 0,
                state: 'CLOSED',
                nextAttempt: null,
                lastFailure: null
            });
        }

        const breaker = this.circuitBreakers.get(exchangeName);

        if (type === 'error') {
            breaker.failureCount++;
            breaker.successCount = 0;
            breaker.lastFailure = new Date();

            if (breaker.failureCount >= 5 && breaker.state === 'CLOSED') {
                breaker.state = 'OPEN';
                breaker.nextAttempt = new Date(Date.now() + 60000); // 1 minute
                console.log(`🔴 القاطع الدائري مفتوح لـ ${exchangeName}`);
            }
        } else if (type === 'success') {
            breaker.successCount++;
            breaker.failureCount = 0;

            if (breaker.successCount >= 3 && breaker.state === 'HALF_OPEN') {
                breaker.state = 'CLOSED';
                console.log(`🟢 القاطع الدائري مغلق لـ ${exchangeName}`);
            }
        }
    }

    isCircuitBreakerOpen(exchangeName) {
        const breaker = this.circuitBreakers.get(exchangeName);
        if (!breaker || breaker.state !== 'OPEN') return false;

        if (breaker.nextAttempt && breaker.nextAttempt <= new Date()) {
            breaker.state = 'HALF_OPEN';
            breaker.nextAttempt = null;
            return false;
        }

        return true;
    }

    // التحقق من حدود الاتصالات
    validateConnectionLimits(exchangeName) {
        const connections = Array.from(this.connectionPool.values())
            .filter(conn => conn.exchange === exchangeName && conn.status === 'connected');

        if (connections.length >= this.maxConnectionsPerExchange) {
            throw new Error(`تم تجاوز الحد الأقصى لاتصالات ${exchangeName}`);
        }
    }

    // فحص الصحة المتقدم
    async performHealthCheck(exchangeName, instance) {
        try {
            const startTime = performance.now();
            await instance.testConnection();
            const responseTime = performance.now() - startTime;

            this.healthStatus.set(exchangeName, 'healthy');
            this.recordPerformanceMetric(exchangeName, 'health_check', responseTime);

            // تحديث القاطع الدائري
            this.updateCircuitBreaker(exchangeName, 'success');

        } catch (error) {
            this.healthStatus.set(exchangeName, 'unhealthy');
            this.updateCircuitBreaker(exchangeName, 'error');
            throw error;
        }
    }

    // الحصول على خدمة مع تعقب الأداء
    async getExchangeService(connectionId) {
        const connection = this.connectionPool.get(connectionId);
        if (!connection) {
            throw new Error('الاتصال غير موجود');
        }

        connection.lastActivity = new Date();
        connection.requestCount++;

        // إرجاع وكيل لتعقب الأداء
        return this.createPerformanceProxy(connection.instance, connectionId);
    }

    // إنشاء وكيل لتعقب الأداء
    createPerformanceProxy(instance, connectionId) {
        return new Proxy(instance, {
            get(target, prop) {
                if (typeof target[prop] === 'function') {
                    return async function(...args) {
                        const startTime = performance.now();
                        try {
                            const result = await target[prop](...args);
                            const duration = performance.now() - startTime;
                            
                            // تسجيل الأداء
                            target.emit('performance', {
                                metric: `${prop}_duration`,
                                value: duration,
                                connectionId,
                                timestamp: new Date()
                            });

                            return result;
                        } catch (error) {
                            const duration = performance.now() - startTime;
                            
                            target.emit('performance', {
                                metric: `${prop}_error`,
                                value: duration,
                                connectionId,
                                timestamp: new Date(),
                                error: error.message
                            });

                            throw error;
                        }
                    };
                }
                return target[prop];
            }
        });
    }

    // تنفيذ أوامر متعددة المنصات مع تحسينات
    async executeMultiExchangeOrder(orderRequest) {
        const results = [];
        const errors = [];
        const startTime = performance.now();

        // تنفيذ متوازي للطلبات
        const promises = orderRequest.exchanges.map(async (exchangeOrder) => {
            try {
                const { exchangeName, credentials, orderData } = exchangeOrder;
                
                const exchangeService = await this.createExchangeService(
                    exchangeName, 
                    credentials, 
                    { timeout: orderRequest.timeout || 30000 }
                );

                const result = await exchangeService.createOrder(orderData);
                
                return {
                    exchange: exchangeName,
                    success: true,
                    data: result,
                    timestamp: new Date()
                };

            } catch (error) {
                return {
                    exchange: exchangeOrder.exchangeName,
                    success: false,
                    error: error.message,
                    timestamp: new Date()
                };
            }
        });

        const settledResults = await Promise.allSettled(promises);
        
        settledResults.forEach(result => {
            if (result.status === 'fulfilled') {
                if (result.value.success) {
                    results.push(result.value);
                } else {
                    errors.push(result.value);
                }
            } else {
                errors.push({
                    exchange: 'unknown',
                    success: false,
                    error: result.reason.message,
                    timestamp: new Date()
                });
            }
        });

        const totalTime = performance.now() - startTime;

        this.emit('multi_exchange_order_completed', {
            totalOrders: orderRequest.exchanges.length,
            successful: results.length,
            failed: errors.length,
            totalTime,
            timestamp: new Date()
        });

        return {
            success: errors.length === 0,
            results,
            errors,
            performance: {
                totalTime,
                averageTime: totalTime / orderRequest.exchanges.length
            },
            summary: {
                total: orderRequest.exchanges.length,
                successful: results.length,
                failed: errors.length
            }
        };
    }

    // إحصائيات وأداء متقدم
    getAdvancedStats() {
        const stats = {
            totalSupportedExchanges: this.supportedExchanges.size,
            activeConnections: this.connectionPool.size,
            healthStatus: Object.fromEntries(this.healthStatus),
            performanceMetrics: Object.fromEntries(this.performanceMetrics),
            circuitBreakers: Object.fromEntries(this.circuitBreakers),
            rateLimiters: Array.from(this.rateLimiters.keys()),
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            timestamp: new Date()
        };

        // إضافة إحصائيات مفصلة لكل منصة
        stats.exchangeDetails = Array.from(this.exchangeConfigs.values()).map(config => ({
            name: config.name,
            health: this.healthStatus.get(config.id) || 'unknown',
            activeConnections: Array.from(this.connectionPool.values())
                .filter(conn => conn.exchange === config.id).length,
            performance: this.performanceMetrics.get(config.id) || {},
            circuitBreaker: this.circuitBreakers.get(config.id) || {}
        }));

        return stats;
    }

    // تسجيل مقاييس الأداء
    recordPerformanceMetric(exchangeName, metric, value) {
        if (!this.performanceMetrics.has(exchangeName)) {
            this.performanceMetrics.set(exchangeName, {
                requests: 0,
                errors: 0,
                averageResponseTime: 0,
                metrics: {}
            });
        }

        const metrics = this.performanceMetrics.get(exchangeName);
        
        if (metric === 'connection_time' || metric.includes('duration')) {
            metrics.averageResponseTime = (metrics.averageResponseTime * metrics.requests + value) / (metrics.requests + 1);
        }
        
        if (metric.includes('error')) {
            metrics.errors++;
        }

        metrics.requests++;
        metrics.metrics[metric] = value;
    }

    // تسجيل النشاط
    recordActivity(exchangeName, data) {
        this.emit('exchange_activity', {
            exchange: exchangeName,
            ...data,
            timestamp: new Date()
        });
    }

    // التعامل مع أخطاء الاتصال
    handleConnectionError(exchangeName, error, duration) {
        console.error(`💥 فشل في إنشاء خدمة ${exchangeName} بعد ${duration}ms:`, error);
        
        this.recordPerformanceMetric(exchangeName, 'connection_error', duration);
        this.updateCircuitBreaker(exchangeName, 'error');
        
        this.emit('exchange_connection_failed', {
            exchange: exchangeName,
            error: error.message,
            duration,
            timestamp: new Date()
        });
    }

    // توليد معرف اتصال آمن
    generateConnectionId(exchangeName, credentials) {
        const uniqueString = `${exchangeName}_${credentials.apiKey}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        return crypto.createHash('sha256').update(uniqueString).digest('hex');
    }

    // إخفاء البيانات الاعتمادية
    maskCredentials(credentials) {
        const masked = {};
        
        for (const [key, value] of Object.entries(credentials)) {
            if (typeof value === 'string' && value.length > 8) {
                masked[key] = value.substring(0, 4) + '***' + value.substring(value.length - 4);
            } else {
                masked[key] = '***';
            }
        }
        
        return masked;
    }

    // التحقق من صحة البيانات الاعتمادية
    validateCredentials(exchangeName, credentials) {
        const config = this.exchangeConfigs.get(exchangeName);
        if (!config) return;

        const requiredFields = config.requires || [];
        
        for (const field of requiredFields) {
            if (!credentials[field]) {
                throw new Error(`الحقل ${field} مطلوب لمنصة ${exchangeName}`);
            }
        }

        // تحقق إضافي حسب نوع المنصة
        if (exchangeName === 'binance' && credentials.apiKey.length !== 64) {
            throw new Error('مفتاح API الخاص بـ Binance غير صحيح');
        }

        if (exchangeName === 'mexc' && credentials.secret.length < 32) {
            throw new Error('المفتاح السري لـ MEXC غير صحيح');
        }

        if (exchangeName === 'kucoin' && !credentials.passphrase) {
            throw new Error('عبارة المرور مطلوبة لـ KuCoin');
        }
    }

    // المراقبة الصحية
    initializeHealthMonitoring() {
        // فحص صحة المنصات كل دقيقتين
        setInterval(() => {
            this.checkAllExchangesHealth();
        }, 2 * 60 * 1000);

        // تنظيف الاتصالات غير النشطة كل 30 دقيقة
        setInterval(() => {
            this.cleanupInactiveConnections();
        }, 30 * 60 * 1000);

        // تحديث الإحصائيات كل 5 دقائق
        setInterval(() => {
            this.updatePerformanceStatistics();
        }, 5 * 60 * 1000);
    }

    // تتبع الأداء
    initializePerformanceTracking() {
        // تنظيف المقاييس القديمة كل ساعة
        setInterval(() => {
            this.cleanupOldMetrics();
        }, 60 * 60 * 1000);
    }

    // تنظيف المقاييس القديمة
    cleanupOldMetrics() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        for (const [exchangeName, metrics] of this.performanceMetrics) {
            // يمكن إضافة منطق لحفظ المقاييس القديمة في قاعدة البيانات
            if (now - metrics.lastUpdated > oneHour) {
                // إعادة تعيين بعض المقاييس
                metrics.requests = 0;
                metrics.errors = 0;
                metrics.lastUpdated = now;
            }
        }
    }

    // فحص صحة جميع المنصات
    async checkAllExchangesHealth() {
        for (const exchangeName of this.supportedExchanges.keys()) {
            try {
                await this.checkExchangeHealth(exchangeName);
            } catch (error) {
                console.error(`❌ فشل فحص صحة ${exchangeName}:`, error);
                this.healthStatus.set(exchangeName, 'unhealthy');
            }
        }
    }

    // فحص صحة منصة محددة
    async checkExchangeHealth(exchangeName) {
        try {
            const config = this.exchangeConfigs.get(exchangeName);
            if (!config) return false;

            // محاكاة فحص الصحة - في البيئة الحقيقية نتحقق من API المنصة
            const isHealthy = Math.random() > 0.1; // 90% healthy
            
            this.healthStatus.set(exchangeName, isHealthy ? 'healthy' : 'unhealthy');
            
            this.emit('health_check', {
                exchange: exchangeName,
                status: isHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date()
            });

            return isHealthy;
        } catch (error) {
            this.healthStatus.set(exchangeName, 'unhealthy');
            throw error;
        }
    }

    // تنظيف الاتصالات غير النشطة
    cleanupInactiveConnections() {
        const now = new Date();
        const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

        for (const [connectionId, connection] of this.connectionPool.entries()) {
            if (now - connection.lastActivity > inactiveThreshold) {
                this.connectionPool.delete(connectionId);
                console.log(`🧹 تم تنظيف اتصال غير نشط: ${connectionId}`);
                
                this.emit('connection_cleaned', {
                    connectionId: connectionId,
                    exchange: connection.exchange,
                    reason: 'inactivity',
                    timestamp: new Date()
                });
            }
        }
    }

    // تحديث إحصائيات الأداء
    updatePerformanceStatistics() {
        // يمكن إضافة منطق لحفظ الإحصائيات في قاعدة البيانات
        console.log('📊 تحديث إحصائيات أداء المنصات...');
    }

    // إغلاق جميع اتصالات منصة محددة
    closeAllConnections(exchangeName) {
        for (const [connectionId, connection] of this.connectionPool.entries()) {
            if (connection.exchange === exchangeName) {
                this.connectionPool.delete(connectionId);
                
                this.emit('connection_closed', {
                    connectionId: connectionId,
                    exchange: exchangeName,
                    reason: 'exchange_removed',
                    timestamp: new Date()
                });
            }
        }
    }

    // إضافة منصة جديدة
    addExchangeSupport(exchangeName, serviceClass, config) {
        if (this.supportedExchanges.has(exchangeName)) {
            console.warn(`⚠️ المنصة ${exchangeName} موجودة مسبقاً، جاري التحديث...`);
        }

        this.supportedExchanges.set(exchangeName, serviceClass);
        this.exchangeConfigs.set(exchangeName, {
            ...config,
            addedAt: new Date(),
            status: 'active'
        });
        
        console.log(`✅ تم إضافة/تحديث دعم منصة: ${exchangeName}`);
        this.emit('exchange_added', { exchange: exchangeName, config });
    }

    // إزالة دعم منصة
    removeExchangeSupport(exchangeName) {
        if (!this.supportedExchanges.has(exchangeName)) {
            throw new Error(`المنصة ${exchangeName} غير موجودة`);
        }

        this.supportedExchanges.delete(exchangeName);
        this.exchangeConfigs.delete(exchangeName);
        
        // إغلاق جميع اتصالات هذه المنصة
        this.closeAllConnections(exchangeName);
        
        console.log(`🗑️ تم إزالة دعم منصة: ${exchangeName}`);
        this.emit('exchange_removed', { exchange: exchangeName });
    }

    // الحصول على قائمة المنصات المدعومة
    getSupportedExchanges(detailed = false) {
        if (!detailed) {
            return Array.from(this.supportedExchanges.keys());
        }

        return Array.from(this.exchangeConfigs.entries()).map(([key, config]) => ({
            id: key,
            name: config.name,
            requires: config.requires,
            supportedAssets: config.supportedAssets,
            features: config.features,
            rateLimit: config.rateLimit,
            status: config.status,
            supportedPairs: config.supportedPairs,
            volumeRank: config.volumeRank,
            health: this.healthStatus.get(key) || 'unknown'
        }));
    }

    // التحقق من توافق المنصة
    validateExchangeCompatibility(exchangeName, requirements) {
        const config = this.exchangeConfigs.get(exchangeName);
        if (!config) {
            return { valid: false, error: 'المنصة غير مدعومة' };
        }

        const issues = [];

        // التحقق من الأصول المدعومة
        if (requirements.assets) {
            requirements.assets.forEach(asset => {
                if (!config.supportedAssets.includes(asset)) {
                    issues.push(`الأصل ${asset} غير مدعوم`);
                }
            });
        }

        // التحقق من الميزات المطلوبة
        if (requirements.features) {
            requirements.features.forEach(feature => {
                if (!config.features.includes(feature)) {
                    issues.push(`الميزة ${feature} غير مدعومة`);
                }
            });
        }

        // التحقق من معدل الطلبات
        if (requirements.minRateLimit && config.rateLimit < requirements.minRateLimit) {
            issues.push(`معدل الطلبات غير كافي`);
        }

        return {
            valid: issues.length === 0,
            issues: issues,
            exchange: config
        };
    }

    // الحصول على أداء المنصات
    async getExchangePerformance() {
        const performance = [];

        for (const [exchangeName, config] of this.exchangeConfigs) {
            try {
                const health = this.healthStatus.get(exchangeName) || 'unknown';
                const connections = Array.from(this.connectionPool.values())
                    .filter(conn => conn.exchange === exchangeName).length;

                performance.push({
                    exchange: exchangeName,
                    name: config.name,
                    health: health,
                    activeConnections: connections,
                    rateLimit: config.rateLimit,
                    supportedPairs: config.supportedPairs,
                    volumeRank: config.volumeRank,
                    lastChecked: new Date()
                });

            } catch (error) {
                console.error(`❌ خطأ في مراقبة أداء ${exchangeName}:`, error);
            }
        }

        return performance;
    }

    // إعداد محدِّد معدل الطلبات
    setupRateLimiter(exchangeName) {
        const config = this.exchangeConfigs.get(exchangeName);
        if (!config) return;

        const rateLimiter = {
            limit: config.rateLimit,
            window: 1000, // 1 second
            requests: [],
            check: function() {
                const now = Date.now();
                this.requests = this.requests.filter(time => now - time < this.window);
                
                if (this.requests.length >= this.limit) {
                    const waitTime = this.window - (now - this.requests[0]);
                    throw new Error(`تم تجاوز معدل الطلبات، انتظر ${waitTime}ms`);
                }
                
                this.requests.push(now);
                return true;
            }
        };

        this.rateLimiters.set(exchangeName, rateLimiter);
    }

    // إعادة تعيين النظام
    async reset() {
        this.connectionPool.clear();
        this.rateLimiters.clear();
        this.healthStatus.clear();
        this.performanceMetrics.clear();
        this.circuitBreakers.clear();
        
        console.log('🔄 تم إعادة تعيين نظام إدارة المنصات');
        this.emit('system_reset', { timestamp: new Date() });
    }

    // الحصول على إحصائيات النظام
    getSystemStats() {
        return {
            totalSupportedExchanges: this.supportedExchanges.size,
            activeConnections: this.connectionPool.size,
            healthStatus: Object.fromEntries(this.healthStatus),
            performanceMetrics: Object.fromEntries(this.performanceMetrics),
            circuitBreakers: Object.fromEntries(this.circuitBreakers),
            rateLimiters: Array.from(this.rateLimiters.keys()),
            uptime: process.uptime(),
            timestamp: new Date()
        };
    }
}

// الفئة الأساسية المحسنة لخدمات المنصات
class BaseExchangeService extends EventEmitter {
    constructor(credentials, options = {}) {
        super();
        
        this.credentials = credentials;
        this.options = {
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
            enableCompression: true,
            enableCaching: false,
            cacheTTL: 30000,
            ...options
        };
        
        this.name = 'Base Exchange';
        this.connected = false;
        this.lastPing = null;
        this.requestCount = 0;
        this.errorCount = 0;
        this.cache = new Map();
        
        this.initializeRequestInterceptor();
        this.initializeResponseInterceptor();
    }

    // المهيئات المحسنة للطلب والاستجابة
    initializeRequestInterceptor() {
        this.requestInterceptor = async (config) => {
            this.emit('request_start', {
                method: config.method,
                url: config.url,
                timestamp: new Date()
            });

            // إضافة التوكن إذا لزم الأمر
            if (this.requiresAuthentication(config.url)) {
                config.headers = {
                    ...config.headers,
                    ...this.getAuthHeaders()
                };
            }

            return config;
        };
    }

    initializeResponseInterceptor() {
        this.responseInterceptor = (response) => {
            this.emit('request_complete', {
                method: response.config.method,
                url: response.config.url,
                status: response.status,
                duration: response.duration,
                timestamp: new Date()
            });

            return response;
        };
    }

    // الدوال الأساسية المحسنة
    async connect() {
        try {
            this.emit('connecting', { exchange: this.name });
            
            // محاكاة الاتصال - في الواقع نتحقق من صحة البيانات الاعتمادية
            await this.testConnection();
            
            this.connected = true;
            this.lastPing = new Date();
            
            this.emit('connected', { 
                exchange: this.name, 
                timestamp: this.lastPing 
            });
            
            console.log(`✅ تم الاتصال بمنصة ${this.name} بنجاح`);
            
        } catch (error) {
            this.connected = false;
            this.emit('connection_failed', { 
                exchange: this.name, 
                error: error.message 
            });
            throw error;
        }
    }

    async testConnection() {
        // يجب تنفيذ هذا في الخدمات الفرعية
        throw new Error('يجب تطبيق هذه الدالة في الخدمة الفرعية');
    }

    async getBalance() {
        this.trackRequest();
        throw new Error('يجب تطبيق هذه الدالة في الخدمة الفرعية');
    }

    async createOrder(orderData) {
        this.trackRequest();
        throw new Error('يجب تطبيق هذه الدالة في الخدمة الفرعية');
    }

    async getMarkets() {
        this.trackRequest();
        throw new Error('يجب تطبيق هذه الدالة في الخدمة الفرعية');
    }

    async getTicker(symbol) {
        this.trackRequest();
        throw new Error('يجب تطبيق هذه الدالة في الخدمة الفرعية');
    }

    // تتبع الطلبات للإحصائيات
    trackRequest() {
        this.requestCount++;
        this.emit('activity', {
            type: 'api_request',
            count: this.requestCount,
            timestamp: new Date()
        });
    }

    // تنفيذ الطلبات مع إعادة المحاولة
    async executeWithRetry(apiCall, context = 'API Call') {
        let lastError;
        
        for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
            try {
                const result = await apiCall();
                return result;
                
            } catch (error) {
                lastError = error;
                
                if (attempt < this.options.retryAttempts) {
                    console.warn(`⚠️ إعادة محاولة ${attempt}/${this.options.retryAttempts} لـ ${context}`);
                    await this.delay(this.options.retryDelay * attempt);
                }
            }
        }
        
        throw new Error(`فشل ${context} بعد ${this.options.retryAttempts} محاولات: ${lastError.message}`);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // تسجيل الطلبات
    logRequest(method, endpoint, data = null) {
        console.log(`📤 ${this.name} Request: ${method} ${endpoint}`, data || '');
    }

    logResponse(method, endpoint, response) {
        console.log(`📥 ${this.name} Response: ${method} ${endpoint}`, response);
    }

    // التحقق من الحاجة للمصادقة
    requiresAuthentication(url) {
        const publicEndpoints = ['/ping', '/time', '/exchangeInfo', '/ticker/price'];
        return !publicEndpoints.some(endpoint => url.includes(endpoint));
    }

    // الحصول على رؤوس المصادقة
    getAuthHeaders() {
        // يجب تطبيق هذا في الخدمات الفرعية
        return {};
    }
}

// خدمة MEXC محددة (نموذج محسن)
class MEXCService extends BaseExchangeService {
    constructor(credentials, options) {
        super(credentials, options);
        this.name = 'MEXC Global';
        this.baseUrl = 'https://api.mexc.com/api/v3';
    }

    async testConnection() {
        this.logRequest('GET', '/account');
        
        // محاكاة الاتصال - في الواقع نستخدم API حقيقي
        await this.delay(100);
        
        if (!this.credentials.apiKey || !this.credentials.secret) {
            throw new Error('بيانات الاعتماد غير صالحة');
        }
        
        this.logResponse('GET', '/account', { status: 'connected' });
        return true;
    }

    async getBalance() {
        return await this.executeWithRetry(async () => {
            this.logRequest('GET', '/account');
            
            // محاكاة جلب الرصيد
            await this.delay(200);
            
            const balance = {
                usdt: 1000 + Math.random() * 500,
                btc: 0.1 + Math.random() * 0.05,
                eth: 2.5 + Math.random() * 1.5,
                total: 1500 + Math.random() * 1000
            };
            
            this.logResponse('GET', '/account', balance);
            return balance;
        }, 'getBalance');
    }

    async createOrder(orderData) {
        return await this.executeWithRetry(async () => {
            this.logRequest('POST', '/order', orderData);
            
            // محاكاة إنشاء أمر
            await this.delay(300);
            
            const orderResult = {
                orderId: `MEXC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                symbol: orderData.symbol,
                side: orderData.side,
                type: orderData.type,
                quantity: orderData.quantity,
                price: orderData.price,
                status: 'filled',
                executedQty: orderData.quantity,
                executedPrice: orderData.price,
                timestamp: new Date()
            };
            
            this.logResponse('POST', '/order', orderResult);
            return orderResult;
        }, 'createOrder');
    }

    async getMarkets() {
        return await this.executeWithRetry(async () => {
            this.logRequest('GET', '/exchangeInfo');
            
            // محاكاة جلب الأسواق
            await this.delay(150);
            
            const markets = [
                { symbol: 'BTCUSDT', base: 'BTC', quote: 'USDT', status: 'TRADING' },
                { symbol: 'ETHUSDT', base: 'ETH', quote: 'USDT', status: 'TRADING' },
                { symbol: 'ADAUSDT', base: 'ADA', quote: 'USDT', status: 'TRADING' }
            ];
            
            this.logResponse('GET', '/exchangeInfo', { markets });
            return markets;
        }, 'getMarkets');
    }
}

module.exports = new ExchangeFactory();