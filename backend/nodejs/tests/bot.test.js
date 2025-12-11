// backend/nodejs/tests/bot.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // المسار الصحيح للخادم
const User = require('../models/User');
const BotCreatorService = require('../services/botCreator');

describe('Bot System Integration Tests', () => {
    let authToken;
    let testUserId;
    let testServer;

    beforeAll(async () => {
        // الاتصال بقاعدة بيانات الاختبار
        await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://localhost:27017/quantum_trade_test');
        
        // بدء الخادم للتست
        testServer = app.listen(4000);
    });

    beforeEach(async () => {
        // تنظيف وإنشاء مستخدم اختبار
        await User.deleteMany({});
        
        const user = new User({
            personalInfo: {
                name: 'Test User',
                email: 'test@example.com',
                password: 'TestPass123!'
            },
            subscription: {
                status: 'active',
                plan: 'pro'
            },
            paymentHistory: [{
                status: 'completed',
                type: 'subscription',
                amount: 99
            }]
        });
        await user.save();
        testUserId = user._id;
        authToken = user.generateAuthToken();
    });

    afterAll(async () => {
        await testServer.close();
        await mongoose.connection.close();
    });

    describe('POST /api/bot/activate', () => {
        it('should activate trading bot successfully', async () => {
            const response = await request(app)
                .post('/api/bot/activate')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.botToken).toBeDefined();
            expect(response.body.message).toContain('تم إنشاء بوت التداول بنجاح');
        });

        it('should reject activation for inactive subscription', async () => {
            await User.findByIdAndUpdate(testUserId, {
                'subscription.status': 'inactive'
            });

            const response = await request(app)
                .post('/api/bot/activate')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/bot/status', () => {
        it('should return bot status', async () => {
            const response = await request(app)
                .get('/api/bot/status')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Security Tests', () => {
        it('should reject unauthorized access', async () => {
            const response = await request(app)
                .get('/api/bot/status')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});
