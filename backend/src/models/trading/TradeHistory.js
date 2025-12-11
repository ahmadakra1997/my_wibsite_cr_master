/**
 * نموذج سجل التداول المتقدم
 * تتبع شامل لجميع عمليات التداول مع تحليلات متقدمة
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const tradeHistorySchema = new mongoose.Schema({
    // 🔐 معلومات الأساسية
    tradeId: {
        type: String,
        default: () => `trade_${uuidv4()}`,
        unique: true,
        index: true
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

    // 📊 معلومات الصفقة
    pair: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    exchange: {
        type: String,
        enum: ['binance', 'kucoin', 'bybit', 'coinbase', 'kraken'],
        required: true
    },
    type: {
        type: String,
        enum: ['buy', 'sell'],
        required: true
    },
    side: {
        type: String,
        enum: ['long', 'short'],
        required: true
    },

    // 💰 المعلومات المالية
    entryPrice: {
        type: Number,
        required: true,
        min: 0
    },
    exitPrice: {
        type: Number,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    amount: {
        type: Number, // المبلغ الإجمالي
        required: true,
        min: 0
    },
    fee: {
        type: Number,
        default: 0,
        min: 0
    },
    profit: {
        type: Number, // صافي الربح/الخسارة
        default: 0
    },
    profitPercentage: {
        type: Number // نسبة الربح/الخسارة
    },

    // ⏰ معلومات الوقت
    entryTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    exitTime: {
        type: Date
    },
    duration: {
        type: Number // المدة بالثواني
    },

    // 🎯 معلومات الاستراتيجية
    strategy: {
        type: String,
        required: true
    },
    timeframe: {
        type: String,
        enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d'],
        required: true
    },
    signal: {
        type: String, // إشارة الدخول
        trim: true
    },

    // 🛡️ إدارة المخاطر
    stopLoss: {
        type: Number,
        min: 0
    },
    takeProfit: {
        type: Number,
        min: 0
    },
    riskRewardRatio: {
        type: Number
    },
    positionSize: {
        type: Number, // حجم المركز بالنسبة للرصيد
        min: 0,
        max: 100
    },

    // 📈 التحليل الفني
    technicalIndicators: {
        rsi: Number,
        macd: Number,
        bollingerUpper: Number,
        bollingerLower: Number,
        volume: Number,
        support: Number,
        resistance: Number
    },

    // 🔄 حالة الصفقة
    status: {
        type: String,
        enum: ['open', 'closed', 'cancelled', 'error'],
        default: 'open'
    },
    closeReason: {
        type: String,
        enum: ['take_profit', 'stop_loss', 'manual', 'trailing_stop', 'timeout', 'error']
    },

    // 📝 ملاحظات وإضافات
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    tags: [{
        type: String,
        trim: true
    }],

    // 🔍 بيانات المراجعة
    review: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comments: String,
        lessons: String,
        reviewedAt: Date
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 🔍 فهارس متقدمة للأداء
tradeHistorySchema.index({ userId: 1, entryTime: -1 });
tradeHistorySchema.index({ botId: 1, status: 1 });
tradeHistorySchema.index({ pair: 1, entryTime: -1 });
tradeHistorySchema.index({ strategy: 1, profit: -1 });
tradeHistorySchema.index({ entryTime: 1 });
tradeHistorySchema.index({ status: 1, exitTime: 1 });

// 🎯 virtuals للحسابات المشتقة
tradeHistorySchema.virtual('isProfitable').get(function() {
    return this.profit > 0;
});

tradeHistorySchema.virtual('isClosed').get(function() {
    return this.status === 'closed';
});

tradeHistorySchema.virtual('holdingPeriod').get(function() {
    if (!this.exitTime) return 0;
    return Math.floor((this.exitTime - this.entryTime) / 1000);
});

tradeHistorySchema.virtual('profitPerHour').get(function() {
    if (!this.isClosed) return 0;
    const hours = this.holdingPeriod / 3600;
    return hours > 0 ? this.profit / hours : 0;
});

// 🛡️ middleware للتحقق قبل الحفظ
tradeHistorySchema.pre('save', function(next) {
    // حساب نسبة الربح
    if (this.entryPrice && this.exitPrice) {
        this.profitPercentage = ((this.exitPrice - this.entryPrice) / this.entryPrice) * 100;
        
        if (this.type === 'sell') {
            this.profitPercentage = -this.profitPercentage;
        }
    }

    // حساب المدة
    if (this.entryTime && this.exitTime) {
        this.duration = Math.floor((this.exitTime - this.entryTime) / 1000);
    }

    // حساب نسبة المخاطرة/العائد
    if (this.stopLoss && this.takeProfit && this.entryPrice) {
        const risk = Math.abs(this.entryPrice - this.stopLoss);
        const reward = Math.abs(this.takeProfit - this.entryPrice);
        this.riskRewardRatio = reward / risk;
    }

    next();
});

// 🎯 methods مخصصة
tradeHistorySchema.methods.closeTrade = function(exitPrice, closeReason = 'manual') {
    this.exitPrice = exitPrice;
    this.status = 'closed';
    this.exitTime = new Date();
    this.closeReason = closeReason;

    // حساب الربح النهائي
    this.calculateProfit();
};

tradeHistorySchema.methods.calculateProfit = function() {
    if (!this.exitPrice || !this.entryPrice) return 0;

    let profit;
    if (this.type === 'buy') {
        profit = (this.exitPrice - this.entryPrice) * this.quantity;
    } else { // sell (short)
        profit = (this.entryPrice - this.exitPrice) * this.quantity;
    }

    this.profit = profit - this.fee;
    return this.profit;
};

tradeHistorySchema.methods.addReview = function(rating, comments, lessons) {
    this.review = {
        rating,
        comments,
        lessons,
        reviewedAt: new Date()
    };
};

// 📊 static methods للاستعلامات المتقدمة
tradeHistorySchema.statics.getUserTrades = function(userId, filters = {}) {
    const query = { userId };
    
    if (filters.timeframe) {
        const timeFilter = this.getTimeFilter(filters.timeframe);
        query.entryTime = timeFilter;
    }
    
    if (filters.pair) {
        query.pair = filters.pair;
    }
    
    if (filters.strategy) {
        query.strategy = filters.strategy;
    }
    
    if (filters.status) {
        query.status = filters.status;
    }

    return this.find(query)
        .sort({ entryTime: -1 })
        .limit(filters.limit || 100);
};

tradeHistorySchema.statics.getPerformanceStats = function(userId, timeframe = '30d') {
    const timeFilter = this.getTimeFilter(timeframe);
    
    return this.aggregate([
        {
            $match: {
                userId: mongoose.Types.ObjectId(userId),
                status: 'closed',
                entryTime: timeFilter
            }
        },
        {
            $group: {
                _id: null,
                totalTrades: { $sum: 1 },
                profitableTrades: { $sum: { $cond: [{ $gt: ['$profit', 0] }, 1, 0] } },
                totalProfit: { $sum: '$profit' },
                avgProfit: { $avg: '$profit' },
                maxProfit: { $max: '$profit' },
                maxLoss: { $min: '$profit' },
                avgDuration: { $avg: '$duration' },
                bestPair: { 
                    $max: {
                        pair: '$pair',
                        profit: '$profit'
                    }
                }
            }
        }
    ]);
};

tradeHistorySchema.statics.getTimeFilter = function(timeframe) {
    const now = new Date();
    let startTime;
    
    switch(timeframe) {
        case '24h':
            startTime = new Date(now - 24 * 60 * 60 * 1000);
            break;
        case '7d':
            startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
            startTime = new Date(now - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            startTime = new Date(now - 90 * 24 * 60 * 60 * 1000);
            break;
        default:
            startTime = new Date(now - 30 * 24 * 60 * 60 * 1000);
    }
    
    return { $gte: startTime };
};

tradeHistorySchema.statics.getStrategyPerformance = function(userId) {
    return this.aggregate([
        {
            $match: {
                userId: mongoose.Types.ObjectId(userId),
                status: 'closed'
            }
        },
        {
            $group: {
                _id: '$strategy',
                totalTrades: { $sum: 1 },
                profitableTrades: { $sum: { $cond: [{ $gt: ['$profit', 0] }, 1, 0] } },
                totalProfit: { $sum: '$profit' },
                winRate: { $avg: { $cond: [{ $gt: ['$profit', 0] }, 1, 0] } },
                avgProfit: { $avg: '$profit' },
                avgDuration: { $avg: '$duration' }
            }
        },
        {
            $project: {
                strategy: '$_id',
                totalTrades: 1,
                profitableTrades: 1,
                totalProfit: 1,
                winRate: { $multiply: ['$winRate', 100] },
                avgProfit: 1,
                avgDuration: 1,
                _id: 0
            }
        },
        {
            $sort: { totalProfit: -1 }
        }
    ]);
};

module.exports = mongoose.model('TradeHistory', tradeHistorySchema);
