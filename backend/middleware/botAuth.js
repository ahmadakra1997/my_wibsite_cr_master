// backend/middleware/botAuth.js - وساطة أمان مخصصة للبوت
const User = require('../models/User');

const botAuth = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // التحقق من أن المستخدم لديه بوت نشط
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        // التحقق من أن البوت نشط للعمليات الحساسة
        if (req.method !== 'GET' && user.tradingBots.activeBot.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'البوت غير نشط'
            });
        }

        // إضافة معلومات البوت إلى الطلب
        req.bot = user.tradingBots.activeBot;
        next();

    } catch (error) {
        console.error('Bot auth error:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في التحقق من صلاحيات البوت'
        });
    }
};

module.exports = botAuth;
