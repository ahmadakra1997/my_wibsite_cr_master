// backend/controllers/botController.js
const BotCreatorService = require('../services/botCreator');
const User = require('../models/User');

class BotController {
    constructor() {
        this.botService = new BotCreatorService();
    }

    // تفعيل البوت التلقائي للمستخدم
    activateBot = async (req, res) => {
        try {
            const userId = req.user.id;
            
            // جلب بيانات المستخدم الكاملة
            const user = await User.findById(userId)
                .populate('exchangeAccounts')
                .select('+tradingBots.activeBot.telegramBotToken');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'المستخدم غير موجود'
                });
            }

            // التحقق من حالة الاشتراك
            if (user.subscription.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'يجب تفعيل الاشتراك أولاً قبل إنشاء البوت'
                });
            }

            // التحقق من وجود بوت نشط مسبقاً
            if (user.tradingBots.activeBot.status === 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'يوجد بوت نشط بالفعل للمستخدم'
                });
            }

            // إنشاء البوت التلقائي
            const result = await this.botService.createUserBot(userId, user.toObject());

            res.status(201).json({
                success: true,
                message: 'تم إنشاء بوت التداول بنجاح',
                data: result
            });

        } catch (error) {
            console.error('Error activating bot:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'فشل في إنشاء البوت',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    };

    // الحصول على حالة البوت
    getBotStatus = async (req, res) => {
        try {
            const userId = req.user.id;
            
            const status = await this.botService.getUserBotStatus(userId);

            res.json({
                success: true,
                data: status
            });

        } catch (error) {
            console.error('Error getting bot status:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'فشل في الحصول على حالة البوت'
            });
        }
    };

    // إيقاف البوت
    stopBot = async (req, res) => {
        try {
            const userId = req.user.id;
            const { botId } = req.body;

            if (!botId) {
                return res.status(400).json({
                    success: false,
                    message: 'معرف البوت مطلوب'
                });
            }

            const result = await this.botService.stopUserBot(userId, botId);

            res.json({
                success: true,
                message: result.message,
                data: result
            });

        } catch (error) {
            console.error('Error stopping bot:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'فشل في إيقاف البوت'
            });
        }
    };

    // تحديث تكوين البوت
    updateBotConfig = async (req, res) => {
        try {
            const userId = req.user.id;
            const updates = req.body;

            const result = await this.botService.updateBotConfiguration(userId, updates);

            res.json({
                success: true,
                message: result.message,
                data: result
            });

        } catch (error) {
            console.error('Error updating bot config:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'فشل في تحديث تكوين البوت'
            });
        }
    };

    // الحصول على أداء البوت
    getBotPerformance = async (req, res) => {
        try {
            const userId = req.user.id;

            const performance = await this.botService.getBotPerformance(userId);

            res.json({
                success: true,
                data: performance
            });

        } catch (error) {
            console.error('Error getting bot performance:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'فشل في الحصول على أداء البوت'
            });
        }
    };

    // إعادة تشغيل البوت
    restartBot = async (req, res) => {
        try {
            const userId = req.user.id;
            const { botId } = req.body;

            // أولاً إيقاف البوت
            await this.botService.stopUserBot(userId, botId);

            // ثم جلب بيانات المستخدم وإنشاء بوت جديد
            const user = await User.findById(userId);
            const result = await this.botService.createUserBot(userId, user.toObject());

            res.json({
                success: true,
                message: 'تم إعادة تشغيل البوت بنجاح',
                data: result
            });

        } catch (error) {
            console.error('Error restarting bot:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'فشل في إعادة تشغيل البوت'
            });
        }
    };

    // الحصول على سجل البوتات
    getBotHistory = async (req, res) => {
        try {
            const userId = req.user.id;
            
            const user = await User.findById(userId);
            const history = user.tradingBots.botHistory;

            res.json({
                success: true,
                data: {
                    history: history,
                    totalBots: history.length,
                    activeBots: history.filter(bot => bot.status === 'active').length
                }
            });

        } catch (error) {
            console.error('Error getting bot history:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'فشل في الحصول على سجل البوتات'
            });
        }
    };

    // تحديث إعدادات البوت العامة
    updateBotSettings = async (req, res) => {
        try {
            const userId = req.user.id;
            const { autoCreate, defaultStrategy, riskManagement } = req.body;

            const user = await User.findById(userId);
            
            if (autoCreate !== undefined) {
                user.tradingBots.botSettings.autoCreate = autoCreate;
            }
            
            if (defaultStrategy) {
                user.tradingBots.botSettings.defaultStrategy = defaultStrategy;
            }
            
            if (riskManagement) {
                user.tradingBots.botSettings.riskManagement = {
                    ...user.tradingBots.botSettings.riskManagement,
                    ...riskManagement
                };
            }

            await user.save();

            res.json({
                success: true,
                message: 'تم تحديث إعدادات البوت بنجاح',
                data: user.tradingBots.botSettings
            });

        } catch (error) {
            console.error('Error updating bot settings:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'فشل في تحديث إعدادات البوت'
            });
        }
    };

    // فحص أهلية إنشاء البوت
    checkEligibility = async (req, res) => {
        try {
            const userId = req.user.id;

            const isEligible = await this.botService.checkUserEligibility(userId);

            res.json({
                success: true,
                data: {
                    eligible: isEligible,
                    message: isEligible ? 'المستخدم مؤهل لإنشاء البوت' : 'المستخدم غير مؤهل لإنشاء البوت'
                }
            });

        } catch (error) {
            res.json({
                success: true,
                data: {
                    eligible: false,
                    message: error.message
                }
            });
        }
    };
}

module.exports = new BotController();
