/**
 * نقطة الدخول لخدمات WebSocket
 */

const QuantumWebSocketService = require('./QuantumWebSocketService');
const BotWebSocketManager = require('./BotWebSocketManager');

class WebSocketIntegration {
    constructor(server) {
        this.webSocketService = new QuantumWebSocketService(server);
        this.botManager = new BotWebSocketManager(this.webSocketService);
        
        console.log('🚀 نظام WebSocket المتكامل جاهز للعمل');
    }

    /**
     * الحصول على خدمة WebSocket
     */
    getWebSocketService() {
        return this.webSocketService;
    }

    /**
     * الحصول على مدير البوت
     */
    getBotManager() {
        return this.botManager;
    }

    /**
     * بث حدث بوت
     */
    broadcastBotEvent(userId, eventType, data, options) {
        return this.botManager.broadcastBotEvent(userId, eventType, data, options);
    }

    /**
     * إرسال إشعار للمستخدم
     */
    sendNotification(userId, notification) {
        return this.botManager.sendUserNotification(userId, notification);
    }

    /**
     * الحصول على إحصائيات النظام
     */
    getStats() {
        return {
            webSocket: this.webSocketService.getSystemStats(),
            botManager: this.botManager.getBroadcastStats(),
            timestamp: new Date()
        };
    }

    /**
     * إغلاق النظام
     */
    shutdown() {
        console.log('🔄 إغلاق نظام WebSocket...');
        
        // إغلاق جميع الاتصالات
        this.webSocketService.connections.forEach((session, id) => {
            this.webSocketService.handleQuantumClose(session, 1000, 'Server shutdown');
        });

        console.log('✅ تم إغلاق نظام WebSocket بنجاح');
    }
}

module.exports = WebSocketIntegration;
