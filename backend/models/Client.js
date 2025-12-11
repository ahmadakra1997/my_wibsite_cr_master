// backend/src/models/Client.js - النسخة المتقدمة والمحسنة
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const ClientSchema = new mongoose.Schema({
  // === المعرفات الفريدة ===
  clientId: {
    type: String,
    unique: true,
    default: () => `CLIENT_${uuidv4().split('-')[0].toUpperCase()}`
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // === المعلومات الأساسية والمجهولة ===
  profile: {
    anonymousId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      default: () => `ANON_${crypto.randomBytes(12).toString('hex').toUpperCase()}`
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [50, 'اسم العرض لا يمكن أن يزيد عن 50 حرف'],
      default: function() {
        return `Trader_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      }
    },
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
      maxlength: [300, 'السيرة الذاتية لا يمكن أن تزيد عن 300 حرف'],
      trim: true
    },
    joinDate: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'banned', 'premium'],
      default: 'active',
      index: true
    },
    reputation: {
      score: { type: Number, default: 0, min: 0, max: 1000 },
      level: { type: String, enum: ['new', 'trusted', 'veteran', 'expert'], default: 'new' },
      badges: [{
        name: String,
        icon: String,
        earnedAt: { type: Date, default: Date.now },
        description: String
      }]
    }
  },

  // === الأمان والخصوصية المتقدمة ===
  security: {
    encryptionKey: {
      type: String,
      required: true,
      select: false,
      default: () => crypto.randomBytes(32).toString('hex')
    },
    sessionTokens: [{
      token: { type: String, select: false },
      device: String,
      ip: String,
      userAgent: String,
      createdAt: { type: Date, default: Date.now },
      expiresAt: Date,
      lastUsed: { type: Date, default: Date.now },
      isActive: { type: Boolean, default: true }
    }],
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'friends_only'],
        default: 'private'
      },
      showTradingStats: { type: Boolean, default: false },
      allowMessages: { type: Boolean, default: true },
      showOnlineStatus: { type: Boolean, default: true },
      dataSharing: {
        analytics: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false },
        thirdParty: { type: Boolean, default: false }
      }
    },
    securityQuestions: [{
      question: String,
      answerHash: { type: String, select: false },
      createdAt: { type: Date, default: Date.now }
    }],
    backupCodes: [{
      code: { type: String, select: false },
      used: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }]
  },

  // === نظام البوت الشخصي المتقدم ===
  telegramBot: {
    botId: {
      type: String,
      unique: true,
      sparse: true
    },
    botToken: {
      type: String,
      select: false,
      sparse: true
    },
    botUsername: {
      type: String,
      sparse: true
    },
    chatId: {
      type: String,
      select: false,
      sparse: true
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true
    },
    settings: {
      autoStart: { type: Boolean, default: true },
      notifications: {
        trades: { type: Boolean, default: true },
        alerts: { type: Boolean, default: true },
        system: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false }
      },
      language: {
        type: String,
        enum: ['ar', 'en', 'tr', 'fr'],
        default: 'ar'
      },
      timezone: {
        type: String,
        default: 'Asia/Damascus'
      }
    },
    statistics: {
      messagesSent: { type: Number, default: 0 },
      commandsProcessed: { type: Number, default: 0 },
      lastActive: { type: Date, default: null },
      uptime: { type: Number, default: 0 } // بالثواني
    },
    webhook: {
      url: { type: String, select: false },
      secret: { type: String, select: false },
      isActive: { type: Boolean, default: false }
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },

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
      }
    },
    strategy: {
      primary: {
        type: String,
        enum: ['scalping', 'day_trading', 'swing', 'position', 'arbitrage'],
        default: 'day_trading'
      },
      timeframes: [{
        type: String,
        enum: ['1m', '5m', '15m', '1h', '4h', '1d']
      }],
      indicators: {
        rsi: { 
          enabled: { type: Boolean, default: true }, 
          period: { type: Number, default: 14 }
        },
        macd: { 
          enabled: { type: Boolean, default: true }
        },
        bollinger: { 
          enabled: { type: Boolean, default: true }
        },
        movingAverage: { 
          enabled: { type: Boolean, default: true }
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
        end: { type: String, default: '23:59' }
      },
      marketConditions: {
        highVolatility: { type: Boolean, default: true },
        lowVolatility: { type: Boolean, default: false }
      }
    }
  },

  // === منصات التداول المدعومة ===
  exchangeAccounts: [{
    accountId: {
      type: String,
      default: () => `EXC_${uuidv4().split('-')[0].toUpperCase()}`
    },
    exchange: {
      type: String,
      required: true,
      enum: ['mexc', 'binance', 'kucoin', 'bybit', 'okx', 'gateio', 'huobi'],
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
      enum: ['spot', 'future', 'margin', 'withdraw', 'read', 'trade']
    }],
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'error', 'verifying'],
      default: 'verifying'
    },
    errorLog: [{
      errorId: { type: String, default: () => uuidv4() },
      error: String,
      timestamp: { type: Date, default: Date.now },
      severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      resolved: { type: Boolean, default: false }
    }],
    security: {
      whitelistedIPs: [String],
      enableWithdrawals: { type: Boolean, default: false },
      tradeOnly: { type: Boolean, default: true }
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // === نظام الإشعارات المتقدم ===
  notifications: {
    telegram: {
      enabled: { type: Boolean, default: false },
      chatId: String,
      settings: {
        trades: { type: Boolean, default: true },
        alerts: { type: Boolean, default: true },
        system: { type: Boolean, default: true },
        news: { type: Boolean, default: false }
      }
    },
    email: {
      enabled: { type: Boolean, default: true },
      frequency: {
        type: String,
        enum: ['realtime', 'hourly', 'daily', 'weekly', 'important_only'],
        default: 'realtime'
      },
      settings: {
        trades: { type: Boolean, default: true },
        alerts: { type: Boolean, default: true },
        system: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false }
      }
    },
    sms: {
      enabled: { type: Boolean, default: false },
      phone: String,
      settings: {
        criticalAlerts: { type: Boolean, default: true },
        securityAlerts: { type: Boolean, default: true }
      }
    },
    webPush: {
      enabled: { type: Boolean, default: true },
      endpoint: String,
      keys: {
        p256dh: String,
        auth: String
      }
    },
    discord: {
      enabled: { type: Boolean, default: false },
      webhookUrl: { type: String, select: false },
      settings: {
        trades: { type: Boolean, default: true },
        alerts: { type: Boolean, default: true }
      }
    }
  },

  // === الإحصائيات والأداء المتقدم ===
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
      profitFactor: { type: Number, default: 0 }
    },
    account: {
      totalDeposits: { type: Number, default: 0, min: 0 },
      totalWithdrawals: { type: Number, default: 0, min: 0 },
      currentBalance: { type: Number, default: 0 },
      accountValue: { type: Number, default: 0 },
      portfolioGrowth: { type: Number, default: 0 }
    },
    activity: {
      loginCount: { type: Number, default: 0, min: 0 },
      tradeFrequency: { type: Number, default: 0, min: 0 },
      lastTradeDate: { type: Date, default: null },
      apiUsage: { type: Number, default: 0, min: 0 },
      sessionDuration: { type: Number, default: 0, min: 0 } // بالدقائق
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

  // === المراقبة الأمنية المتقدمة ===
  monitoring: {
    lastLogin: {
      type: Date,
      default: null
    },
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
      resolved: { type: Boolean, default: false },
      actionTaken: String
    }],
    auditLog: [{
      logId: { type: String, default: () => uuidv4() },
      action: String,
      resource: String,
      details: mongoose.Schema.Types.Mixed,
      ip: String,
      userAgent: String,
      timestamp: { type: Date, default: Date.now }
    }],
    securityScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    }
  },

  // === التفضيلات والإعدادات ===
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'dark'
    },
    language: {
      type: String,
      enum: ['ar', 'en', 'tr', 'fr'],
      default: 'ar'
    },
    timezone: {
      type: String,
      default: 'Asia/Damascus'
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'TRY', 'SAR', 'AED']
    },
    tradingView: {
      chartStyle: { type: String, enum: ['candlestick', 'line', 'area', 'bars'], default: 'candlestick' },
      timezone: { type: String, default: 'exchange' },
      soundEnabled: { type: Boolean, default: true }
    },
    alerts: {
      sound: { type: Boolean, default: true },
      vibration: { type: Boolean, default: true },
      popup: { type: Boolean, default: true }
    }
  },

  // === نظام الدعم والمساعدة ===
  support: {
    activeTickets: [{
      ticketId: String,
      subject: String,
      status: String,
      createdAt: Date
    }],
    lastContact: Date,
    satisfactionScore: { type: Number, default: 0, min: 0, max: 5 },
    feedback: [{
      rating: Number,
      comment: String,
      timestamp: { type: Date, default: Date.now }
    }]
  },

  // === العلامات والتصنيفات ===
  tags: [{
    type: String,
    enum: [
      'vip', 'new_client', 'active_trader', 'inactive', 'high_volume',
      'risk_taker', 'conservative', 'technical', 'premium'
    ],
    index: true
  }],

  // === النسخ الاحتياطي والإعدادات ===
  backup: {
    lastBackup: Date,
    autoBackup: { type: Boolean, default: true },
    encrypted: { type: Boolean, default: true }
  },

  // === الحالة النظامية ===
  systemStatus: {
    isActive: { type: Boolean, default: true, index: true },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: String,
    suspensionEnd: Date,
    lastHealthCheck: Date
  }

}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      // إخفاء الحقول الحساسة
      delete ret.security;
      delete ret.exchangeAccounts;
      delete ret.sessionTokens;
      delete ret.backupCodes;
      delete ret.securityQuestions;
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
});

// === الفهرسات المتقدمة ===
ClientSchema.index({ userId: 1 }, { unique: true });
ClientSchema.index({ 'profile.anonymousId': 1 });
ClientSchema.index({ 'profile.status': 1 });
ClientSchema.index({ 'telegramBot.isActive': 1 });
ClientSchema.index({ 'statistics.trading.netProfit': -1 });
ClientSchema.index({ 'monitoring.securityScore': -1 });
ClientSchema.index({ tags: 1 });
ClientSchema.index({ 'profile.joinDate': -1 });
ClientSchema.index({ 'profile.lastSeen': -1 });
ClientSchema.index({ 'systemStatus.isActive': 1 });

// === الدوال الافتراضية (Virtuals) ===
ClientSchema.virtual('isOnline').get(function() {
  const now = new Date();
  const lastSeen = new Date(this.profile.lastSeen);
  return (now - lastSeen) < (5 * 60 * 1000); // 5 دقائق
});

ClientSchema.virtual('accountAge').get(function() {
  const now = new Date();
  const joinDate = new Date(this.profile.joinDate);
  return Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
});

ClientSchema.virtual('tradingExperience').get(function() {
  const age = this.accountAge;
  if (age < 30) return 'مبتدئ';
  if (age < 180) return 'متوسط';
  return 'محترف';
});

ClientSchema.virtual('riskProfile').get(function() {
  const successRate = this.statistics.trading.successRate;
  if (successRate > 70) return 'محافظ';
  if (successRate > 50) return 'متوازن';
  return 'مجازف';
});

// === Middleware ===
ClientSchema.pre('save', function(next) {
  if (this.isModified('exchangeAccounts')) {
    this.encryptExchangeData();
  }
  
  if (this.isModified('profile.lastSeen')) {
    this.updateActivityStats();
  }
  
  next();
});

ClientSchema.pre('findOneAndUpdate', function(next) {
  this.set({ 'profile.lastSeen': new Date() });
  next();
});

// === الدوال الخاصة بالنموذج ===
ClientSchema.methods.encryptExchangeData = function() {
  const crypto = require('crypto');
  
  this.exchangeAccounts.forEach(account => {
    if (account.apiKey && !account.apiKey.startsWith('encrypted_')) {
      const cipher = crypto.createCipher('aes-256-gcm', this.security.encryptionKey);
      let encrypted = cipher.update(account.apiKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      account.apiKey = `encrypted_${encrypted}`;
    }
    
    if (account.secret && !account.secret.startsWith('encrypted_')) {
      const cipher = crypto.createCipher('aes-256-gcm', this.security.encryptionKey);
      let encrypted = cipher.update(account.secret, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      account.secret = `encrypted_${encrypted}`;
    }
  });
};

ClientSchema.methods.decryptExchangeData = function(accountId) {
  const crypto = require('crypto');
  const account = this.exchangeAccounts.id(accountId);
  
  if (!account) return null;
  
  try {
    if (account.apiKey.startsWith('encrypted_')) {
      const encrypted = account.apiKey.replace('encrypted_', '');
      const decipher = crypto.createDecipher('aes-256-gcm', this.security.encryptionKey);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }
  } catch (error) {
    console.error('فشل فك التشفير:', error);
    return null;
  }
};

ClientSchema.methods.updateActivityStats = function() {
  const now = new Date();
  const lastSeen = new Date(this.profile.lastSeen);
  
  // تحديث مدة الجلسة
  const sessionDuration = (now - lastSeen) / (1000 * 60); // بالدقائق
  this.statistics.activity.sessionDuration += sessionDuration;
};

ClientSchema.methods.addSuspiciousActivity = function(activity, severity, ip, userAgent) {
  this.monitoring.suspiciousActivities.push({
    activity,
    severity,
    ip,
    userAgent,
    timestamp: new Date()
  });
  
  // تحديث درجة الأمان
  this.updateSecurityScore();
};

ClientSchema.methods.updateSecurityScore = function() {
  let score = 100;
  
  // خصم النقاط بناءً على الأنشطة المشبوهة
  const suspiciousCount = this.monitoring.suspiciousActivities.length;
  score -= Math.min(suspiciousCount * 5, 50);
  
  // خصم إذا لم يكن هناك تحقق ثنائي
  if (!this.security.twoFactorEnabled) {
    score -= 10;
  }
  
  // خصم إذا كان الحساب مقفلاً
  if (this.monitoring.lockUntil && this.monitoring.lockUntil > new Date()) {
    score -= 20;
  }
  
  this.monitoring.securityScore = Math.max(0, score);
};

ClientSchema.methods.generateBackupCodes = function() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push({
      code: bcrypt.hashSync(code, 12),
      used: false,
      createdAt: new Date()
    });
  }
  this.security.backupCodes = codes;
  return codes;
};

ClientSchema.methods.verifyBackupCode = function(code) {
  for (let backupCode of this.security.backupCodes) {
    if (!backupCode.used && bcrypt.compareSync(code, backupCode.code)) {
      backupCode.used = true;
      return true;
    }
  }
  return false;
};

ClientSchema.methods.addAuditLog = function(action, resource, details, ip, userAgent) {
  this.monitoring.auditLog.push({
    action,
    resource,
    details,
    ip,
    userAgent,
    timestamp: new Date()
  });
  
  // الاحتفاظ بآخر 100 سجل فقط
  if (this.monitoring.auditLog.length > 100) {
    this.monitoring.auditLog.shift();
  }
};

// === الدوال الثابتة ===
ClientSchema.statics.findByStatus = function(status) {
  return this.find({ 'profile.status': status });
};

ClientSchema.statics.findActiveTraders = function() {
  return this.find({
    'profile.status': 'active',
    'statistics.activity.lastTradeDate': { 
      $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
    }
  });
};

ClientSchema.statics.getSystemStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalClients: { $sum: 1 },
        activeClients: { 
          $sum: { 
            $cond: [{ $eq: ['$profile.status', 'active'] }, 1, 0] 
          } 
        },
        premiumClients: { 
          $sum: { 
            $cond: [{ $eq: ['$profile.status', 'premium'] }, 1, 0] 
          } 
        },
        totalProfit: { $sum: '$statistics.trading.netProfit' },
        avgSecurityScore: { $avg: '$monitoring.securityScore' },
        activeBots: {
          $sum: { 
            $cond: [{ $eq: ['$telegramBot.isActive', true] }, 1, 0] 
          } 
        }
      }
    }
  ]);
  
  return stats[0] || {};
};

module.exports = mongoose.model('Client', ClientSchema);
