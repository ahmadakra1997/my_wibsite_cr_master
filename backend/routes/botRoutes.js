// backend/routes/botRoutes.js
// راوتر مخصص لنظام البوت – مصمم ليكون متوافقاً مع خدمة botCreator الحالية
// بدون أن نغيّر منطقها الداخلي، فقط نلفّه بدوال Express صحيحة.

const express = require('express');
const router = express.Router();

let BotCreatorService = {};
try {
  BotCreatorService = require('../services/botCreator');
  console.log('✅ BotCreatorService تم تحميله في routes/botRoutes.js');
} catch (err) {
  console.warn('⚠️ لم يتم تحميل BotCreatorService في routes/botRoutes.js:', err.message);
  BotCreatorService = {};
}

/**
 * Helper عام يستدعي أنسب دالة متاحة من خدمة البوت
 * بدون افتراض شكل واحد ثابت للملف القديم.
 *
 * - لو الملف نفسه دالة → نستدعيها مباشرة كـ middleware.
 * - لو يحتوي على دوال بأسماء مختلفة → نحاول مجموعة أسماء محتملة.
 * - لو لم نجد شيء → نرجّع 501 بدون أن نكسر السيرفر.
 */
function resolveBotHandler(possibleNames, routeLabel) {
  return async (req, res, next) => {
    try {
      // لو الموديول نفسه دالة (كان يُستخدم مباشرة كـ middleware)
      if (typeof BotCreatorService === 'function') {
        return BotCreatorService(req, res, next);
      }

      // جرّب أسماء دوال متوقعة (createBotForUser, activateBot, controlBot, ...)
      for (const name of possibleNames) {
        const candidate = BotCreatorService[name];
        if (typeof candidate === 'function') {
          // نحافظ على this لو كانت دالة داخل class
          return candidate.call(BotCreatorService, req, res, next);
        }
      }

      console.warn(
        `[botRoutes] ⚠️ لم يتم العثور على أي handler من [${possibleNames.join(
          ', ',
        )}] للمسار ${routeLabel}`,
      );

      return res.status(501).json({
        error: 'وظيفة البوت غير متوفّرة حالياً على الخادم',
        code: 'BOT_HANDLER_NOT_IMPLEMENTED',
        route: routeLabel,
      });
    } catch (error) {
      console.error(`[botRoutes] ❌ خطأ أثناء تنفيذ ${routeLabel}:`, error);
      return res.status(500).json({
        error: 'خطأ داخلي أثناء تنفيذ عملية البوت',
        code: 'BOT_HANDLER_ERROR',
        route: routeLabel,
      });
    }
  };
}

// 🩺 Health check خاص بنظام البوت
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'bot',
    hasService: !!BotCreatorService,
    timestamp: new Date().toISOString(),
  });
});

// 🤖 تفعيل / إنشاء أو تحديث بوت للمستخدم
// يتوافق مع أسماء محتملة في خدمة البوت: activateBot, createOrUpdateBot, createBotForUser
router.post(
  '/activate',
  resolveBotHandler(
    ['activateBot', 'createOrUpdateBot', 'createBotForUser'],
    'POST /api/bot/activate',
  ),
);

// 📊 حالة البوت / البوتات للمستخدم
router.get(
  '/status',
  resolveBotHandler(
    ['getBotStatus', 'getUserBotStatus', 'getUserBots'],
    'GET /api/bot/status',
  ),
);

// 🎮 التحكم في البوت (إيقاف، تشغيل، تعديل إعدادات…)
router.post(
  '/control',
  resolveBotHandler(
    ['controlBot', 'updateBotControl', 'handleBotControl'],
    'POST /api/bot/control',
  ),
);

// 📨 Webhook للبوت (في حال كان موجود في الخدمة)
router.post(
  '/webhook',
  resolveBotHandler(
    ['handleWebhook', 'botWebhookHandler'],
    'POST /api/bot/webhook',
  ),
);

module.exports = router;
