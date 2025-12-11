// backend/services/AnonymousSupportService.js - النسخة المتقدمة والمحسنة
const crypto = require('crypto');
const EventEmitter = require('events');
const mongoose = require('mongoose');

class AnonymousSupportService extends EventEmitter {
    constructor() {
        super();
        
        this.clientSessions = new Map();
        this.supportTickets = new Map();
        this.supportAgents = new Map();
        this.encryptionKey = this.generateEncryptionKey();
        
        // إعدادات الدعم
        this.config = {
            supportEmail: process.env.SUPPORT_EMAIL || 'support@qatrader.com',
            supportPhone: process.env.SUPPORT_PHONE || '+1234567890',
            autoResponse: true,
            maxMessagesPerSession: 50,
            sessionTimeout: 24 * 60 * 60 * 1000, // 24 ساعة
            priorityLevels: ['low', 'medium', 'high', 'urgent'],
            supportCategories: ['technical', 'billing', 'trading', 'security', 'general']
        };

        this.stats = {
            totalSessions: 0,
            activeSessions: 0,
            resolvedTickets: 0,
            averageResponseTime: 0,
            satisfactionRate: 0
        };

        this.init();
    }

    async init() {
        await this.loadSupportAgents();
        this.startSessionCleanup();
        this.startStatsUpdate();
        
        console.log('💬 نظام الدعم المجهول المتقدم مفعل');
    }

    // توليد مفتاح تشفير
    generateEncryptionKey() {
        return crypto.randomBytes(32);
    }

    // تشفير بيانات الجلسة
    encryptSessionData(data) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: cipher.getAuthTag().toString('hex')
        };
    }

    // فك تشفير بيانات الجلسة
    decryptSessionData(encryptedData) {
        try {
            const decipher = crypto.createDecipheriv(
                'aes-256-gcm', 
                this.encryptionKey, 
                Buffer.from(encryptedData.iv, 'hex')
            );
            
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
            
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            this.logSecurityEvent('SESSION_DECRYPTION_FAILED', { error: error.message });
            return null;
        }
    }

    // إنشاء جلسة دعم مجهولة متقدمة
    createAnonymousSession(clientInfo, category = 'general', priority = 'medium') {
        const sessionId = crypto.randomBytes(32).toString('hex');
        const anonymousId = `SUPPORT_${crypto.randomBytes(16).toString('hex')}`;
        const ticketNumber = this.generateTicketNumber();
        
        const sessionData = {
            sessionId,
            anonymousId,
            ticketNumber,
            clientInfo: this.anonymizeClientInfo(clientInfo),
            category,
            priority,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            lastActivity: new Date(),
            messageCount: 0,
            attachments: [],
            rating: null,
            assignedAgent: null,
            responseTime: null,
            encryptionKey: crypto.randomBytes(16).toString('hex') // مفتاح منفصل للجلسة
        };

        // تشفير وحفظ بيانات الجلسة
        const encryptedSession = this.encryptSessionData(sessionData);
        this.clientSessions.set(sessionId, encryptedSession);

        this.stats.totalSessions++;
        this.stats.activeSessions++;

        // إشعار بجلسة جديدة
        this.notifyNewSession(sessionData);

        this.emit('sessionCreated', sessionData);

        return { 
            sessionId, 
            anonymousId, 
            ticketNumber,
            securityToken: this.generateSecurityToken(sessionId)
        };
    }

    // إخفاء معلومات العميل
    anonymizeClientInfo(clientInfo) {
        return {
            // معلومات عامة بدون بيانات تعريف
            platform: clientInfo.platform,
            language: clientInfo.language,
            timezone: clientInfo.timezone,
            // إزالة المعلومات الحساسة
            ipHash: crypto.createHash('sha256').update(clientInfo.ip || '').digest('hex'),
            userAgentHash: crypto.createHash('sha256').update(clientInfo.userAgent || '').digest('hex')
        };
    }

    // توليد رقم تذكرة
    generateTicketNumber() {
        const timestamp = Date.now().toString().slice(-6);
        const random = crypto.randomBytes(3).toString('hex').toUpperCase();
        return `TKT-${timestamp}-${random}`;
    }

    // توليد توكن أمان
    generateSecurityToken(sessionId) {
        return crypto.createHmac('sha256', this.encryptionKey)
            .update(sessionId + Date.now())
            .digest('hex');
    }

    // إرسال رسالة دعم مجهولة متقدمة
    async sendSupportMessage(sessionId, message, attachments = [], messageType = 'text') {
        const encryptedSession = this.clientSessions.get(sessionId);
        if (!encryptedSession) {
            throw new Error('جلسة الدعم غير صالحة أو منتهية');
        }

        const session = this.decryptSessionData(encryptedSession);
        if (!session) {
            throw new Error('فشل في فك تشفير جلسة الدعم');
        }

        // التحقق من حدود الرسائل
        if (session.messageCount >= this.config.maxMessagesPerSession) {
            throw new Error('تم تجاوز الحد الأقصى لعدد الرسائل في هذه الجلسة');
        }

        // تحديث الجلسة
        session.messageCount++;
        session.lastActivity = new Date();
        session.updatedAt = new Date();

        // تخزين الرسالة
        const messageId = crypto.randomBytes(16).toString('hex');
        const messageData = {
            messageId,
            type: messageType,
            content: message,
            attachments: await this.processAttachments(attachments),
            timestamp: new Date(),
            direction: 'client_to_support',
            encrypted: true
        };

        // إضافة الرسالة للسجل
        await this.logMessage(session, messageData);

        // إرسال إشعار للدعم
        await this.notifySupportTeam(session, messageData);

        // رد تلقائي إذا مفعل
        if (this.config.autoResponse) {
            await this.sendAutoResponse(session);
        }

        // تحديث الجلسة المشفرة
        const updatedEncryptedSession = this.encryptSessionData(session);
        this.clientSessions.set(sessionId, updatedEncryptedSession);

        this.emit('messageSent', { session, message: messageData });

        return { 
            success: true, 
            messageId,
            timestamp: new Date(),
            ticketNumber: session.ticketNumber
        };
    }

    // معالجة المرفقات
    async processAttachments(attachments) {
        const processedAttachments = [];

        for (const attachment of attachments) {
            try {
                const attachmentId = crypto.randomBytes(16).toString('hex');
                const encryptedAttachment = await this.encryptAttachment(attachment);
                
                processedAttachments.push({
                    id: attachmentId,
                    name: attachment.name,
                    type: attachment.type,
                    size: attachment.size,
                    encryptedData: encryptedAttachment,
                    uploadTime: new Date()
                });
            } catch (error) {
                console.error('فشل في معالجة المرفق:', error);
            }
        }

        return processedAttachments;
    }

    // تشفير المرفقات
    async encryptAttachment(attachment) {
        // في بيئة إنتاج، استخدم خدمة تخزين آمنة
        return {
            // محاكاة للتشفير - في الواقع قم بتشفير البيانات
            data: `encrypted_${attachment.data}`,
            iv: crypto.randomBytes(16).toString('hex'),
            authTag: crypto.randomBytes(16).toString('hex')
        };
    }

    // إشعار فريق الدعم
    async notifySupportTeam(session, message) {
        const notificationMessage = `
🎫 رسالة دعم جديدة

📋 التذكرة: ${session.ticketNumber}
🆔 المعرف المجهول: ${session.anonymousId}
📁 التصنيف: ${session.category}
🚨 الأولوية: ${session.priority}
⏰ الوقت: ${new Date().toLocaleString('ar-SA')}

💬 الرسالة:
${message.content}

📊 إحصائيات الجلسة:
• عدد الرسائل: ${session.messageCount}
• مدة الجلسة: ${this.getSessionDuration(session)} دقيقة
• النشاط: ${this.getActivityLevel(session)}

────────────────────
🔒 عميل مجهول الهوية
💬 للرد، استخدم المعرف: ${session.sessionId}
        `;

        // إرسال عبر قنوات متعددة
        await this.sendToSupportChannels(notificationMessage, session.priority);
    }

    // إرسال عبر قنوات الدعم
    async sendToSupportChannels(message, priority) {
        const channels = [];

        // إضافة القنوات بناءً على الأولوية
        if (priority === 'urgent' || priority === 'high') {
            channels.push('telegram', 'email', 'sms');
        } else {
            channels.push('telegram', 'email');
        }

        for (const channel of channels) {
            try {
                switch (channel) {
                    case 'telegram':
                        await this.sendTelegramAlert(message);
                        break;
                    case 'email':
                        await this.sendEmailToSupport(message);
                        break;
                    case 'sms':
                        await this.sendSMSAlert(message);
                        break;
                }
            } catch (error) {
                console.error(`فشل الإرسال عبر ${channel}:`, error);
            }
        }
    }

    // إرسال تنبيه التليجرام
    async sendTelegramAlert(message) {
        try {
            const telegramService = require('./TelegramService');
            await telegramService.sendToSupportGroup(message);
        } catch (error) {
            console.error('فشل إرسال تنبيه التليجرام:', error);
        }
    }

    // إرسال بريد للدعم
    async sendEmailToSupport(message) {
        try {
            const emailService = require('./EmailService');
            await emailService.send({
                to: this.config.supportEmail,
                subject: 'رسالة دعم جديدة - نظام الدعم المجهول',
                text: message,
                priority: 'high'
            });
        } catch (error) {
            console.error('فشل إرسال بريد الدعم:', error);
        }
    }

    // إرسال تنبيه SMS
    async sendSMSAlert(message) {
        try {
            const smsService = require('./SMSService');
            await smsService.sendToSupport(message.substring(0, 160)); // حدود SMS
        } catch (error) {
            console.error('فشل إرسال تنبيه SMS:', error);
        }
    }

    // رد تلقائي
    async sendAutoResponse(session) {
        if (session.messageCount > 1) return; // لا رد تلقائي بعد الرسالة الأولى

        const autoResponse = this.generateAutoResponse(session);
        const responseData = {
            messageId: crypto.randomBytes(16).toString('hex'),
            type: 'text',
            content: autoResponse,
            timestamp: new Date(),
            direction: 'support_to_client',
            isAutoResponse: true
        };

        // إرسال الرد للعميل
        await this.sendReplyToClient(session, responseData);

        // تسجيل الرد التلقائي
        await this.logMessage(session, responseData);
    }

    // توليد رد تلقائي
    generateAutoResponse(session) {
        const responses = {
            technical: `
شكراً لتواصلكم مع دعم QA TRADER التقني

✅ تم استلام رسالتكم بنجاح
🆔 رقم التذكرة: ${session.ticketNumber}
⏰ متوسط وقت الاستجابة: 15-30 دقيقة

🔧 فريق الدعم الفني سيقوم بالرد عليكم قريباً
📞 للطوارئ: ${this.config.supportPhone}
            `,
            billing: `
شكراً لتواصلكم مع دعم QA TRADER للفواتير

✅ تم استلام استفساركم البنكي
🆔 رقم التذكرة: ${session.ticketNumber}
⏰ متوسط وقت الاستجابة: 30-60 دقيقة

💳 فريق الفواتير سيرد عليكم خلال وقت العمل
            `,
            trading: `
شكراً لتواصلكم مع دعم QA TRADER للتداول

✅ تم استلام استفساركم التداولي
🆔 رقم التذكرة: ${session.ticketNumber}
⏰ متوسط وقت الاستجابة: 10-20 دقيقة

📈 فريق التداول متاح لمساعدتكم
            `,
            default: `
شكراً لتواصلكم مع دعم QA TRADER

✅ تم استلام رسالتكم بنجاح
🆔 رقم التذكرة: ${session.ticketNumber}
⏰ متوسط وقت الاستجابة: 20-40 دقيقة

👥 فريق الدعم سيرد عليكم قريباً
🔒 محادثتكم مجهولة وآمنة
            `
        };

        return responses[session.category] || responses.default;
    }

    // الرد على العميل (من الدعم للعميل)
    async replyToClient(sessionId, replyMessage, supportAgent, attachments = []) {
        const encryptedSession = this.clientSessions.get(sessionId);
        if (!encryptedSession) {
            throw new Error('لم يتم العثور على جلسة العميل');
        }

        const session = this.decryptSessionData(encryptedSession);
        if (!session) {
            throw new Error('فشل في فك تشفير جلسة الدعم');
        }

        // تحديث الجلسة
        session.assignedAgent = supportAgent;
        session.lastActivity = new Date();
        session.updatedAt = new Date();

        // حساب وقت الاستجابة لأول رسالة
        if (session.messageCount === 1 && !session.responseTime) {
            session.responseTime = new Date() - session.createdAt;
        }

        // إنشاء بيانات الرد
        const replyData = {
            messageId: crypto.randomBytes(16).toString('hex'),
            type: 'text',
            content: replyMessage,
            attachments: await this.processAttachments(attachments),
            timestamp: new Date(),
            direction: 'support_to_client',
            agent: supportAgent,
            encrypted: true
        };

        // إرسال الرد للعميل
        await this.sendReplyToClient(session, replyData);

        // تسجيل الرد
        await this.logMessage(session, replyData);

        // تحديث الجلسة المشفرة
        const updatedEncryptedSession = this.encryptSessionData(session);
        this.clientSessions.set(sessionId, updatedEncryptedSession);

        this.emit('replySent', { session, reply: replyData });

        return { success: true, messageId: replyData.messageId };
    }

    // إرسال الرد للعميل
    async sendReplyToClient(session, replyData) {
        const messageContent = `
💬 رد من الدعم الفني - QA TRADER

📋 التذكرة: ${session.ticketNumber}
👤 الدعم: ${replyData.agent || 'فريق الدعم'}
⏰ الوقت: ${replyData.timestamp.toLocaleString('ar-SA')}

📝 الرسالة:
${replyData.content}

${replyData.attachments.length > 0 ? `📎 المرفقات: ${replyData.attachments.length} ملف` : ''}

🔒 هذه محادثة مجهولة الهوية
💬 للرد، اضغط على رد في هذه المحادثة
        `;

        // إرسال عبر منصة العميل (تيليجرام، تطبيق ويب، إلخ)
        await this.sendToClientPlatform(session, messageContent, replyData.attachments);
    }

    // إرسال للعميل عبر المنصة
    async sendToClientPlatform(session, message, attachments) {
        try {
            // افترض أن العميل على تيليجرام
            const telegramManager = require('../clients/telegram/TelegramBotManager');
            await telegramManager.sendToClient(session.clientInfo.platformId, message, attachments);
        } catch (error) {
            console.error('فشل إرسال الرد للعميل:', error);
            // يمكن إضافة قنوات بديلة مثل البريد الإلكتروني
        }
    }

    // تحميل وكلاء الدعم
    async loadSupportAgents() {
        try {
            // في الواقع، تحميل من قاعدة البيانات
            const SupportAgent = require('../models/SupportAgent');
            const agents = await SupportAgent.find({ active: true });
            
            agents.forEach(agent => {
                this.supportAgents.set(agent.agentId, {
                    id: agent.agentId,
                    name: agent.name,
                    email: agent.email,
                    permissions: agent.permissions,
                    activeTickets: agent.activeTickets,
                    maxTickets: agent.maxTickets,
                    online: agent.online
                });
            });
        } catch (error) {
            console.error('فشل تحميل وكلاء الدعم:', error);
        }
    }

    // تعيين تذكرة لوكيل
    assignTicketToAgent(sessionId, agentId) {
        const encryptedSession = this.clientSessions.get(sessionId);
        if (!encryptedSession) return false;

        const session = this.decryptSessionData(encryptedSession);
        if (!session) return false;

        const agent = this.supportAgents.get(agentId);
        if (!agent || agent.activeTickets >= agent.maxTickets) return false;

        session.assignedAgent = agentId;
        agent.activeTickets++;

        // تحديث الجلسة
        const updatedEncryptedSession = this.encryptSessionData(session);
        this.clientSessions.set(sessionId, updatedEncryptedSession);

        this.emit('ticketAssigned', { session, agent });

        return true;
    }

    // تقييم الدعم
    async rateSupport(sessionId, rating, feedback = '') {
        const encryptedSession = this.clientSessions.get(sessionId);
        if (!encryptedSession) return false;

        const session = this.decryptSessionData(encryptedSession);
        if (!session) return false;

        session.rating = {
            score: rating,
            feedback: feedback,
            ratedAt: new Date()
        };

        session.status = 'closed';

        // تحديث الإحصائيات
        this.updateSatisfactionRate(rating);

        // تحديث الجلسة
        const updatedEncryptedSession = this.encryptSessionData(session);
        this.clientSessions.set(sessionId, updatedEncryptedSession);

        this.emit('supportRated', { session, rating });

        return true;
    }

    // تحديث معدل الرضا
    updateSatisfactionRate(newRating) {
        const totalRatings = this.stats.resolvedTickets;
        const currentRate = this.stats.satisfactionRate;
        
        this.stats.satisfactionRate = ((currentRate * totalRatings) + newRating) / (totalRatings + 1);
        this.stats.resolvedTickets++;
    }

    // تسجيل الرسالة
    async logMessage(session, messageData) {
        try {
            const SupportLog = require('../models/SupportLog');
            await SupportLog.create({
                sessionId: session.sessionId,
                anonymousId: session.anonymousId,
                ticketNumber: session.ticketNumber,
                messageId: messageData.messageId,
                direction: messageData.direction,
                content: messageData.content,
                attachments: messageData.attachments,
                timestamp: messageData.timestamp,
                agent: messageData.agent,
                isAutoResponse: messageData.isAutoResponse || false
            });
        } catch (error) {
            console.error('فشل تسجيل رسالة الدعم:', error);
        }
    }

    // تنظيف الجلسات المنتهية
    startSessionCleanup() {
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 60 * 60 * 1000); // كل ساعة
    }

    cleanupExpiredSessions() {
        const now = new Date();
        let cleanedCount = 0;

        for (const [sessionId, encryptedSession] of this.clientSessions.entries()) {
            const session = this.decryptSessionData(encryptedSession);
            if (!session) continue;

            if (now - session.lastActivity > this.config.sessionTimeout) {
                this.clientSessions.delete(sessionId);
                cleanedCount++;
                this.stats.activeSessions--;
            }
        }

        if (cleanedCount > 0) {
            console.log(`🧹 تم تنظيف ${cleanedCount} جلسة دعم منتهية`);
        }
    }

    // تحديث الإحصائيات
    startStatsUpdate() {
        setInterval(() => {
            this.updateStatistics();
        }, 5 * 60 * 1000); // كل 5 دقائق
    }

    updateStatistics() {
        // تحديث الإحصائيات الحية
        this.stats.activeSessions = this.clientSessions.size;
        
        // يمكن إضافة المزيد من الإحصائيات
    }

    // وظائف مساعدة
    getSessionDuration(session) {
        return Math.round((new Date() - session.createdAt) / (60 * 1000));
    }

    getActivityLevel(session) {
        const minutesSinceLastActivity = (new Date() - session.lastActivity) / (60 * 1000);
        if (minutesSinceLastActivity < 5) return 'نشط جداً';
        if (minutesSinceLastActivity < 30) return 'نشط';
        return 'هادئ';
    }

    // الحصول على إحصائيات الدعم
    getSupportStats() {
        return {
            ...this.stats,
            availableAgents: Array.from(this.supportAgents.values()).filter(a => a.online).length,
            totalAgents: this.supportAgents.size,
            sessionTimeout: this.config.sessionTimeout / (60 * 1000) + ' دقيقة'
        };
    }

    // البحث في الجلسات
    searchSessions(criteria) {
        const results = [];
        
        for (const [sessionId, encryptedSession] of this.clientSessions.entries()) {
            const session = this.decryptSessionData(encryptedSession);
            if (!session) continue;

            let match = true;

            if (criteria.category && session.category !== criteria.category) {
                match = false;
            }
            if (criteria.priority && session.priority !== criteria.priority) {
                match = false;
            }
            if (criteria.status && session.status !== criteria.status) {
                match = false;
            }
            if (criteria.agent && session.assignedAgent !== criteria.agent) {
                match = false;
            }

            if (match) {
                results.push({
                    sessionId: session.sessionId,
                    anonymousId: session.anonymousId,
                    ticketNumber: session.ticketNumber,
                    category: session.category,
                    priority: session.priority,
                    status: session.status,
                    createdAt: session.createdAt,
                    lastActivity: session.lastActivity,
                    messageCount: session.messageCount,
                    assignedAgent: session.assignedAgent
                });
            }
        }

        return results;
    }

    // تسجيل حدث أمني
    logSecurityEvent(eventType, details = {}) {
        const event = {
            type: eventType,
            timestamp: new Date().toISOString(),
            service: 'AnonymousSupport',
            details: details
        };

        this.emit('securityEvent', event);
    }
}

module.exports = AnonymousSupportService;