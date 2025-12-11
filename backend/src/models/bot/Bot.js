/**
 * نموذج البوت التداولي المتقدم
 * إدارة شاملة للبوت مع تتبع الحالة والأداء
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const botSchema = new mongoose.Schema({
    // 🔐 معلومات الأساسية
    botId: {
        type: String,
        default: () => `bot_${uuidv4()}`,
        unique: true,
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
        default: 'Trading Bot Pro',
        trim: true,
        maxlength: 100
    },
    version: {
        type: String,
        default: '2.1.0'
    },

    // 🎯 حالة البوت
    status: {
        type: String,
        enum: ['active', 'inactive', 'paused', 'error', 'initializing'],
        default: 'inactive'
    },
    isActive: {
        type: Boolean,
        default: false
    },
    activationTime: {
        type: Date
    },
    deactivationTime: {
        type: Date
    },
    uptime: {
        type: Number, // بالثواني
        default: 0
    },

    // 📊 أداء البوت
    totalTrades: {
        type: Number,
        default: 0
    },
    successfulTrades: {
        type: Number,
        default: 0
    },
    failedTrades: {
        type: Number,
        default: 0
    },
    activeTrades: {
        type: Number,
        default: 0
    },
    totalProfit: {
        type: Number, // إجمالي الربح بالدولار
        default: 0
    },
    currentEquity: {
        type: Number, // الرصيد الحالي
        default: 0
    },
    initialBalance: {
        type: Number, // الرصيد الأولي
        default: 0
    },

    // ⚡ إحصائيات الأداء
    performance: {
        winRate: {
            type: Number, // نسبة الفوز
            default: 0,
            min: 0,
            max: 1
        },
        avgTradeDuration: {
            type: Number, // متوسط مدة الصفقة بالثواني
            default: 0
        },
        maxDrawdown: {
            type: Number, // أقصى خسارة
            default: 0
        },
        sharpeRatio: {
            type: Number, // نسبة شارب
            default: 0
        },
        volatility: {
            type: Number, // التقلب
            default: 0
        },
        profitFactor: {
            type: Number, // عامل الربحية
            default: 0
        }
    },

    // 🔗 اتصال المنصات
    exchangeConnections: [{
        exchange: {
            type: String,
            enum: ['binance', 'kucoin', 'bybit', 'coinbase', 'kraken']
        },
        isConnected: {
            type: Boolean,
            default: false
        },
        connectionTime: Date,
        lastPing: Date,
        latency: Number,
        apiKey: String, // مشفر
        secretKey: String // مشفر
    }],

    // ⚙️ الإعدادات الحالية
    currentSettings: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BotSettings'
    },

    // 🚨 نظام المراقبة
    lastHealthCheck: {
        type: Date,
        default: Date.now
    },
    healthStatus: {
        type: String,
        enum: ['healthy', 'warning', 'critical'],
        default: 'healthy'
    },
    errorLogs: [{
        timestamp: {
            type: Date,
            default: Date.now
        },
        level: {
            type: String,
            enum: ['info', 'warning', 'error', 'critical']
        },
        message: String,
        code: String,
        details: mongoose.Schema.Types.Mixed
    }],

    // 📈 بيانات الوقت الحقيقي
    realTimeData: {
        cpuUsage: Number,
        memoryUsage: Number,
        networkLatency: Number,
        lastTradeTime: Date,
        currentPositions: [{
            pair: String,
            side: String,
            size: Number,
            entryPrice: Number,
            currentPrice: Number,
            unrealizedPnl: Number
        }]
    },

    // 🔄 النسخ الاحتياطي
    backupSettings: {
        lastBackup: Date,
        backupFrequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly'],
            default: 'daily'
        },
        autoBackup: {
            type: Boolean,
            default: true
        }
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 🔍 فهارس متقدمة للأداء
botSchema.index({ userId: 1, status: 1 });
botSchema.index({ 'exchangeConnections.exchange': 1 });
botSchema.index({ 'realTimeData.lastTradeTime': -1 });
botSchema.index({ createdAt: -1 });

// 🎯 virtuals للحسابات المشتقة
botSchema.virtual('totalRuntime').get(function() {
    if (!this.activationTime) return 0;
    const endTime = this.deactivationTime || new Date();
    return Math.floor((endTime - this.activationTime) / 1000);
});

botSchema.virtual('dailyProfit').get(function() {
    // حساب الربح اليومي بناءً على الوقت
    return this.totalProfit * 0.1; // مثال مبسط
});

botSchema.virtual('successRate').get(function() {
    if (this.totalTrades === 0) return 0;
    return (this.successfulTrades / this.totalTrades) * 100;
});

botSchema.virtual('efficiencyScore').get(function() {
    const winRateScore = this.successRate * 0.6;
    const profitScore = Math.min(this.totalProfit / 1000, 30); // حد أقصى 30 نقطة
    const drawdownPenalty = Math.max(0, this.performance.maxDrawdown * 2);
    return Math.max(0, winRateScore + profitScore - drawdownPenalty);
});

// 🛡️ middleware للتحقق قبل الحفظ
botSchema.pre('save', function(next) {
    // تحديث وقت آخر تحديث
    this.lastHealthCheck = new Date();
    
    // حساب نسبة الفوز
    if (this.totalTrades > 0) {
        this.performance.winRate = this.successfulTrades / this.totalTrades;
    }
    
    // تحديث حالة الصحة
    this.updateHealthStatus();
    
    next();
});

// 🎯 methods مخصصة
botSchema.methods.updateHealthStatus = function() {
    const now = new Date();
    const timeSinceLastCheck = (now - this.lastHealthCheck) / 1000;
    
    if (timeSinceLastCheck > 300) { // 5 دقائق
        this.healthStatus = 'critical';
    } else if (timeSinceLastCheck > 120) { // دقيقتان
        this.healthStatus = 'warning';
    } else {
        this.healthStatus = 'healthy';
    }
};

botSchema.methods.addErrorLog = function(level, message, code, details = {}) {
    this.errorLogs.push({
        timestamp: new Date(),
        level,
        message,
        code,
        details
    });
    
    // الاحتفاظ بآخر 100 خطأ فقط
    if (this.errorLogs.length > 100) {
        this.errorLogs = this.errorLogs.slice(-100);
    }
};

botSchema.methods.activate = function() {
    this.status = 'active';
    this.isActive = true;
    this.activationTime = new Date();
    this.addErrorLog('info', 'Bot activated successfully', 'BOT_ACTIVATED');
};

botSchema.methods.deactivate = function() {
    this.status = 'inactive';
    this.isActive = false;
    this.deactivationTime = new Date();
    this.uptime += this.totalRuntime;
    this.addErrorLog('info', 'Bot deactivated successfully', 'BOT_DEACTIVATED');
};

botSchema.methods.addTrade = function(tradeData) {
    this.totalTrades++;
    
    if (tradeData.profit > 0) {
        this.successfulTrades++;
    } else {
        this.failedTrades++;
    }
    
    this.totalProfit += tradeData.profit;
    this.currentEquity += tradeData.profit;
    
    // تحديث إحصائيات الأداء
    this.updatePerformanceMetrics();
};

botSchema.methods.updatePerformanceMetrics = function() {
    // هنا سيتم إضافة منطق حساب مقاييس الأداء المتقدمة
    if (this.totalTrades > 0) {
        this.performance.winRate = this.successfulTrades / this.totalTrades;
    }
};

// 📊 static methods للاستعلامات المتقدمة
botSchema.statics.findByUserId = function(userId) {
    return this.find({ userId })
        .populate('currentSettings')
        .sort({ createdAt: -1 });
};

botSchema.statics.findActiveBots = function() {
    return this.find({ status: 'active' })
        .populate('currentSettings')
        .select('botId name userId status performance currentEquity');
};

botSchema.statics.getPerformanceStats = function(timeframe = '24h') {
    const timeFilter = this.getTimeFilter(timeframe);
    
    return this.aggregate([
        { $match: timeFilter },
        {
            $group: {
                _id: null,
                totalBots: { $sum: 1 },
                activeBots: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                totalProfit: { $sum: '$totalProfit' },
                avgWinRate: { $avg: '$performance.winRate' },
                totalTrades: { $sum: '$totalTrades' }
            }
        }
    ]);
};

botSchema.statics.getTimeFilter = function(timeframe) {
    const now = new Date();
    let startTime;
    
    switch(timeframe) {
        case '1h':
            startTime = new Date(now - 60 * 60 * 1000);
            break;
        case '24h':
            startTime = new Date(now - 24 * 60 * 60 * 1000);
            break;
        case '7d':
            startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
            startTime = new Date(now - 30 * 24 * 60 * 60 * 1000);
            break;
        default:
            startTime = new Date(now - 24 * 60 * 60 * 1000);
    }
    
    return { createdAt: { $gte: startTime } };
};

module.exports = mongoose.model('Bot', botSchema);
