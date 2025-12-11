// backend/src/security/cyberSecurityMonitor.js - النسخة المحسنة والمتقدمة
const EventEmitter = require('events');
const mongoose = require('mongoose');
const geoip = require('geoip-lite');
const { performance } = require('perf_hooks');
const crypto = require('crypto');

class CyberSecurityMonitor extends EventEmitter {
    constructor() {
        super();
        
        this.suspiciousActivities = new Map();
        this.ipBlacklist = new Set();
        this.ipWhitelist = new Set();
        this.requestPatterns = new Map();
        
        // أنماط الهجوم المعروفة
        this.attackPatterns = [
            // SQL Injection
            /(union.*select|drop.*table|insert.*into|delete.*from|update.*set|exec\(|xp_cmdshell)/i,
            
            // XSS Attacks
            /(<script>|eval\(|alert\(\)|document\.cookie|onload\s*=|onerror\s*=)/i,
            
            // Path Traversal
            /(\.\.\/|\.\.\\|etc\/passwd|win\.ini|boot\.ini)/i,
            
            // Command Injection
            /(\||&|;|\$\(|\`|\$\{)/,
            
            // File Inclusion
            /(php:\/\/|phar:\/\/|zip:\/\/|data:\/\/)/i,
            
            // API Abuse
            /(admin|root|system|config)/i,
            
            // Cryptojacking
            /(coin-hive|miner|webassembly| cryptonight)/i,
            
            // Bot Patterns
            /(bot|spider|crawler|scraper)/i
        ];

        // معدلات الطلبات المسموحة
        this.rateLimits = {
            general: { windowMs: 15 * 60 * 1000, max: 100 },
            auth: { windowMs: 60 * 60 * 1000, max: 5 },
            api: { windowMs: 1 * 60 * 1000, max: 30 },
            admin: { windowMs: 5 * 60 * 1000, max: 10 }
        };

        this.stats = {
            totalRequests: 0,
            blockedRequests: 0,
            suspiciousActivities: 0,
            attacksPrevented: 0
        };

        this.monitoringEnabled = true;
        this.autoBlockEnabled = true;
        this.realtimeAlerts = true;

        this.init();
    }

    async init() {
        await this.loadBlacklist();
        await this.loadWhitelist();
        this.startPeriodicCleanup();
        console.log('🛡️ نظام مراقبة الأمان السيبراني مفعل');
    }

    // وسيط مراقبة الطلبات المحسّن
    monitorRequest(req, res, next) {
        if (!this.monitoringEnabled) return next();

        const startTime = performance.now();
        const clientIP = this.getClientIP(req);
        const userAgent = req.get('User-Agent') || 'Unknown';
        const requestId = crypto.randomBytes(8).toString('hex');

        // إضافة معلومات المراقبة للطلب
        req.securityContext = {
            id: requestId,
            ip: clientIP,
            userAgent: userAgent,
            startTime: startTime,
            riskScore: 0,
            threats: []
        };

        // تسجيل الطلب
        this.logRequest(req);

        // التحقق من القائمة السوداء
        if (this.ipBlacklist.has(clientIP)) {
            this.blockRequest(req, res, 'IP في القائمة السوداء');
            return;
        }

        // التحقق من القائمة البيضاء
        if (this.ipWhitelist.has(clientIP)) {
            return next();
        }

        // الكشف عن أنماط الهجوم
        const attackDetection = this.detectAttackPatterns(req);
        if (attackDetection.isAttack) {
            req.securityContext.threats.push(...attackDetection.threats);
            req.securityContext.riskScore += attackDetection.riskScore;

            this.handleAttackDetection(req, res, attackDetection);
            return;
        }

        // مراقبة معدل الطلبات
        const rateLimitCheck = this.checkRateLimit(clientIP, req.path);
        if (rateLimitCheck.exceeded) {
            req.securityContext.threats.push('تجاوز معدل الطلبات المسموح');
            req.securityContext.riskScore += 30;

            this.handleRateLimitExceeded(req, res, rateLimitCheck);
            return;
        }

        // تحليل السلوك المشبوه
        const behaviorAnalysis = this.analyzeBehavior(req);
        if (behaviorAnalysis.suspicious) {
            req.securityContext.threats.push(...behaviorAnalysis.threats);
            req.securityContext.riskScore += behaviorAnalysis.riskScore;
        }

        // إذا كانت درجة الخطورة عالية، كتلة الطلب
        if (req.securityContext.riskScore >= 70) {
            this.blockRequest(req, res, 'نشاط مشبوه عالي الخطورة');
            return;
        }

        // مراقبة وقت الاستجابة
        res.on('finish', () => {
            const responseTime = performance.now() - startTime;
            this.monitorResponseTime(req, responseTime);
            
            // تحديث إحصائيات الطلب
            this.updateRequestStats(req, res.statusCode);
        });

        next();
    }

    // كشف أنماط الهجوم المتقدم
    detectAttackPatterns(req) {
        const threats = [];
        let riskScore = 0;
        const requestData = JSON.stringify({
            body: req.body,
            query: req.query,
            params: req.params,
            headers: this.getSensitiveHeaders(req),
            path: req.path
        }).toLowerCase();

        for (const pattern of this.attackPatterns) {
            if (pattern.test(requestData)) {
                const threat = `كشف نمط هجوم: ${pattern.toString()}`;
                threats.push(threat);
                riskScore += 20;
            }
        }

        // كشف هجمات الـ DDoS
        if (this.detectDDoSPattern(req)) {
            threats.push('نمط هجوم DDoS محتمل');
            riskScore += 40;
        }

        // كشف هجمات القوة الغاشمة
        if (this.detectBruteForcePattern(req)) {
            threats.push('نمط هجوم القوة الغاشمة');
            riskScore += 35;
        }

        return {
            isAttack: riskScore > 0,
            threats,
            riskScore
        };
    }

    // كشف هجمات DDoS
    detectDDoSPattern(req) {
        const clientIP = this.getClientIP(req);
        const now = Date.now();
        
        if (!this.requestPatterns.has(clientIP)) {
            this.requestPatterns.set(clientIP, {
                count: 0,
                firstRequest: now,
                lastRequest: now,
                paths: new Set()
            });
        }

        const pattern = this.requestPatterns.get(clientIP);
        pattern.count++;
        pattern.lastRequest = now;
        pattern.paths.add(req.path);

        // إذا كان هناك أكثر من 100 طلب في دقيقة واحدة
        if (pattern.count > 100 && (now - pattern.firstRequest) < 60000) {
            return true;
        }

        // إذا طلب أكثر من 20 مسار مختلف في دقيقة واحدة
        if (pattern.paths.size > 20 && (now - pattern.firstRequest) < 60000) {
            return true;
        }

        return false;
    }

    // كشف هجمات القوة الغاشمة
    detectBruteForcePattern(req) {
        if (!req.path.includes('/auth/login')) return false;

        const clientIP = this.getClientIP(req);
        const key = `bruteforce:${clientIP}`;
        
        if (!this.suspiciousActivities.has(key)) {
            this.suspiciousActivities.set(key, {
                count: 0,
                firstAttempt: Date.now(),
                lastAttempt: Date.now()
            });
        }

        const activity = this.suspiciousActivities.get(key);
        activity.count++;
        activity.lastAttempt = Date.now();

        // أكثر من 5 محاولات تسجيل دخول في 10 دقائق
        return activity.count > 5 && (Date.now() - activity.firstAttempt) < 600000;
    }

    // تحليل السلوك المشبوه
    analyzeBehavior(req) {
        const threats = [];
        let riskScore = 0;
        const clientIP = this.getClientIP(req);

        // تحليل الموقع الجغرافي
        const geo = geoip.lookup(clientIP);
        if (geo && this.isSuspiciousCountry(geo.country)) {
            threats.push(`طلب من دولة عالية الخطورة: ${geo.country}`);
            riskScore += 15;
        }

        // تحليل User-Agent
        if (this.isSuspiciousUserAgent(req.get('User-Agent'))) {
            threats.push('عميل مشبوه (User-Agent)');
            riskScore += 10;
        }

        // تحليل وقت الطلب (أنشطة غير اعتيادية)
        if (this.isUnusualRequestTime()) {
            threats.push('وقت طلب غير اعتيادي');
            riskScore += 5;
        }

        return {
            suspicious: riskScore > 0,
            threats,
            riskScore
        };
    }

    // التحقق من معدل الطلبات
    checkRateLimit(clientIP, path) {
        const now = Date.now();
        const key = `ratelimit:${clientIP}:${path}`;

        if (!this.suspiciousActivities.has(key)) {
            this.suspiciousActivities.set(key, {
                count: 0,
                windowStart: now
            });
        }

        const activity = this.suspiciousActivities.get(key);
        const windowMs = this.getRateLimitWindow(path);

        // إعادة تعيين النافذة إذا انتهت
        if (now - activity.windowStart > windowMs) {
            activity.count = 0;
            activity.windowStart = now;
        }

        activity.count++;

        const maxRequests = this.getMaxRequests(path);
        const exceeded = activity.count > maxRequests;

        return {
            exceeded,
            current: activity.count,
            max: maxRequests,
            resetIn: windowMs - (now - activity.windowStart)
        };
    }

    // الحصول على نافذة معدل الطلبات بناءً على المسار
    getRateLimitWindow(path) {
        if (path.includes('/auth/')) return this.rateLimits.auth.windowMs;
        if (path.includes('/admin/')) return this.rateLimits.admin.windowMs;
        if (path.includes('/api/')) return this.rateLimits.api.windowMs;
        return this.rateLimits.general.windowMs;
    }

    getMaxRequests(path) {
        if (path.includes('/auth/')) return this.rateLimits.auth.max;
        if (path.includes('/admin/')) return this.rateLimits.admin.max;
        if (path.includes('/api/')) return this.rateLimits.api.max;
        return this.rateLimits.general.max;
    }

    // معالجة كشف الهجوم
    async handleAttackDetection(req, res, detection) {
        const clientIP = this.getClientIP(req);
        
        this.stats.attacksPrevented++;
        this.stats.blockedRequests++;

        // تسجيل الحادث الأمني
        await this.logSecurityIncident({
            type: 'ATTACK_DETECTED',
            ip: clientIP,
            path: req.path,
            method: req.method,
            threats: detection.threats,
            riskScore: detection.riskScore,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        });

        // إضافة إلى القائمة السوداء إذا كانت خطيرة
        if (detection.riskScore >= 50 && this.autoBlockEnabled) {
            this.ipBlacklist.add(clientIP);
            await this.saveToBlacklist(clientIP);
        }

        // إشعار عاجل
        if (this.realtimeAlerts) {
            await this.notifyOwnerImmediately(req, detection);
        }

        this.blockRequest(req, res, 'هجوم أمني تم كشفه');
    }

    // معالجة تجاوز معدل الطلبات
    async handleRateLimitExceeded(req, res, rateLimit) {
        const clientIP = this.getClientIP(req);
        
        this.stats.blockedRequests++;

        await this.logSecurityIncident({
            type: 'RATE_LIMIT_EXCEEDED',
            ip: clientIP,
            path: req.path,
            method: req.method,
            current: rateLimit.current,
            max: rateLimit.max,
            timestamp: new Date().toISOString()
        });

        this.blockRequest(req, res, 'تجاوز معدل الطلبات المسموح');
    }

    // طلب محظور
    blockRequest(req, res, reason) {
        const clientIP = this.getClientIP(req);
        
        this.emit('requestBlocked', {
            ip: clientIP,
            reason: reason,
            path: req.path,
            timestamp: new Date().toISOString()
        });

        res.status(403).json({
            error: 'طلب مرفوض لأسباب أمنية',
            code: 'REQUEST_BLOCKED',
            reason: reason,
            requestId: req.securityContext?.id,
            timestamp: new Date().toISOString()
        });
    }

    // مراقبة وقت الاستجابة
    monitorResponseTime(req, responseTime) {
        if (responseTime > 10000) { // أكثر من 10 ثوان
            this.emit('slowResponse', {
                ip: req.securityContext.ip,
                path: req.path,
                responseTime: responseTime,
                timestamp: new Date().toISOString()
            });
        }
    }

    // تحديث إحصائيات الطلبات
    updateRequestStats(req, statusCode) {
        this.stats.totalRequests++;

        if (statusCode >= 400) {
            this.emit('clientError', {
                ip: req.securityContext.ip,
                path: req.path,
                statusCode: statusCode,
                timestamp: new Date().toISOString()
            });
        }
    }

    // إشعار المالك بشكل فوري
    async notifyOwnerImmediately(suspiciousRequest, detection) {
        const geo = geoip.lookup(suspiciousRequest.ip);
        const location = geo ? `${geo.city}, ${geo.country}` : 'غير معروف';

        const alertMessage = `
🚨 تنبيه أمني عاجل - QUANTUM AI TRADER 🚨

⏰ الوقت: ${new Date().toLocaleString('ar-SA')}
🌐 IP المهاجم: ${suspiciousRequest.ip}
📍 الموقع: ${location}
🔗 المسار: ${suspiciousRequest.path}
🛡️ درجة الخطورة: ${detection.riskScore}%

🖥️ معلومات العميل:
${suspiciousRequest.get('User-Agent')}

📊 التهديدات المكتشفة:
${detection.threats.map((t, i) => `${i + 1}. ${t}`).join('\n')}

📈 الإحصائيات:
• إجمالي الطلبات: ${this.stats.totalRequests}
• الطلبات المحظورة: ${this.stats.blockedRequests}
• الهجمات الممنوعة: ${this.stats.attacksPrevented}

✅ الإجراءات المتخذة:
• تم حظر الطلب
• تم تسجيل الحادث
• تم تنبيه المسؤول
${detection.riskScore >= 50 ? '• تم إضافة IP إلى القائمة السوداء' : ''}
        `;

        try {
            // إرسال تنبيهات متعددة
            await Promise.allSettled([
                this.sendTelegramAlert(alertMessage),
                this.sendEmailAlert(alertMessage),
                this.sendSystemAlert(alertMessage)
            ]);
        } catch (error) {
            console.error('فشل في إرسال التنبيه:', error);
        }
    }

    // إرسال تنبيه التليجرام
    async sendTelegramAlert(message) {
        try {
            const telegramService = require('../services/TelegramService');
            await telegramService.sendToOwner(`🔒 ${message.substring(0, 4000)}`);
        } catch (error) {
            console.error('فشل إرسال تنبيه التليجرام:', error);
        }
    }

    // إرسال تنبيه البريد الإلكتروني
    async sendEmailAlert(message) {
        try {
            const emailService = require('../services/EmailService');
            await emailService.sendSecurityAlert({
                subject: '🚨 تنبيه أمني عاجل - QUANTUM AI TRADER',
                message: message,
                priority: 'high'
            });
        } catch (error) {
            console.error('فشل إرسال تنبيه البريد:', error);
        }
    }

    // إرسال تنبيه النظام
    async sendSystemAlert(message) {
        this.emit('securityAlert', {
            message: message,
            timestamp: new Date().toISOString(),
            level: 'CRITICAL'
        });
    }

    // تسجيل الطلب
    logRequest(req) {
        this.emit('requestLogged', {
            id: req.securityContext.id,
            ip: req.securityContext.ip,
            method: req.method,
            path: req.path,
            userAgent: req.securityContext.userAgent,
            timestamp: new Date().toISOString()
        });
    }

    // تسجيل حادث أمني
    async logSecurityIncident(incident) {
        try {
            // حفظ في قاعدة البيانات إذا أردت
            const SecurityLog = require('../models/SecurityLog');
            await SecurityLog.create(incident);
        } catch (error) {
            // تسجيل في الملف إذا فشل الاتصال بقاعدة البيانات
            console.error('حادث أمني:', incident);
        }

        this.emit('securityIncident', incident);
    }

    // وظائف مساعدة
    getClientIP(req) {
        return req.ip || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               '127.0.0.1';
    }

    getSensitiveHeaders(req) {
        const headers = { ...req.headers };
        // إخفاء المعلومات الحساسة
        if (headers.authorization) headers.authorization = '***';
        if (headers.cookie) headers.cookie = '***';
        return headers;
    }

    isSuspiciousCountry(countryCode) {
        const highRiskCountries = ['CN', 'RU', 'KP', 'IR', 'SY'];
        return highRiskCountries.includes(countryCode);
    }

    isSuspiciousUserAgent(userAgent) {
        if (!userAgent) return true;
        const suspiciousAgents = [
            'curl', 'wget', 'python', 'java', 'go-http-client',
            'nikto', 'sqlmap', 'metasploit'
        ];
        return suspiciousAgents.some(agent => 
            userAgent.toLowerCase().includes(agent.toLowerCase())
        );
    }

    isUnusualRequestTime() {
        const hour = new Date().getHours();
        return hour < 6 || hour > 22; // بين 10 مساءً و 6 صباحاً
    }

    // إدارة القوائم
    async loadBlacklist() {
        try {
            // تحميل من قاعدة البيانات أو ملف
            const Blacklist = require('../models/Blacklist');
            const entries = await Blacklist.find({ active: true });
            entries.forEach(entry => this.ipBlacklist.add(entry.ip));
        } catch (error) {
            console.error('فشل تحميل القائمة السوداء:', error);
        }
    }

    async loadWhitelist() {
        try {
            // تحميل من قاعدة البيانات أو ملف
            const Whitelist = require('../models/Whitelist');
            const entries = await Whitelist.find({ active: true });
            entries.forEach(entry => this.ipWhitelist.add(entry.ip));
        } catch (error) {
            console.error('فشل تحميل القائمة البيضاء:', error);
        }
    }

    async saveToBlacklist(ip) {
        try {
            const Blacklist = require('../models/Blacklist');
            await Blacklist.findOneAndUpdate(
                { ip: ip },
                { 
                    ip: ip,
                    reason: 'كشف هجوم تلقائي',
                    addedAt: new Date(),
                    active: true
                },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error('فشل حفظ في القائمة السوداء:', error);
        }
    }

    // التنظيف الدوري
    startPeriodicCleanup() {
        setInterval(() => {
            this.cleanupOldEntries();
        }, 60 * 60 * 1000); // كل ساعة
    }

    cleanupOldEntries() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        // تنظيف أنماط الطلبات القديمة
        for (const [ip, pattern] of this.requestPatterns.entries()) {
            if (now - pattern.lastRequest > oneHour) {
                this.requestPatterns.delete(ip);
            }
        }

        // تنظيف الأنشطة المشبوهة القديمة
        for (const [key, activity] of this.suspiciousActivities.entries()) {
            if (now - activity.lastAttempt > oneHour) {
                this.suspiciousActivities.delete(key);
            }
        }
    }

    // الحصول على الإحصائيات
    getStats() {
        return {
            ...this.stats,
            blacklistSize: this.ipBlacklist.size,
            whitelistSize: this.ipWhitelist.size,
            monitoredIPs: this.requestPatterns.size,
            suspiciousActivities: this.suspiciousActivities.size
        };
    }

    // التحكم في النظام
    enableMonitoring() {
        this.monitoringEnabled = true;
        console.log('✅ تم تفعيل مراقبة الأمان');
    }

    disableMonitoring() {
        this.monitoringEnabled = false;
        console.log('⏸️ تم إيقاف مراقبة الأمان');
    }

    enableAutoBlock() {
        this.autoBlockEnabled = true;
        console.log('✅ تم تفعيل الحظر التلقائي');
    }

    disableAutoBlock() {
        this.autoBlockEnabled = false;
        console.log('⏸️ تم إيقاف الحظر التلقائي');
    }

    // إضافة IP يدوياً للقائمة السوداء
    addToBlacklist(ip, reason = 'يدوي') {
        this.ipBlacklist.add(ip);
        this.saveToBlacklist(ip);
        console.log(`✅ تم إضافة ${ip} إلى القائمة السوداء: ${reason}`);
    }

    // إزالة IP من القائمة السوداء
    removeFromBlacklist(ip) {
        this.ipBlacklist.delete(ip);
        console.log(`✅ تم إزالة ${ip} من القائمة السوداء`);
    }
}

module.exports = CyberSecurityMonitor;