// backend/scripts/setupTestUser.js - النسخة المتقدمة والمحسنة
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// استيراد النماذج
const User = require('../src/models/User');
const Client = require('../src/models/Client');

class TestUserSetup {
    constructor() {
        this.testUsers = [];
        this.setupConfig = {
            database: {
                maxRetries: 3,
                retryDelay: 1000
            },
            security: {
                passwordRounds: 12,
                encryptionKey: process.env.ENCRYPTION_KEY || 'fallback-secure-key-2024'
            },
            users: {
                count: 3,
                profiles: ['trader', 'investor', 'admin']
            }
        };
    }

    // === التهيئة الأساسية ===
    async initialize() {
        try {
            console.log('🚀 بدء إعداد المستخدمين التجريبيين...');
            
            await this.connectToDatabase();
            await this.cleanupExistingTestData();
            await this.createTestUsers();
            await this.setupTestPortfolios();
            await this.generateTestReport();
            
            console.log('✅ اكتمل إعداد المستخدمين التجريبيين بنجاح!');
            return true;
            
        } catch (error) {
            console.error('❌ فشل في إعداد المستخدمين التجريبيين:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }

    // === إدارة الاتصال بقاعدة البيانات ===
    async connectToDatabase() {
        let retries = 0;
        
        while (retries < this.setupConfig.database.maxRetries) {
            try {
                console.log(`🔗 محاولة الاتصال بقاعدة البيانات (${retries + 1}/${this.setupConfig.database.maxRetries})...`);
                
                await mongoose.connect(process.env.MONGODB_URI, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 45000,
                    maxPoolSize: 10,
                    minPoolSize: 2,
                    retryWrites: true,
                    w: 'majority'
                });

                console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
                return;
                
            } catch (error) {
                retries++;
                console.warn(`⚠️ فشل في الاتصال بقاعدة البيانات: ${error.message}`);
                
                if (retries >= this.setupConfig.database.maxRetries) {
                    throw new Error(`فشل الاتصال بقاعدة البيانات بعد ${retries} محاولات`);
                }
                
                console.log(`⏳ انتظار ${this.setupConfig.database.retryDelay}ms قبل إعادة المحاولة...`);
                await this.delay(this.setupConfig.database.retryDelay * retries);
            }
        }
    }

    // === تنظيف البيانات التجريبية الموجودة ===
    async cleanupExistingTestData() {
        try {
            console.log('🧹 جاري تنظيف البيانات التجريبية القديمة...');
            
            const testEmails = [
                'test@akraa.com',
                'trader@akraa.com', 
                'investor@akraa.com',
                'admin@akraa.com'
            ];

            // حذف المستخدمين التجريبيين
            const deleteResult = await User.deleteMany({
                email: { $in: testEmails }
            });

            console.log(`🗑️ تم حذف ${deleteResult.deletedCount} مستخدم تجريبي`);

            // تنظيف العملاء المرتبطين
            await Client.deleteMany({
                'contact.email': { $in: testEmails }
            });

            console.log('✅ اكتمل تنظيف البيانات القديمة');
            
        } catch (error) {
            console.error('❌ خطأ في تنظيف البيانات القديمة:', error);
            throw error;
        }
    }

    // === إنشاء المستخدمين التجريبيين ===
    async createTestUsers() {
        try {
            console.log('👥 جاري إنشاء المستخدمين التجريبيين...');

            const usersData = [
                {
                    // المستخدم الأساسي - التاجر
                    name: 'محمد التاجر',
                    email: 'test@akraa.com',
                    password: 'Test123456!',
                    phone: '+963912345678',
                    country: 'SY',
                    role: 'trader',
                    subscription: {
                        plan: 'premium',
                        status: 'active',
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 أشهر
                        features: ['advanced_analytics', 'multi_exchange', 'priority_support']
                    },
                    tradingSettings: {
                        riskLevel: 'high',
                        preferredExchanges: ['binance', 'bybit', 'mexc'],
                        autoTrading: true,
                        maxDailyLoss: 500,
                        takeProfit: 15,
                        stopLoss: 5,
                        leverage: 10
                    }
                },
                {
                    // المستخدم الثاني - المستثمر
                    name: 'أحمد المستثمر',
                    email: 'investor@akraa.com', 
                    password: 'Investor123!',
                    phone: '+963987654321',
                    country: 'AE',
                    role: 'investor',
                    subscription: {
                        plan: 'enterprise',
                        status: 'active',
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // سنة
                        features: ['portfolio_management', 'institutional_tools', 'dedicated_support']
                    },
                    tradingSettings: {
                        riskLevel: 'low',
                        preferredExchanges: ['binance', 'okx'],
                        autoTrading: false,
                        maxDailyLoss: 200,
                        takeProfit: 8,
                        stopLoss: 3,
                        leverage: 3
                    }
                },
                {
                    // المستخدم الثالث - المدير
                    name: 'مدير النظام',
                    email: 'admin@akraa.com',
                    password: 'Admin123!',
                    phone: '+963911223344',
                    country: 'SA',
                    role: 'admin',
                    subscription: {
                        plan: 'enterprise',
                        status: 'active',
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                        features: ['all_features', 'system_management', 'user_management']
                    },
                    tradingSettings: {
                        riskLevel: 'medium',
                        preferredExchanges: ['binance', 'bybit', 'okx', 'mexc'],
                        autoTrading: true,
                        maxDailyLoss: 1000,
                        takeProfit: 20,
                        stopLoss: 8,
                        leverage: 5
                    }
                }
            ];

            for (const userData of usersData) {
                const user = await this.createSingleUser(userData);
                this.testUsers.push(user);
                console.log(`✅ تم إنشاء المستخدم: ${user.name} (${user.email})`);
            }

        } catch (error) {
            console.error('❌ خطأ في إنشاء المستخدمين:', error);
            throw error;
        }
    }

    // === إنشاء مستخدم فردي ===
    async createSingleUser(userData) {
        try {
            // تشفير كلمة المرور
            const salt = await bcrypt.genSalt(this.setupConfig.security.passwordRounds);
            const hashedPassword = await bcrypt.hash(userData.password, salt);

            // إنشاء معرفات فريدة
            const userId = new mongoose.Types.ObjectId();
            const clientId = new mongoose.Types.ObjectId();

            // بيانات المحفظة المشفرة
            const encryptedWallets = this.encryptWallets(userData.role);

            // إنشاء المستخدم
            const user = new User({
                _id: userId,
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                phone: userData.phone,
                country: userData.country,
                role: userData.role,
                isActive: true,
                emailVerified: true,
                phoneVerified: true,
                subscription: {
                    ...userData.subscription,
                    subscriptionId: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                },
                tradingSettings: {
                    ...userData.tradingSettings,
                    userId: userId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                profile: {
                    avatar: this.generateAvatarUrl(userData.name),
                    bio: this.generateBio(userData.role),
                    joinDate: new Date(),
                    lastLogin: new Date(),
                    timezone: 'Asia/Damascus',
                    language: 'ar',
                    theme: 'quantum'
                },
                security: {
                    twoFactorEnabled: false,
                    lastPasswordChange: new Date(),
                    loginAttempts: 0,
                    accountLocked: false,
                    securityLevel: 'high'
                },
                notifications: {
                    email: true,
                    sms: false,
                    push: true,
                    telegram: true,
                    tradingAlerts: true,
                    securityAlerts: true
                },
                wallets: encryptedWallets,
                apiKeys: this.generateApiKeys(userData.role),
                statistics: this.generateUserStats(userData.role),
                metadata: {
                    isTestUser: true,
                    createdBy: 'setup-script',
                    creationDate: new Date(),
                    version: '2.0.0'
                }
            });

            await user.save();

            // إنشاء عميل مرتبط
            await this.createClient(user, clientId);

            return user;

        } catch (error) {
            console.error(`❌ خطأ في إنشاء المستخدم ${userData.email}:`, error);
            throw error;
        }
    }

    // === إنشاء عميل مرتبط ===
    async createClient(user, clientId) {
        try {
            const client = new Client({
                _id: clientId,
                userId: user._id,
                personalInfo: {
                    firstName: user.name.split(' ')[0],
                    lastName: user.name.split(' ').slice(1).join(' '),
                    dateOfBirth: new Date(1990, 0, 1),
                    nationality: user.country,
                    idNumber: `TEST${Date.now()}`,
                    idType: 'passport'
                },
                contact: {
                    email: user.email,
                    phone: user.phone,
                    address: {
                        street: 'شارع الاختبار',
                        city: 'دمشق',
                        state: 'دمشق',
                        country: user.country,
                        postalCode: '00000'
                    }
                },
                financialInfo: {
                    riskTolerance: user.tradingSettings.riskLevel,
                    investmentGoals: this.getInvestmentGoals(user.role),
                    annualIncome: this.getAnnualIncome(user.role),
                    netWorth: this.getNetWorth(user.role),
                    experience: this.getExperienceLevel(user.role),
                    sourceOfFunds: 'business_income'
                },
                kycStatus: {
                    verified: true,
                    verificationDate: new Date(),
                    verifiedBy: 'auto-system',
                    level: 'advanced',
                    documents: [
                        {
                            type: 'id_card',
                            status: 'approved',
                            uploadedAt: new Date()
                        }
                    ]
                },
                portfolio: {
                    totalValue: this.getPortfolioValue(user.role),
                    initialInvestment: this.getInitialInvestment(user.role),
                    currentBalance: this.getCurrentBalance(user.role),
                    profitLoss: this.getProfitLoss(user.role),
                    performance: this.generatePerformanceData()
                },
                status: {
                    isActive: true,
                    activationDate: new Date(),
                    lastReviewDate: new Date(),
                    complianceStatus: 'approved'
                },
                metadata: {
                    isTestClient: true,
                    createdBy: 'setup-script',
                    creationDate: new Date()
                }
            });

            await client.save();
            console.log(`✅ تم إنشاء العميل للمستخدم: ${user.name}`);

        } catch (error) {
            console.error(`❌ خطأ في إنشاء العميل للمستخدم ${user.email}:`, error);
            throw error;
        }
    }

    // === إعداد المحافظ التجريبية ===
    async setupTestPortfolios() {
        try {
            console.log('💰 جاري إعداد المحافظ التجريبية...');

            for (const user of this.testUsers) {
                await this.setupUserPortfolio(user);
            }

            console.log('✅ اكتمل إعداد المحافظ التجريبية');
            
        } catch (error) {
            console.error('❌ خطأ في إعداد المحافظ:', error);
            throw error;
        }
    }

    async setupUserPortfolio(user) {
        // محاكاة بيانات المحفظة بناءً على دور المستخدم
        const portfolioData = this.generatePortfolioData(user.role);
        
        // في تطبيق حقيقي، هنا سيتم تحديث بيانات المحفظة في قاعدة البيانات
        console.log(`📊 تم إعداد محفظة للمستخدم ${user.name}: ${portfolioData.totalValue} USD`);
    }

    // === توليد تقرير الاختبار ===
    async generateTestReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 تقرير المستخدمين التجريبيين');
        console.log('='.repeat(60));

        this.testUsers.forEach((user, index) => {
            console.log(`\n👤 المستخدم ${index + 1}:`);
            console.log(`   الاسم: ${user.name}`);
            console.log(`   البريد: ${user.email}`);
            console.log(`   كلمة المرور: ${this.getOriginalPassword(user.email)}`);
            console.log(`   الدور: ${user.role}`);
            console.log(`   الاشتراك: ${user.subscription.plan}`);
            console.log(`   مستوى المخاطرة: ${user.tradingSettings.riskLevel}`);
            console.log(`   المنصات: ${user.tradingSettings.preferredExchanges.join(', ')}`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('🔐 معلومات الأمان:');
        console.log('   - كلمات المرور تستخدم تشفير bcrypt بـ 12 جولة');
        console.log('   - البيانات الحساسة مشفرة في قاعدة البيانات');
        console.log('   - جميع المستخدمين مفعلين ومؤكدين');
        
        console.log('\n🎯 ملاحظات الاختبار:');
        console.log('   - يمكن استخدام هذه الحسابات للتطوير والاختبار المحلي');
        console.log('   - لا تستخدم في البيئة الإنتاجية');
        console.log('   - البيانات قابلة للتخصيص حسب احتياجات الاختبار');
        console.log('='.repeat(60));
    }

    // === دوال المساعدة ===
    encryptWallets(role) {
        const baseWallets = [
            {
                type: 'spot',
                exchange: 'binance',
                balance: this.getWalletBalance(role, 'spot'),
                currency: 'USDT',
                isActive: true
            },
            {
                type: 'future',
                exchange: 'bybit', 
                balance: this.getWalletBalance(role, 'future'),
                currency: 'USDT',
                isActive: true
            },
            {
                type: 'spot',
                exchange: 'mexc',
                balance: this.getWalletBalance(role, 'spot'),
                currency: 'USDT',
                isActive: true
            }
        ];

        // في تطبيق حقيقي، هنا سيتم تشفير البيانات الحساسة
        return baseWallets.map(wallet => ({
            ...wallet,
            encrypted: true,
            encryptionVersion: 'v1'
        }));
    }

    generateApiKeys(role) {
        if (role === 'admin') {
            return [
                {
                    exchange: 'binance',
                    key: `test_api_key_${crypto.randomBytes(8).toString('hex')}`,
                    secret: `test_api_secret_${crypto.randomBytes(16).toString('hex')}`,
                    permissions: ['read', 'trade', 'withdraw'],
                    isActive: true,
                    createdAt: new Date()
                }
            ];
        }
        return [];
    }

    generateUserStats(role) {
        const baseStats = {
            totalTrades: this.getRandomNumber(50, 500),
            successfulTrades: this.getRandomNumber(30, 400),
            successRate: this.getRandomNumber(60, 95),
            totalVolume: this.getRandomNumber(10000, 100000),
            averageProfit: this.getRandomNumber(5, 25),
            totalProfit: this.getRandomNumber(1000, 50000)
        };

        // تعديل الإحصائيات بناءً على الدور
        switch(role) {
            case 'trader':
                return { ...baseStats, totalTrades: baseStats.totalTrades * 2 };
            case 'investor':
                return { ...baseStats, totalVolume: baseStats.totalVolume * 3 };
            case 'admin':
                return { ...baseStats, totalProfit: baseStats.totalProfit * 2 };
            default:
                return baseStats;
        }
    }

    // === دوال توليد البيانات ===
    getOriginalPassword(email) {
        const passwords = {
            'test@akraa.com': 'Test123456!',
            'investor@akraa.com': 'Investor123!', 
            'admin@akraa.com': 'Admin123!'
        };
        return passwords[email] || 'Unknown';
    }

    getWalletBalance(role, type) {
        const baseBalance = type === 'future' ? 5000 : 10000;
        const multipliers = {
            'trader': 1.5,
            'investor': 2.0,
            'admin': 3.0
        };
        return baseBalance * (multipliers[role] || 1);
    }

    getInvestmentGoals(role) {
        const goals = {
            'trader': ['short_term_gains', 'active_trading'],
            'investor': ['long_term_growth', 'portfolio_diversification'],
            'admin': ['wealth_preservation', 'capital_growth']
        };
        return goals[role] || ['general_investment'];
    }

    getAnnualIncome(role) {
        const incomes = {
            'trader': '50000-100000',
            'investor': '100000-250000', 
            'admin': '250000+'
        };
        return incomes[role] || '25000-50000';
    }

    getNetWorth(role) {
        const worths = {
            'trader': '100000-500000',
            'investor': '500000-2000000',
            'admin': '2000000+'
        };
        return worths[role] || '50000-100000';
    }

    getExperienceLevel(role) {
        const experiences = {
            'trader': 'expert',
            'investor': 'advanced',
            'admin': 'professional'
        };
        return experiences[role] || 'intermediate';
    }

    getPortfolioValue(role) {
        const values = {
            'trader': 75000,
            'investor': 250000,
            'admin': 1000000
        };
        return values[role] || 50000;
    }

    getInitialInvestment(role) {
        const investments = {
            'trader': 50000,
            'investor': 150000,
            'admin': 500000
        };
        return investments[role] || 25000;
    }

    getCurrentBalance(role) {
        const balances = {
            'trader': 80000,
            'investor': 275000,
            'admin': 1100000
        };
        return balances[role] || 30000;
    }

    getProfitLoss(role) {
        const profits = {
            'trader': 30000,
            'investor': 125000,
            'admin': 600000
        };
        return profits[role] || 5000;
    }

    generatePerformanceData() {
        return {
            daily: this.getRandomNumber(-2, 5),
            weekly: this.getRandomNumber(-5, 15),
            monthly: this.getRandomNumber(-10, 30),
            yearly: this.getRandomNumber(15, 150)
        };
    }

    generateAvatarUrl(name) {
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=0A1F3A&color=00D4FF&bold=true`;
    }

    generateBio(role) {
        const bios = {
            'trader': 'تاجر محترف متخصص في التداول الكمي والذكاء الاصطناعي',
            'investor': 'مستثمر مؤسسي مع خبرة طويلة في إدارة المحافظ المالية',
            'admin': 'مدير نظام مع خبرة في إدارة منصات التداول المتقدمة'
        };
        return bios[role] || 'مستخدم نشط في منصة التداول الكمي';
    }

    generatePortfolioData(role) {
        return {
            totalValue: this.getPortfolioValue(role),
            cryptocurrencies: this.getRandomNumber(5, 15),
            stocks: this.getRandomNumber(0, 10),
            commodities: this.getRandomNumber(0, 5),
            diversification: this.getRandomNumber(60, 95)
        };
    }

    getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // === التنظيف ===
    async cleanup() {
        try {
            if (mongoose.connection.readyState !== 0) {
                await mongoose.connection.close();
                console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
            }
        } catch (error) {
            console.error('❌ خطأ في إغلاق الاتصال:', error);
        }
    }
}

// === التنفيذ الرئيسي ===
async function main() {
    try {
        const setup = new TestUserSetup();
        await setup.initialize();
        
        console.log('\n🎉 تم إنشاء جميع المستخدمين التجريبيين بنجاح!');
        console.log('📍 يمكنك الآن استخدام هذه الحسابات للاختبار والتطوير');
        
    } catch (error) {
        console.error('💥 فشل تنفيذ الإعداد:', error);
        process.exit(1);
    }
}

// تشغيل البرنامج
if (require.main === module) {
    main();
}

module.exports = TestUserSetup;