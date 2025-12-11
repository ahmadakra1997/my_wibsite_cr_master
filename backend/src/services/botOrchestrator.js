// backend/src/services/botOrchestrator.js
// طبقة تنسيق احترافية بين:
// - MongoDB (نماذج Bot / BotSettings / TradeHistory)
// - PythonEngineClient (FastAPI)
// لا تغيّر منطق التداول، فقط تنسّق عمليات start/stop/config/metrics

const pythonEngineClient = require('./pythonEngineClient');

let Bot;
let BotSettings;
let TradeHistory;
let logger;

try {
  Bot = require('../models/bot/Bot');
  BotSettings = require('../models/bot/BotSettings');
  TradeHistory = require('../models/trading/TradeHistory');
  logger = require('../utils/logger');
} catch (e) {
  logger = console;
}

class BotOrchestrator {
  /**
   * جلب البوت مع التحقق من ملكيته
   */
  async getBotById(botId, userId) {
    if (!Bot) throw new Error('Bot model is not available');

    const query = { _id: botId };
    if (userId) {
      // كل مستخدم يشوف بوتاته فقط (إلا إذا عندك منطق صلاحيات آخر)
      query.owner = userId;
    }

    const bot = await Bot.findOne(query).populate('settings');
    if (!bot) {
      const err = new Error('Bot not found');
      err.status = 404;
      err.code = 'BOT_NOT_FOUND';
      throw err;
    }
    return bot;
  }

  /**
   * تشغيل البوت:
   * - تحديث الحالة في DB
   * - استدعاء Python engine لتشغيل التنفيذ الفعلي
   */
  async startBot(botId, userContext = {}) {
    const bot = await this.getBotById(botId, userContext.userId);

    const settings =
      bot.settings ||
      (BotSettings
        ? await BotSettings.findOne({ bot: bot._id })
        : null);

    const engineConfig = {
      botId: String(bot._id),
      symbol: bot.symbol,
      exchange: bot.exchange,
      strategy: bot.strategyKey || bot.strategy || 'default',
      // إعدادات إضافية
      leverage: settings?.leverage,
      maxPositionSize: settings?.maxPositionSize,
      maxDailyLossPercent: settings?.maxDailyLossPercent,
      riskMode: settings?.riskMode || 'balanced',
      userId: userContext.userId,
      tenantId: userContext.tenantId,
    };

    // استدعاء Python engine
    const engineResult = await pythonEngineClient.startBot(
      bot._id,
      engineConfig,
    );

    // تحديث حالة البوت في DB (بدون لمس منطق التداول)
    bot.status = 'running';
    bot.lastStartAt = new Date();
    bot.lastError = null;
    await bot.save();

    return {
      bot,
      engineResult,
    };
  }

  /**
   * إيقاف مؤقت
   */
  async pauseBot(botId, userContext = {}) {
    const bot = await this.getBotById(botId, userContext.userId);

    const engineResult = await pythonEngineClient.pauseBot(bot._id);

    bot.status = 'paused';
    bot.lastPauseAt = new Date();
    await bot.save();

    return { bot, engineResult };
  }

  /**
   * إيقاف كامل
   */
  async stopBot(botId, userContext = {}) {
    const bot = await this.getBotById(botId, userContext.userId);

    const engineResult = await pythonEngineClient.stopBot(bot._id);

    bot.status = 'stopped';
    bot.lastStopAt = new Date();
    await bot.save();

    return { bot, engineResult };
  }

  /**
   * إيقاف طارئ (لا نلمس منطق الاستراتيجية، فقط نضمن وقف التنفيذ)
   */
  async emergencyStop(botId, userContext = {}) {
    const bot = await this.getBotById(botId, userContext.userId);

    try {
      await pythonEngineClient.stopBot(bot._id);
    } catch (e) {
      logger.error('[BotOrchestrator] emergencyStop engine error:', e);
    }

    bot.status = 'emergency-stopped';
    bot.lastStopAt = new Date();
    bot.lastError = 'Emergency stop triggered by user';
    await bot.save();

    return { bot };
  }

  /**
   * تحديث إعدادات البوت:
   * - حفظها في BotSettings
   * - إرسالها لمحرك Python ليحدث السياق الداخلي
   */
  async updateBotConfig(botId, config, userContext = {}) {
    const bot = await this.getBotById(botId, userContext.userId);

    let settings;
    if (BotSettings) {
      settings =
        (await BotSettings.findOne({ bot: bot._id })) ||
        new BotSettings({ bot: bot._id });

      if (config.leverage !== undefined)
        settings.leverage = config.leverage;
      if (config.maxPositionSize !== undefined)
        settings.maxPositionSize = config.maxPositionSize;
      if (config.maxDailyLossPercent !== undefined)
        settings.maxDailyLossPercent = config.maxDailyLossPercent;
      if (config.riskMode !== undefined)
        settings.riskMode = config.riskMode;

      await settings.save();
    }

    const engineResult = await pythonEngineClient.updateBotConfig(
      bot._id,
      {
        ...config,
        botId: String(bot._id),
        symbol: bot.symbol,
        exchange: bot.exchange,
        strategy: bot.strategyKey || bot.strategy || 'default',
        userId: userContext.userId,
        tenantId: userContext.tenantId,
      },
    );

    return { bot, settings, engineResult };
  }

  /**
   * جلب Metrics من Python + DB
   */
  async getBotMetrics(botId, userContext = {}) {
    const bot = await this.getBotById(botId, userContext.userId);

    let engineStatus = null;
    try {
      const fullStatus = await pythonEngineClient.getStatus();
      // نفترض أن Python يرجع قائمة أو object يحتوي على حالة كل بوت
      // نستخرج حالة هذا البوت فقط إن وجدت
      engineStatus =
        fullStatus?.bots?.find?.(
          (b) => String(b.botId) === String(bot._id),
        ) || null;
    } catch (e) {
      logger.error('[BotOrchestrator] getBotMetrics engine error:', e);
    }

    let recentTrades = [];
    if (TradeHistory) {
      recentTrades = await TradeHistory.find({ bot: bot._id })
        .sort({ createdAt: -1 })
        .limit(50);
    }

    return {
      bot,
      engineStatus,
      recentTrades,
    };
  }
}

module.exports = new BotOrchestrator();
