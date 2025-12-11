// backend/routes/users.js
// ✅ راوتر مستخدمين آمن – يضمن دائماً إرسال callback دوال لـ Express
const express = require('express');
const router = express.Router();

let userController = {};

try {
    userController = require('../controllers/userController');
    console.log('✅ userController تم تحميله في routes/users.js');
} catch (err) {
    console.warn('⚠️ لم يتم تحميل userController في routes/users.js:', err.message);
    userController = {};
}

/**
 * helper لتغليف أي handler باسم داخل userController
 * إذا لم نجد الدالة، نرجع callback لا يكسر السيرفر ويعطي 501 فقط.
 */
function useHandler(handlerName, method, path) {
    const handler = userController && userController[handlerName];

    if (typeof handler === 'function') {
        // نرجّع نفس الدالة بدون تغيير منطقها
        return (req, res, next) => handler(req, res, next);
    }

    console.warn(
        `[users.js] ⚠️ لم يتم العثور على handler "${handlerName}" في userController لمسار ${method} ${path}`
    );

    return (req, res) => {
        res.status(501).json({
            error: `Handler "${handlerName}" غير مُنفّذ حالياً في userController`,
            code: 'NOT_IMPLEMENTED',
            route: req.originalUrl
        });
    };
}

// 🔹 Health check لمسارات المستخدمين
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'users',
        timestamp: new Date().toISOString()
    });
});

// 🔹 ملف المستخدم الحالي (إن كانت موجودة في userController)
router.get('/me', useHandler('getCurrentUser', 'GET', '/me'));
router.put('/me', useHandler('updateProfile', 'PUT', '/me'));

// 🔹 تفضيلات المستخدم
router.post('/preferences', useHandler('updatePreferences', 'POST', '/preferences'));

// 🔹 مسارات البوت للمستخدم (تستخدم نظام البوت الحالي بدون تغيير المنطق)
router.get('/bots', useHandler('getUserBots', 'GET', '/bots'));
router.post('/bots', useHandler('createOrUpdateBot', 'POST', '/bots'));
router.post('/bots/:id/control', useHandler('controlBot', 'POST', '/bots/:id/control'));

// مهم: لو عندك دوال بأسماء مختلفة في userController
// فقط عدّل أسماء handlerName في useHandler أعلاه لتطابق أسماءك الأصلية.

module.exports = router;
