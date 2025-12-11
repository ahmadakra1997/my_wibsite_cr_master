// backend/src/controllers/engine/engineController.js
// متحكم الطبقة الوسيطة بين Node.js و Python Trading Engine
// لا يلمس منطق التداول، فقط يستدعي pythonEngineClient ويرجع نتائج منظمة

const pythonEngineClient = require('../../services/pythonEngineClient');

let ResponseHandler;
let ErrorHandler;
let logger;

// نحاول استخدام utils لو موجودة، وإلا ن fallback على console بسيط
try {
  ResponseHandler = require('../../utils/responseHandler');
  ErrorHandler = require('../../utils/errorHandler');
  logger = require('../../utils/logger');
} catch (e) {
  logger = console;
}

class EngineController {
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
            logger.error('[EngineController] Error:', error);
            res.status(error.status || 500).json({
              success: false,
              code: code || error.code || 'ENGINE_ERROR',
              message: error.message || 'Engine request failed',
              details: error.details || null,
            });
          },
        };
  }

  /**
   * فحص الصحة العامة للـ engine
   * GET /api/engine/health
   */
  async getHealth(req, res) {
    try {
      const health = await pythonEngineClient.getHealth();
      this.responseHandler.sendSuccess(
        res,
        'Python trading engine health fetched successfully',
        health,
      );
    } catch (error) {
      this.errorHandler.handleError(res, error, 'ENGINE_HEALTH_FAILED');
    }
  }

  /**
   * حالة التشغيل للـ engine / البوتات من منظور Python
   * GET /api/engine/status
   */
  async getStatus(req, res) {
    try {
      const status = await pythonEngineClient.getStatus();
      this.responseHandler.sendSuccess(
        res,
        'Python trading engine status fetched successfully',
        status,
      );
    } catch (error) {
      this.errorHandler.handleError(res, error, 'ENGINE_STATUS_FAILED');
    }
  }

  /**
   * تشغيل Backtest من Python
   * POST /api/engine/backtest
   * body: { strategy, symbol, timeframe, capital, from, to, ... }
   */
  async runBacktest(req, res) {
    try {
      const params = req.body || {};
      const result = await pythonEngineClient.backtest(params);

      this.responseHandler.sendSuccess(
        res,
        'Backtest executed successfully',
        result,
      );
    } catch (error) {
      this.errorHandler.handleError(res, error, 'ENGINE_BACKTEST_FAILED');
    }
  }

  /**
   * اختبار سريع لإشارة واحدة من الـ engine (للاستعمال الداخلي)
   * POST /api/engine/signal-test
   */
  async testSignal(req, res) {
    try {
      const payload = req.body || {};
      const signal = await pythonEngineClient.requestSignals(payload);

      this.responseHandler.sendSuccess(
        res,
        'Signal fetched successfully from Python engine',
        signal,
      );
    } catch (error) {
      this.errorHandler.handleError(res, error, 'ENGINE_SIGNAL_TEST_FAILED');
    }
  }
}

module.exports = new EngineController();
