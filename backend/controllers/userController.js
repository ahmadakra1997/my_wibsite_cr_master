const BotCreatorService = require('../services/botCreator');

// تحديث بيانات المستخدم بإضافة API Keys
const updateUserApiKeys = async (req, res) => {
  try {
    const userId = req.user.id;
    const { platform, apiKey, secretKey } = req.body;
    
    const user = await User.findById(userId);
    const userPlan = user.subscriptionPlan;
    const planSettings = BotCreatorService.getTradingSettings(userPlan);
    
    // التحقق من الصلاحيات حسب الخطة
    if (!planSettings.allowedExchanges.includes(platform)) {
      return res.status(403).json({
        message: `خطة ${userPlan} لا تدعم منصة ${platform}`
      });
    }
    
    // تحديث المفاتيح
    user.apiKeys[platform] = { apiKey, secretKey };
    await user.save();
    
    res.json({ message: 'تم تحديث المفاتيح بنجاح' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// تفعيل البوت بعد الدفع
const activateUserBot = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (user.paymentStatus !== 'completed') {
      return res.status(400).json({ message: 'يجب إكمال عملية الدفع أولاً' });
    }
    
    // إنشاء البوت التلقائي
    const botData = await BotCreatorService.createUserBot(userId, user);
    
    // حفظ بيانات البوت في المستخدم
    user.tradingBotUrl = botData.botUrl;
    user.telegramBotToken = botData.botToken;
    user.createdBots.push({
      botName: `${user.username}_trading_bot`,
      botUrl: botData.botUrl
    });
    
    await user.save();
    
    res.json({
      message: 'تم إنشاء بوت التداول بنجاح',
      botUrl: botData.botUrl,
      botConfig: botData.botConfig
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
