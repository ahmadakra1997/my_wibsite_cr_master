/**
 * مدير WebSocket للبوت المتقدم
 * إدارة شاملة لأحداث البوت عبر WebSocket
 */

class BotWebSocketManager {
    constructor(webSocketService) {
        this.wsService = webSocketService;
        this.botEvents = new Map();
        this.setupBotEventHandlers();
    }

    /**
     * إعداد معالجات أحداث البوت
     */
    setupBotEventHandlers() {
        // أحداث البوت الأساسية
        this.botEvents.set('bot_activated', this.handleBotActivated.bind(this));
        this.botEvents.set('bot_deactivated', this.handleBotDeactivated.bind(this));
        this.botEvents.set('trade_executed', this.handleTradeExecuted.bind(this));
        this.botEvents.set('trade_updated', this.handleTradeUpdated.bind(this));
        this.botEvents.set('performance_updated', this.handlePerformanceUpdated.bind(this));
        this.botEvents.set('error_occurred', this.handleErrorOccurred.bind(this));
        this.botEvents.set('settings_updated', this.handleSettingsUpdated.bind(this));
    }

    /**
     * بث حدث البوت إلى جميع العملاء المعنيين
     */
    broadcastBotEvent(userId, eventType, data, options = {}) {
        const event = {
            type: eventType,
            data,
            timestamp: new Date(),
            eventId: this.generateEventId(),
            ...options
        };

        // البث عبر القنوات المختلفة
        const channels = this.getChannelsForBotEvent(eventType, userId);
        let totalSent = 0;

        channels.forEach(channel => {
            const sent = this.wsService.broadcastToChannel(channel, event, {
                priority: options.priority || 'normal',
                persistent: options.persistent || false
            });
            totalSent += sent;
        });

        // البث المباشر إلى المستخدم
        const userSent = this.wsService.broadcastToUser(userId, event, channels);
        totalSent += userSent;

        console.log(`📢 بث حدث ${eventType} إلى ${totalSent} عميل`);
        return totalSent;
    }

    /**
     * الحصول على القنوات المناسبة لحدث البوت
     */
    getChannelsForBotEvent(eventType, userId) {
        const baseChannels = [`user-${userId}`, `bot-${userId}`];
        
        switch (eventType) {
            case 'bot_activated':
            case 'bot_deactivated':
                return [...baseChannels, 'bot-status'];
                
            case 'trade_executed':
            case 'trade_updated':
                return [...baseChannels, 'trading-updates'];
                
            case 'performance_updated':
                return [...baseChannels, 'performance-metrics'];
                
            case 'error_occurred':
                return [...baseChannels, 'notifications'];
                
            case 'settings_updated':
                return baseChannels;
                
            default:
                return baseChannels;
        }
    }

    /**
     * معالجة تفعيل البوت
     */
    handleBotActivated(userId, botData) {
        return this.broadcastBotEvent(userId, 'bot_activated', {
            botId: botData.botId,
            activationTime: botData.activationTime,
            status: 'active',
            message: 'تم تفعيل البوت بنجاح'
        }, {
            priority: 'high',
            persistent: true
        });
    }

    /**
     * معالجة إيقاف البوت
     */
    handleBotDeactivated(userId, botData) {
        return this.broadcastBotEvent(userId, 'bot_deactivated', {
            botId: botData.botId,
            deactivationTime: botData.deactivationTime,
            status: 'inactive',
            runtime: botData.runtime,
            message: 'تم إيقاف البوت'
        }, {
            priority: 'high',
            persistent: true
        });
    }

    /**
     * معالجة تنفيذ صفقة
     */
    handleTradeExecuted(userId, tradeData) {
        return this.broadcastBotEvent(userId, 'trade_executed', {
            tradeId: tradeData.tradeId,
            pair: tradeData.pair,
            type: tradeData.type,
            amount: tradeData.amount,
            price: tradeData.price,
            profit: tradeData.profit,
            timestamp: tradeData.timestamp
        }, {
            priority: 'high'
        });
    }

    /**
     * معالجة تحديث الصفقة
     */
    handleTradeUpdated(userId, tradeData) {
        return this.broadcastBotEvent(userId, 'trade_updated', {
            tradeId: tradeData.tradeId,
            status: tradeData.status,
            currentProfit: tradeData.currentProfit,
            exitPrice: tradeData.exitPrice,
            updateReason: tradeData.updateReason
        });
    }

    /**
     * معالجة تحديث الأداء
     */
    handlePerformanceUpdated(userId, performanceData) {
        return this.broadcastBotEvent(userId, 'performance_updated', {
            metrics: performanceData.metrics,
            timeframe: performanceData.timeframe,
            timestamp: performanceData.timestamp,
            summary: performanceData.summary
        });
    }

    /**
     * معالجة الأخطاء
     */
    handleErrorOccurred(userId, errorData) {
        return this.broadcastBotEvent(userId, 'error_occurred', {
            errorCode: errorData.code,
            errorMessage: errorData.message,
            severity: errorData.severity,
            component: errorData.component,
            timestamp: errorData.timestamp,
            suggestions: errorData.suggestions
        }, {
            priority: 'urgent',
            persistent: true
        });
    }

    /**
     * معالجة تحديث الإعدادات
     */
    handleSettingsUpdated(userId, settingsData) {
        return this.broadcastBotEvent(userId, 'settings_updated', {
            settingsId: settingsData.settingsId,
            changes: settingsData.changes,
            updatedAt: settingsData.updatedAt,
            version: settingsData.version
        });
    }

    /**
     * إرسال تحديث حالة البوت الحية
     */
    sendLiveBotStatus(userId, statusData) {
        return this.broadcastBotEvent(userId, 'live_status_update', {
            isActive: statusData.isActive,
            uptime: statusData.uptime,
            activeTrades: statusData.activeTrades,
            equity: statusData.equity,
            performance: statusData.performance,
            lastUpdate: statusData.lastUpdate
        });
    }

    /**
     * إرسال إشعارات للمستخدم
     */
    sendUserNotification(userId, notification) {
        const event = {
            type: 'user_notification',
            data: {
                id: this.generateEventId(),
                title: notification.title,
                message: notification.message,
                type: notification.type,
                priority: notification.priority || 'normal',
                actions: notification.actions || [],
                timestamp: new Date()
            }
        };

        return this.wsService.broadcastToUser(userId, event, ['notifications']);
    }

    /**
     * توليد معرف حدث فريد
     */
    generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * الحصول على إحصائيات البث
     */
    getBroadcastStats() {
        return {
            totalEvents: this.botEvents.size,
            activeHandlers: Array.from(this.botEvents.keys()),
            serviceStatus: this.wsService ? 'connected' : 'disconnected'
        };
    }
}

module.exports = BotWebSocketManager;
