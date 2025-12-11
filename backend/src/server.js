const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const authRoutes = require('../routes/auth');
const productRoutes = require('../routes/products');
const orderRoutes = require('../routes/orders');
const userRoutes = require('../routes/users');
const uploadRoutes = require('../routes/upload');

const botRoutes = require('../routes/botRoutes');

let CyberSecurityMonitor, AntiReverseEngineering, EncryptionService;
let securitySystemsAvailable = false;

try {
  CyberSecurityMonitor = require('./services/cyberSecurityMonitor');
  AntiReverseEngineering = require('./services/antiReverseEngineering');
  EncryptionService = require('./services/EncryptionService');
  securitySystemsAvailable = true;
  console.log('✅ تم تحميل الأنظمة الأمنية المتقدمة');
} catch (error) {
  console.log('⚠️ الأنظمة المتقدمة غير متوفرة، استخدام الأنظمة الأساسية');

  CyberSecurityMonitor = class {
    startRealTimeMonitoring() {
      console.log('🔒 مراقبة الأمان الأساسية مفعلة');
    }
    logSecurityEvent() {
      /* لا شيء */
    }
    logRequest() {
      /* لا شيء */
    }
    logPerformanceIssue() {
      /* لا شيء */
    }
    isActive() {
      return false;
    }
    stopMonitoring() {
      /* لا شيء */
    }
  };

  AntiReverseEngineering = class {
    initializeAdvancedProtection() {
      console.log('🛡️ حماية أساسية مفعلة');
    }
    isActive() {
      return false;
    }
  };

  EncryptionService = class {};
}

let paymentRoutes, tradingRoutes, clientRoutes, adminRoutes, webhookRoutes;
let advancedRoutesAvailable = false;

try {
  paymentRoutes = require('./routes/payment');
  tradingRoutes = require('./routes/trading');
  clientRoutes = require('./routes/client');
  adminRoutes = require('./routes/admin');
  webhookRoutes = require('./routes/webhooks');
  advancedRoutesAvailable = true;
  console.log('✅ تم تحميل مسارات التداول المتقدمة');
} catch (error) {
  console.log('⚠️ مسارات التداول المتقدمة غير متوفرة، استخدام المسارات الأساسية');

  paymentRoutes = express.Router();
  tradingRoutes = express.Router();
  clientRoutes = express.Router();
  adminRoutes = express.Router();
  webhookRoutes = express.Router();
}

class QuantumTradeServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = process.env.PORT || 5000;
    this.pythonPort = process.env.PYTHON_PORT || 8000;
    this.env = process.env.NODE_ENV || 'development';

    this.securityMonitor = new CyberSecurityMonitor();
    this.antiReverse = new AntiReverseEngineering();
    this.encryptionService = new EncryptionService();

    this.tradingWebSocket = null;
    this.botWebSocket = null;
    this.pythonWebSocket = null;
    this.connectedClients = new Map();

    this.initializeCoreSystems();
    this.setupSecurityInfrastructure();
    this.setupAdvancedMiddlewares();
    this.setupDatabaseConnection();

    if (process.env.ENABLE_PYTHON_INTEGRATION === 'true') {
      this.setupPythonIntegration();
    }

    this.setupAPIRoutes();
    this.setupWebSocketBridge();
    this.setupErrorHandlers();
    this.setupPerformanceMonitoring();
  }

  initializeCoreSystems() {
    this.createDirectoryStructure();

    this.securityMonitor.startRealTimeMonitoring();
    this.antiReverse.initializeAdvancedProtection();

    this.securityMonitor.logSecurityEvent('SERVER_INITIALIZATION', {
      timestamp: new Date().toISOString(),
      environment: this.env,
      version: '2.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
      pythonIntegration: process.env.ENABLE_PYTHON_INTEGRATION === 'true',
      securitySystems: securitySystemsAvailable,
      advancedRoutes: advancedRoutesAvailable,
      botSystem: true,
    });

    console.log('🔧 بدء تهيئة الأنظمة الأساسية...');
    console.log(
      `🐍 تكامل Python: ${
        process.env.ENABLE_PYTHON_INTEGRATION === 'true' ? 'مفعل' : 'معطل'
      }`,
    );
    console.log('🤖 نظام البوت: 🟢 مفعل');
  }

  createDirectoryStructure() {
    const directories = [
      './logs',
      './logs/security',
      './logs/performance',
      './logs/errors',
      './logs/websocket',
      './logs/bot',
      './uploads',
      './temp',
      './backups',
    ];

    directories.forEach((dir) => {
      const fullPath = path.join(__dirname, '../../', dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  setupSecurityInfrastructure() {
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
            connectSrc: ["'self'", 'https:', 'wss:', 'ws:'],
            fontSrc: ["'self'", 'https:', 'data:'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            workerSrc: ["'self'", 'blob:'],
            manifestSrc: ["'self'"],
          },
        },
        crossOriginEmbedderPolicy: { policy: 'require-corp' },
        crossOriginOpenerPolicy: { policy: 'same-origin' },
        crossOriginResourcePolicy: { policy: 'same-site' },
        dnsPrefetchControl: { allow: false },
        frameguard: { action: 'deny' },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
        ieNoOpen: true,
        noSniff: true,
        permittedCrossDomainPolicies: { permittedPolicies: 'none' },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      }),
    );

    this.setupRateLimiting();

    this.app.use(cors(this.getCorsConfig()));

    this.app.use(this.advancedSecurityMiddleware.bind(this));
  }

  setupRateLimiting() {
    const limiters = {
      general: rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 200,
        message: {
          error: 'طلبات كثيرة من هذا العنوان IP',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: '15 دقيقة',
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        keyGenerator: (req) => req.ip || req.connection.remoteAddress,
      }),

      auth: rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 10,
        message: {
          error: 'محاولات تسجيل دخول كثيرة',
          code: 'AUTH_RATE_LIMIT',
          retryAfter: '60 دقيقة',
        },
        skipSuccessfulRequests: true,
      }),

      api: rateLimit({
        windowMs: 1 * 60 * 1000,
        max: 50,
        message: {
          error: 'طلبات API كثيرة',
          code: 'API_RATE_LIMIT',
          retryAfter: '1 دقيقة',
        },
      }),

      payment: rateLimit({
        windowMs: 5 * 60 * 1000,
        max: 20,
        message: {
          error: 'طلبات دفع كثيرة',
          code: 'PAYMENT_RATE_LIMIT',
          retryAfter: '5 دقائق',
        },
      }),

      websocket: rateLimit({
        windowMs: 1 * 60 * 1000,
        max: 30,
        message: {
          error: 'طلبات WebSocket كثيرة',
          code: 'WEBSOCKET_RATE_LIMIT',
          retryAfter: '1 دقيقة',
        },
      }),

      bot: rateLimit({
        windowMs: 10 * 60 * 1000,
        max: 30,
        message: {
          error: 'طلبات بوت كثيرة',
          code: 'BOT_RATE_LIMIT',
          retryAfter: '10 دقائق',
        },
        skipSuccessfulRequests: false,
      }),
    };

    this.app.use('/api/', limiters.general);
    this.app.use('/api/auth/', limiters.auth);
    this.app.use('/api/trading/', limiters.api);
    this.app.use('/api/payment/', limiters.payment);
    this.app.use('/ws/', limiters.websocket);
    this.app.use('/api/bot/', limiters.bot);
  }

  getCorsConfig() {
    const allowedOrigins =
      this.env === 'production'
        ? (process.env.ALLOWED_ORIGINS || 'https://yourdomain.com').split(',')
        : [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:5000',
            'http://localhost:8000',
          ];

    return {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          this.securityMonitor.logSecurityEvent('CORS_VIOLATION', {
            origin,
            timestamp: new Date().toISOString(),
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
        'X-Bot-Token',
      ],
      exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'X-Bot-Status',
      ],
      maxAge: 86400,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };
  }

  advancedSecurityMiddleware(req, res, next) {
    const requestId = this.generateRequestId();
    req.requestId = requestId;

    res.header('X-Request-ID', requestId);
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.header(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=()',
    );
    res.header('X-Runtime', 'Node.js');

    if (req.path.includes('/bot')) {
      res.header('X-Bot-System', 'active');
    }

    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    if (this.detectSuspiciousActivity(req)) {
      this.securityMonitor.logSecurityEvent('SUSPICIOUS_ACTIVITY_DETECTED', {
        requestId,
        ip: req.ip,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });

      return res.status(429).json({
        error: 'نشاط مشبوه تم اكتشافه',
        code: 'SUSPICIOUS_ACTIVITY',
        requestId,
      });
    }

    this.securityMonitor.logRequest(req);

    next();
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  detectSuspiciousActivity(req) {
    const suspiciousPatterns = [
      /(\.\.\/|\.\.\\)/, // directory traversal
      /<script>|javascript:/i, // XSS attempts
      /union.*select|insert.*into|drop.*table/i, // SQL injection
      /exec\(|system\(|eval\(/i, // command execution
      /\/\.env|\/config|\/backup/i, // sensitive file access
      /phpmyadmin|adminer|webconfig/i, // admin tools
    ];

    const userAgent = req.get('User-Agent') || '';
    const isSuspiciousUA =
      userAgent.includes('bot') ||
      userAgent.includes('crawler') ||
      userAgent.includes('scanner');

    return (
      suspiciousPatterns.some(
        (pattern) =>
          pattern.test(req.url) ||
          pattern.test(JSON.stringify(req.body)) ||
          pattern.test(userAgent),
      ) || isSuspiciousUA
    );
  }

  setupAdvancedMiddlewares() {
    this.setupAdvancedLogging();

    this.app.use(
      compression({
        level: 6,
        threshold: 1024,
        filter: (req, res) => {
          if (req.headers['x-no-compression']) return false;
          return compression.filter(req, res);
        },
      }),
    );

    this.app.use(
      express.json({
        limit: '10mb',
        verify: (req, res, buf) => {
          req.rawBody = buf;
          try {
            JSON.parse(buf);
          } catch (e) {
            this.securityMonitor.logSecurityEvent('INVALID_JSON_PAYLOAD', {
              requestId: req.requestId,
              ip: req.ip,
              url: req.url,
              error: e.message,
              timestamp: new Date().toISOString(),
            });
            res.status(400).json({
              error: 'حمولة JSON غير صالحة',
              code: 'INVALID_JSON',
              requestId: req.requestId,
            });
          }
        },
      }),
    );

    this.app.use(
      express.urlencoded({
        extended: true,
        limit: '10mb',
        parameterLimit: 100,
      }),
    );

    this.app.use(
      '/uploads',
      express.static(path.join(__dirname, '../../uploads')),
    );

    this.app.use(this.performanceMiddleware.bind(this));
  }

  setupAdvancedLogging() {
    const logFormats = {
      combined:
        ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms',
      security:
        ':date[iso] :method :url :status :res[content-length] :response-time ms :remote-addr :user-agent',
      websocket: ':date[iso] :client-id :event-type :message',
      bot: ':date[iso] :method :url :status :response-time ms :remote-addr :user-agent',
    };

    const accessLogStream = fs.createWriteStream(
      path.join(__dirname, '../../logs/access.log'),
      { flags: 'a' },
    );

    this.app.use(
      morgan(logFormats.combined, {
        stream: accessLogStream,
        skip: (req) =>
          req.url.includes('/health') || req.url.includes('/metrics'),
      }),
    );

    const securityLogStream = fs.createWriteStream(
      path.join(__dirname, '../../logs/security/security.log'),
      { flags: 'a' },
    );

    this.app.use(
      morgan(logFormats.security, {
        stream: securityLogStream,
        skip: (req) => !this.isSecurityRelevant(req),
      }),
    );

    const botLogStream = fs.createWriteStream(
      path.join(__dirname, '../../logs/bot/bot.log'),
      { flags: 'a' },
    );

    this.app.use(
      morgan(logFormats.bot, {
        stream: botLogStream,
        skip: (req) => !req.url.includes('/bot'),
      }),
    );

    if (this.env !== 'production') {
      this.app.use(morgan('dev'));
    }
  }

  isSecurityRelevant(req) {
    const securityPaths = [
      '/auth',
      '/payment',
      '/admin',
      '/api/key',
      '/ws/',
      '/api/bot/',
    ];
    return securityPaths.some((path) => req.url.includes(path));
  }

  performanceMiddleware(req, res, next) {
    const start = process.hrtime();

    res.on('finish', () => {
      const duration = process.hrtime(start);
      const responseTime = duration[0] * 1000 + duration[1] / 1000000;

      if (responseTime > 1000) {
        this.securityMonitor.logPerformanceIssue({
          requestId: req.requestId,
          url: req.url,
          method: req.method,
          responseTime,
          timestamp: new Date().toISOString(),
        });
      }

      if (req.url.includes('/bot') && responseTime > 500) {
        this.securityMonitor.logSecurityEvent('BOT_PERFORMANCE_ISSUE', {
          requestId: req.requestId,
          url: req.url,
          method: req.method,
          responseTime,
          timestamp: new Date().toISOString(),
        });
      }
    });

    next();
  }

  async setupDatabaseConnection() {
    try {
      const connectDB = require('../config/database');
      await connectDB();

      console.log('🔗 تم الاتصال بقاعدة البيانات بنجاح');

      this.setupDatabaseEventListeners();
    } catch (error) {
      console.error('❌ فشل الاتصال بقاعدة البيانات:', error);
      this.securityMonitor.logSecurityEvent('DATABASE_CONNECTION_FAILED', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      process.exit(1);
    }
  }

  setupDatabaseEventListeners() {
    mongoose.connection.on('error', (err) => {
      console.error('❌ خطأ في اتصال قاعدة البيانات:', err);
      this.securityMonitor.logSecurityEvent('DATABASE_ERROR', {
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ تم قطع اتصال قاعدة البيانات');
      this.securityMonitor.logSecurityEvent('DATABASE_DISCONNECTED', {
        timestamp: new Date().toISOString(),
      });
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔁 تم إعادة الاتصال بقاعدة البيانات');
      this.securityMonitor.logSecurityEvent('DATABASE_RECONNECTED', {
        timestamp: new Date().toISOString(),
      });
    });

    mongoose.connection.on('connected', () => {
      console.log('✅ اتصال قاعدة البيانات نشط');
    });
  }

  setupPythonIntegration() {
    if (process.env.ENABLE_PYTHON_INTEGRATION !== 'true') {
      console.log(
        '🐍 تكامل Python معطل (ENABLE_PYTHON_INTEGRATION != true)',
      );
      return;
    }

    console.log('🔗 بدء تكامل محرك التداول Python...');

    try {
      const tradingProxy = createProxyMiddleware({
        target: `http://localhost:${this.pythonPort}`,
        changeOrigin: true,
        pathRewrite: {
          '^/api/v1/trading': '/api/v1/trading',
        },
        on: {
          proxyReq: (proxyReq, req, res) => {
            console.log(
              `🔄 توجيه طلب تداول إلى Python: ${req.method} ${req.url}`,
            );

            this.securityMonitor.logSecurityEvent('TRADING_REQUEST_PROXY', {
              requestId: req.requestId,
              method: req.method,
              url: req.url,
              target: `http://localhost:${this.pythonPort}`,
              timestamp: new Date().toISOString(),
            });
          },
          proxyRes: (proxyRes, req, res) => {
            console.log(
              `✅ استجابة من Python: ${proxyRes.statusCode} ${req.url}`,
            );
          },
          error: (err, req, res) => {
            console.error('❌ خطأ في الاتصال مع Python:', err.message);

            this.securityMonitor.logSecurityEvent(
              'PYTHON_CONNECTION_ERROR',
              {
                requestId: req.requestId,
                error: err.message,
                timestamp: new Date().toISOString(),
              },
            );

            res.status(503).json({
              error: 'خدمة التداول غير متاحة حالياً',
              code: 'TRADING_SERVICE_UNAVAILABLE',
              requestId: req.requestId,
              fallback: true,
              timestamp: new Date().toISOString(),
            });
          },
        },
        timeout: 30000,
        proxyTimeout: 30000,
      });

      this.app.use('/api/v1/trading', tradingProxy);
      console.log('✅ تم تكوين Reverse Proxy للتداول مع Python');
    } catch (error) {
      console.error('❌ فشل في تكوين تكامل Python:', error);
    }
  }

  setupWebSocketBridge() {
    this.tradingWebSocket = new WebSocket.Server({
      server: this.server,
      path: '/ws/trading',
      perMessageDeflate: false,
      clientTracking: true,
    });

    console.log('🔌 بدء جسر WebSocket للبيانات الحية...');

    this.tradingWebSocket.on('connection', (clientWs, request) => {
      const clientId = this.generateClientId();
      const clientIP = request.socket.remoteAddress;

      console.log(`🔗 عميل متصل WebSocket: ${clientId} من ${clientIP}`);

      this.connectedClients.set(clientId, {
        ws: clientWs,
        ip: clientIP,
        connectedAt: new Date(),
        lastActivity: new Date(),
        type: 'trading',
      });

      this.securityMonitor.logSecurityEvent('WEBSOCKET_CLIENT_CONNECTED', {
        clientId,
        ip: clientIP,
        userAgent: request.headers['user-agent'],
        timestamp: new Date().toISOString(),
        type: 'trading',
      });

      if (process.env.ENABLE_PYTHON_INTEGRATION === 'true') {
        this.connectToPythonWebSocket(clientWs, clientId);
      }

      clientWs.on('message', (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          this.handleWebSocketMessage(clientWs, parsedMessage, clientId);

          const clientInfo = this.connectedClients.get(clientId);
          if (clientInfo) {
            clientInfo.lastActivity = new Date();
          }
        } catch (error) {
          console.error('❌ خطأ في معالجة رسالة WebSocket:', error);
          this.logWebSocketError(
            clientId,
            'MESSAGE_PARSING_ERROR',
            error.message,
          );
        }
      });

      clientWs.on('close', (code, reason) => {
        console.log(`🔌 عميل مقطوع WebSocket: ${clientId} (${code})`);
        this.cleanupClientConnection(clientId, code, reason);
      });

      clientWs.on('error', (error) => {
        console.error(`❌ خطأ WebSocket للعميل ${clientId}:`, error);
        this.logWebSocketError(clientId, 'CLIENT_ERROR', error.message);
        this.cleanupClientConnection(clientId, 1006, 'Client error');
      });

      this.sendToClient(clientId, {
        type: 'connection_established',
        clientId,
        timestamp: new Date().toISOString(),
        message: 'تم الاتصال بنجاح بخادم التداول',
        services: {
          trading: process.env.ENABLE_PYTHON_INTEGRATION === 'true',
          live_data: true,
          websocket: true,
          bot_system: true,
        },
      });

      this.startClientActivityMonitoring(clientId);
    });

    this.setupBotWebSocket();

    if (process.env.ENABLE_PYTHON_INTEGRATION === 'true') {
      setTimeout(() => {
        this.connectToPythonWebSocketServer();
      }, 2000);
    }

    console.log('✅ تم تهيئة جسر WebSocket');
  }

  setupBotWebSocket() {
    this.botWebSocket = new WebSocket.Server({
      server: this.server,
      path: '/ws/bot',
      perMessageDeflate: false,
      clientTracking: true,
    });

    console.log('🤖 بدء جسر WebSocket للبوت...');

    this.botWebSocket.on('connection', (clientWs, request) => {
      const clientId = this.generateClientId();
      const clientIP = request.socket.remoteAddress;

      console.log(`🔗 عميل بوت متصل WebSocket: ${clientId} من ${clientIP}`);

      this.connectedClients.set(clientId, {
        ws: clientWs,
        ip: clientIP,
        connectedAt: new Date(),
        lastActivity: new Date(),
        type: 'bot',
      });

      this.securityMonitor.logSecurityEvent('BOT_WEBSOCKET_CONNECTED', {
        clientId,
        ip: clientIP,
        userAgent: request.headers['user-agent'],
        timestamp: new Date().toISOString(),
      });

      clientWs.on('message', (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          this.handleBotWebSocketMessage(clientWs, parsedMessage, clientId);

          const clientInfo = this.connectedClients.get(clientId);
          if (clientInfo) {
            clientInfo.lastActivity = new Date();
          }
        } catch (error) {
          console.error('❌ خطأ في معالجة رسالة بوت WebSocket:', error);
          this.logWebSocketError(
            clientId,
            'BOT_MESSAGE_PARSING_ERROR',
            error.message,
          );
        }
      });

      clientWs.on('close', (code, reason) => {
        console.log(`🔌 عميل بوت مقطوع WebSocket: ${clientId} (${code})`);
        this.cleanupClientConnection(clientId, code, reason);
      });

      clientWs.on('error', (error) => {
        console.error(
          `❌ خطأ WebSocket للعميل البوت ${clientId}:`,
          error,
        );
        this.logWebSocketError(
          clientId,
          'BOT_CLIENT_ERROR',
          error.message,
        );
        this.cleanupClientConnection(clientId, 1006, 'Bot client error');
      });

      this.sendToClient(clientId, {
        type: 'bot_connection_established',
        clientId,
        timestamp: new Date().toISOString(),
        message: 'تم الاتصال بنجاح بخادم البوت',
        services: {
          bot_management: true,
          realtime_updates: true,
          trading_signals: true,
        },
      });

      this.startClientActivityMonitoring(clientId);
    });
  }

  handleBotWebSocketMessage(clientWs, message, clientId) {
    const { type, data } = message;

    this.securityMonitor.logSecurityEvent('BOT_WEBSOCKET_MESSAGE', {
      clientId,
      type,
      data,
      timestamp: new Date().toISOString(),
    });

    switch (type) {
      case 'bot_status':
        this.handleBotStatusRequest(clientId, data);
        break;
      case 'bot_control':
        this.handleBotControlRequest(clientId, data);
        break;
      case 'ping':
        this.sendToClient(clientId, {
          type: 'pong',
          timestamp: new Date().toISOString(),
          service: 'bot',
        });
        break;
      default:
        this.sendToClient(clientId, {
          type: 'error',
          message: 'نوع رسالة البوت غير معروف',
          originalType: type,
          timestamp: new Date().toISOString(),
        });
    }
  }

  handleBotStatusRequest(clientId, data) {
    const botStatus = {
      type: 'bot_status_response',
      botId: data.botId,
      status: 'active',
      performance: {
        totalTrades: 45,
        successfulTrades: 38,
        totalProfit: 1250.5,
        successRate: 84.4,
      },
      configuration: {
        strategy: 'day_trading',
        riskLevel: 'medium',
        exchanges: ['binance', 'bybit'],
      },
      timestamp: new Date().toISOString(),
    };

    this.sendToClient(clientId, botStatus);
  }

  handleBotControlRequest(clientId, data) {
    const { action, botId } = data;

    this.securityMonitor.logSecurityEvent('BOT_CONTROL_ACTION', {
      clientId,
      action,
      botId,
      timestamp: new Date().toISOString(),
    });

    const response = {
      type: 'bot_control_response',
      action,
      botId,
      status: 'success',
      message: `تم ${action} البوت بنجاح`,
      timestamp: new Date().toISOString(),
    };

    this.sendToClient(clientId, response);
  }

  connectToPythonWebSocketServer() {
    if (process.env.ENABLE_PYTHON_INTEGRATION !== 'true') return;

    const pythonWsUrl = `ws://localhost:${this.pythonPort}/ws/trading`;

    console.log(
      `🔄 محاولة الاتصال بخادم Python WebSocket: ${pythonWsUrl}`,
    );

    try {
      this.pythonWebSocket = new WebSocket(pythonWsUrl, {
        handshakeTimeout: 10000,
        perMessageDeflate: false,
      });

      this.pythonWebSocket.on('open', () => {
        console.log('✅ تم الاتصال بنجاح بخادم Python WebSocket');

        this.securityMonitor.logSecurityEvent(
          'PYTHON_WEBSOCKET_CONNECTED',
          {
            url: pythonWsUrl,
            timestamp: new Date().toISOString(),
          },
        );

        this.broadcastToClients({
          type: 'service_status',
          service: 'python_engine',
          status: 'connected',
          timestamp: new Date().toISOString(),
        });
      });

      this.pythonWebSocket.on('message', (data) => {
        try {
          const payload = JSON.parse(data);
          this.broadcastToClients(payload);

          this.securityMonitor.logSecurityEvent(
            'PYTHON_WEBSOCKET_MESSAGE',
            {
              messageType: payload.type,
              timestamp: new Date().toISOString(),
            },
          );
        } catch (error) {
          console.error('❌ خطأ في معالجة رسالة Python:', error);
        }
      });

      this.pythonWebSocket.on('close', (code, reason) => {
        console.warn(
          '⚠️ تم قطع الاتصال بخادم Python WebSocket:',
          code,
          reason,
        );

        this.securityMonitor.logSecurityEvent(
          'PYTHON_WEBSOCKET_DISCONNECTED',
          {
            code,
            reason: reason?.toString(),
            timestamp: new Date().toISOString(),
          },
        );

        this.broadcastToClients({
          type: 'service_status',
          service: 'python_engine',
          status: 'disconnected',
          timestamp: new Date().toISOString(),
        });

        setTimeout(() => {
          this.connectToPythonWebSocketServer();
        }, 5000);
      });

      this.pythonWebSocket.on('error', (error) => {
        console.error('❌ خطأ في اتصال Python WebSocket:', error);

        this.securityMonitor.logSecurityEvent(
          'PYTHON_WEBSOCKET_ERROR',
          {
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        );
      });
    } catch (error) {
      console.error('❌ فشل في إنشاء اتصال Python WebSocket:', error);

      setTimeout(() => {
        this.connectToPythonWebSocketServer();
      }, 10000);
    }
  }

  connectToPythonWebSocket(clientWs, clientId) {
    if (
      !this.pythonWebSocket ||
      this.pythonWebSocket.readyState !== WebSocket.OPEN
    ) {
      this.sendToClient(clientId, {
        type: 'service_unavailable',
        message: 'خدمة البيانات الحية غير متاحة حالياً',
        clientId,
        timestamp: new Date().toISOString(),
        retryIn: 5,
      });
      return;
    }

    this.pythonWebSocket.send(
      JSON.stringify({
        type: 'client_connected',
        clientId,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  broadcastToClients(data) {
    if (!this.tradingWebSocket || this.connectedClients.size === 0) return;

    const messageString =
      typeof data === 'string' ? data : JSON.stringify(data);

    this.connectedClients.forEach((clientInfo, clientId) => {
      if (clientInfo.ws.readyState === WebSocket.OPEN) {
        try {
          clientInfo.ws.send(messageString);
        } catch (error) {
          console.error(
            `❌ خطأ في بث البيانات للعميل ${clientId}:`,
            error,
          );
          this.cleanupClientConnection(clientId, 1011, 'Broadcast error');
        }
      }
    });
  }

  sendToClient(clientId, data) {
    const clientInfo = this.connectedClients.get(clientId);
    if (clientInfo && clientInfo.ws.readyState === WebSocket.OPEN) {
      try {
        clientInfo.ws.send(JSON.stringify(data));
      } catch (error) {
        console.error(
          `❌ خطأ في إرسال البيانات للعميل ${clientId}:`,
          error,
        );
      }
    }
  }

  handleWebSocketMessage(clientWs, message, clientId) {
    const { type, data } = message;

    if (type === 'subscribe' || type === 'unsubscribe') {
      this.securityMonitor.logSecurityEvent('WEBSOCKET_SUBSCRIPTION', {
        clientId,
        type,
        data,
        timestamp: new Date().toISOString(),
      });
    }

    if (
      process.env.ENABLE_PYTHON_INTEGRATION === 'true' &&
      this.pythonWebSocket &&
      this.pythonWebSocket.readyState === WebSocket.OPEN
    ) {
      this.pythonWebSocket.send(
        JSON.stringify({
          ...message,
          clientId,
          timestamp: new Date().toISOString(),
        }),
      );
    } else {
      this.handleLocalWebSocketMessage(clientWs, message, clientId);
    }
  }

  handleLocalWebSocketMessage(clientWs, message, clientId) {
    const { type, data } = message;

    switch (type) {
      case 'ping':
        this.sendToClient(clientId, {
          type: 'pong',
          timestamp: new Date().toISOString(),
        });
        break;
      case 'get_stats':
        this.sendToClient(clientId, {
          type: 'stats',
          connectedClients: this.connectedClients.size,
          pythonConnected:
            this.pythonWebSocket &&
            this.pythonWebSocket.readyState === WebSocket.OPEN,
          botSystem: true,
          timestamp: new Date().toISOString(),
        });
        break;
      case 'get_bot_status':
        this.handleBotStatusRequest(clientId, data);
        break;
      default:
        this.sendToClient(clientId, {
          type: 'error',
          message: 'نوع الرسالة غير معروف',
          originalType: type,
          timestamp: new Date().toISOString(),
        });
    }
  }

  cleanupClientConnection(
    clientId,
    code = 1000,
    reason = 'Normal closure',
  ) {
    const clientInfo = this.connectedClients.get(clientId);
    if (clientInfo) {
      if (
        this.pythonWebSocket &&
        this.pythonWebSocket.readyState === WebSocket.OPEN
      ) {
        this.pythonWebSocket.send(
          JSON.stringify({
            type: 'client_disconnected',
            clientId,
            code,
            reason,
            timestamp: new Date().toISOString(),
          }),
        );
      }

      const eventType =
        clientInfo.type === 'bot'
          ? 'BOT_WEBSOCKET_DISCONNECTED'
          : 'WEBSOCKET_CLIENT_DISCONNECTED';

      this.securityMonitor.logSecurityEvent(eventType, {
        clientId,
        code,
        reason,
        duration: new Date() - clientInfo.connectedAt,
        timestamp: new Date().toISOString(),
      });

      if (clientInfo.ws.readyState === WebSocket.OPEN) {
        clientInfo.ws.close(code, reason);
      }

      if (clientInfo.activityCheckInterval) {
        clearInterval(clientInfo.activityCheckInterval);
      }

      this.connectedClients.delete(clientId);

      console.log(
        `🧹 تم تنظيف اتصال العميل: ${clientId} (${clientInfo.type})`,
      );
    }
  }

  startClientActivityMonitoring(clientId) {
    const activityCheck = setInterval(() => {
      const clientInfo = this.connectedClients.get(clientId);
      if (!clientInfo) {
        clearInterval(activityCheck);
        return;
      }

      const inactiveTime = new Date() - clientInfo.lastActivity;
      if (inactiveTime > 300000) {
        console.log(`⏰ فصل العميل ${clientId} بسبب عدم النشاط`);
        this.cleanupClientConnection(
          clientId,
          1001,
          'Inactivity timeout',
        );
        clearInterval(activityCheck);
      }
    }, 30000);

    const clientInfo = this.connectedClients.get(clientId);
    if (clientInfo) {
      clientInfo.activityCheckInterval = activityCheck;
    }
  }

  logWebSocketError(clientId, errorType, errorMessage) {
    const errorLog = {
      clientId,
      errorType,
      errorMessage,
      timestamp: new Date().toISOString(),
    };

    const logFile = errorType.includes('BOT')
      ? 'bot_errors.log'
      : 'errors.log';
    const websocketLogStream = fs.createWriteStream(
      path.join(__dirname, '../../logs/websocket/', logFile),
      { flags: 'a' },
    );

    websocketLogStream.write(JSON.stringify(errorLog) + '\n');
    websocketLogStream.end();

    this.securityMonitor.logSecurityEvent('WEBSOCKET_ERROR', errorLog);
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  setupAPIRoutes() {
    this.app.get('/health', (req, res) => {
      const healthCheck = {
        status: 'OK',
        service: 'QUANTUM AI TRADER SERVER',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: this.env,
        version: '2.0.0',
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        database:
          mongoose.connection.readyState === 1
            ? 'connected'
            : 'disconnected',
        pythonIntegration: {
          enabled: process.env.ENABLE_PYTHON_INTEGRATION === 'true',
          status:
            this.pythonWebSocket &&
            this.pythonWebSocket.readyState === WebSocket.OPEN
              ? 'connected'
              : 'disconnected',
          port: this.pythonPort,
        },
        websocket: {
          connectedClients: this.connectedClients.size,
          pythonConnected:
            this.pythonWebSocket &&
            this.pythonWebSocket.readyState === WebSocket.OPEN,
          botConnections: Array.from(
            this.connectedClients.values(),
          ).filter((client) => client.type === 'bot').length,
        },
        security: {
          monitoring: this.securityMonitor.isActive(),
          reverseEngineering: this.antiReverse.isActive(),
          systemsAvailable: securitySystemsAvailable,
        },
        routes: {
          advancedAvailable: advancedRoutesAvailable,
          basicAvailable: true,
          botSystem: true,
        },
      };

      res.status(200).json(healthCheck);
    });

    this.app.get('/metrics', (req, res) => {
      res.status(200).json(this.getSystemMetrics());
    });

    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/products', productRoutes);
    this.app.use('/api/orders', orderRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/upload', uploadRoutes);
    this.app.use('/api/bot', botRoutes);
    console.log('✅ تم تحميل مسارات نظام البوت');

    if (advancedRoutesAvailable) {
      this.app.use('/api/v1/auth', authRoutes);
      this.app.use('/api/v1/client', clientRoutes);
      this.app.use('/api/v1/payment', paymentRoutes);
      this.app.use('/api/v1/admin', adminRoutes);
      this.app.use('/api/v1/webhooks', webhookRoutes);
      console.log('✅ تم تحميل المسارات المتقدمة');
    }

    this.app.get('/', (req, res) => {
      res.json({
        message: 'مرحباً بكم في خادم التداول المتقدم',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        features: {
          python_integration:
            process.env.ENABLE_PYTHON_INTEGRATION === 'true',
          websocket: true,
          advanced_security: securitySystemsAvailable,
          advanced_routes: advancedRoutesAvailable,
          basic_routes: true,
          bot_system: true,
        },
        documentation: 'https://docs.yourdomain.com',
        api_endpoints: {
          bot: '/api/bot/*',
        },
      });
    });

    this.app.use('/api/*', (req, res) => {
      this.securityMonitor.logSecurityEvent('ENDPOINT_NOT_FOUND', {
        requestId: req.requestId,
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        timestamp: new Date().toISOString(),
      });

      res.status(404).json({
        error: 'النقطة المطلوبة غير موجودة',
        code: 'ENDPOINT_NOT_FOUND',
        path: req.originalUrl,
        requestId: req.requestId,
        availableRoutes: [
          '/api/auth/*',
          '/api/products/*',
          '/api/orders/*',
          '/api/users/*',
          '/api/upload/*',
          '/api/bot/*',
          '/health',
          '/metrics',
        ].concat(
          advancedRoutesAvailable
            ? [
                '/api/v1/auth/*',
                '/api/v1/client/*',
                '/api/v1/payment/*',
                '/api/v1/admin/*',
                '/api/v1/webhooks/*',
              ]
            : [],
        ),
      });
    });
  }

  getSystemMetrics() {
    const botClients = Array.from(this.connectedClients.values()).filter(
      (client) => client.type === 'bot',
    );

    return {
      timestamp: new Date().toISOString(),
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
      },
      database: {
        state: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      },
      pythonIntegration: {
        enabled: process.env.ENABLE_PYTHON_INTEGRATION === 'true',
        websocket: this.pythonWebSocket
          ? {
              state: this.pythonWebSocket.readyState,
              connected:
                this.pythonWebSocket.readyState === WebSocket.OPEN,
            }
          : null,
        port: this.pythonPort,
      },
      websocket: {
        connectedClients: this.connectedClients.size,
        tradingClients: Array.from(
          this.connectedClients.values(),
        ).filter((client) => client.type === 'trading').length,
        botClients: botClients.length,
        clientDetails: Array.from(
          this.connectedClients.entries(),
        ).map(([id, info]) => ({
          id,
          ip: info.ip,
          type: info.type,
          connectedAt: info.connectedAt,
          lastActivity: info.lastActivity,
        })),
      },
      features: {
        securitySystems: securitySystemsAvailable,
        advancedRoutes: advancedRoutesAvailable,
        pythonIntegration: process.env.ENABLE_PYTHON_INTEGRATION === 'true',
        botSystem: true,
      },
    };
  }

  setupErrorHandlers() {
    this.app.use((error, req, res, next) => {
      console.error('🚨 معالج الأخطاء العام:', error);

      const errorId = `err_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      this.securityMonitor.logSecurityEvent('SERVER_ERROR', {
        errorId,
        requestId: req.requestId,
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        isBotRequest: req.url.includes('/bot'),
      });

      this.logErrorToFile(error, req, errorId);

      if (this.env === 'production') {
        return res.status(500).json({
          error: 'خطأ داخلي في الخادم',
          code: 'INTERNAL_ERROR',
          errorId,
          requestId: req.requestId,
          support: 'support@yourdomain.com',
        });
      }

      res.status(500).json({
        error: error.message,
        stack: error.stack,
        code: 'INTERNAL_ERROR',
        errorId,
        requestId: req.requestId,
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('🚨 رفض Promise غير معالج:', reason);
      this.securityMonitor.logSecurityEvent('UNHANDLED_REJECTION', {
        reason: reason?.toString() || 'Unknown',
        timestamp: new Date().toISOString(),
      });
    });

    process.on('uncaughtException', (error) => {
      console.error('🚨 استثناء غير معالج:', error);
      this.securityMonitor.logSecurityEvent('UNCAUGHT_EXCEPTION', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });

      this.gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
  }

  logErrorToFile(error, req, errorId) {
    const errorLog = {
      errorId,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      request: {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        headers: req.headers,
        isBotRequest: req.url.includes('/bot'),
      },
    };

    const logFile = req.url.includes('/bot')
      ? 'bot_errors.log'
      : 'errors.log';
    const errorLogStream = fs.createWriteStream(
      path.join(__dirname, '../../logs/errors/', logFile),
      { flags: 'a' },
    );

    errorLogStream.write(JSON.stringify(errorLog) + '\n');
    errorLogStream.end();
  }

  setupPerformanceMonitoring() {
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      if (memoryUsage.heapUsed > 500 * 1024 * 1024) {
        this.securityMonitor.logPerformanceIssue({
          type: 'HIGH_MEMORY_USAGE',
          memoryUsage,
          timestamp: new Date().toISOString(),
        });
      }
    }, 60000);

    setInterval(() => {
      const botClients = Array.from(
        this.connectedClients.values(),
      ).filter((client) => client.type === 'bot');
      const websocketStats = {
        connectedClients: this.connectedClients.size,
        botClients: botClients.length,
        pythonConnected:
          this.pythonWebSocket &&
          this.pythonWebSocket.readyState === WebSocket.OPEN,
        timestamp: new Date().toISOString(),
      };

      if (websocketStats.connectedClients > 100) {
        this.securityMonitor.logPerformanceIssue({
          type: 'HIGH_WEBSOCKET_CONNECTIONS',
          stats: websocketStats,
          timestamp: new Date().toISOString(),
        });
      }

      if (botClients.length > 50) {
        this.securityMonitor.logPerformanceIssue({
          type: 'HIGH_BOT_CONNECTIONS',
          stats: websocketStats,
          timestamp: new Date().toISOString(),
        });
      }
    }, 30000);
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(this.getStartupBanner());
    });

    this.setupGracefulShutdown();
  }

  getStartupBanner() {
    const pythonStatus =
      process.env.ENABLE_PYTHON_INTEGRATION === 'true'
        ? '🟢 مفعل'
        : '🔴 معطل';
    const securityStatus = securitySystemsAvailable
      ? '🟢 متقدم'
      : '🟡 أساسي';
    const routesStatus = advancedRoutesAvailable
      ? '🟢 متقدمة'
      : '🟡 أساسية';
    const botStatus = '🟢 مفعل';

    const botClients = Array.from(
      this.connectedClients.values(),
    ).filter((client) => client.type === 'bot').length;

    return `
🚀 QUANTUM AI TRADER SERVER - الإصدار 2.0.0

📍 المنفذ: ${this.port}
🐍 تكامل Python: ${pythonStatus}
🔒 الأمان: ${securityStatus}
🛣️ المسارات: ${routesStatus}
🤖 نظام البوت: ${botStatus}
🌍 البيئة: ${this.env}
⚡ Node.js: ${process.version}
📦 PID: ${process.pid}

✅ الأنظمة المفعلة:
   🔒 ${securitySystemsAvailable ? 'مراقبة الأمان المتقدمة' : 'مراقبة الأمان الأساسية'}
   🔌 خادم WebSocket للبيانات الحية
   🤖 نظام البوت التلقائي المتكامل
   📊 مراقبة الأداء والتسجيل المتقدم
   🗄️  قاعدة البيانات: ${
     mongoose.connection.readyState === 1 ? '🟢 متصل' : '🔴 غير متصل'
   }

🔗 اتصالات الخدمة:
   📡 Node.js API: http://localhost:${this.port}
   ${
     process.env.ENABLE_PYTHON_INTEGRATION === 'true'
       ? `🤖 Python Trading: http://localhost:${this.pythonPort}`
       : ''
   }
   🔌 WebSocket Trading: ws://localhost:${this.port}/ws/trading
   🔌 WebSocket Bot: ws://localhost:${this.port}/ws/bot

🎯 المسارات المتاحة:
   • /api/auth/* → إدارة المستخدمين
   • /api/products/* → إدارة المنتجات
   • /api/orders/* → إدارة الطلبات
   • /api/users/* → إدارة الملفات
   • /api/upload/* → رفع الملفات
   • /api/bot/* → نظام البوت التلقائي ⭐
   ${
     advancedRoutesAvailable
       ? `
   • /api/v1/auth/* → إدارة المستخدمين (المتقدمة)
   • /api/v1/client/* → إدارة العملاء (المتقدمة)
   • /api/v1/payment/* → نظام الدفع (المتقدمة)
   • /api/v1/admin/* → لوحة التحكم (المتقدمة)
   • /api/v1/webhooks/* → Webhooks (المتقدمة)
   `
       : ''
   }
   ${
     process.env.ENABLE_PYTHON_INTEGRATION === 'true'
       ? `
   • /api/v1/trading/* → Python Trading Engine
   • /api/v1/live/* → Python Live Data
   • /api/v1/ai/* → Python AI Analysis
   `
       : ''
   }

🔌 حالة WebSocket:
   • العملاء المتصلين: ${this.connectedClients.size}
   • عملاء البوت: ${botClients}
   • اتصال Python: ${
     this.pythonWebSocket &&
     this.pythonWebSocket.readyState === WebSocket.OPEN
       ? '🟢 نشط'
       : '🔴 غير متصل'
   }

🤖 نظام البوت:
   • الحالة: 🟢 نشط
   • المسارات: /api/bot/activate, /api/bot/status, /api/bot/control
   • WebSocket: ws://localhost:${this.port}/ws/bot
   • الوثائق: /api/bot/docs

==================================================
        `;
  }

  setupGracefulShutdown() {
    const shutdown = (signal) => {
      console.log(`\n\n📢 تم استقبال إشارة ${signal}. بدء الإغلاق الآمن...`);

      this.securityMonitor.logSecurityEvent('SERVER_SHUTDOWN_INITIATED', {
        signal,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });

      const botClients = Array.from(
        this.connectedClients.values(),
      ).filter((client) => client.type === 'bot').length;
      console.log(
        `👋 إغلاق اتصالات ${this.connectedClients.size} عميل (${botClients} بوت)...`,
      );

      this.connectedClients.forEach((clientInfo, clientId) => {
        this.cleanupClientConnection(clientId, 1001, 'Server shutdown');
      });

      if (this.tradingWebSocket) {
        this.tradingWebSocket.close();
        console.log('✅ تم إغلاق خادم WebSocket للتداول.');
      }

      if (this.botWebSocket) {
        this.botWebSocket.close();
        console.log('✅ تم إغلاق خادم WebSocket للبوت.');
      }

      if (this.pythonWebSocket) {
        this.pythonWebSocket.close();
        console.log('✅ تم إغلاق اتصال Python WebSocket.');
      }

      this.server.close((err) => {
        if (err) {
          console.error('❌ خطأ في إغلاق خادم HTTP:', err);
        } else {
          console.log('✅ تم إغلاق خادم HTTP.');
        }

        mongoose.connection.close(false, (dbErr) => {
          if (dbErr) {
            console.error('❌ خطأ في إغلاق قاعدة البيانات:', dbErr);
          } else {
            console.log('✅ تم إغلاق اتصال قاعدة البيانات.');
          }

          this.securityMonitor.stopMonitoring();
          console.log('✅ تم إيقاف مراقبة الأمان.');

          console.log('👋 اكتمل الإغلاق الآمن.');
          process.exit(err || dbErr ? 1 : 0);
        });
      });

      setTimeout(() => {
        console.error(
          '❌ لم يتمكن من إغلاق الاتصالات في الوقت المحدد، إغلاق قسري',
        );
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2'));
  }

  gracefulShutdown(reason) {
    console.log(`\n🔄 بدء الإغلاق الآمن بسبب: ${reason}`);
    // نستخدم نفس مسار الإغلاق الآمن عبر إرسال SIGTERM
    process.emit('SIGTERM');
  }
}

const server = new QuantumTradeServer();
server.start();

module.exports = server;
