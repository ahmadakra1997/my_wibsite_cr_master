// backend/src/routes/engine.js
// مسارات تكامل Python Trading Engine من خلال Node.js

const express = require('express');
const router = express.Router();
const engineController = require('../controllers/engine/engineController');

// لو عندك middleware جاهز للمصادقة/الصلاحيات استورده هنا
let authenticateToken;
let authorizeBotAccess;

try {
  // نفس النمط المستعمل في bot.js
  const authMiddleware = require('../middleware/authMiddleware');
  authenticateToken = authMiddleware.authenticateToken;
  authorizeBotAccess = authMiddleware.authorizeBotAccess;
} catch (e) {
  // في حالة عدم توفره في هذا الهيكل الحالي، يمكن إضافته لاحقاً
  authenticateToken = (req, res, next) => next();
  authorizeBotAccess = (req, res, next) => next();
}

// 🔐 حماية المسارات الأساسية
router.use(authenticateToken);
router.use(authorizeBotAccess);

// 🩺 صحة الـ engine
router.get('/health', engineController.getHealth.bind(engineController));

// 📊 حالة الـ engine / البوتات من منظور Python
router.get('/status', engineController.getStatus.bind(engineController));

// 🧪 Backtest
router.post('/backtest', engineController.runBacktest.bind(engineController));

// 🧬 اختبار إشارة (Debug / Internal)
router.post('/signal-test', engineController.testSignal.bind(engineController));

module.exports = router;
