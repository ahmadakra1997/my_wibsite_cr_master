// frontend/src/services/websocketService.js
/**
 * WebSocketService
 * خدمة موحّدة لإدارة اتصال WebSocket في الواجهة الأمامية.
 *
 * ✅ تحسينات احترافية بدون كسر:
 * - Queue للرسائل لو الاتصال غير Open
 * - Aliases شائعة (subscribeToChannel / sendJson / isConnected)
 * - parsing أوسع (channel/type/event/topic)
 * - backoff مع jitter
 * - Guards إضافية لتفادي crash في بيئات لا تدعم WebSocket
 */

const resolveWsUrl = () => {
  const envWs = process.env.REACT_APP_WS_URL;
  if (envWs) return envWs;

  const apiUrl =
    process.env.REACT_APP_API_URL ||
    process.env.REACT_APP_BACKEND_URL ||
    process.env.REACT_APP_BASE_URL;

  if (apiUrl) {
    const wsBase = apiUrl.replace(/^http/i, 'ws').replace(/\/+$/, '');
    return `${wsBase}/ws`;
  }

  if (typeof window !== 'undefined' && window.location) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/ws`;
  }

  return 'ws://localhost:8000/ws';
};

class WebSocketService {
  constructor(options = {}) {
    this.url = options.url || resolveWsUrl();

    this.reconnectEnabled =
      typeof options.reconnectEnabled === 'boolean' ? options.reconnectEnabled : true;

    this.maxReconnectAttempts = Number.isFinite(options.maxReconnectAttempts)
      ? options.maxReconnectAttempts
      : 10;

    this.reconnectDelayBase = Number.isFinite(options.reconnectDelayBase)
      ? options.reconnectDelayBase
      : 1000;

    this.ws = null;
    this.connectionStatus = 'disconnected'; // connecting | open | closed | error | disconnected

    this.subscribers = {}; // { [channel]: Set<fn> }
    this.globalListeners = {
      statusChange: new Set(),
      error: new Set(),
      rawMessage: new Set(),
    };

    this.reconnectAttempts = 0;
    this.manualClose = false;

    // ✅ Queue للرسائل قبل فتح الاتصال
    this._sendQueue = [];
    this._maxQueue = 200;
  }

  setUrl(nextUrl) {
    if (nextUrl) this.url = nextUrl;
  }

  getUrl() {
    return this.url;
  }

  isConnected() {
    return this.connectionStatus === 'open';
  }

  connect(nextUrl) {
    if (nextUrl) this.url = nextUrl;

    // ✅ Guard: بيئات بدون WebSocket
    if (typeof WebSocket === 'undefined') {
      this._handleError(new Error('WebSocket is not available in this environment.'));
      return;
    }

    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
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
      this._flushQueue();
    };

    this.ws.onmessage = (event) => this._handleMessage(event);
    this.ws.onerror = (event) => this._handleError(event);

    this.ws.onclose = () => {
      this._updateStatus('closed');
      this.ws = null;

      if (!this.manualClose && this.reconnectEnabled) {
        this._scheduleReconnect();
      }
    };
  }

  close() {
    this.manualClose = true;

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }

    this._updateStatus('disconnected');
  }

  // Alias آمن
  disconnect() {
    this.close();
  }

  // ✅ Alias إضافي شائع
  destroy() {
    this.close();
  }

  send(message) {
    // ✅ Guard: بيئات بدون WebSocket
    if (typeof WebSocket === 'undefined') {
      this._enqueue(message);
      this._handleError(new Error('WebSocket is not available in this environment.'));
      return;
    }

    // ✅ بدل ما نفشل: نخزن بالـ Queue ثم نرسل عند open
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this._enqueue(message);
      if (this.connectionStatus !== 'open') this.connect();
      return;
    }

    try {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      this.ws.send(payload);
    } catch (error) {
      this._handleError(error);
    }
  }

  // ✅ Alias شائع
  sendJson(obj) {
    this.send(obj);
  }

  // ✅ Alias شائع (بعض الأكواد تتوقع boolean)
  sendMessage(message) {
    try {
      this.send(message);
      return true;
    } catch {
      return false;
    }
  }

  subscribe(channel, callback, options = {}) {
    if (!channel || typeof callback !== 'function') {
      console.warn('[WebSocketService] Invalid subscribe call.');
      return () => {};
    }

    const autoConnect = options.autoConnect !== false;
    if (autoConnect && this.connectionStatus !== 'open') this.connect();

    if (!this.subscribers[channel]) this.subscribers[channel] = new Set();
    this.subscribers[channel].add(callback);

    return () => {
      this.subscribers[channel]?.delete(callback);
      if (this.subscribers[channel] && this.subscribers[channel].size === 0) {
        delete this.subscribers[channel];
      }
    };
  }

  // ✅ Alias للتوافق مع تسميات أخرى
  subscribeToChannel(channel, callback, options = {}) {
    return this.subscribe(channel, callback, options);
  }

  // ✅ Alias إضافي
  subscribeChannel(channel, callback, options = {}) {
    return this.subscribe(channel, callback, options);
  }

  // ✅ Unsubscribe مباشر (بدون كسر الـ unsubscribe function اللي يرجعها subscribe)
  unsubscribe(channel, callback) {
    if (!channel || typeof callback !== 'function') return;
    this.subscribers[channel]?.delete(callback);
    if (this.subscribers[channel] && this.subscribers[channel].size === 0) {
      delete this.subscribers[channel];
    }
  }

  on(type, callback) {
    if (!this.globalListeners[type] || typeof callback !== 'function') {
      console.warn('[WebSocketService] Invalid global listener type:', type);
      return () => {};
    }

    this.globalListeners[type].add(callback);
    return () => this.globalListeners[type].delete(callback);
  }

  // ✅ Alias إضافي
  addListener(type, callback) {
    return this.on(type, callback);
  }

  // ✅ Off مباشر
  off(type, callback) {
    if (!this.globalListeners[type] || typeof callback !== 'function') return;
    this.globalListeners[type].delete(callback);
  }

  getStatus() {
    return this.connectionStatus;
  }

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

  _emitChannel(channel, payload) {
    const subs = this.subscribers[channel];
    if (!subs) return;

    subs.forEach((cb) => {
      try {
        cb(payload);
      } catch (error) {
        console.error(`[WebSocketService] Error in subscriber for "${channel}":`, error);
      }
    });
  }

  _handleMessage(event) {
    const raw = event?.data;

    this.globalListeners.rawMessage.forEach((cb) => {
      try {
        cb(raw);
      } catch (e) {
        console.error('[WebSocketService] rawMessage listener error:', e);
      }
    });

    let data = raw;
    try {
      data = JSON.parse(raw);
    } catch {
      this._emitChannel('raw', raw);
      return;
    }

    // يدعم: channel/type/event/topic
    const channel = data?.channel || data?.type || data?.event || data?.topic;
    const payload = data?.payload ?? data?.data ?? data;

    if (!channel) {
      this._emitChannel('raw', data);
      return;
    }

    this._emitChannel(channel, payload);
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
      console.warn('[WebSocketService] Max reconnect attempts reached, giving up.');
      return;
    }

    this.reconnectAttempts += 1;

    // ✅ jitter
    const base = this.reconnectDelayBase * this.reconnectAttempts;
    const jitter = Math.floor(Math.random() * 250);
    const delay = base + jitter;

    setTimeout(() => this.connect(), delay);
  }

  _enqueue(message) {
    if (this._sendQueue.length >= this._maxQueue) {
      this._sendQueue.shift(); // drop oldest
    }
    this._sendQueue.push(message);
  }

  _flushQueue() {
    if (typeof WebSocket === 'undefined') return;
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    while (this._sendQueue.length) {
      const msg = this._sendQueue.shift();
      try {
        const payload = typeof msg === 'string' ? msg : JSON.stringify(msg);
        this.ws.send(payload);
      } catch (e) {
        // إذا فشل إرسال رسالة لا نوقف بقية النظام
        console.warn('[WebSocketService] Failed to flush queued message:', e);
      }
    }
  }
}

const websocketService = new WebSocketService();
export default websocketService;
export { WebSocketService };
