// backend/models/User.js - النسخة الكاملة بعد التحديثات
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  // === المعلومات الأساسية والهوية ===
  personalInfo: {
    userId: {
      type: String,
      unique: true,
      default: () => `USER_${uuidv4().split('-')[0].toUpperCase()}`
    },
    name: {
      type: String,
      required: [true, 'الاسم الكامل مطلوب'],
      trim: true,
      maxlength: [100, 'الاسم لا يمكن أن يزيد عن 100 حرف'],
      validate: {
        validator: function(name) {
          return /^[a-zA-Z\u0600-\u06FF\s]{2,100}$/.test(name);
        },
        message: 'الاسم يجب أن يحتوي على أحرف عربية أو إنجليزية فقط'
      }
    },
    email: {
      type: String,
      required: [true, 'البريد الإلكتروني مطلوب'],
      unique: true,
      lowercase: true,
      validate: {
        validator: function(email) {
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/.test(email);
        },
        message: 'البريد الإلكتروني غير صالح'
      },
      index: true
    },
    password: {
      type: String,
      required: [true, 'كلمة المرور مطلوبة'],
      minlength: [8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'],
      validate: {
        validator: function(password) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
        },
        message: 'كلمة المرور يجب أن تحتوي على حرف كبير، حرف صغير، رقم، وررمز خاص'
      },
      select: false
    },
    phone: {
      type: String,
      validate: {
        validator: function(phone) {
          return /^[\+]?[0-9]{10,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
        },
        message: 'رقم الهاتف غير صالح'
      },
      set: function(phone) {
        return phone.replace(/[\s\-\(\)]/g, '');
      }
    },
    country: {
      type: String,
      default: 'SY',
      uppercase: true,
      enum: ['SY', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'IQ', 'JO', 'LB', 'EG', 'TR', 'US', 'GB', 'EU']
    },
    language: {
      type: String,
      default: 'ar',
      enum: ['ar', 'en', 'tr', 'fr', 'ru', 'zh'],
      index: true
    },
    timezone: {
      type: String,
      default: 'Asia/Damascus',
      validate: {
        validator: function(timezone) {
          return Intl.supportedValuesOf('timeZone').includes(timezone);
        },
        message: 'المنطقة الزمنية غير مدعومة'
      }
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'TRY', 'SAR', 'AED', 'QAR', 'KWD', 'BHD', 'OMR']
    }
  },

  // === نظام الاشتراك والدفع المتقدم ===
  subscription: {
    subscriptionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    plan: {
      type: String,
      enum: ['basic', 'pro', 'premium', 'enterprise'],
      default: 'basic',
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'expired', 'suspended', 'cancelled', 'trial'],
      default: 'inactive',
      index: true
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    trialEndDate: {
      type: Date,
      default: function() {
        if (this.subscription.status === 'trial') {
          return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 يوم تجربة
        }
        return null;
      }
    },
    autoRenew: {
      type: Boolean,
      default: false
    },
    paymentMethod: {
      type: String,
      enum: ['usdt', 'sham_bank', 'crypto', 'dev_test', 'credit_card', 'paypal', 'bank_transfer', null],
      default: null
    },
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    features: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: function() {
        const baseFeatures = {
          aiTrading: false,
          advancedAnalytics: false,
          apiAccess: false,
          prioritySupport: false,
          customStrategies: false,
          multiExchange: false,
          riskManagement: false,
          // إضافة ميزات البوت التلقائي
          autoBotCreation: false,
          customBotSettings: false,
          multipleBots: false,
          advancedBotAnalytics: false
        };

        const planFeatures = {
          basic: { 
            aiTrading: true, 
            multiExchange: true,
            autoBotCreation: true
          },
          pro: { 
            aiTrading: true, 
            multiExchange: true, 
            advancedAnalytics: true, 
            apiAccess: true,
            autoBotCreation: true,
            customBotSettings: true
          },
          premium: { 
            aiTrading: true, 
            multiExchange: true, 
            advancedAnalytics: true, 
            apiAccess: true, 
            prioritySupport: true, 
            riskManagement: true,
            autoBotCreation: true,
            customBotSettings: true,
            multipleBots: true
          },
          enterprise: { 
            aiTrading: true, 
            multiExchange: true, 
            advancedAnalytics: true, 
            apiAccess: true, 
            prioritySupport: true, 
            riskManagement: true, 
            customStrategies: true,
            autoBotCreation: true,
            customBotSettings: true,
            multipleBots: true,
            advancedBotAnalytics: true
          }
        };

        return { ...baseFeatures, ...(planFeatures[this.plan] || {}) };
      }
    },
    limits: {
      maxTrades: { type: Number, default: 10, min: 0 },
      maxExchanges: { type: Number, default: 2, min: 1 },
      apiCalls: { type: Number, default: 1000, min: 0 },
      concurrentBots: { type: Number, default: 1, min: 1 },
      dataRetention: { type: Number, default: 30, min: 1 }, // أيام
      // إضافة حدود البوت التلقائي
      maxBots: { type: Number, default: 1, min: 1 },
      botExecutionTime: { type: Number, default: 24, min: 1 }, // ساعات
      botMemoryLimit: { type: Number, default: 512, min: 128 } // ميجابايت
    },
    upgradeHistory: [{
      id: { type: String, default: () => uuidv4() },
      fromPlan: String,
      toPlan: String,
      date: { type: Date, default: Date.now },
      reason: String,
      amount: Number,
      paymentMethod: String
    }],
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly', 'lifetime'],
      default: 'monthly'
    },
    nextBillingDate: {
      type: Date,
      default: null
    }
  },

  // === نظام البوت التلقائي الجديد ===
  tradingBots: {
    activeBot: {
      botId: {
        type: String,
        default: null
      },
      botName: {
        type: String,
        default: function() {
          return `${this.personalInfo.name}_Trading_Bot`;
        }
      },
      telegramBotUrl: {
        type: String,
        default: null
      },
      telegramBotToken: {
        type: String,
        select: false,
        default: null
      },
      webhookUrl: {
        type: String,
        default: null
      },
      status: {
        type: String,
        enum: ['inactive', 'active', 'paused', 'error', 'initializing', 'configuring'],
        default: 'inactive',
        index: true
      },
      createdAt: {
        type: Date,
        default: null
      },
      lastActive: {
        type: Date,
        default: null
      },
      configuration: {
        tradingStrategy: {
          type: String,
          enum: ['scalping', 'day_trading', 'swing', 'arbitrage', 'market_making', 'custom'],
          default: 'day_trading'
        },
        riskLevel: {
          type: String,
          enum: ['low', 'medium', 'high', 'custom'],
          default: 'medium'
        },
        autoRestart: {
          type: Boolean,
          default: true
        },
        notifications: {
          telegram: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
          webhook: { type: Boolean, default: false }
        }
      },
      performance: {
        totalTrades: { type: Number, default: 0 },
        successfulTrades: { type: Number, default: 0 },
        totalProfit: { type: Number, default: 0 },
        currentBalance: { type: Number, default: 0 },
        successRate: { type: Number, default: 0 },
        lastTradeTime: { type: Date, default: null }
      },
      exchangeConnections: [{
        exchange: {
          type: String,
          enum: ['mexc', 'binance', 'kucoin', 'bybit', 'okx', 'gateio', 'huobi', 'coinbase', 'bitget']
        },
        accountId: String,
        status: {
          type: String,
          enum: ['connected', 'disconnected', 'error'],
          default: 'disconnected'
        },
        balance: {
          type: Number,
          default: 0
        }
      }]
    },
    botHistory: [{
      botId: { type: String, required: true },
      botName: String,
      created: { type: Date, default: Date.now },
      deactivated: Date,
      totalRuntime: Number, // بالثواني
      totalProfit: Number,
      totalTrades: Number,
      status: String,
      reason: String
    }],
    botSettings: {
      autoCreate: {
        type: Boolean,
        default: true
      },
      defaultStrategy: {
        type: String,
        default: 'day_trading'
      },
      riskManagement: {
        stopLoss: { type: Number, default: 2, min: 0.1, max: 50 },
        takeProfit: { type: Number, default: 5, min: 0.1, max: 100 },
        maxDrawdown: { type: Number, default: 10, min: 1, max: 50 }
      }
    }
  },

  // === سجل المعاملات المالية المتقدم ===
  paymentHistory: [{
    transactionId: {
      type: String,
      required: true,
      unique: true,
      default: () => `TXN_${uuidv4().split('-')[0].toUpperCase()}`
    },
    subscriptionId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['subscription', 'renewal', 'upgrade', 'refund', 'deposit', 'withdrawal', 'commission'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    method: {
      type: String,
      required: true,
      enum: ['usdt', 'sham_bank', 'crypto', 'credit_card', 'paypal', 'bank_transfer', 'internal']
    },
    network: {
      type: String,
      default: null,
      enum: [null, 'ERC20', 'TRC20', 'BEP20', 'SOLANA', 'BITCOIN']
    },
    reference: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded', 'processing'],
      default: 'pending',
      index: true
    },
    description: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    confirmedAt: {
      type: Date,
      default: null
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isTest: {
      type: Boolean,
      default: false
    },
    metadata: {
      ip: String,
      userAgent: String,
      walletAddress: { type: String, select: false },
      txHash: { type: String, select: false },
      confirmations: { type: Number, default: 0 },
      fee: { type: Number, default: 0 },
      netAmount: { type: Number, default: 0 },
      exchangeRate: { type: Number, default: 1 },
      paymentGateway: String,
      gatewayTransactionId: String
    }
  }],

  // === الملف الشخصي والتفضيلات المتقدمة ===
  profile: {
    avatar: {
      type: String,
      default: null,
      validate: {
        validator: function(url) {
          if (!url) return true;
          return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(url);
        },
        message: 'رابط الصورة غير صالح'
      }
    },
    bio: {
      type: String,
      maxlength: [500, 'السيرة الذاتية لا يمكن أن تزيد عن 500 حرف'],
      trim: true
    },
    joinDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    lastLogin: {
      type: Date,
      default: null
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true
    },
    emailVerified: {
      type: Boolean,
      default: false,
      index: true
    },
    phoneVerified: {
      type: Boolean,
      default: false,
      index: true
    },
    kycVerified: {
      type: Boolean,
      default: false,
      index: true
    },
    verificationToken: {
      type: String,
      select: false
    },
    verificationExpires: {
      type: Date,
      select: false
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      default: function() {
        return crypto.randomBytes(6).toString('hex').toUpperCase();
      }
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'dark'
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        telegram: { type: Boolean, default: false }
      },
      tradingView: {
        chartStyle: { type: String, enum: ['candlestick', 'line', 'area', 'bars'], default: 'candlestick' },
        timezone: { type: String, default: 'exchange' },
        soundEnabled: { type: Boolean, default: true }
      }
    }
  },

  // === منصات التداول وبيانات API المحسنة ===
  exchangeAccounts: [{
    accountId: {
      type: String,
      default: () => `EXC_${uuidv4().split('-')[0].toUpperCase()}`
    },
    exchange: {
      type: String,
      required: true,
      enum: ['mexc', 'binance', 'kucoin', 'bybit', 'okx', 'gateio', 'huobi', 'coinbase', 'bitget'],
      index: true
    },
    nickname: {
      type: String,
      trim: true,
      maxlength: 50
    },
    apiKey: {
      type: String,
      required: true,
      select: false
    },
    secret: {
      type: String,
      required: true,
      select: false
    },
    passphrase: {
      type: String,
      default: null,
      select: false
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    lastSync: {
      type: Date,
      default: null
    },
    balance: {
      type: Map,
      of: {
        total: Number,
        available: Number,
        locked: Number,
        usdValue: Number
      },
      default: {}
    },
    permissions: [{
      type: String,
      enum: ['spot', 'future', 'margin', 'withdraw', 'read', 'trade', 'transfer']
    }],
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'error', 'verifying', 'limited'],
      default: 'verifying'
    },
    errorLog: [{
      errorId: { type: String, default: () => uuidv4() },
      error: String,
      timestamp: { type: Date, default: Date.now },
      severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      resolved: { type: Boolean, default: false }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    security: {
      whitelistedIPs: [String],
      enableWithdrawals: { type: Boolean, default: false },
      tradeOnly: { type: Boolean, default: true }
    }
  }],

  // === إعدادات التداول المتقدمة ===
  tradingSettings: {
    riskManagement: {
      riskLevel: {
        type: String,
        enum: ['conservative', 'moderate', 'aggressive', 'custom'],
        default: 'moderate'
      },
      maxDrawdown: {
        type: Number,
        default: 10,
        min: 1,
        max: 50
      },
      dailyLossLimit: {
        type: Number,
        default: 5,
        min: 1,
        max: 100
      },
      positionSizing: {
        type: String,
        enum: ['fixed', 'percentage', 'kelly', 'volatility'],
        default: 'percentage'
      },
      maxPositionSize: {
        type: Number,
        default: 10,
        min: 1,
        max: 100
      },
      stopLoss: {
        enabled: { type: Boolean, default: true },
        percentage: { type: Number, default: 2, min: 0.1, max: 50 }
      },
      takeProfit: {
        enabled: { type: Boolean, default: true },
        percentage: { type: Number, default: 5, min: 0.1, max: 100 }
      },
      trailingStop: {
        enabled: { type: Boolean, default: false },
        percentage: { type: Number, default: 1, min: 0.1, max: 10 }
      }
    },
    strategy: {
      primary: {
        type: String,
        enum: ['scalping', 'day_trading', 'swing', 'position', 'arbitrage', 'market_making'],
        default: 'day_trading'
      },
      timeframes: [{
        type: String,
        enum: ['1m', '5m', '15m', '1h', '4h', '1d', '1w']
      }],
      indicators: {
        rsi: { 
          enabled: { type: Boolean, default: true }, 
          period: { type: Number, default: 14 },
          overbought: { type: Number, default: 70 },
          oversold: { type: Number, default: 30 }
        },
        macd: { 
          enabled: { type: Boolean, default: true },
          fastPeriod: { type: Number, default: 12 },
          slowPeriod: { type: Number, default: 26 },
          signalPeriod: { type: Number, default: 9 }
        },
        bollinger: { 
          enabled: { type: Boolean, default: true },
          period: { type: Number, default: 20 },
          deviation: { type: Number, default: 2 }
        },
        movingAverage: { 
          enabled: { type: Boolean, default: true }, 
          type: { type: String, enum: ['SMA', 'EMA', 'WMA'], default: 'EMA' },
          period: { type: Number, default: 50 }
        }
      },
      customParameters: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
      }
    },
    automation: {
      enabled: {
        type: Boolean,
        default: false
      },
      tradingHours: {
        start: { type: String, default: '00:00' },
        end: { type: String, default: '23:59' },
        timezone: { type: String, default: 'UTC' }
      },
      marketConditions: {
        highVolatility: { type: Boolean, default: true },
        lowVolatility: { type: Boolean, default: false },
        trendingMarket: { type: Boolean, default: true },
        sidewaysMarket: { type: Boolean, default: false }
      },
      autoRestart: {
        enabled: { type: Boolean, default: true },
        maxRestarts: { type: Number, default: 3 }
      }
    },
    notifications: {
      telegram: {
        enabled: { type: Boolean, default: false },
        chatId: String,
        botToken: { type: String, select: false }
      },
      email: {
        enabled: { type: Boolean, default: true },
        frequency: {
          type: String,
          enum: ['realtime', 'hourly', 'daily', 'weekly', 'important_only'],
          default: 'realtime'
        }
      },
      sms: {
        enabled: { type: Boolean, default: false },
        phone: String
      },
      webPush: {
        enabled: { type: Boolean, default: true }
      },
      discord: {
        enabled: { type: Boolean, default: false },
        webhookUrl: { type: String, select: false }
      }
    }
  },

  // === الإحصائيات والأداء المحسن ===
  statistics: {
    trading: {
      totalTrades: { type: Number, default: 0, min: 0 },
      successfulTrades: { type: Number, default: 0, min: 0 },
      failedTrades: { type: Number, default: 0, min: 0 },
      totalProfit: { type: Number, default: 0 },
      totalLoss: { type: Number, default: 0 },
      netProfit: { type: Number, default: 0 },
      successRate: { type: Number, default: 0, min: 0, max: 100 },
      averageProfit: { type: Number, default: 0 },
      maxDrawdown: { type: Number, default: 0, min: 0, max: 100 },
      sharpeRatio: { type: Number, default: 0 },
      profitFactor: { type: Number, default: 0 },
      recoveryFactor: { type: Number, default: 0 },
      expectancy: { type: Number, default: 0 },
      avgTradeDuration: { type: Number, default: 0 } // بالدقائق
    },
    account: {
      totalDeposits: { type: Number, default: 0, min: 0 },
      totalWithdrawals: { type: Number, default: 0, min: 0 },
      currentBalance: { type: Number, default: 0 },
      accountValue: { type: Number, default: 0 },
      portfolioGrowth: { type: Number, default: 0 },
      roi: { type: Number, default: 0 }, // عائد الاستثمار
      sharpeRatio: { type: Number, default: 0 },
      volatility: { type: Number, default: 0 }
    },
    activity: {
      loginCount: { type: Number, default: 0, min: 0 },
      tradeFrequency: { type: Number, default: 0, min: 0 },
      lastTradeDate: { type: Date, default: null },
      apiUsage: { type: Number, default: 0, min: 0 },
      sessionDuration: { type: Number, default: 0, min: 0 }, // بالدقائق
      activeDays: { type: Number, default: 0, min: 0 }
    },
    performance: {
      weekly: {
        profit: { type: Number, default: 0 },
        trades: { type: Number, default: 0 },
        successRate: { type: Number, default: 0 }
      },
      monthly: {
        profit: { type: Number, default: 0 },
        trades: { type: Number, default: 0 },
        successRate: { type: Number, default: 0 }
      },
      yearly: {
        profit: { type: Number, default: 0 },
        trades: { type: Number, default: 0 },
        successRate: { type: Number, default: 0 }
      }
    }
  },

  // === سجل التداول المحسن ===
  tradeHistory: [{
    tradeId: {
      type: String,
      required: true,
      unique: true,
      default: () => `TRADE_${uuidv4().split('-')[0].toUpperCase()}`
    },
    exchange: {
      type: String,
      required: true,
      index: true
    },
    symbol: {
      type: String,
      required: true,
      index: true
    },
    side: {
      type: String,
      enum: ['buy', 'sell'],
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['market', 'limit', 'stop', 'stop_limit', 'trailing_stop'],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    fee: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['open', 'filled', 'partial', 'cancelled', 'rejected', 'expired'],
      required: true,
      index: true
    },
    profitLoss: {
      type: Number,
      default: 0
    },
    profitLossPercentage: {
      type: Number,
      default: 0
    },
    strategy: {
      type: String,
      default: 'manual'
    },
    timeframe: String,
    notes: String,
    openedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    closedAt: {
      type: Date,
      default: null
    },
    duration: {
      type: Number,
      default: 0
    },
    metadata: {
      exchangeOrderId: String,
      clientOrderId: String,
      executionType: String,
      leverage: { type: Number, default: 1 },
      margin: { type: Number, default: 0 },
      commission: { type: Number, default: 0 },
      slippage: { type: Number, default: 0 },
      fillPrice: Number,
      averagePrice: Number,
      executedQty: Number,
      icebergQty: Number,
      timeInForce: String
    },
    analysis: {
      entryReason: String,
      exitReason: String,
      emotions: [String],
      lessons: String,
      rating: { type: Number, min: 1, max: 5 }
    }
  }],

  // === الأمان والمراقبة المحسنة ===
  security: {
    loginAttempts: {
      type: Number,
      default: 0,
      select: false
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: {
      type: String,
      select: false
    },
    twoFactorBackupCodes: [{
      code: { type: String, select: false },
      used: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }],
    lastPasswordChange: {
      type: Date,
      default: Date.now
    },
    passwordHistory: [{
      password: { type: String, select: false },
      changedAt: { type: Date, default: Date.now }
    }],
    suspiciousActivities: [{
      activityId: { type: String, default: () => uuidv4() },
      activity: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      ip: String,
      userAgent: String,
      location: String,
      timestamp: { type: Date, default: Date.now },
      resolved: { type: Boolean, default: false }
    }],
    sessionTokens: [{
      token: { type: String, select: false },
      expiresAt: Date,
      device: String,
      ip: String,
      userAgent: String,
      lastUsed: { type: Date, default: Date.now },
      isActive: { type: Boolean, default: true }
    }],
    apiKeys: [{
      keyId: { type: String, default: () => uuidv4() },
      name: String,
      key: { type: String, select: false },
      secret: { type: String, select: false },
      permissions: [String],
      lastUsed: Date,
      expiresAt: Date,
      isActive: { type: Boolean, default: true }
    }],
    securityQuestions: [{
      question: String,
      answer: { type: String, select: false }
    }]
  },

  // === نظام الإحالة المحسن ===
  referral: {
    totalReferrals: { type: Number, default: 0, min: 0 },
    activeReferrals: { type: Number, default: 0, min: 0 },
    referralEarnings: { type: Number, default: 0, min: 0 },
    commissionRate: { type: Number, default: 10, min: 0, max: 50 }, // نسبة العمولة
    referredUsers: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      joinedAt: { type: Date, default: Date.now },
      commissionEarned: { type: Number, default: 0, min: 0 },
      status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'pending' }
    }],
    payoutHistory: [{
      payoutId: { type: String, default: () => uuidv4() },
      amount: Number,
      date: { type: Date, default: Date.now },
      method: String,
      status: { type: String, enum: ['pending', 'paid', 'failed'] }
    }]
  },

  // === الإعدادات الإدارية المتقدمة ===
  admin: {
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin', 'super_admin'],
      default: 'user',
      index: true
    },
    permissions: [{
      type: String,
      enum: [
        'user_management', 'content_management', 'financial_management', 
        'system_monitoring', 'security_management', 'support_management',
        'trading_management', 'reporting', 'settings_management'
      ]
    }],
    lastAdminAction: Date,
    actionLog: [{
      action: String,
      target: mongoose.Schema.Types.Mixed,
      timestamp: { type: Date, default: Date.now },
      ip: String,
      userAgent: String
    }],
    notes: String,
    accessLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    }
  },

  // === التحليلات والتتبع ===
  analytics: {
    acquisition: {
      source: String,
      campaign: String,
      medium: String,
      initialReferrer: String
    },
    behavior: {
      favoritePairs: [String],
      tradingHours: [Number], // ساعات النشاط
      deviceUsage: {
        desktop: { type: Number, default: 0 },
        mobile: { type: Number, default: 0 },
        tablet: { type: Number, default: 0 }
      },
      featureUsage: {
        dashboard: { type: Number, default: 0 },
        trading: { type: Number, default: 0 },
        analytics: { type: Number, default: 0 },
        settings: { type: Number, default: 0 }
      }
    },
    engagement: {
      lastActive: Date,
      sessionCount: { type: Number, default: 0 },
      averageSession: { type: Number, default: 0 }, // بالدقائق
      retentionRate: { type: Number, default: 0 }
    }
  },

  // === النسخ الاحتياطي والإعدادات ===
  backup: {
    lastBackup: Date,
    backupFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
    autoBackup: { type: Boolean, default: true },
    encrypted: { type: Boolean, default: true }
  },

  // === العلامات والتصنيفات ===
  tags: [{
    type: String,
    enum: [
      'vip', 'new_user', 'active_trader', 'inactive', 'high_volume',
      'risk_taker', 'conservative', 'technical', 'fundamental',
      'day_trader', 'swing_trader', 'investor', 'arbitrageur'
    ],
    index: true
  }],

  // === الحالة النظامية ===
  systemStatus: {
    isActive: { type: Boolean, default: true, index: true },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: String,
    suspensionEnd: Date,
    lastHealthCheck: Date,
    systemNotes: String
  }

}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      // إخفاء الحقول الحساسة مع الحفاظ على الوظائف الحالية
      delete ret.password;
      delete ret.security;
      delete ret.tradingBots?.activeBot?.telegramBotToken;
      delete ret.exchangeAccounts;
      delete ret.twoFactorSecret;
      delete ret.sessionTokens;
      delete ret.apiKeys;
      delete ret.securityQuestions;
      delete ret.twoFactorBackupCodes;
      delete ret.passwordHistory;
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
});

// === الفهرسات المتقدمة للأداء ===
userSchema.index({ 'personalInfo.email': 1 }, { collation: { locale: 'en', strength: 2 } });
userSchema.index({ 'subscription.status': 1, 'subscription.endDate': 1 });
userSchema.index({ 'profile.joinDate': -1, 'statistics.trading.netProfit': -1 });
userSchema.index({ 'profile.referralCode': 1 }, { sparse: true });
userSchema.index({ 'personalInfo.phone': 1 }, { sparse: true });
userSchema.index({ 'statistics.trading.netProfit': -1 });
userSchema.index({ 'admin.role': 1, 'profile.lastActivity': -1 });
userSchema.index({ 'systemStatus.isActive': 1, 'subscription.status': 1 });
userSchema.index({ 'tags': 1 });
userSchema.index({ 'analytics.behavior.favoritePairs': 1 });
userSchema.index({ 'tradeHistory.openedAt': -1, 'tradeHistory.symbol': 1 });
userSchema.index({ 'security.suspiciousActivities.timestamp': -1 });

// === إضافة الفهرسات الجديدة ===
userSchema.index({ 'tradingBots.activeBot.status': 1 });
userSchema.index({ 'tradingBots.activeBot.createdAt': -1 });
userSchema.index({ 'subscription.plan': 1, 'tradingBots.activeBot.status': 1 });

// === إضافة الدوال الافتراضية الجديدة ===
userSchema.virtual('hasActiveBot').get(function() {
  return this.tradingBots.activeBot.status === 'active';
});

userSchema.virtual('botCreationEligible').get(function() {
  return this.subscription.status === 'active' && 
         this.paymentHistory.some(payment => 
           payment.status === 'completed' && 
           payment.type === 'subscription'
         );
});

userSchema.virtual('botPerformance').get(function() {
  const bot = this.tradingBots.activeBot;
  return {
    successRate: bot.performance.successRate,
    totalProfit: bot.performance.totalProfit,
    totalTrades: bot.performance.totalTrades,
    isProfitable: bot.performance.totalProfit > 0
  };
});

// === الحفاظ على جميع الدوال الافتراضية الحالية ===
userSchema.virtual('isSubscriptionActive').get(function() {
  const now = new Date();
  return this.subscription.status === 'active' && 
         this.subscription.endDate > now;
});

userSchema.virtual('isTrialActive').get(function() {
  const now = new Date();
  return this.subscription.status === 'trial' && 
         this.subscription.trialEndDate > now;
});

userSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.subscription.endDate) return 0;
  const now = new Date();
  const expiry = new Date(this.subscription.endDate);
  const diff = expiry - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

userSchema.virtual('trialDaysRemaining').get(function() {
  if (!this.subscription.trialEndDate) return 0;
  const now = new Date();
  const trialEnd = new Date(this.subscription.trialEndDate);
  const diff = trialEnd - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

userSchema.virtual('accountAge').get(function() {
  const now = new Date();
  const joinDate = new Date(this.profile.joinDate);
  return Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
});

userSchema.virtual('tradingExperience').get(function() {
  const age = this.accountAge;
  if (age < 30) return 'مبتدئ';
  if (age < 180) return 'متوسط';
  if (age < 365) return 'متقدم';
  return 'خبير';
});

userSchema.virtual('riskProfile').get(function() {
  const successRate = this.statistics.trading.successRate;
  const avgProfit = this.statistics.trading.averageProfit;
  
  if (successRate > 70 && avgProfit > 0) return 'محافظ';
  if (successRate > 50 && avgProfit > 0) return 'متوازن';
  if (successRate > 30) return 'مجازف';
  return 'خبير';
});

// === الحفاظ على Middleware الحالي ===
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.security.sessionTokens.push({
    token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 ساعة
    device: 'web',
    lastUsed: new Date()
  });
  return token;
};

module.exports = mongoose.model('User', userSchema);
