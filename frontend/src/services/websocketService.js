// frontend/src/services/websocketService.js

/**
 * WebSocketService
 * خدمة موحّدة لإدارة اتصال WebSocket في الواجهة الأمامية.
 *
 * مميزات:
 * - إعادة اتصال تلقائية مع backoff بسيط.
 * - إدارة قائمة subscribers لكل نوع من الرسائل (channels).
 * - كشف حالة الاتصال (connecting / open / closed / error).
 *
 * طريقة الاستخدام:
 *  import websocketService from '../services/websocketService';
 *
 *  websocketService.subscribe('orderBook', (payload) => {
 *    // تحديث الـ store أو الحالة المحلية...
 *  });
 *
 *  websocketService.connect();
 */

class WebSocketService {
  constructor(options = {}) {
    this.url =
      options.url ||
      process.env.REACT_APP_WS_URL ||
      'wss://YOUR_BACKEND_WS_ENDPOINT';

    this.reconnectEnabled =
      typeof options.reconnectEnabled === 'boolean'
        ? options.reconnectEnabled
        : true;

    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.reconnectDelayBase = options.reconnectDelayBase || 1000; // ms

    this.ws = null;
    this.connectionStatus = 'disconnected'; // 'connecting' | 'open' | 'closed' | 'error'

    // subscribers: { [channel: string]: Set<function> }
    this.subscribers = {};

    // للأحداث العامة مثل: onStatusChange, onError, onRawMessage
    this.globalListeners = {
      statusChange: new Set(),
      error: new Set(),
      rawMessage: new Set(),
    };

    this.reconnectAttempts = 0;
    this.manualClose = false;
  }

  /**
   * فتح الاتصال إذا لم يكن مفتوحًا
   */
  connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.manualClose = false;
    this._updateStatus('connecting');

    try {
      this.ws = new WebSocket(this.url);
    } catch (error) {
      this._handleError(error);
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this._updateStatus('open');
    };

    this.ws.onmessage = (event) => {
      this._handleMessage(event);
    };

    this.ws.onerror = (event) => {
      this._handleError(event);
    };

    this.ws.onclose = () => {
      this._updateStatus('closed');
      this.ws = null;

      if (!this.manualClose && this.reconnectEnabled) {
        this._scheduleReconnect();
      }
    };
  }

  /**
   * إغلاق الاتصال يدويًا
   */
  close() {
    this.manualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._updateStatus('disconnected');
  }

  /**
   * إرسال رسالة عبر WebSocket
   */
  send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocketService] Trying to send while WS is not open.');
      return;
    }

    try {
      const payload =
        typeof message === 'string' ? message : JSON.stringify(message);
      this.ws.send(payload);
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * الاشتراك في channel معيّن (مثل: 'orderBook', 'trades', 'ticker')
   * @returns unsubscribe function
   */
  subscribe(channel, callback) {
    if (!channel || typeof callback !== 'function') {
      console.warn('[WebSocketService] Invalid subscribe call.');
      return () => {};
    }

    if (!this.subscribers[channel]) {
      this.subscribers[channel] = new Set();
    }
    this.subscribers[channel].add(callback);

    // تُعيد دالة لإلغاء الاشتراك
    return () => {
      this.subscribers[channel].delete(callback);
      if (this.subscribers[channel].size === 0) {
        delete this.subscribers[channel];
      }
    };
  }

  /**
   * الاشتراك في أحداث عامة مثل تغيّر حالة الاتصال
   * type: 'statusChange' | 'error' | 'rawMessage'
   */
  on(type, callback) {
    if (!this.globalListeners[type] || typeof callback !== 'function') {
      console.warn('[WebSocketService] Invalid global listener type:', type);
      return () => {};
    }
    this.globalListeners[type].add(callback);
    return () => {
      this.globalListeners[type].delete(callback);
    };
  }

  /**
   * حالة الاتصال الحالية
   */
  getStatus() {
    return this.connectionStatus;
  }

  // -------------------------
  //   Internal helpers
  // -------------------------

  _updateStatus(status) {
    if (this.connectionStatus === status) return;
    this.connectionStatus = status;

    this.globalListeners.statusChange.forEach((cb) => {
      try {
        cb(status);
      } catch (e) {
        console.error('[WebSocketService] statusChange listener error:', e);
      }
    });
  }

  _handleMessage(event) {
    let data = event.data;

    this.globalListeners.rawMessage.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error('[WebSocketService] rawMessage listener error:', e);
      }
    });

    try {
      data = JSON.parse(event.data);
    } catch {
      // إذا كان النص ليس JSON، نُمرره كما هو لقناة 'raw'
      const rawSubscribers = this.subscribers.raw;
      if (rawSubscribers) {
        rawSubscribers.forEach((cb) => {
          try {
            cb(event.data);
          } catch (e) {
            console.error('[WebSocketService] raw subscriber error:', e);
          }
        });
      }
      return;
    }

    /**
     * نتوقع هيكل رسائل مثل:
     * {
     *   channel: 'orderBook' | 'trades' | 'ticker' | ...,
     *   payload: {...}
     * }
     */
    const { channel, payload } = data;

    if (!channel || !this.subscribers[channel]) {
      return;
    }

    this.subscribers[channel].forEach((cb) => {
      try {
        cb(payload);
      } catch (error) {
        console.error(
          `[WebSocketService] Error in subscriber for channel "${channel}":`,
          error,
        );
      }
    });
  }

  _handleError(error) {
    console.error('[WebSocketService] Error:', error);
    this._updateStatus('error');

    this.globalListeners.error.forEach((cb) => {
      try {
        cb(error);
      } catch (e) {
        console.error('[WebSocketService] error listener error:', e);
      }
    });
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(
        '[WebSocketService] Max reconnect attempts reached, giving up.',
      );
      return;
    }

    this.reconnectAttempts += 1;
    const delay =
      this.reconnectDelayBase * this.reconnectAttempts; // backoff بسيط

    console.info(
      `[WebSocketService] Scheduling reconnect #${this.reconnectAttempts} in ${delay}ms`,
    );

    setTimeout(() => {
      this.connect();
    }, delay);
  }
}

// إنشاء instance واحدة مشتركة في المشروع كله
const websocketService = new WebSocketService();

export default websocketService;
