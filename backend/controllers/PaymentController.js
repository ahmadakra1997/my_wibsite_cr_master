// backend/controllers/PaymentController.js - النسخة المتقدمة والمؤمنة
const { User } = require('../models/User');
const { Client } = require('../models/Client');
const { Transaction } = require('../models/Transaction');
const crypto = require('crypto');
const axios = require('axios');
const { EventEmitter } = require('events');

class PaymentController extends EventEmitter {
  constructor() {
    super();
    this.paymentProcessors = new Map();
    this.initializeProcessors();
    this.setupEventHandlers();
  }

  // === تهيئة معالجات الدفع ===
  initializeProcessors() {
    this.paymentProcessors.set('usdt', this.processCryptoPayment.bind(this));
    this.paymentProcessors.set('bank_transfer', this.processBankTransfer.bind(this));
    this.paymentProcessors.set('credit_card', this.processCardPayment.bind(this));
    this.paymentProcessors.set('crypto', this.processCryptoPayment.bind(this));
    this.paymentProcessors.set('stripe', this.processStripePayment.bind(this));
    this.paymentProcessors.set('paypal', this.processPaypalPayment.bind(this));
  }

  // === إعداد معالجي الأحداث ===
  setupEventHandlers() {
    this.on('payment_processed', this.handlePaymentProcessed.bind(this));
    this.on('payment_failed', this.handlePaymentFailed.bind(this));
    this.on('subscription_activated', this.handleSubscriptionActivated.bind(this));
    this.on('refund_issued', this.handleRefundIssued.bind(this));
  }

  // === معالجة الدفع الرئيسية المحسنة ===
  async processPayment(req, res) {
    const session = await require('mongoose').startSession();
    session.startTransaction();

    try {
      const { 
        userId, 
        method, 
        amount, 
        plan, 
        currency = 'USD',
        paymentData = {},
        metadata = {}
      } = req.body;

      // التحقق من صحة البيانات
      await this.validatePaymentRequest(req.body);
      
      // البحث عن المستخدم مع التحقق المتقدم
      const user = await this.getUserWithValidation(userId);
      
      // التحقق من الاشتراكات النشطة
      await this.checkActiveSubscriptions(user);

      // تحديد المعالج المناسب
      const processor = this.paymentProcessors.get(method);
      if (!processor) {
        throw new PaymentError('PAYMENT_METHOD_NOT_SUPPORTED', `طريقة الدفع ${method} غير مدعومة`);
      }

      // تنفيذ المعاملة
      const paymentResult = await processor.call(this, {
        user,
        amount,
        plan,
        currency,
        paymentData,
        metadata,
        session
      });

      // تأكيد المعاملة
      await session.commitTransaction();

      // إطلاق حدث المعاملة الناجحة
      this.emit('payment_processed', {
        userId: user._id,
        transactionId: paymentResult.transactionId,
        amount,
        currency,
        method,
        plan
      });

      return this.sendSuccessResponse(res, paymentResult);

    } catch (error) {
      await session.abortTransaction();
      return this.handlePaymentError(error, res);
    } finally {
      session.endSession();
    }
  }

  // === معالجة الدفع بالعملات المشفرة ===
  async processCryptoPayment(params) {
    const { user, amount, plan, currency, paymentData, session } = params;
    
    const transactionId = this.generateSecureTransactionId('CRYPTO');
    const subscriptionId = this.generateSubscriptionId(plan);

    // التحقق من بيانات الشبكة
    const networkValidation = this.validateCryptoNetwork(paymentData.network);
    if (!networkValidation.valid) {
      throw new PaymentError('INVALID_NETWORK', networkValidation.message);
    }

    // إنشاء عنوان استقبال فريد
    const depositAddress = await this.generateDepositAddress(user, paymentData.network);
    
    // حساب المبلغ المطلوب بدقة
    const calculatedAmount = await this.calculateCryptoAmount(amount, currency, paymentData.network);

    // إنشاء سجل المعاملة
    const transaction = new Transaction({
      transactionId,
      userId: user._id,
      type: 'subscription_payment',
      amount: calculatedAmount.amount,
      currency: calculatedAmount.cryptoCurrency,
      method: 'crypto',
      status: 'pending',
      network: paymentData.network,
      depositAddress: depositAddress.address,
      targetAmount: calculatedAmount.targetAmount,
      exchangeRate: calculatedAmount.exchangeRate,
      metadata: {
        plan,
        network: paymentData.network,
        requiredConfirmations: this.getRequiredConfirmations(paymentData.network),
        timeoutBlocks: this.getTimeoutBlocks(paymentData.network)
      }
    });

    await transaction.save({ session });

    return {
      transactionId,
      subscriptionId,
      status: 'pending',
      depositAddress: depositAddress.address,
      requiredAmount: calculatedAmount.amount,
      cryptoCurrency: calculatedAmount.cryptoCurrency,
      exchangeRate: calculatedAmount.exchangeRate,
      qrCode: depositAddress.qrCode,
      instructions: this.getCryptoInstructions(paymentData.network, calculatedAmount),
      expiryTime: new Date(Date.now() + 30 * 60 * 1000) // 30 دقيقة
    };
  }

  // === معالجة التحويل البنكي ===
  async processBankTransfer(params) {
    const { user, amount, plan, currency, session } = params;

    const transactionId = this.generateSecureTransactionId('BANK');
    const subscriptionId = this.generateSubscriptionId(plan);

    // الحصول على معلومات البنك
    const bankInfo = this.getBankInformation(currency);
    
    // إنشاء رقم مرجع فريد
    const referenceNumber = this.generateBankReference();

    const transaction = new Transaction({
      transactionId,
      userId: user._id,
      type: 'subscription_payment',
      amount,
      currency,
      method: 'bank_transfer',
      status: 'pending',
      referenceNumber,
      bankInfo,
      metadata: {
        plan,
        expectedArrival: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 ساعة
      }
    });

    await transaction.save({ session });

    return {
      transactionId,
      subscriptionId,
      status: 'pending',
      bankInfo: {
        ...bankInfo,
        referenceNumber,
        beneficiary: process.env.BANK_BENEFICIARY || 'QUANTUM AI TRADING PLATFORM',
        amount,
        currency
      },
      instructions: this.getBankTransferInstructions(bankInfo, referenceNumber),
      documents: this.getRequiredDocuments()
    };
  }

  // === معالجة الدفع بالبطاقة ===
  async processCardPayment(params) {
    const { user, amount, plan, currency, paymentData, session } = params;

    // التحقق من بيانات البطاقة
    const cardValidation = this.validateCardData(paymentData);
    if (!cardValidation.valid) {
      throw new PaymentError('INVALID_CARD_DATA', cardValidation.message);
    }

    const transactionId = this.generateSecureTransactionId('CARD');
    const subscriptionId = this.generateSubscriptionId(plan);

    // معالجة الدفع عبر بوابة الدفع
    const paymentResult = await this.processThroughGateway({
      amount,
      currency,
      cardData: paymentData,
      description: `Subscription: ${plan}`
    });

    if (!paymentResult.success) {
      throw new PaymentError('GATEWAY_DECLINED', paymentResult.message);
    }

    const transaction = new Transaction({
      transactionId,
      userId: user._id,
      type: 'subscription_payment',
      amount,
      currency,
      method: 'credit_card',
      status: 'completed',
      gatewayTransactionId: paymentResult.gatewayId,
      metadata: {
        plan,
        gateway: 'stripe',
        cardLast4: paymentData.cardNumber.slice(-4)
      }
    });

    await transaction.save({ session });

    // تفعيل الاشتراك فوراً
    await this.activateSubscription(user, plan, subscriptionId, transactionId, session);

    return {
      transactionId,
      subscriptionId,
      status: 'completed',
      gatewayResponse: paymentResult,
      subscription: user.subscription
    };
  }

  // === معالجة الاسترجاع ===
  async processRefund(req, res) {
    const session = await require('mongoose').startSession();
    session.startTransaction();

    try {
      const { transactionId, amount, reason, adminId } = req.body;

      // التحقق من صلاحية المشرف
      await this.verifyAdminPermissions(adminId);

      // البحث عن المعاملة
      const transaction = await Transaction.findOne({ transactionId });
      if (!transaction) {
        throw new PaymentError('TRANSACTION_NOT_FOUND', 'لم يتم العثور على المعاملة');
      }

      // التحقق من إمكانية الاسترجاع
      this.validateRefundEligibility(transaction, amount);

      // تنفيذ الاسترجاع
      const refundResult = await this.executeRefund(transaction, amount, reason);

      // تحديث سجل المعاملة
      transaction.refund = {
        amount: refundResult.refundAmount,
        reason,
        processedBy: adminId,
        processedAt: new Date(),
        gatewayRefundId: refundResult.gatewayRefundId
      };

      transaction.status = 'refunded';
      await transaction.save({ session });

      // تحديث رصيد المستخدم إذا لزم الأمر
      await this.updateUserBalance(transaction.userId, refundResult.refundAmount, session);

      await session.commitTransaction();

      this.emit('refund_issued', {
        transactionId,
        userId: transaction.userId,
        amount: refundResult.refundAmount,
        reason,
        adminId
      });

      return res.status(200).json({
        success: true,
        message: 'تم استرجاع المبلغ بنجاح',
        data: {
          refundId: refundResult.gatewayRefundId,
          amount: refundResult.refundAmount,
          transactionId,
          processedAt: new Date()
        }
      });

    } catch (error) {
      await session.abortTransaction();
      return this.handlePaymentError(error, res);
    } finally {
      session.endSession();
    }
  }

  // === جلب معلومات الدفع المتقدمة ===
  async getPaymentInfo(req, res) {
    try {
      const { plan, currency = 'USD' } = req.query;

      // الحصول على أسعار الصرف الحالية
      const exchangeRates = await this.getCurrentExchangeRates();
      
      // معلومات الباقات
      const subscriptionPlans = this.getSubscriptionPlans(currency, exchangeRates);

      // معلومات طرق الدفع
      const paymentMethods = await this.getAvailablePaymentMethods(currency);

      // إحصائيات الدفع
      const paymentStats = await this.getPaymentStatistics();

      res.status(200).json({
        success: true,
        data: {
          plans: subscriptionPlans,
          paymentMethods,
          exchangeRates,
          statistics: paymentStats,
          security: {
            compliance: ['PCI-DSS', 'AML', 'KYC', 'GDPR'],
            encryption: 'AES-256-GCM',
            certifications: ['ISO-27001']
          }
        },
        metadata: {
          timestamp: new Date(),
          currency,
          rateSource: 'multiple_sources'
        }
      });

    } catch (error) {
      console.error('💥 خطأ في جلب معلومات الدفع:', error);
      res.status(500).json({
        success: false,
        code: 'PAYMENT_INFO_ERROR',
        message: 'فشل في جلب معلومات الدفع'
      });
    }
  }

  // === التحقق من حالة المعاملة ===
  async checkPaymentStatus(req, res) {
    try {
      const { transactionId } = req.params;
      const { detailed = false } = req.query;

      const transaction = await Transaction.findOne({ transactionId })
        .populate('userId', 'name email');

      if (!transaction) {
        return res.status(404).json({
          success: false,
          code: 'TRANSACTION_NOT_FOUND',
          message: 'لم يتم العثور على المعاملة'
        });
      }

      let statusDetails = {
        transactionId: transaction.transactionId,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        method: transaction.method,
        createdAt: transaction.createdAt
      };

      // إضافة تفاصيل إضافية إذا طلب
      if (detailed) {
        statusDetails = {
          ...statusDetails,
          user: {
            id: transaction.userId._id,
            name: transaction.userId.name,
            email: transaction.userId.email
          },
          metadata: transaction.metadata,
          confirmations: transaction.confirmations,
          network: transaction.network,
          gatewayData: transaction.gatewayData
        };

        // إضافة معلومات تتبع إضافية للعملات المشفرة
        if (transaction.method === 'crypto') {
          statusDetails.blockchainInfo = await this.getBlockchainInfo(transaction);
        }
      }

      res.status(200).json({
        success: true,
        data: statusDetails
      });

    } catch (error) {
      console.error('💥 خطأ في التحقق من حالة المعاملة:', error);
      res.status(500).json({
        success: false,
        code: 'STATUS_CHECK_ERROR',
        message: 'فشل في التحقق من حالة المعاملة'
      });
    }
  }

  // === إنشاء فاتورة ===
  async createInvoice(req, res) {
    try {
      const { userId, items, dueDate, currency = 'USD', metadata = {} } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'المستخدم غير موجود'
        });
      }

      const invoiceId = this.generateInvoiceId();
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const invoice = {
        invoiceId,
        userId,
        items,
        totalAmount,
        currency,
        dueDate: new Date(dueDate),
        status: 'pending',
        createdAt: new Date(),
        metadata
      };

      // حفظ الفاتورة في قاعدة البيانات
      await this.saveInvoice(invoice);

      // إرسال الفاتورة بالبريد الإلكتروني
      await this.sendInvoiceEmail(user, invoice);

      res.status(201).json({
        success: true,
        message: 'تم إنشاء الفاتورة بنجاح',
        data: {
          invoiceId,
          totalAmount,
          currency,
          dueDate: invoice.dueDate,
          paymentUrl: `${process.env.APP_URL}/pay/invoice/${invoiceId}`
        }
      });

    } catch (error) {
      console.error('💥 خطأ في إنشاء الفاتورة:', error);
      res.status(500).json({
        success: false,
        code: 'INVOICE_CREATION_ERROR',
        message: 'فشل في إنشاء الفاتورة'
      });
    }
  }

  // === معالجة webhooks ===
  async handlePaymentWebhook(req, res) {
    try {
      const { provider } = req.params;
      const signature = req.headers['stripe-signature'] || req.headers['paypal-signature'];
      
      // التحقق من صحة الطلب
      const isValid = await this.verifyWebhookSignature(provider, req.body, signature);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid signature' });
      }

      const event = req.body;
      
      // معالجة الحدث حسب النوع
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handleSuccessfulPayment(event.data);
          break;
        case 'payment_intent.payment_failed':
          await this.handleFailedPayment(event.data);
          break;
        case 'charge.refunded':
          await this.handleRefund(event.data);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.status(200).json({ received: true });

    } catch (error) {
      console.error('💥 خطأ في معالجة webhook:', error);
      res.status(400).json({ success: false, error: 'Webhook processing failed' });
    }
  }

  // === دوال المساعدة المتقدمة ===

  // التحقق من صحة طلب الدفع
  async validatePaymentRequest(data) {
    const { userId, method, amount, plan, currency } = data;

    if (!userId || !method || !amount || !plan) {
      throw new PaymentError('INVALID_REQUEST', 'بيانات الدفع غير مكتملة');
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      throw new PaymentError('INVALID_AMOUNT', 'المبلغ غير صحيح');
    }

    const validMethods = Array.from(this.paymentProcessors.keys());
    if (!validMethods.includes(method)) {
      throw new PaymentError('UNSUPPORTED_METHOD', `طريقة الدفع ${method} غير مدعومة`);
    }

    const validPlans = ['basic', 'pro', 'premium', 'enterprise'];
    if (!validPlans.includes(plan)) {
      throw new PaymentError('INVALID_PLAN', `الباقة ${plan} غير صحيحة`);
    }

    // التحقق من حدود الدفع
    const amountValidation = this.validatePaymentAmount(amount, currency, method);
    if (!amountValidation.valid) {
      throw new PaymentError('AMOUNT_LIMIT_EXCEEDED', amountValidation.message);
    }
  }

  // الحصول على المستخدم مع التحقق
  async getUserWithValidation(userId) {
    const user = await User.findById(userId)
      .select('+paymentHistory +subscription +security');
    
    if (!user) {
      throw new PaymentError('USER_NOT_FOUND', 'المستخدم غير موجود');
    }

    if (user.security?.accountLocked) {
      throw new PaymentError('ACCOUNT_LOCKED', 'الحساب مغلق مؤقتاً');
    }

    return user;
  }

  // التحقق من الاشتراكات النشطة
  async checkActiveSubscriptions(user) {
    if (user.subscription && user.subscription.status === 'active') {
      const endDate = new Date(user.subscription.endDate);
      if (endDate > new Date()) {
        throw new PaymentError('ACTIVE_SUBSCRIPTION', 'لديك اشتراك نشط بالفعل');
      }
    }
  }

  // إنشاء معرف معاملة آمن
  generateSecureTransactionId(prefix) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex').toUpperCase();
    const hash = crypto.createHash('sha256')
      .update(`${prefix}${timestamp}${random}`)
      .digest('hex')
      .slice(0, 16)
      .toUpperCase();
    
    return `${prefix}-${timestamp}-${hash}`;
  }

  // إنشاء معرف اشتراك
  generateSubscriptionId(plan) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `SUB-${plan.toUpperCase()}-${timestamp}-${random}`;
  }

  // تفعيل الاشتراك
  async activateSubscription(user, plan, subscriptionId, transactionId, session) {
    const planDetails = this.getPlanDetails(plan);
    
    user.subscription = {
      subscriptionId,
      plan,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + planDetails.duration * 24 * 60 * 60 * 1000),
      transactionId,
      features: planDetails.features,
      autoRenew: false,
      activatedAt: new Date()
    };

    await user.save({ session });

    this.emit('subscription_activated', {
      userId: user._id,
      subscriptionId,
      plan,
      transactionId
    });
  }

  // إرسال استجابة النجاح
  sendSuccessResponse(res, data) {
    return res.status(200).json({
      success: true,
      message: 'تمت عملية الدفع بنجاح',
      data
    });
  }

  // معالجة أخطاء الدفع
  handlePaymentError(error, res) {
    console.error('💥 خطأ في الدفع:', error);

    if (error instanceof PaymentError) {
      return res.status(error.statusCode || 400).json({
        success: false,
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details })
      });
    }

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'حدث خطأ داخلي في النظام'
    });
  }

  // === معالجي الأحداث ===
  async handlePaymentProcessed(data) {
    console.log('✅ معاملة دفع ناجحة:', data);
    // إرسال إشعارات، تحديث الإحصائيات، etc.
  }

  async handlePaymentFailed(data) {
    console.log('❌ معاملة دفع فاشلة:', data);
    // إشعارات الدعم، تسجيل الخطأ، etc.
  }

  async handleSubscriptionActivated(data) {
    console.log('🎉 اشتراك مفعل:', data);
    // إرسال بريد ترحيبي، إعداد الحساب، etc.
  }

  async handleRefundIssued(data) {
    console.log('↩️ استرجاع أموال:', data);
    // تحديث المحاسبة، إشعارات، etc.
  }
}

// === فئة خطأ مخصصة للدفع ===
class PaymentError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.details = details;
    this.statusCode = this.getStatusCode(code);
  }

  getStatusCode(code) {
    const statusMap = {
      'USER_NOT_FOUND': 404,
      'ACTIVE_SUBSCRIPTION': 400,
      'INSUFFICIENT_FUNDS': 402,
      'PAYMENT_METHOD_NOT_SUPPORTED': 400,
      'INVALID_NETWORK': 400,
      'INVALID_CARD_DATA': 400,
      'GATEWAY_DECLINED': 402,
      'AMOUNT_LIMIT_EXCEEDED': 400,
      'ACCOUNT_LOCKED': 403
    };
    return statusMap[code] || 400;
  }
}

module.exports = new PaymentController();
