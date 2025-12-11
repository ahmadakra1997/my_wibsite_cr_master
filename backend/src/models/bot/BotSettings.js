/**
 * نموذج إعدادات البوت المتقدمة
 * إدارة شاملة لإعدادات البوت مع التحقق والنسخ الاحتياطي
 */

const mongoose = require('mongoose');

const botSettingsSchema = new mongoose.Schema({
    // 🔐 معلومات الأساسية
    settingsId: {
        type: String,
        unique: true,
        default: () => `settings_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    },
    botId: {
        type: String,
        ref: 'Bot',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        default: 'Default Settings',
        trim: true
    },
    isActive: {
        type: Boolean,
        default: false
    },

    // 🏠 الإعدادات العامة
    general: {
        botName: {
            type: String,
            required: true,
            default: 'Trading Bot Pro',
            trim: true,
            maxlength: 50
        },
        autoStart: {
            type: Boolean,
            default: false
        },
        riskLevel: {
            type: String,
            enum: ['low', 'medium', 'high', 'very_high'],
            default: 'medium'
        },
        maxDailyTrades: {
            type: Number,
            min: 1,
            max: 100,
            default: 10
        },
        stopLoss: {
            type: Number,
            min: 0.1,
            max: 10,
            default: 2
        },
        takeProfit: {
            type: Number,
            min: 0.1,
            max: 20,
            default: 5
        },
        tradeAmount: {
            type: Number,
            min: 10,
            max: 10000,
            default: 100
        },
        tradeAmountType: {
            type: String,
            enum: ['fixed', 'percentage'],
            default: 'fixed'
        },
        maxPositionSize: {
            type: Number,
            min: 1,
            max: 10000,
            default: 1000
        }
    },

    // 📈 إعدادات التداول
    trading: {
        strategy: {
            type: String,
            enum: ['mean-reversion', 'trend-following', 'breakout', 'scalping', 'arbitrage', 'martingale'],
            default: 'mean-reversion'
        },
        pairs: [{
            type: String,
            validate: {
                validator: function(pairs) {
                    return pairs.length <= 20; // حد أقصى 20 زوج
                },
                message: 'Cannot have more than 20 trading pairs'
            }
        }],
        timeframe: {
            type: String,
            enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d'],
            default: '1h'
        },
        maxOpenTrades: {
            type: Number,
            min: 1,
            max: 10,
            default: 3
        },
        trailingStop: {
            type: Boolean,
            default: false
        },
        trailingStopDistance: {
            type: Number,
            min: 0.1,
            max: 5,
            default: 1
        },
        hedgeMode: {
            type: Boolean,
            default: false
        },
        useMargin: {
            type: Boolean,
            default: false
        },
        leverage: {
            type: Number,
            min: 1,
            max: 100,
            default: 1
        }
    },

    // 📊 الإعدادات التقنية
    technical: {
        rsiPeriod: {
            type: Number,
            min: 5,
            max: 30,
            default: 14
        },
        rsiOverbought: {
            type: Number,
            min: 60,
            max: 90,
            default: 70
        },
        rsiOversold: {
            type: Number,
            min: 10,
            max: 40,
            default: 30
        },
        macdFast: {
            type: Number,
            min: 5,
            max: 20,
            default: 12
        },
        macdSlow: {
            type: Number,
            min: 20,
            max: 40,
            default: 26
        },
        macdSignal: {
            type: Number,
            min: 5,
            max: 15,
            default: 9
        },
        bollingerPeriod: {
            type: Number,
            min: 10,
            max: 30,
            default: 20
        },
        bollingerStd: {
            type: Number,
            min: 1,
            max: 3,
            default: 2
        },
        useVolume: {
            type: Boolean,
            default: true
        },
        useSupportResistance: {
            type: Boolean,
            default: true
        },
        supportResistancePeriod: {
            type: Number,
            min: 50,
            max: 200,
            default: 100
        }
    },

    // 🔔 إعدادات الإشعارات
    notifications: {
        emailAlerts: {
            type: Boolean,
            default: true
        },
        pushNotifications: {
            type: Boolean,
            default: false
        },
        tradeExecuted: {
            type: Boolean,
            default: true
        },
        tradeClosed: {
            type: Boolean,
            default: true
        },
        stopLossHit: {
            type: Boolean,
            default: true
        },
        takeProfitHit: {
            type: Boolean,
            default: true
        },
        errorAlerts: {
            type: Boolean,
            default: true
        },
        dailyReport: {
            type: Boolean,
            default: true
        },
        weeklyReport: {
            type: Boolean,
            default: true
        }
    },

    // 🔗 إعدادات المنصات
    exchanges: [{
        exchange: {
            type: String,
            enum: ['binance', 'kucoin', 'bybit', 'coinbase', 'kraken']
        },
        apiKey: {
            type: String,
            // سيتم تشفير هذا الحقل
        },
        secretKey: {
            type: String,
            // سيتم تشفير هذا الحقل
        },
        isActive: {
            type: Boolean,
            default: false
        },
        testnet: {
            type: Boolean,
            default: true
        }
    }],

    // 🛡️ إعدادات الأمان
    security: {
        twoFactorAuth: {
            type: Boolean,
            default: false
        },
        ipWhitelist: [{
            type: String,
            validate: {
                validator: function(ip) {
                    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
                    return ipRegex.test(ip);
                },
                message: 'Invalid IP address format'
            }
        }],
        apiRateLimit: {
            type: Number,
            min: 1,
            max: 1000,
            default: 100
        },
        autoLogout: {
            type: Number, // دقائق
            min: 1,
            max: 1440,
            default: 60
        }
    },

    // 💾 النسخ الاحتياطي والتاريخ
    version: {
        type: Number,
        default: 1
    },
    isBackup: {
        type: Boolean,
        default: false
    },
    originalSettingsId: {
        type: String,
        ref: 'BotSettings'
    },
    changeLog: [{
        timestamp: {
            type: Date,
            default: Date.now
        },
        version: Number,
        changes: mongoose.Schema.Types.Mixed,
        description: String
    }]

}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            // إخفاء البيانات الحساسة
            delete ret.exchanges;
            return ret;
        }
    }
});

// 🔍 فهارس متقدمة
botSettingsSchema.index({ userId: 1, isActive: 1 });
botSettingsSchema.index({ botId: 1, version: -1 });
botSettingsSchema.index({ 'trading.strategy': 1 });

// 🛡️ middleware للتشفير
botSettingsSchema.pre('save', function(next) {
    // تشفير API keys قبل الحفظ
    if (this.exchanges && this.exchanges.length > 0) {
        this.exchanges.forEach(exchange => {
            if (exchange.apiKey && !exchange.apiKey.startsWith('encrypted:')) {
                exchange.apiKey = `encrypted:${this.encryptData(exchange.apiKey)}`;
            }
            if (exchange.secretKey && !exchange.secretKey.startsWith('encrypted:')) {
                exchange.secretKey = `encrypted:${this.encryptData(exchange.secretKey)}`;
            }
        });
    }
    
    // تسجيل التغييرات
    if (this.isModified() && !this.isNew) {
        this.recordChange();
    }
    
    next();
});

// 🎯 methods مخصصة
botSettingsSchema.methods.encryptData = function(data) {
    // هنا سيتم تنفيذ منطق التشفير الفعلي
    return Buffer.from(data).toString('base64');
};

botSettingsSchema.methods.decryptData = function(encryptedData) {
    if (encryptedData.startsWith('encrypted:')) {
        return Buffer.from(encryptedData.substring(10), 'base64').toString();
    }
    return encryptedData;
};

botSettingsSchema.methods.recordChange = function() {
    const changes = this.modifiedPaths().reduce((acc, path) => {
        acc[path] = {
            from: this.get(path),
            to: this.isModified(path) ? this.get(path) : undefined
        };
        return acc;
    }, {});

    this.changeLog.push({
        version: this.version + 1,
        changes,
        description: `Settings updated automatically`
    });
};

botSettingsSchema.methods.createBackup = function() {
    const backup = this.toObject();
    delete backup._id;
    delete backup.__v;
    
    backup.isBackup = true;
    backup.originalSettingsId = this.settingsId;
    backup.version = this.version;
    
    return backup;
};

botSettingsSchema.methods.validateSettings = function() {
    const errors = [];

    // التحقق من أزواج التداول
    if (this.trading.pairs.length === 0) {
        errors.push('At least one trading pair is required');
    }

    // التحقق من حجم التداول
    if (this.general.tradeAmount > this.general.maxPositionSize) {
        errors.push('Trade amount cannot exceed maximum position size');
    }

    // التحقق من الرافعة المالية
    if (this.trading.useMargin && this.trading.leverage > 10 && this.general.riskLevel === 'high') {
        errors.push('High leverage not allowed for high risk level');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// 📊 static methods
botSettingsSchema.statics.getActiveSettings = function(botId) {
    return this.findOne({ botId, isActive: true });
};

botSettingsSchema.statics.getSettingsHistory = function(botId, limit = 10) {
    return this.find({ botId })
        .sort({ version: -1 })
        .limit(limit)
        .select('settingsId version createdAt changeLog');
};

botSettingsSchema.statics.restoreFromBackup = async function(settingsId) {
    const backup = await this.findOne({ settingsId, isBackup: true });
    if (!backup) {
        throw new Error('Backup not found');
    }

    // تعطيل الإعدادات الحالية
    await this.updateMany(
        { botId: backup.botId, isActive: true },
        { isActive: false }
    );

    // إنشاء نسخة جديدة من النسخة الاحتياطية
    const restored = new this(backup);
    restored._id = undefined;
    restored.isActive = true;
    restored.isBackup = false;
    restored.version = backup.version + 1;

    return await restored.save();
};

module.exports = mongoose.model('BotSettings', botSettingsSchema);
