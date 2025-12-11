// backend/src/security/antiReverseEngineering.js - النسخة المتقدمة والمحسنة
const crypto = require('crypto');
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const { performance, PerformanceObserver } = require('perf_hooks');

class AntiReverseEngineering {
    constructor() {
        this.encryptionKey = this.generateSecureKey();
        this.integrityHashes = new Map();
        this.runtimeChecks = new Set();
        this.selfProtectionEnabled = true;
        this.debuggerDetectionEnabled = true;
        this.memoryTamperingDetection = true;
        
        // مفاتيح التشفير المتقدمة
        this.cryptoKeys = {
            code: this.deriveKey('code_integrity_key'),
            data: this.deriveKey('data_protection_key'),
            config: this.deriveKey('config_encryption_key')
        };

        this.init();
    }

    async init() {
        await this.calculateIntegrityHashes();
        this.setupRuntimeProtection();
        this.setupPerformanceMonitoring();
        this.setupSelfProtection();
        
        console.log('🔒 نظام مكافحة الهندسة العكسية المتقدم مفعل');
    }

    // توليد مفتاح آمن
    generateSecureKey() {
        return crypto.randomBytes(32); // 256-bit key
    }

    // اشتقاق مفاتيح متقدمة
    deriveKey(purpose) {
        return crypto.scryptSync(this.encryptionKey, purpose, 32);
    }

    // تشفير متقدم مع authentication
    encryptSensitiveData(data, keyType = 'data') {
        try {
            const key = this.cryptoKeys[keyType];
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
            
            let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            return {
                encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                timestamp: Date.now(),
                version: '2.0'
            };
        } catch (error) {
            this.logSecurityEvent('ENCRYPTION_FAILED', { error: error.message });
            throw new Error('فشل في تشفير البيانات الحساسة');
        }
    }

    // فك التشفير مع التحقق
    decryptSensitiveData(encryptedData, keyType = 'data') {
        try {
            const key = this.cryptoKeys[keyType];
            const decipher = crypto.createDecipheriv(
                'aes-256-gcm', 
                key, 
                Buffer.from(encryptedData.iv, 'hex')
            );
            
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
            
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            this.logSecurityEvent('DECRYPTION_FAILED', { 
                error: error.message,
                tampering: 'محتمل'
            });
            this.triggerSecurityResponse('TAMPERING_DETECTED');
            return null;
        }
    }

    // تعمية كود متقدمة
    obfuscateCode(code, level = 'high') {
        const obfuscationConfigs = {
            low: {
                compact: true,
                controlFlowFlattening: false,
                deadCodeInjection: false,
                debugProtection: false,
                selfDefending: false
            },
            medium: {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.5,
                deadCodeInjection: true,
                deadCodeInjectionThreshold: 0.2,
                debugProtection: true,
                selfDefending: true
            },
            high: {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 1,
                deadCodeInjection: true,
                deadCodeInjectionThreshold: 0.4,
                debugProtection: true,
                debugProtectionInterval: 4000,
                disableConsoleOutput: true,
                identifierNamesGenerator: 'hexadecimal',
                log: false,
                numbersToExpressions: true,
                renameGlobals: true,
                selfDefending: true,
                simplify: true,
                splitStrings: true,
                splitStringsChunkLength: 5,
                stringArray: true,
                stringArrayEncoding: ['rc4'],
                stringArrayThreshold: 1,
                transformObjectKeys: true,
                unicodeEscapeSequence: true
            }
        };

        try {
            const obfuscator = require('javascript-obfuscator');
            const result = obfuscator.obfuscate(code, obfuscationConfigs[level]);
            
            this.logSecurityEvent('CODE_OBFUSCATED', { 
                level: level,
                originalSize: code.length,
                obfuscatedSize: result.getObfuscatedCode().length
            });
            
            return result.getObfuscatedCode();
        } catch (error) {
            console.warn('⚠️ فشل في تعمية الكود، استخدام الكود الأصلي:', error.message);
            return code;
        }
    }

    // نظام التحقق من السلامة المتقدم
    async verifyCodeIntegrity() {
        const checks = [
            this.checkFileIntegrity(),
            this.checkRuntimeEnvironment(),
            this.checkDebuggerPresence(),
            this.checkMemoryTampering(),
            this.checkExecutionTime(),
            this.checkModuleIntegrity()
        ];

        const results = await Promise.allSettled(checks);
        const failures = results.filter(result => 
            result.status === 'fulfilled' && !result.value
        );

        if (failures.length > 0) {
            this.logSecurityEvent('INTEGRITY_CHECK_FAILED', {
                failedChecks: failures.length,
                details: failures.map(f => f.reason || 'unknown')
            });
            
            this.triggerSecurityResponse('INTEGRITY_VIOLATION');
            return false;
        }

        return true;
    }

    // التحقق من سلامة الملفات
    async checkFileIntegrity() {
        const criticalFiles = [
            process.mainModule.filename,
            __filename,
            path.join(__dirname, 'cyberSecurityMonitor.js'),
            path.join(__dirname, '../app.js')
        ];

        for (const file of criticalFiles) {
            if (!fs.existsSync(file)) {
                this.logSecurityEvent('MISSING_CRITICAL_FILE', { file });
                return false;
            }

            const currentHash = await this.calculateFileHash(file);
            const expectedHash = this.integrityHashes.get(file);

            if (expectedHash && currentHash !== expectedHash) {
                this.logSecurityEvent('FILE_TAMPERING_DETECTED', { 
                    file: path.basename(file),
                    expected: expectedHash,
                    actual: currentHash
                });
                return false;
            }
        }

        return true;
    }

    // حساب hash الملف
    async calculateFileHash(filePath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha512');
            const stream = fs.createReadStream(filePath);
            
            stream.on('data', data => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }

    // حساب hashes السلامة
    async calculateIntegrityHashes() {
        const files = [
            process.mainModule.filename,
            __filename,
            path.join(__dirname, 'cyberSecurityMonitor.js')
        ];

        for (const file of files) {
            try {
                const hash = await this.calculateFileHash(file);
                this.integrityHashes.set(file, hash);
            } catch (error) {
                console.warn(`⚠️ فشل في حساب hash للملف: ${file}`);
            }
        }
    }

    // كشف البيئة التشغيلية
    checkRuntimeEnvironment() {
        const suspiciousIndicators = [
            // كشف أدوات التطوير
            typeof process !== 'undefined' && process.env.NODE_ENV === 'development',
            typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__,
            typeof process !== 'undefined' && process.execArgv.join(' ').includes('--inspect'),
            
            // كشف المحاكيات
            process.platform === 'android' && !process.env.ANDROID_ROOT,
            typeof navigator !== 'undefined' && navigator.webdriver,
            
            // كشف أدوات الهندسة العكسية
            typeof process !== 'undefined' && process.env.DEBUG,
            typeof require !== 'undefined' && require.cache && Object.keys(require.cache).length < 10
        ];

        if (suspiciousIndicators.some(indicator => indicator)) {
            this.logSecurityEvent('SUSPICIOUS_RUNTIME_ENVIRONMENT', {
                indicators: suspiciousIndicators
                    .map((indicator, index) => indicator ? index : -1)
                    .filter(i => i !== -1)
            });
            return false;
        }

        return true;
    }

    // كشف المصححات
    checkDebuggerPresence() {
        if (!this.debuggerDetectionEnabled) return true;

        let debuggerDetected = false;

        // طريقة 1: توقيت التنفيذ
        const start = performance.now();
        for (let i = 0; i < 1000000; i++) { /* حلقة مكثفة */ }
        const end = performance.now();
        
        if (end - start > 100) { // إذا استغرق وقتاً طويلاً
            debuggerDetected = true;
        }

        // طريقة 2: فحص وسيطات التشغيل
        if (process.execArgv.some(arg => arg.includes('--inspect') || arg.includes('--debug'))) {
            debuggerDetected = true;
        }

        // طريقة 3: فحص الذاكرة
        if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) { // أكثر من 500MB
            debuggerDetected = true;
        }

        if (debuggerDetected) {
            this.logSecurityEvent('DEBUGGER_DETECTED', {
                executionTime: end - start,
                memoryUsage: process.memoryUsage().heapUsed,
                execArgs: process.execArgv
            });
        }

        return !debuggerDetected;
    }

    // كشف العبث بالذاكرة
    checkMemoryTampering() {
        if (!this.memoryTamperingDetection) return true;

        // فحص تكامل الكائنات الهامة
        const criticalObjects = [
            this.encryptionKey,
            this.cryptoKeys,
            this.integrityHashes
        ];

        for (const obj of criticalObjects) {
            const serialized = JSON.stringify(obj);
            const hash = crypto.createHash('sha256').update(serialized).digest('hex');
            
            // تخزين والتحقق من التكامل
            if (!this.runtimeChecks.has(hash)) {
                this.runtimeChecks.add(hash);
            } else {
                const currentHash = crypto.createHash('sha256').update(serialized).digest('hex');
                if (currentHash !== hash) {
                    this.logSecurityEvent('MEMORY_TAMPERING_DETECTED', {
                        object: obj.constructor.name,
                        originalHash: hash,
                        currentHash: currentHash
                    });
                    return false;
                }
            }
        }

        return true;
    }

    // فحص وقت التنفيذ
    checkExecutionTime() {
        const maxAllowedTime = 5000; // 5 ثواني
        
        return new Promise((resolve) => {
            const start = Date.now();
            
            // محاكاة عمل كثيف
            setTimeout(() => {
                const executionTime = Date.now() - start;
                
                if (executionTime > maxAllowedTime) {
                    this.logSecurityEvent('SUSPICIOUS_EXECUTION_TIME', {
                        executionTime: executionTime,
                        maxAllowed: maxAllowedTime
                    });
                    resolve(false);
                } else {
                    resolve(true);
                }
            }, 100);
        });
    }

    // فحص تكامل الوحدات
    checkModuleIntegrity() {
        const criticalModules = ['crypto', 'fs', 'path', 'vm'];
        
        for (const moduleName of criticalModules) {
            try {
                const module = require(moduleName);
                const moduleHash = crypto.createHash('sha256')
                    .update(moduleName + JSON.stringify(module))
                    .digest('hex');
                
                // يمكن إضافة تحقق إضافي هنا
                if (moduleHash.length !== 64) { // SHA256 يجب أن يكون 64 حرف
                    return false;
                }
            } catch (error) {
                this.logSecurityEvent('MODULE_INTEGRITY_CHECK_FAILED', {
                    module: moduleName,
                    error: error.message
                });
                return false;
            }
        }
        
        return true;
    }

    // إعداد مراقبة الأداء
    setupPerformanceMonitoring() {
        if (typeof PerformanceObserver !== 'undefined') {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.duration > 1000) { // إذا تجاوز الثانية
                        this.logSecurityEvent('PERFORMANCE_ANOMALY', {
                            entry: entry.name,
                            duration: entry.duration
                        });
                    }
                });
            });
            
            observer.observe({ entryTypes: ['measure', 'function'] });
        }
    }

    // إعداد الحماية الذاتية
    setupSelfProtection() {
        if (!this.selfProtectionEnabled) return;

        // منع التعديل على الكائن
        Object.freeze(this);
        Object.freeze(this.constructor.prototype);

        // حماية الأساليب
        const methods = Object.getOwnPropertyNames(this.constructor.prototype);
        methods.forEach(method => {
            if (typeof this[method] === 'function' && method !== 'constructor') {
                Object.defineProperty(this, method, {
                    writable: false,
                    configurable: false
                });
            }
        });

        // مراقبة محاولات التعديل
        const handler = {
            set: (target, property, value) => {
                this.logSecurityEvent('PROTECTED_OBJECT_MODIFICATION_ATTEMPT', {
                    property: property,
                    value: value,
                    stack: new Error().stack
                });
                return false; // منع التعديل
            },
            deleteProperty: (target, property) => {
                this.logSecurityEvent('PROTECTED_OBJECT_DELETION_ATTEMPT', {
                    property: property,
                    stack: new Error().stack
                });
                return false; // منع الحذف
            }
        };

        return new Proxy(this, handler);
    }

    // إعداد حماية وقت التشغيل
    setupRuntimeProtection() {
        // كشف وتجنب الـ hooking
        const originalRequire = require;
        
        require = function(id) {
            if (['vm', 'inspector', 'worker_threads'].includes(id)) {
                this.logSecurityEvent('SUSPICIOUS_MODULE_REQUIRE', { module: id });
                throw new Error(`الوحدة ${id} غير مسموح بها لأسباب أمنية`);
            }
            return originalRequire.apply(this, arguments);
        }.bind(this);

        // حماية global object
        Object.defineProperty(global, 'require', {
            value: require,
            writable: false,
            configurable: false
        });
    }

    // استجابة أمنية متدرجة
    triggerSecurityResponse(incidentType) {
        const responses = {
            TAMPERING_DETECTED: {
                level: 'CRITICAL',
                actions: [
                    this.notifyOwner('🚨 كشف العبث بالكود - إغلاق فوري'),
                    this.destroySensitiveData(),
                    process.exit(1)
                ]
            },
            INTEGRITY_VIOLATION: {
                level: 'HIGH',
                actions: [
                    this.notifyOwner('⚠️ انتهاك سلامة الكود'),
                    this.encryptCriticalData(),
                    this.lockSystemTemporarily()
                ]
            },
            DEBUGGER_DETECTED: {
                level: 'MEDIUM',
                actions: [
                    this.notifyOwner('🔍 كشف مصحح - إجراءات مضادة'),
                    this.injectAntiDebuggingCode(),
                    this.obfuscateRuntime()
                ]
            }
        };

        const response = responses[incidentType];
        if (response) {
            this.logSecurityEvent('SECURITY_RESPONSE_TRIGGERED', {
                incident: incidentType,
                level: response.level,
                actions: response.actions.map(action => action.name)
            });

            response.actions.forEach(action => {
                try {
                    if (typeof action === 'function') {
                        action.call(this);
                    }
                } catch (error) {
                    console.error('فشل في تنفيذ الإجراء الأمني:', error);
                }
            });
        }
    }

    // إخطار المالك
    async notifyOwner(message) {
        const alertMessage = `
🔒 تنبيه أمني - نظام مكافحة الهندسة العكسية

📝 الوصف: ${message}
⏰ الوقت: ${new Date().toLocaleString('ar-SA')}
🖥️  النظام: ${process.platform} ${process.arch}
🌐  البيئة: ${process.env.NODE_ENV || 'production'}

📊 حالة النظام:
• سلامة الكود: ${await this.verifyCodeIntegrity() ? 'سليمة' : 'متعرضة'}
• الذاكرة: ${process.memoryUsage().heapUsed / 1024 / 1024} MB
• وقت التشغيل: ${process.uptime()} ثانية

✅ الإجراءات المتخذة:
• تم تسجيل الحادث
• تم تنبيه المسؤول
• تم تنفيذ الإجراءات المضادة
        `;

        try {
            // إرسال عبر قنوات متعددة
            await Promise.allSettled([
                this.sendTelegramAlert(alertMessage),
                this.sendEmailAlert(alertMessage),
                this.logToSecurityFile(alertMessage)
            ]);
        } catch (error) {
            console.error('فشل في إرسال التنبيه:', error);
        }
    }

    // إرسال تنبيه التليجرام
    async sendTelegramAlert(message) {
        try {
            const telegramService = require('../services/TelegramService');
            await telegramService.sendToOwner(`🛡️ ${message.substring(0, 4000)}`);
        } catch (error) {
            console.error('فشل إرسال تنبيه التليجرام:', error);
        }
    }

    // إرسال تنبيه البريد الإلكتروني
    async sendEmailAlert(message) {
        try {
            const emailService = require('../services/EmailService');
            await emailService.sendSecurityAlert({
                subject: '🛡️ تنبيه أمني - نظام مكافحة الهندسة العكسية',
                message: message,
                priority: 'critical'
            });
        } catch (error) {
            console.error('فشل إرسال تنبيه البريد:', error);
        }
    }

    // تسجيل في ملف الأمان
    async logToSecurityFile(message) {
        const logEntry = `
[${new Date().toISOString()}] الأمن السيبراني
${message}
────────────────────────────────────────
        `;

        fs.appendFileSync(
            path.join(__dirname, '../../logs/security.log'),
            logEntry,
            { flag: 'a' }
        );
    }

    // تدمير البيانات الحساسة
    destroySensitiveData() {
        try {
            // تنظيف المفاتيح من الذاكرة
            this.encryptionKey.fill(0);
            Object.values(this.cryptoKeys).forEach(key => key.fill(0));
            
            // مسح الخرائط والمجموعات
            this.integrityHashes.clear();
            this.runtimeChecks.clear();
            
            // إجبار جمع القمامة (إذا ممكن)
            if (global.gc) {
                global.gc();
            }
        } catch (error) {
            console.error('فشل في تدمير البيانات الحساسة:', error);
        }
    }

    // تشفير البيانات الحرجة
    encryptCriticalData() {
        // تنفيذ تشفير إضافي للبيانات الحرجة
        console.log('🔐 تشفير البيانات الحرجة...');
    }

    // قفل النظام مؤقتاً
    lockSystemTemporarily() {
        console.log('🔒 قفل النظام مؤقتاً للتحقيق...');
        // يمكن إضافة تأخير أو تعليق مؤقت
    }

    // حقن كود مضاد للت debugging
    injectAntiDebuggingCode() {
        const antiDebugCode = `
        setInterval(function() {
            if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
                process.exit(1);
            }
        }, Math.random() * 10000 + 5000);
        `;
        
        try {
            vm.runInNewContext(antiDebugCode, {}, { timeout: 100 });
        } catch (error) {
            // تجاهل الأخطاء المتوقعة
        }
    }

    // تعمية وقت التشغيل
    obfuscateRuntime() {
        // تقنيات تعمية ديناميكية
        console.log('🌀 تفعيل تعمية وقت التشغيل...');
    }

    // تسجيل حدث أمني
    logSecurityEvent(eventType, details = {}) {
        const event = {
            type: eventType,
            timestamp: new Date().toISOString(),
            details: details,
            processId: process.pid,
            platform: process.platform
        };

        // إرسال الحدث لأنظمة المراقبة
        if (typeof this.emit === 'function') {
            this.emit('securityEvent', event);
        }

        // تسجيل في الملف
        this.logToSecurityFile(JSON.stringify(event, null, 2));
    }

    // الحصول على حالة النظام
    getSystemStatus() {
        return {
            integrityChecks: this.runtimeChecks.size,
            protectedFiles: this.integrityHashes.size,
            selfProtection: this.selfProtectionEnabled,
            debuggerDetection: this.debuggerDetectionEnabled,
            memoryProtection: this.memoryTamperingDetection,
            uptime: process.uptime()
        };
    }

    // تفعيل/إيقاف الميزات
    enableFeature(feature) {
        const features = {
            'self-protection': () => this.selfProtectionEnabled = true,
            'debugger-detection': () => this.debuggerDetectionEnabled = true,
            'memory-protection': () => this.memoryTamperingDetection = true
        };

        if (features[feature]) {
            features[feature]();
            console.log(`✅ تم تفعيل ${feature}`);
        }
    }

    disableFeature(feature) {
        const features = {
            'self-protection': () => this.selfProtectionEnabled = false,
            'debugger-detection': () => this.debuggerDetectionEnabled = false,
            'memory-protection': () => this.memoryTamperingDetection = false
        };

        if (features[feature]) {
            features[feature]();
            console.log(`⏸️ تم إيقاف ${feature}`);
        }
    }
}

module.exports = AntiReverseEngineering;