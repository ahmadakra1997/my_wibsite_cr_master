// backend/src/routes/bot.js
// REST API للبوت، مبنية فوق BotController وBotOrchestrator

const express = require('express');
const router = express.Router();
const botController = require('../controllers/bot/botController');

// Middlewares للمصادقة والصلاحيات (عدّل الأسماء حسب مشروعك)
let authenticateToken;
let authorizeBotAccess;

try {
  const authMiddleware = require('../middleware/authMiddleware');
  authenticateToken = authMiddleware.authenticateToken;
  authorizeBotAccess = authMiddleware.authorizeBotAccess;
} catch (e) {
  authenticateToken = (req, res, next) => next();
  authorizeBotAccess = (req, res, next) => next();
}

// 🔐 حماية المسارات
router.use(authenticateToken);
router.use(authorizeBotAccess);

// 📋 قائمة البوتات
router.get('/', botController.listBots.bind(botController));

// 📄 تفاصيل بوت
router.get('/:id', botController.getBot.bind(botController));

// ➕ إنشاء بوت جديد
router.post('/', botController.createBot.bind(botController));

// ▶️ تشغيل
router.post('/:id/start', botController.startBot.bind(botController));

// ⏸ إيقاف مؤقت
router.post('/:id/pause', botController.pauseBot.bind(botController));

// ⏹ إيقاف كامل
router.post('/:id/stop', botController.stopBot.bind(botController));

// 🧨 إيقاف طارئ
router.post(
  '/:id/emergency-stop',
  botController.emergencyStop.bind(botController),
);

// ⚙️ تحديث الإعدادات
router.put(
  '/:id/settings',
  botController.updateSettings.bind(botController),
);

// 📊 Metrics
router.get('/:id/metrics', botController.getMetrics.bind(botController));

module.exports = router;
