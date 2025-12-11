// backend/src/controllers/bot/botController.js
// متحكم البوت: يستقبل طلبات HTTP، يعتمد على botOrchestrator
// ويحافظ على منطق التداول داخل Python كما هو دون لمس

const botOrchestrator = require('../../services/botOrchestrator');

let Bot;
let ResponseHandler;
let ErrorHandler;
let logger;

try {
  Bot = require('../../models/bot/Bot');
  ResponseHandler = require('../../utils/responseHandler');
  ErrorHandler = require('../../utils/errorHandler');
  logger = require('../../utils/logger');
} catch (e) {
  logger = console;
}

class BotController {
  constructor() {
    this.responseHandler = ResponseHandler
      ? new ResponseHandler()
      : {
          sendSuccess(res, message, data) {
            res.json({ success: true, message, data });
          },
        };
    this.errorHandler = ErrorHandler
      ? new ErrorHandler()
      : {
          handleError(res, error, code) {
            logger.error('[BotController] Error:', error);
            res.status(error.status || 500).json({
              success: false,
              code: code || error.code || 'BOT_ERROR',
              message: error.message || 'Bot request failed',
              details: error.details || null,
            });
          },
        };
  }

  /**
   * قائمة البوتات الخاصة بالمستخدم الحالي
   * GET /api/bot
   */
  async listBots(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      if (!Bot) {
        throw new Error('Bot model not available');
      }

      const bots = await Bot.find({ owner: userId }).sort({
        createdAt: -1,
      });

      this.responseHandler.sendSuccess(
        res,
        'Bots fetched successfully',
        bots,
      );
    } catch (error) {
      this.errorHandler.handleError(res, error, 'BOT_LIST_FAILED');
    }
  }

  /**
   * تفاصيل بوت واحد
   * GET /api/bot/:id
   */
  async getBot(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const botId = req.params.id;

      const bot = await botOrchestrator.getBotById(botId, userId);

      this.responseHandler.sendSuccess(
        res,
        'Bot fetched successfully',
        bot,
      );
    } catch (error) {
      this.errorHandler.handleError(res, error, 'BOT_GET_FAILED');
    }
  }

  /**
   * إنشاء بوت جديد (لا يشغّله تلقائيًا)
   * POST /api/bot
   */
  async createBot(req, res) {
    try {
      if (!Bot) throw new Error('Bot model not available');

      const userId = req.user?.id || req.user?._id;
      const {
        name,
        symbol,
        exchange,
        strategyKey,
        description,
        tags,
      } = req.body;

      const bot = await Bot.create({
        owner: userId,
        name,
        symbol,
        exchange,
        strategyKey,
        description,
        tags,
        status: 'idle',
      });

      this.responseHandler.sendSuccess(
        res,
        'Bot created successfully',
        bot,
      );
    } catch (error) {
      this.errorHandler.handleError(
        res,
        error,
        'BOT_CREATE_FAILED',
      );
    }
  }

  /**
   * تشغيل البوت
   * POST /api/bot/:id/start
   */
  async startBot(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const botId = req.params.id;
      const configOverrides = req.body || {};

      const result = await botOrchestrator.startBot(botId, {
        userId,
        tenantId: req.user?.tenantId,
        ...configOverrides,
      });

      this.responseHandler.sendSuccess(
        res,
        'Bot started successfully',
        result,
      );
    } catch (error) {
      this.errorHandler.handleError(
        res,
        error,
        'BOT_START_FAILED',
      );
    }
  }

  /**
   * إيقاف مؤقت
   * POST /api/bot/:id/pause
   */
  async pauseBot(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const botId = req.params.id;

      const result = await botOrchestrator.pauseBot(botId, {
        userId,
        tenantId: req.user?.tenantId,
      });

      this.responseHandler.sendSuccess(
        res,
        'Bot paused successfully',
        result,
      );
    } catch (error) {
      this.errorHandler.handleError(
        res,
        error,
        'BOT_PAUSE_FAILED',
      );
    }
  }

  /**
   * إيقاف كامل
   * POST /api/bot/:id/stop
   */
  async stopBot(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const botId = req.params.id;

      const result = await botOrchestrator.stopBot(botId, {
        userId,
        tenantId: req.user?.tenantId,
      });

      this.responseHandler.sendSuccess(
        res,
        'Bot stopped successfully',
        result,
      );
    } catch (error) {
      this.errorHandler.handleError(
        res,
        error,
        'BOT_STOP_FAILED',
      );
    }
  }

  /**
   * إيقاف طارئ
   * POST /api/bot/:id/emergency-stop
   */
  async emergencyStop(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const botId = req.params.id;

      const result = await botOrchestrator.emergencyStop(botId, {
        userId,
        tenantId: req.user?.tenantId,
      });

      this.responseHandler.sendSuccess(
        res,
        'Bot emergency-stopped successfully',
        result,
      );
    } catch (error) {
      this.errorHandler.handleError(
        res,
        error,
        'BOT_EMERGENCY_STOP_FAILED',
      );
    }
  }

  /**
   * تحديث إعدادات البوت
   * PUT /api/bot/:id/settings
   */
  async updateSettings(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const botId = req.params.id;
      const config = req.body || {};

      const result = await botOrchestrator.updateBotConfig(
        botId,
        config,
        {
          userId,
          tenantId: req.user?.tenantId,
        },
      );

      this.responseHandler.sendSuccess(
        res,
        'Bot settings updated successfully',
        result,
      );
    } catch (error) {
      this.errorHandler.handleError(
        res,
        error,
        'BOT_SETTINGS_UPDATE_FAILED',
      );
    }
  }

  /**
   * Metrics للبوت: حالة من Python + تداولات من DB
   * GET /api/bot/:id/metrics
   */
  async getMetrics(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const botId = req.params.id;

      const result = await botOrchestrator.getBotMetrics(botId, {
        userId,
        tenantId: req.user?.tenantId,
      });

      this.responseHandler.sendSuccess(
        res,
        'Bot metrics fetched successfully',
        result,
      );
    } catch (error) {
      this.errorHandler.handleError(
        res,
        error,
        'BOT_METRICS_FAILED',
      );
    }
  }
}

module.exports = new BotController();
