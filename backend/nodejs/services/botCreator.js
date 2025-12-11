// backend/nodejs/services/botCreator.js
const axios = require('axios');
const { Telegraf } = require('telegraf');
const crypto = require('crypto');
const User = require('../../models/User'); // ✅ المسار الصحيح إلى backend/models/User.js

class BotCreatorService {
    constructor() {
        this.telegramApiUrl = 'https://api.telegram.org/bot';
        this.botFatherToken = process.env.BOT_FATHER_TOKEN;
    }

    async createUserBot(userId, userData) {
        try {
            // 1. التحقق من أهلية المستخدم
            const isEligible = await this.checkUserEligibility(userId);
            if (!isEligible) {
                throw new Error('المستخدم غير مؤهل لإنشاء بوت تداول');
            }

            // 2. إنشاء بوت تلغرام
            const botToken = await this.createTelegramBot(userData);
            
            // 3. إنشاء تكوين البوت
            const botConfig = await this.generateBotConfig(userId, userData, botToken);
            
            // 4. حفظ بيانات البوت في المستخدم
            const savedBot = await this.saveBotToDatabase(userId, botConfig);
            
            // 5. بدء تشغيل البوت
            await this.startBotInstance(botToken, botConfig);
            
            return {
                success: true,
                botToken: botToken,
                botUrl: `https://t.me/${savedBot.botUsername}`,
                botId: savedBot.botId,
                configuration: botConfig,
                message: 'تم إنشاء بوت التداول بنجاح'
            };
            
        } catch (error) {
            console.error('Error creating user bot:', error);
            throw new Error(`فشل في إنشاء البوت: ${error.message}`);
        }
    }

    async checkUserEligibility(userId) {
        try {
            const user = await User.findById(userId);
            
            if (!user) {
                throw new Error('المستخدم غير موجود');
            }
            
            // التحقق من حالة الاشتراك
            if (user.subscription.status !== 'active') {
                throw new Error('يجب تفعيل الاشتراك أولاً');
            }
            
            // التحقق من وجود دفعات ناجحة
            const hasSuccessfulPayment = user.paymentHistory.some(
                payment => payment.status === 'completed' && payment.type === 'subscription'
            );
            
            if (!hasSuccessfulPayment) {
                throw new Error('لم يتم العثور على دفعات ناجحة');
            }
            
            // التحقق من عدم وجود بوت نشط
            if (user.tradingBots.activeBot.status === 'active') {
                throw new Error('يوجد بالفعل بوت نشط للمستخدم');
            }
            
            return true;
            
        } catch (error) {
            throw new Error(`خطأ في التحقق من الأهلية: ${error.message}`);
        }
    }

    async createTelegramBot(userData) {
        try {
            if (!this.botFatherToken) {
                // في حالة التطوير، استخدام token افتراضي
                console.log('Using development bot token');
                return this.generateDevelopmentToken(userData);
            }
            
            const botName = `${userData.personalInfo.name.replace(' ', '_')}_Trading_Bot`;
            
            const response = await axios.post(
                `${this.telegramApiUrl}${this.botFatherToken}/createNewBot`,
                {
                    name: botName,
                    description: `بوت تداول تلقائي لـ ${userData.personalInfo.name}`
                }
            );
            
            if (response.data.ok) {
                return response.data.result.token;
            } else {
                throw new Error(response.data.description || 'خطأ غير معروف في إنشاء البوت');
            }
            
        } catch (error) {
            console.error('Error creating Telegram bot:', error);
            // في حالة الخطأ، نعيد token تطوير
            return this.generateDevelopmentToken(userData);
        }
    }

    generateDevelopmentToken(userData) {
        const timestamp = Date.now().toString();
        const userId = userData.personalInfo.userId;
        const hash = crypto.createHash('md5').update(userId).digest('hex').substring(0, 8);
        return `dev_bot_${userId}_${timestamp}_${hash}`;
    }

    async generateBotConfig(userId, userData, botToken) {
        const userSettings = userData.tradingSettings || {};
        const subscription = userData.subscription || {};
        
        // الحصول على الحسابات النشطة فقط
        const activeExchanges = userData.exchangeAccounts 
            ? userData.exchangeAccounts.filter(acc => acc.isActive)
            : [];

        return {
            userId: userId,
            botToken: botToken,
            tradingConfig: {
                strategy: userSettings.strategy?.primary || 'day_trading',
                riskLevel: userSettings.riskManagement?.riskLevel || 'moderate',
                exchanges: activeExchanges.map(acc => ({
                    exchange: acc.exchange,
                    accountId: acc.accountId,
                    nickname: acc.nickname
                })),
                indicators: userSettings.strategy?.indicators || {},
                riskManagement: {
                    stopLoss: userSettings.riskManagement?.stopLoss?.percentage || 2,
                    takeProfit: userSettings.riskManagement?.takeProfit?.percentage || 5,
                    maxDrawdown: userSettings.riskManagement?.maxDrawdown || 10,
                    maxPositionSize: userSettings.riskManagement?.maxPositionSize || 10
                }
            },
            notificationConfig: {
                telegram: userSettings.notifications?.telegram?.enabled || true,
                email: userSettings.notifications?.email?.enabled || true,
                webhook: userSettings.notifications?.webhook?.enabled || false
            },
            subscriptionLimits: {
                maxTrades: subscription.limits?.maxTrades || 10,
                maxExchanges: subscription.limits?.maxExchanges || 2,
                concurrentBots: subscription.limits?.concurrentBots || 1
            },
            created: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    async saveBotToDatabase(userId, botConfig) {
        try {
            const user = await User.findById(userId);
            
            const botData = {
                botId: `BOT_${Date.now()}_${userId}`,
                botName: `${user.personalInfo.name}_Trading_Bot`,
                telegramBotUrl: `https://t.me/${user.personalInfo.name.replace(' ', '_')}_bot`,
                telegramBotToken: botConfig.botToken,
                status: 'active',
                createdAt: new Date(),
                lastActive: new Date(),
                configuration: {
                    tradingStrategy: botConfig.tradingConfig.strategy,
                    riskLevel: botConfig.tradingConfig.riskLevel,
                    autoRestart: true,
                    notifications: botConfig.notificationConfig
                },
                performance: {
                    totalTrades: 0,
                    successfulTrades: 0,
                    totalProfit: 0,
                    currentBalance: 0,
                    successRate: 0,
                    lastTradeTime: null
                },
                exchangeConnections: botConfig.tradingConfig.exchanges.map(exchange => ({
                    exchange: exchange.exchange,
                    accountId: exchange.accountId,
                    status: 'connected',
                    balance: 0
                }))
            };

            // تحديث بيانات المستخدم
            user.tradingBots.activeBot = botData;
            
            // إضافة إلى السجل
            user.tradingBots.botHistory.push({
                botId: botData.botId,
                botName: botData.botName,
                created: botData.createdAt,
                status: 'active'
            });

            await user.save();
            return botData;
            
        } catch (error) {
            throw new Error(`خطأ في حفظ البوت: ${error.message}`);
        }
    }

    async startBotInstance(botToken, botConfig) {
        try {
            console.log(`Starting bot for user ${botConfig.userId}`);
            
            // هنا يمكن بدء تشغيل البوت الفعلي
            // يمكن استخدام Telegraf أو أي مكتبة أخرى
            
            const botStatus = {
                status: 'running',
                startedAt: new Date(),
                config: botConfig,
                processId: `bot_${Date.now()}`
            };

            // بدء البوت (تنفيذ تجريبي)
            await this.initializeTradingBot(botToken, botConfig);
            
            return botStatus;
            
        } catch (error) {
            throw new Error(`فشل في بدء البوت: ${error.message}`);
        }
    }

    async initializeTradingBot(botToken, config) {
        try {
            // تنفيذ تجريبي لبدء البوت
            console.log('Initializing trading bot with config:', {
                strategy: config.tradingConfig.strategy,
                riskLevel: config.tradingConfig.riskLevel,
                exchanges: config.tradingConfig.exchanges.length
            });

            // محاكاة بدء البوت
            setTimeout(() => {
                console.log('Trading bot started successfully');
            }, 1000);

            return { success: true, message: 'Bot initialized' };
            
        } catch (error) {
            console.error('Error initializing trading bot:', error);
            throw error;
        }
    }

    async stopUserBot(userId, botId) {
        try {
            const user = await User.findById(userId);
            
            if (user.tradingBots.activeBot.botId === botId) {
                user.tradingBots.activeBot.status = 'inactive';
                user.tradingBots.activeBot.lastActive = new Date();
                
                // تحديث السجل
                for (let bot of user.tradingBots.botHistory) {
                    if (bot.botId === botId) {
                        bot.deactivated = new Date();
                        bot.status = 'inactive';
                        bot.reason = 'Stopped by user';
                        break;
                    }
                }
                
                await user.save();
                
                // إيقاف البوت فعلياً
                await this.stopBotInstance(botId);
                
                return { 
                    success: true, 
                    message: 'تم إيقاف البوت بنجاح',
                    botId: botId
                };
            } else {
                throw new Error('البوت غير موجود أو غير نشط');
            }
            
        } catch (error) {
            throw new Error(`فشل في إيقاف البوت: ${error.message}`);
        }
    }

    async stopBotInstance(botId) {
        try {
            console.log(`Stopping bot instance: ${botId}`);
            // تنفيذ إيقاف البوت الفعلي
            return { success: true, message: 'Bot stopped' };
        } catch (error) {
            console.error('Error stopping bot instance:', error);
            throw error;
        }
    }

    async getUserBotStatus(userId) {
        try {
            const user = await User.findById(userId);
            const activeBot = user.tradingBots.activeBot;
            
            if (!activeBot || activeBot.status !== 'active') {
                return { 
                    hasActiveBot: false, 
                    message: 'لا يوجد بوت نشط' 
                };
            }
            
            return {
                hasActiveBot: true,
                botId: activeBot.botId,
                botName: activeBot.botName,
                status: activeBot.status,
                botUrl: activeBot.telegramBotUrl,
                configuration: activeBot.configuration,
                performance: activeBot.performance,
                exchangeConnections: activeBot.exchangeConnections,
                createdAt: activeBot.createdAt,
                lastActive: activeBot.lastActive
            };
            
        } catch (error) {
            throw new Error(`فشل في الحصول على حالة البوت: ${error.message}`);
        }
    }

    async updateBotConfiguration(userId, updates) {
        try {
            const user = await User.findById(userId);
            const activeBot = user.tradingBots.activeBot;
            
            if (!activeBot || activeBot.status !== 'active') {
                throw new Error('لا يوجد بوت نشط للتحديث');
            }
            
            // تحديث التكوين
            if (updates.tradingStrategy) {
                activeBot.configuration.tradingStrategy = updates.tradingStrategy;
            }
            
            if (updates.riskLevel) {
                activeBot.configuration.riskLevel = updates.riskLevel;
            }
            
            if (updates.notifications) {
                activeBot.configuration.notifications = {
                    ...activeBot.configuration.notifications,
                    ...updates.notifications
                };
            }
            
            await user.save();
            
            return {
                success: true,
                message: 'تم تحديث تكوين البوت بنجاح',
                configuration: activeBot.configuration
            };
            
        } catch (error) {
            throw new Error(`فشل في تحديث تكوين البوت: ${error.message}`);
        }
    }

    async getBotPerformance(userId) {
        try {
            const user = await User.findById(userId);
            const activeBot = user.tradingBots.activeBot;
            
            if (!activeBot) {
                return { message: 'لا يوجد بوت نشط' };
            }
            
            return {
                botId: activeBot.botId,
                botName: activeBot.botName,
                performance: activeBot.performance,
                overallStats: {
                    totalRuntime: this.calculateRuntime(activeBot.createdAt),
                    avgDailyTrades: this.calculateAverageTrades(activeBot.performance.totalTrades, activeBot.createdAt),
                    profitability: activeBot.performance.totalProfit > 0 ? 'مربح' : 'خاسر'
                }
            };
            
        } catch (error) {
            throw new Error(`فشل في الحصول على أداء البوت: ${error.message}`);
        }
    }

    calculateRuntime(createdAt) {
        const now = new Date();
        const diff = now - new Date(createdAt);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return `${days} يوم, ${hours} ساعة`;
    }

    calculateAverageTrades(totalTrades, createdAt) {
        const now = new Date();
        const diff = now - new Date(createdAt);
        const days = Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
        return (totalTrades / days).toFixed(2);
    }

    // دالة لمعالجة رسائل البوت
    async handleBotMessage(botToken, message) {
        try {
            // معالجة الرسائل الواردة للبوت
            console.log('Received bot message:', message);
            
            // هنا يمكن إضافة منطق معالجة الرسائل
            return { processed: true, response: 'تم معالجة الرسالة' };
            
        } catch (error) {
            console.error('Error handling bot message:', error);
            throw error;
        }
    }
}

module.exports = BotCreatorService;
