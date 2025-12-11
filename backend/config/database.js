const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/my_website';

  try {
    // الاتصال بقاعدة البيانات
    const conn = await mongoose.connect(mongoURI, {
      // هذه الخيارات لم تعد ضرورية في الإصدارات الحديثة
      // لكن تركناها للتوافق إن لم تسبب مشاكل
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);

    // في بيئة الإنتاج: أوقف السيرفر (سلوك آمن)
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '🚫 NODE_ENV=production → إيقاف السيرفر بسبب فشل الاتصال بقاعدة البيانات'
      );
      process.exit(1);
    }

    // في بيئة التطوير: لا توقف السيرفر، فقط اعمل تحذير
    console.warn(
      '⚠️ MongoDB غير متصلة. يتم المتابعة بدون قاعدة بيانات (وضع التطوير فقط).'
    );
  }
};

module.exports = connectDB;
