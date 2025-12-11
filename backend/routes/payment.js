// backend/routes/payment.js - النسخة المتقدمة والمؤمنة
const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const { encryptData, decryptData } = require('../services/encryptionService');

// === معدل الحد للطلبات الحساسة ===
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 10, // حد أقصى 10 طلبات كل 15 دقيقة
    message: {
        error: 'تم تجاوز الحد المسموح لطلبات الدفع',
        retryAfter: '15 دقيقة'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const transactionLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 دقائق
    max: 20, // حد أقصى 20 طلب كل 5 دقائق
    message: {
        error: 'الكثير من طلبات التحقق من المعاملات',
        retryAfter: '5 دقائق'
    }
});

// === قواعد التحقق من صحة البيانات ===
const paymentValidation = [
    body('amount')
        .isFloat({ min: 1, max: 1000000 })
        .withMessage('المبلغ يجب أن يكون بين 1 و 1,000,000'),
    body('currency')
        .isIn(['USD', 'EUR', 'GBP', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'TRY'])
        .withMessage('العملة غير مدعومة'),
    body('paymentMethod')
        .isIn(['credit_card', 'bank_transfer', 'crypto', 'wallet', 'paypal', 'stripe'])
        .withMessage('طريقة الدفع غير مدعومة'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('الوصف يجب ألا يتجاوز 500 حرف')
];

const transactionValidation = [
    param('transactionId')
        .isLength({ min: 10, max: 100 })
        .withMessage('معرف المعاملة غير صالح')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('معرف المعاملة يحتوي على أحرف غير مسموحة')
];

const refundValidation = [
    body('transactionId')
        .isLength({ min: 10, max: 100 })
        .withMessage('معرف المعاملة غير صالح'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('المبلغ يجب أن يكون أكبر من 0.01'),
    body('reason')
        .isLength({ min: 10, max: 500 })
        .withMessage('سبب الاسترجاع يجب أن يكون بين 10 و 500 حرف')
];

// === تطبيق middleware المصادقة على جميع مسارات الدفع ===
router.use(auth);

// === تطبيق middleware التشفير للبيانات الحساسة ===
router.use((req, res, next) => {
    // تشفير البيانات الحساسة في الطلب
    if (req.body.paymentData) {
        req.body.encryptedPaymentData = encryptData(req.body.paymentData);
        delete req.body.paymentData;
    }
    next();
});

// === مسارات الدفع الرئيسية ===

// معالجة الدفع - مع الحد من المعدل والتحقق من الصحة
router.post('/process', 
    paymentLimiter,
    paymentValidation,
    handleValidationErrors,
    PaymentController.processPayment
);

// جلب معلومات الدفع والتاريخ
router.get('/info',
    [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('رقم الصفحة يجب أن يكون رقم صحيح موجب'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('الحد يجب أن يكون بين 1 و 100'),
        query('startDate')
            .optional()
            .isISO8601()
            .withMessage('تاريخ البداية غير صالح'),
        query('endDate')
            .optional()
            .isISO8601()
            .withMessage('تاريخ النهاية غير صالح')
    ],
    handleValidationErrors,
    PaymentController.getPaymentInfo
);

// التحقق من حالة المعاملة
router.get('/status/:transactionId',
    transactionLimiter,
    transactionValidation,
    handleValidationErrors,
    PaymentController.checkPaymentStatus
);

// === مسارات إضافية متقدمة ===

// استرجاع الأموال (Refund)
router.post('/refund',
    paymentLimiter,
    refundValidation,
    handleValidationErrors,
    PaymentController.processRefund
);

// تأكيد الدفع (للمعاملات التي تحتاج تأكيد إضافي)
router.post('/confirm',
    paymentLimiter,
    [
        body('transactionId')
            .isLength({ min: 10, max: 100 })
            .withMessage('معرف المعاملة غير صالح'),
        body('confirmationCode')
            .isLength({ min: 4, max: 10 })
            .withMessage('كود التأكيد غير صالح')
    ],
    handleValidationErrors,
    PaymentController.confirmPayment
);

// إلغاء معاملة معلقة
router.post('/cancel',
    paymentLimiter,
    [
        body('transactionId')
            .isLength({ min: 10, max: 100 })
            .withMessage('معرف المعاملة غير صالح'),
        body('reason')
            .optional()
            .isLength({ max: 500 })
            .withMessage('سبب الإلغاء يجب ألا يتجاوز 500 حرف')
    ],
    handleValidationErrors,
    PaymentController.cancelPayment
);

// إنشاء فاتورة
router.post('/invoice',
    paymentLimiter,
    [
        body('amount')
            .isFloat({ min: 1, max: 1000000 })
            .withMessage('المبلغ يجب أن يكون بين 1 و 1,000,000'),
        body('currency')
            .isIn(['USD', 'EUR', 'GBP', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'TRY'])
            .withMessage('العملة غير مدعومة'),
        body('description')
            .isLength({ max: 500 })
            .withMessage('الوصف يجب ألا يتجاوز 500 حرف'),
        body('dueDate')
            .isISO8601()
            .withMessage('تاريخ الاستحقاق غير صالح')
    ],
    handleValidationErrors,
    PaymentController.createInvoice
);

// جلب الفواتير
router.get('/invoices',
    [
        query('status')
            .optional()
            .isIn(['pending', 'paid', 'overdue', 'cancelled'])
            .withMessage('حالة الفاتورة غير صالحة'),
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('رقم الصفحة يجب أن يكون رقم صحيح موجب'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage('الحد يجب أن يكون بين 1 و 50')
    ],
    handleValidationErrors,
    PaymentController.getInvoices
);

// تحديث طريقة الدفع
router.put('/payment-method',
    paymentLimiter,
    [
        body('paymentMethodId')
            .isLength({ min: 5, max: 50 })
            .withMessage('معرف طريقة الدفع غير صالح'),
        body('type')
            .isIn(['credit_card', 'bank_account', 'crypto_wallet', 'digital_wallet'])
            .withMessage('نوع طريقة الدفع غير مدعوم'),
        body('isDefault')
            .optional()
            .isBoolean()
            .withMessage('الحقل isDefault يجب أن يكون boolean')
    ],
    handleValidationErrors,
    PaymentController.updatePaymentMethod
);

// جلب طرق الدفع
router.get('/payment-methods',
    PaymentController.getPaymentMethods
);

// حذف طريقة دفع
router.delete('/payment-method/:methodId',
    [
        param('methodId')
            .isLength({ min: 5, max: 50 })
            .withMessage('معرف طريقة الدفع غير صالح')
    ],
    handleValidationErrors,
    PaymentController.deletePaymentMethod
);

// === إحصائيات وتحليلات ===

// إحصائيات الدفع
router.get('/statistics',
    [
        query('period')
            .optional()
            .isIn(['today', 'week', 'month', 'quarter', 'year', 'custom'])
            .withMessage('الفترة غير مدعومة'),
        query('startDate')
            .optional()
            .isISO8601()
            .withMessage('تاريخ البداية غير صالح'),
        query('endDate')
            .optional()
            .isISO8601()
            .withMessage('تاريخ النهاية غير صالح')
    ],
    handleValidationErrors,
    PaymentController.getPaymentStatistics
);

// تقرير المعاملات
router.get('/report',
    [
        query('type')
            .isIn(['transactions', 'refunds', 'invoices', 'revenue'])
            .withMessage('نوع التقرير غير مدعوم'),
        query('format')
            .optional()
            .isIn(['json', 'csv', 'pdf'])
            .withMessage('تنسيق التقرير غير مدعوم'),
        query('startDate')
            .isISO8601()
            .withMessage('تاريخ البداية غير صالح'),
        query('endDate')
            .isISO8601()
            .withMessage('تاريخ النهاية غير صالح')
    ],
    handleValidationErrors,
    PaymentController.generateReport
);

// === webhooks للدفع ===

// webhook لاستقبال تحديثات حالة الدفع من مقدمي الخدمة
router.post('/webhook/:provider',
    [
        param('provider')
            .isIn(['stripe', 'paypal', 'coinbase', 'binance', 'nowpayments'])
            .withMessage('مزود الخدمة غير مدعوم')
    ],
    // عدم تطبيق auth على webhooks لأنها تأتي من مزودي الخدمة
    PaymentController.handlePaymentWebhook
);

// تأكيد webhook
router.get('/webhook/:provider/verify',
    [
        param('provider')
            .isIn(['stripe', 'paypal', 'coinbase', 'binance', 'nowpayments'])
            .withMessage('مزود الخدمة غير مدعوم')
    ],
    PaymentController.verifyWebhook
);

// === إدارة العملات المشفرة ===

// إنشاء عنوان استقبال للعملات المشفرة
router.post('/crypto/address',
    paymentLimiter,
    [
        body('currency')
            .isIn(['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'XRP', 'ADA', 'DOT', 'DOGE', 'MATIC'])
            .withMessage('العملة المشفرة غير مدعومة'),
        body('network')
            .optional()
            .isIn(['ERC20', 'BEP20', 'TRC20', 'MATIC', 'SOLANA'])
            .withMessage('الشبكة غير مدعومة')
    ],
    handleValidationErrors,
    PaymentController.generateCryptoAddress
);

// التحقق من استلام العملات المشفرة
router.get('/crypto/check/:address',
    transactionLimiter,
    [
        param('address')
            .isLength({ min: 25, max: 100 })
            .withMessage('عنوان العملة المشفرة غير صالح')
    ],
    handleValidationErrors,
    PaymentController.checkCryptoPayment
);

// === مسارات الطوارئ والاسترجاع ===

// استرجاع معاملة فاشلة
router.post('/retry',
    paymentLimiter,
    [
        body('transactionId')
            .isLength({ min: 10, max: 100 })
            .withMessage('معرف المعاملة غير صالح')
    ],
    handleValidationErrors,
    PaymentController.retryFailedTransaction
);

// التحقق من سلامة نظام الدفع
router.get('/health',
    PaymentController.paymentHealthCheck
);

// === middleware للتعامل مع الأخطاء الخاصة بالدفع ===
router.use((error, req, res, next) => {
    if (error.name === 'PaymentError') {
        return res.status(400).json({
            error: 'خطأ في المعاملة',
            message: error.message,
            code: error.code
        });
    }
    
    if (error.name === 'InsufficientFundsError') {
        return res.status(402).json({
            error: 'رصيد غير كافي',
            message: error.message,
            requiredAmount: error.requiredAmount,
            currentBalance: error.currentBalance
        });
    }
    
    if (error.name === 'TransactionTimeoutError') {
        return res.status(408).json({
            error: 'انتهت مهلة المعاملة',
            message: error.message,
            transactionId: error.transactionId
        });
    }
    
    next(error);
});

// === تصدير المسارات ===
module.exports = router;
