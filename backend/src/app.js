// backend/src/app.js - النسخة المتقدمة والمؤمنة مع تكامل WebSocket
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

// أنظمة الأمان المتقدمة
const AntiReverseEngineering = require('./security/antiReverseEngineering');
const CyberSecurityMonitor = require('./security/cyberSecurityMonitor');
const EncryptionService = require('./services/EncryptionService');

// 🆕 تكامل WebSocket المتقدم
const WebSocketIntegration = require('./services/websocket');

// مسارات API
const paymentRoutes = require('./routes/payment');
const authRoutes = require('./routes/auth');
const tradingRoutes = require('./routes/trading');
const supportRoutes = require('./routes/support');
const clientRoutes = require('./routes/client');
const adminSecurityRoutes = require('./routes/admin/security');
const telegramWebhookRoutes = require('./routes/webhooks/telegram');
const exchangesWebhookRoutes = require('./routes/webhooks/exchanges');
// في مكان تجميع المسارات داخل app.js أو server.js
const engineRoutes = require('./routes/engine');
app.use('/api/engine', engineRoutes);
// 🆕 مسارات البوت التداولي المتقدمة
const botRoutes = require('./routes/bot');
app.use('/api/bot', botRoutes);

// backend/src/server.js أو backend/src/app.js (أين ما تُهيّئ الـ Express app)
const express = require('express');
const registerRoutes = require('./routes'); // هذا الملف الذي أنشأناه الآن

const app = express();

// ... هنا middlewares: helmet, cors, bodyParser, rateLimit, إلخ

// ⬇️ سطر واحد لتسجيل كل المسارات
registerRoutes(app);

// ... هنا error handlers + server.listen(...)

class QATraderBackend {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 5000;
        this.env = process.env.NODE_ENV || 'development';
        this.securityMonitor = new CyberSecurityMonitor();
        this.antiReverse = new AntiReverseEngineering();
        this.encryptionService = new EncryptionService();
        
        // 🆕 تهيئة WebSocket Integration
        this.webSocketIntegration = null;
        
        this.initializeAdvancedSystems();
        this.setupSecurityInfrastructure();
        this.setupEnhancedMiddlewares();
        this.setupAPIRoutes();
        this.setupDatabaseConnection();
        this.setupErrorHandlers();
        this.setupPerformanceMonitoring();
    }

    initializeAdvancedSystems() {
        // إنشاء هيكل المجلدات المتقدم
        this.createAdvancedDirectoryStructure();
        
        // بدء أنظمة المراقبة الأمنية المتقدمة
        this.securityMonitor.startAdvancedMonitoring();
        this.antiReverse.initializeQuantumProtection();

        // تسجيل حدث بدء التشغيل المتقدم
        this.securityMonitor.logSecurityEvent('QUANTUM_SERVER_STARTUP', {
            timestamp: new Date().toISOString(),
            environment: this.env,
            version: '2.0.0',
            nodeVersion: process.version,
            platform: process.platform,
            architecture: os.arch(),
            cpuCores: os.cpus().length,
            totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB'
        });

        console.log('🔧 بدء تهيئة الأنظمة الكمية المتقدمة...');
    }

    createAdvancedDirectoryStructure() {
        const directories = [
            '../../logs',
            '../../logs/security',
            '../../logs/performance',
            '../../logs/audit',
            '../../logs/errors',
            '../../uploads',
            '../../uploads/documents',
            '../../uploads/temp',
            '../../backups',
            '../../backups/daily',
            '../../backups/weekly'
        ];

        directories.forEach(dir => {
            const fullPath = path.join(__dirname, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }
        });
    }

    setupSecurityInfrastructure() {
        // 🔒 تكوين Helmet المتقدم مع سياسات أمان شاملة
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https:", "blob:"],
                    imgSrc: ["'self'", "data:", "https:", "blob:"],
                    connectSrc: ["'self'", "https:", "wss:"],
                    fontSrc: ["'self'", "https:", "data:"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'", "https:"],
                    frameSrc: ["'none'"],
                    workerSrc: ["'self'", "blob:"],
                    manifestSrc: ["'self'"],
                    formAction: ["'self'"],
                    baseUri: ["'self'"],
                    frameAncestors: ["'none'"]
                }
            },
            crossOriginEmbedderPolicy: { policy: "require-corp" },
            crossOriginOpenerPolicy: { policy: "same-origin" },
            crossOriginResourcePolicy: { policy: "same-site" },
            dnsPrefetchControl: { allow: false },
            frameguard: { action: "deny" },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            },
            ieNoOpen: true,
            noSniff: true,
            permittedCrossDomainPolicies: { permittedPolicies: "none" },
            referrerPolicy: { policy: "strict-origin-when-cross-origin" },
            xssFilter: true
        }));

        // 🛡️ تحديد معدل الطلبات المتقدم والمتعدد المستويات
        this.setupAdvancedRateLimiting();

        // 🌍 تكوين CORS المحسن والديناميكي
        this.app.use(cors(this.getAdvancedCorsConfig()));

        // 🔐 وسيط الأمان المخصص المتقدم
        this.app.use(this.quantumSecurityMiddleware.bind(this));
    }

    setupAdvancedRateLimiting() {
        const createLimiter = (windowMs, max, message, skipSuccessful = false) => rateLimit({
            windowMs,
            max,
            message: {
                success: false,
                error: message.error,
                code: message.code,
                retryAfter: message.retryAfter,
                timestamp: new Date().toISOString()
            },
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests: skipSuccessful,
            keyGenerator: (req) => {
                return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            },
            handler: (req, res) => {
                this.securityMonitor.logSecurityEvent('RATE_LIMIT_TRIGGERED', {
                    ip: req.ip,
                    url: req.url,
                    method: req.method,
                    limit: max,
                    window: windowMs,
                    timestamp: new Date().toISOString()
                });
                res.status(429).json({
                    success: false,
                    error: message.error,
                    code: message.code,
                    retryAfter: message.retryAfter
                });
            }
        });

        const limiters = {
            // عام لكل IP
            general: createLimiter(15 * 60 * 1000, 200, {
                error: 'طلبات كثيرة من هذا العنوان',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: '15 دقيقة'
            }),

            // المصادقة
            auth: createLimiter(60 * 60 * 1000, 8, {
                error: 'محاولات تسجيل دخول كثيرة',
                code: 'AUTH_RATE_LIMIT',
                retryAfter: '60 دقيقة'
            }, true),

            // التداول
            trading: createLimiter(1 * 60 * 1000, 60, {
                error: 'طلبات تداول كثيرة',
                code: 'TRADING_RATE_LIMIT', 
                retryAfter: '1 دقيقة'
            }),

            // الدفع
            payment: createLimiter(5 * 60 * 1000, 15, {
                error: 'طلبات دفع كثيرة',
                code: 'PAYMENT_RATE_LIMIT',
                retryAfter: '5 دقائق'
            }),

            // 🆕 البوت التداولي
            bot: createLimiter(1 * 60 * 1000, 120, {
                error: 'طلبات بوت كثيرة',
                code: 'BOT_RATE_LIMIT',
                retryAfter: '1 دقيقة'
            }),

            // الويب هووكس
            webhook: createLimiter(1 * 60 * 1000, 100, {
                error: 'طلبات ويب هووك كثيرة',
                code: 'WEBHOOK_RATE_LIMIT',
                retryAfter: '1 دقيقة'
            })
        };

        // تطبيق محددات المعدل بشكل انتقائي
        this.app.use('/api/', limiters.general);
        this.app.use('/api/auth/', limiters.auth);
        this.app.use('/api/trading/', limiters.trading);
        this.app.use('/api/payment/', limiters.payment);
        this.app.use('/api/bot/', limiters.bot);
        this.app.use('/webhooks/', limiters.webhook);
    }

    getAdvancedCorsConfig() {
        const productionOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['https://akraa.com', 'https://www.akraa.com'];
        
        const developmentOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:5000',
            'http://127.0.0.1:5000'
        ];

        const allowedOrigins = this.env === 'production' ? productionOrigins : developmentOrigins;

        return {
            origin: (origin, callback) => {
                // السماح بالطلبات بدون أصل (مثل mobile apps أو curl)
                if (!origin) return callback(null, true);
                
                if (allowedOrigins.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    this.securityMonitor.logSecurityEvent('CORS_VIOLATION', {
                        origin,
                        allowedOrigins,
                        timestamp: new Date().toISOString()
                    });
                    callback(new Error('غير مسموح به بواسطة CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'X-API-Key',
                'X-Client-Version',
                'X-Device-ID',
                'X-Session-ID',
                'X-CSRF-Token',
                'X-Request-ID',
                'X-Quantum-Signature'
            ],
            exposedHeaders: [
                'X-RateLimit-Limit',
                'X-RateLimit-Remaining',
                'X-RateLimit-Reset',
                'X-Request-ID',
                'X-Quantum-Version'
            ],
            maxAge: 86400, // 24 ساعة
            preflightContinue: false,
            optionsSuccessStatus: 204
        };
    }

    quantumSecurityMiddleware(req, res, next) {
        const requestId = this.generateQuantumRequestId();
        req.requestId = requestId;
        req.startTime = process.hrtime();

        // إضافة رؤوس أمان متقدمة
        res.header('X-Request-ID', requestId);
        res.header('X-Content-Type-Options', 'nosniff');
        res.header('X-Frame-Options', 'DENY');
        res.header('X-XSS-Protection', '1; mode=block');
        res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
        res.header('X-Runtime', 'Node.js');
        res.header('X-Quantum-Version', '2.0.0');
        res.header('X-Quantum-Security', 'enabled');

        // إزالة الرؤوس الخطرة
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');

        // فحص متقدم للنشاط المشبوه
        const threatLevel = this.analyzeThreatLevel(req);
        if (threatLevel > 7) {
            this.securityMonitor.logSecurityEvent('HIGH_THREAT_LEVEL_DETECTED', {
                requestId,
                ip: req.ip,
                method: req.method,
                url: req.url,
                userAgent: req.get('User-Agent'),
                threatLevel,
                timestamp: new Date().toISOString()
            });

            return res.status(429).json({
                success: false,
                error: 'تم اكتشاف نشاط مشبوه',
                code: 'HIGH_THREAT_LEVEL',
                requestId,
                support: 'security@akraa.com'
            });
        }

        // تسجيل الطلب للأغراض الأمنية والأدائية
        this.securityMonitor.logAdvancedRequest(req);

        next();
    }

    generateQuantumRequestId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const hash = this.encryptionService.quickHash(`${timestamp}${random}`);
        return `qreq_${timestamp}_${hash.substr(0, 8)}`;
    }

    analyzeThreatLevel(req) {
        let threatScore = 0;
        const userAgent = req.get('User-Agent') || '';

        // أنماط التهديد المعروفة
        const threatPatterns = [
            { pattern: /(\.\.\/|\.\.\\)/, score: 3 }, // directory traversal
            { pattern: /<script>|javascript:/i, score: 4 }, // XSS attempts
            { pattern: /union.*select|insert.*into|drop.*table/i, score: 5 }, // SQL injection
            { pattern: /exec\(|system\(|eval\(/i, score: 4 }, // command execution
            { pattern: /\/\.env|\/config|\/backup/i, score: 3 }, // sensitive file access
            { pattern: /phpmyadmin|adminer|webconfig/i, score: 2 } // admin tools
        ];

        // تحليل User-Agent
        if (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.includes('scanner')) {
            threatScore += 2;
        }

        if (userAgent.length > 500) { // User-Agent طويل بشكل غير عادي
            threatScore += 3;
        }

        // فحص URL و Body
        threatPatterns.forEach(({ pattern, score }) => {
            if (pattern.test(req.url) || pattern.test(JSON.stringify(req.body)) || pattern.test(userAgent)) {
                threatScore += score;
            }
        });

        // طلبات غير عادية
        if (req.method === 'POST' && req.url.includes('/auth/login') && !req.get('Content-Type')?.includes('application/json')) {
            threatScore += 2;
        }

        return Math.min(threatScore, 10);
    }

    setupEnhancedMiddlewares() {
        // 📊 تسجيل الطلبات المتقدم والمصنف
        this.setupQuantumLogging();

        // 🔄 ضغط الاستجابات المتقدم
        this.app.use(compression({
            level: 6,
            threshold: 1024,
            filter: (req, res) => {
                if (req.headers['x-no-compression']) return false;
                if (res.getHeader('Content-Type')?.includes('image')) return false;
                return compression.filter(req, res);
            }
        }));

        // 📝 تحليل JSON المحسن مع تحقق متقدم
        this.app.use(express.json({ 
            limit: '10mb',
            verify: (req, res, buf) => {
                req.rawBody = buf;
                try {
                    const parsed = JSON.parse(buf);
                    
                    // فحص عمق الكائن
                    if (this.getObjectDepth(parsed) > 10) {
                        throw new Error('عمق كائن JSON يتجاوز الحد المسموح');
                    }
                    
                    // فحص حجم المصفوفات
                    if (Array.isArray(parsed) && parsed.length > 1000) {
                        throw new Error('حجم مصفوفة JSON يتجاوز الحد المسموح');
                    }
                    
                } catch (e) {
                    this.securityMonitor.logSecurityEvent('MALFORMED_JSON_PAYLOAD', {
                        requestId: req.requestId,
                        ip: req.ip,
                        url: req.url,
                        error: e.message,
                        timestamp: new Date().toISOString()
                    });
                    res.status(400).json({ 
                        success: false,
                        error: 'حمولة JSON غير صالحة أو تحتوي على بيانات خطيرة',
                        code: 'MALFORMED_JSON',
                        requestId: req.requestId
                    });
                }
            }
        }));
        
        this.app.use(express.urlencoded({ 
            extended: true, 
            limit: '10mb',
            parameterLimit: 100
        }));

        // ⚡ وسيط الأداء والمراقبة
        this.app.use(this.quantumPerformanceMiddleware.bind(this));
    }

    setupQuantumLogging() {
        const logFormats = {
            combined: ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms',
            security: ':date[iso] :method :url :status :res[content-length] :response-time ms :remote-addr :user-agent :req[request-id]',
            performance: ':date[iso] :method :url :status :response-time ms :res[content-length]'
        };

        // سجل الوصول العام
        const accessLogStream = fs.createWriteStream(
            path.join(__dirname, '../../logs/access.log'), 
            { flags: 'a', encoding: 'utf8' }
        );
        
        this.app.use(morgan(logFormats.combined, { 
            stream: accessLogStream,
            skip: (req) => this.shouldSkipLogging(req)
        }));

        // سجل الأمان
        const securityLogStream = fs.createWriteStream(
            path.join(__dirname, '../../logs/security/security.log'), 
            { flags: 'a', encoding: 'utf8' }
        );

        const securityMorgan = morgan(logFormats.security, { 
            stream: securityLogStream,
            skip: (req) => !this.isSecurityRelevantRequest(req)
        });
        this.app.use(securityMorgan);

        // سجل الأداء
        const performanceLogStream = fs.createWriteStream(
            path.join(__dirname, '../../logs/performance/performance.log'), 
            { flags: 'a', encoding: 'utf8' }
        );

        this.app.use(morgan(logFormats.performance, {
            stream: performanceLogStream,
            skip: (req, res) => res.statusCode < 400 && process.hrtime(req.startTime)[0] < 1
        }));

        // تسجيل المطور (للتطوير فقط)
        if (this.env !== 'production') {
            this.app.use(morgan('dev'));
        }
    }

    shouldSkipLogging(req) {
        const skippedPaths = ['/health', '/metrics', '/favicon.ico'];
        return skippedPaths.some(path => req.url.includes(path));
    }

    isSecurityRelevantRequest(req) {
        const securityPaths = ['/auth', '/payment', '/admin', '/webhooks', '/api/key', '/api/bot'];
        return securityPaths.some(path => req.url.includes(path));
    }

    getObjectDepth(obj) {
        let depth = 0;
        if (obj && typeof obj === 'object') {
            Object.values(obj).forEach(value => {
                if (typeof value === 'object') {
                    depth = Math.max(depth, this.getObjectDepth(value));
                }
            });
            depth++;
        }
        return depth;
    }

    quantumPerformanceMiddleware(req, res, next) {
        const start = process.hrtime();

        res.on('finish', () => {
            const duration = process.hrtime(start);
            const responseTime = duration[0] * 1000 + duration[1] / 1000000;

            // تسجيل الأداء للطلبات البطيئة
            if (responseTime > 2000) { // أكثر من 2 ثانية
                this.securityMonitor.logPerformanceIssue({
                    requestId: req.requestId,
                    url: req.url,
                    method: req.method,
                    responseTime: responseTime.toFixed(2),
                    statusCode: res.statusCode,
                    timestamp: new Date().toISOString(),
                    memoryUsage: process.memoryUsage(),
                    type: 'SLOW_RESPONSE'
                });
            }

            // تسجيل أخطاء الخادم
            if (res.statusCode >= 500) {
                this.securityMonitor.logSecurityEvent('SERVER_ERROR_RESPONSE', {
                    requestId: req.requestId,
                    url: req.url,
                    method: req.method,
                    statusCode: res.statusCode,
                    responseTime: responseTime.toFixed(2),
                    timestamp: new Date().toISOString()
                });
            }
        });

        next();
    }

    setupAPIRoutes() {
        // 🏥 نقطة فحص الصحة المتقدمة
        this.app.get('/health', (req, res) => {
            const healthCheck = {
                status: 'OK',
                service: 'QA TRADER Backend - Quantum Edition',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: this.env,
                version: '2.0.0',
                memory: process.memoryUsage(),
                database: {
                    state: mongoose.connection.readyState,
                    host: mongoose.connection.host,
                    name: mongoose.connection.name
                },
                system: {
                    load: os.loadavg(),
                    freeMemory: os.freemem(),
                    totalMemory: os.totalmem(),
                    cpus: os.cpus().length
                },
                security: {
                    monitoring: this.securityMonitor.isActive(),
                    reverseEngineering: this.antiReverse.isActive(),
                    lastIncident: this.securityMonitor.getLastIncidentTime()
                },
                // 🆕 إضافة إحصائيات WebSocket
                websocket: this.webSocketIntegration ? {
                    active: true,
                    connections: this.webSocketIntegration.getStats()?.totalConnections || 0,
                    botsConnected: this.webSocketIntegration.getStats()?.activeBots || 0
                } : { active: false }
            };

            res.status(200).json(healthCheck);
        });

        // 📊 نقطة المقاييس المتقدمة
        this.app.get('/metrics', (req, res) => {
            if (this.env === 'production' && !this.isValidApiKey(req)) {
                return res.status(401).json({
                    success: false,
                    error: 'غير مصرح بالوصول إلى المقاييس',
                    code: 'UNAUTHORIZED_METRICS_ACCESS'
                });
            }

            res.status(200).json(this.getAdvancedMetrics());
        });

        // 🆕 مسار إحصائيات WebSocket
        this.app.get('/websocket-stats', (req, res) => {
            if (this.webSocketIntegration) {
                res.json(this.webSocketIntegration.getStats());
            } else {
                res.status(503).json({ 
                    error: 'WebSocket service not available',
                    active: false
                });
            }
        });

        // 🛣️ مسارات API مع الإصدار والتوثيق
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/trading', tradingRoutes);
        this.app.use('/api/support', supportRoutes);
        this.app.use('/api/client', clientRoutes);
        this.app.use('/api/payment', paymentRoutes);
        
        // 🆕 مسارات البوت التداولي المتقدمة
        this.app.use('/api/bot', botRoutes);
        
        // مسارات الإدارة المتقدمة
        this.app.use('/admin/security', adminSecurityRoutes);
        
        // مسارات الويب هووكس الآمنة
        this.app.use('/webhooks/telegram', telegramWebhookRoutes);
        this.app.use('/webhooks/exchanges', exchangesWebhookRoutes);

        // 🎯 معالج 404 المتقدم
        this.app.use('/api/*', (req, res) => {
            this.securityMonitor.logSecurityEvent('ENDPOINT_NOT_FOUND', {
                requestId: req.requestId,
                ip: req.ip,
                method: req.method,
                url: req.originalUrl,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            });

            res.status(404).json({
                success: false,
                error: 'النقطة المطلوبة غير موجودة',
                code: 'ENDPOINT_NOT_FOUND',
                path: req.originalUrl,
                requestId: req.requestId,
                suggestion: 'تحقق من التوثيق أو اتصل بالدعم',
                documentation: 'https://docs.akraa.com/api/v2',
                support: 'support@akraa.com'
            });
        });
    }

    isValidApiKey(req) {
        const apiKey = req.headers['x-api-key'];
        const validKeys = process.env.METRICS_API_KEYS?.split(',') || [];
        return validKeys.includes(apiKey);
    }

    getAdvancedMetrics() {
        return {
            timestamp: new Date().toISOString(),
            application: {
                name: 'QA TRADER Quantum',
                version: '2.0.0',
                environment: this.env,
                uptime: process.uptime(),
                nodeVersion: process.version
            },
            process: {
                pid: process.pid,
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                uptime: process.uptime()
            },
            system: {
                loadavg: os.loadavg(),
                freemem: os.freemem(),
                totalmem: os.totalmem(),
                cpus: os.cpus().length,
                arch: os.arch(),
                platform: os.platform()
            },
            database: {
                state: mongoose.connection.readyState,
                host: mongoose.connection.host,
                name: mongoose.connection.name,
                models: mongoose.modelNames()
            },
            security: {
                totalRequests: this.securityMonitor.getRequestCount(),
                blockedRequests: this.securityMonitor.getBlockedCount(),
                threatsDetected: this.securityMonitor.getThreatCount(),
                lastIncident: this.securityMonitor.getLastIncidentTime(),
                monitoringUptime: this.securityMonitor.getUptime()
            },
            performance: {
                responseTimes: this.securityMonitor.getResponseTimeStats(),
                memoryTrend: this.securityMonitor.getMemoryTrend(),
                activeConnections: this.securityMonitor.getActiveConnections()
            },
            // 🆕 إضافة إحصائيات WebSocket
            websocket: this.webSocketIntegration ? this.webSocketIntegration.getStats() : { active: false }
        };
    }

    async setupDatabaseConnection() {
        try {
            const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quantum_trade';
            
            const mongooseOptions = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                maxPoolSize: 15,
                minPoolSize: 5,
                retryWrites: true,
                w: 'majority',
                bufferCommands: false,
                bufferMaxEntries: 0,
                autoIndex: this.env !== 'production'
            };

            await mongoose.connect(MONGODB_URI, mongooseOptions);
            
            console.log('🔗 تم الاتصال بقاعدة البيانات بنجاح');
            
            // مستمعي أحداث قاعدة البيانات المتقدمة
            this.setupDatabaseEventListeners();

        } catch (error) {
            console.error('❌ فشل الاتصال بقاعدة البيانات:', error);
            this.securityMonitor.logSecurityEvent('DATABASE_CONNECTION_FAILED', {
                error: error.message,
                timestamp: new Date().toISOString(),
                connectionString: this.maskSensitiveData(MONGODB_URI)
            });
            process.exit(1);
        }
    }

    setupDatabaseEventListeners() {
        mongoose.connection.on('error', (err) => {
            console.error('❌ خطأ في اتصال قاعدة البيانات:', err);
            this.securityMonitor.logSecurityEvent('DATABASE_ERROR', {
                error: err.message,
                timestamp: new Date().toISOString()
            });
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ تم قطع اتصال قاعدة البيانات');
            this.securityMonitor.logSecurityEvent('DATABASE_DISCONNECTED', {
                timestamp: new Date().toISOString()
            });
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔁 تم إعادة الاتصال بقاعدة البيانات');
            this.securityMonitor.logSecurityEvent('DATABASE_RECONNECTED', {
                timestamp: new Date().toISOString()
            });
        });

        mongoose.connection.on('connected', () => {
            console.log('✅ اتصال قاعدة البيانات نشط ومستقر');
        });
    }

    maskSensitiveData(str) {
        return str.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    }

    setupErrorHandlers() {
        // 🚨 معالج الأخطاء العام المتقدم
        this.app.use((error, req, res, next) => {
            console.error('🚨 معالج الأخطاء المتقدم:', error);

            const errorId = `qerr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

            // تسجيل حدث الأمان المتقدم
            this.securityMonitor.logSecurityEvent('QUANTUM_SERVER_ERROR', {
                errorId,
                requestId: req.requestId,
                error: error.message,
                stack: this.cleanStack(error.stack),
                url: req.url,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString(),
                environment: this.env
            });

            // حفظ الخطأ في السجل
            this.logErrorToFile(error, req, errorId);

            // عدم كشف تفاصيل الخطأ في الإنتاج
            if (this.env === 'production') {
                return res.status(500).json({
                    success: false,
                    error: 'خطأ داخلي في الخادم',
                    code: 'INTERNAL_ERROR',
                    errorId,
                    requestId: req.requestId,
                    support: 'support@akraa.com',
                    incident: 'تم الإبلاغ عن الحادث تلقائياً'
                });
            }

            res.status(500).json({
                success: false,
                error: error.message,
                stack: this.cleanStack(error.stack),
                code: 'INTERNAL_ERROR',
                errorId,
                requestId: req.requestId
            });
        });

        // 🚨 معالج رفض Promise غير المعالج
        process.on('unhandledRejection', (reason, promise) => {
            console.error('🚨 رفض Promise غير معالج:', reason);
            this.securityMonitor.logSecurityEvent('UNHANDLED_REJECTION', {
                reason: reason?.toString() || 'Unknown',
                timestamp: new Date().toISOString(),
                environment: this.env
            });
        });

        // 🚨 معالج استثناء غير معالج
        process.on('uncaughtException', (error) => {
            console.error('🚨 استثناء غير معالج:', error);
            this.securityMonitor.logSecurityEvent('UNCAUGHT_EXCEPTION', {
                error: error.message,
                stack: this.cleanStack(error.stack),
                timestamp: new Date().toISOString(),
                environment: this.env
            });
            
            // الإغلاق الآمن
            this.quantumGracefulShutdown('UNCAUGHT_EXCEPTION');
        });
    }

    cleanStack(stack) {
        if (!stack) return 'No stack trace available';
        return stack.split('\n').slice(0, 5).join('\n'); // أول 5 أسطر فقط
    }

    logErrorToFile(error, req, errorId) {
        const errorLog = {
            errorId,
            requestId: req.requestId,
            timestamp: new Date().toISOString(),
            environment: this.env,
            error: {
                message: error.message,
                stack: this.cleanStack(error.stack),
                name: error.name,
                code: error.code
            },
            request: {
                method: req.method,
                url: req.url,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                headers: this.sanitizeHeaders(req.headers)
            }
        };

        const errorLogStream = fs.createWriteStream(
            path.join(__dirname, '../../logs/errors/errors.log'), 
            { flags: 'a', encoding: 'utf8' }
        );

        errorLogStream.write(JSON.stringify(errorLog) + '\n');
        errorLogStream.end();
    }

    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
        sensitiveHeaders.forEach(header => {
            if (sanitized[header]) {
                sanitized[header] = '***';
            }
            if (sanitized[header.toLowerCase()]) {
                sanitized[header.toLowerCase()] = '***';
            }
        });
        return sanitized;
    }

    setupPerformanceMonitoring() {
        // مراقبة استخدام الذاكرة
        setInterval(() => {
            const memoryUsage = process.memoryUsage();
            const memoryPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

            if (memoryPercentage > 80) { // 80% usage
                this.securityMonitor.logPerformanceIssue({
                    type: 'HIGH_MEMORY_USAGE',
                    memoryUsage,
                    memoryPercentage: memoryPercentage.toFixed(2),
                    timestamp: new Date().toISOString()
                });
            }

            if (memoryUsage.heapUsed > 400 * 1024 * 1024) { // 400MB
                global.gc && global.gc(); // تشغيل garbage collector إذا كان متاحاً
            }
        }, 30000); // كل 30 ثانية
    }

    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(this.getQuantumStartupBanner());
        });

        // 🆕 بدء تكامل WebSocket بعد بدء الخادم
        this.webSocketIntegration = new WebSocketIntegration(this.server);
        console.log('🔗 تم تهيئة تكامل WebSocket المتقدم');

        this.setupGracefulShutdown();
    }

    getQuantumStartupBanner() {
        const dbStatus = mongoose.connection.readyState === 1 ? '🟢 متصل' : '🔴 غير متصل';
        const securityStatus = this.securityMonitor.isActive() ? '🟢 نشط' : '🔴 غير نشط';
        const reverseEngineeringStatus = this.antiReverse.isActive() ? '🟢 نشط' : '🔴 غير نشط';
        const websocketStatus = this.webSocketIntegration ? '🟢 نشط' : '🔴 غير نشط';

        return `

        
🚀  QUANTUM AI TRADER BACKEND - الإصدار 2.1.0

📍  المنفذ: ${this.port}
🌍  البيئة: ${this.env}
⚡  Node.js: ${process.version}
📦  PID: ${process.pid}
⏰  وقت البدء: ${new Date().toISOString()}

✅  الأنظمة المتقدمة المفعلة:
   🔒  نظام مكافحة الهندسة العكسية الكمي ${reverseEngineeringStatus}
   🛡️  مراقبة الأمان في الوقت الحقيقي ${securityStatus}
   🤖  نظام البوت التداولي المتقدم (مفعل)
   🔗  نظام WebSocket المتقدم ${websocketStatus}
   📊  مراقبة الأداء والتسجيل المتقدم
   🌍  تكوين CORS آمن وديناميكي
   ⚡  ضغط وتحميل متقدم
   🚨  معالجة أخطاء شاملة ومتقدمة
   🔄  إغلاق آمن للخادم
   📈  نظام مقاييس متكامل

🔗  قاعدة البيانات: ${dbStatus}
📊  عدد النوى: ${os.cpus().length}
💾  الذاكرة: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB

📍  العنوان: http://localhost:${this.port}
🔗  WebSocket: ws://localhost:${this.port}
📊  إحصائيات WebSocket: http://localhost:${this.port}/websocket-stats
📚  التوثيق: https://docs.akraa.com/api/v2
🆘  الدعم: support@akraa.com
🔐  الأمان: security@akraa.com

==================================================

        `;
    }

    setupGracefulShutdown() {
        const shutdown = (signal) => {
            console.log(`\n\n📢 تم استقبال إشارة ${signal}. بدء الإغلاق الآمن...`);
            
            this.securityMonitor.logSecurityEvent('QUANTUM_SERVER_SHUTDOWN', {
                signal,
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: this.env
            });

            // 🆕 إغلاق اتصالات WebSocket أولاً
            if (this.webSocketIntegration) {
                console.log('🔌 إغلاق اتصالات WebSocket...');
                this.webSocketIntegration.closeAllConnections();
            }

            // إغلاق خادم HTTP
            this.server.close((err) => {
                if (err) {
                    console.error('❌ خطأ في إغلاق خادم HTTP:', err);
                } else {
                    console.log('✅ تم إغلاق خادم HTTP.');
                }

                // إغلاق اتصال قاعدة البيانات
                mongoose.connection.close(false, (dbErr) => {
                    if (dbErr) {
                        console.error('❌ خطأ في إغلاق قاعدة البيانات:', dbErr);
                    } else {
                        console.log('✅ تم إغلاق اتصال قاعدة البيانات.');
                    }

                    // إيقاف أنظمة المراقبة
                    this.securityMonitor.stopMonitoring();
                    this.antiReverse.stopProtection();
                    console.log('✅ تم إيقاف أنظمة المراقبة والأمان.');

                    console.log('👋 اكتمل الإغلاق الآمن للخادم الكمي.');
                    process.exit(err || dbErr ? 1 : 0);
                });
            });

            // الإغلاق القسري بعد 30 ثانية
            setTimeout(() => {
                console.error('❌ لم يتمكن من إغلاق الاتصالات في الوقت المحدد، إغلاق قسري');
                process.exit(1);
            }, 30000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGUSR2', () => shutdown('SIGUSR2')); // للنوديمون
    }

    quantumGracefulShutdown(reason) {
        console.log(`\n🔄 بدء الإغلاق الآمن الكمي بسبب: ${reason}`);
        this.setupGracefulShutdown()('QUANTUM_AUTO_SHUTDOWN');
    }
}

module.exports = QATraderBackend;
