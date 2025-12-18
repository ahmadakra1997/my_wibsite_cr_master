// frontend/src/services/websocketService.js
/**
 * WebSocketService
 * خدمة موحّدة لإدارة اتصال WebSocket في الواجهة الأمامية.
 *
 * مميزات:
 * - URL ذكي (env -> API URL -> نفس الدومين)
 * - إعادة اتصال تلقائية backoff + jitter
 * - Subscribers حسب القناة
 * - يدعم عدة أشكال رسائل من الباكيند (channel/payload أو type/data)
 * - Queue للرسائل قبل فتح الاتصال (حتى لا تضيع)
 * - Ping اختياري للحفاظ على الاتصال (إذا الباكيند يدعمه)
 */

const resolveWsUrl = () => {
  // 1) Explicit WS url
  const envWs = process.env.REACT_APP_WS_URL;
  if (envWs) return envWs;

  // 2) Derive from API url
  const apiUrl =
    process.env.REACT_APP_API_URL ||
    process.env.REACT_APP_BACKEND_URL ||
    process.env.REACT_APP_BASE_URL;

  if (apiUrl) {
    const wsBase = apiUrl.replace(/^http/i, 'ws').replace(/\/+$/, '');
    return `${wsBase}/ws`;
  }

  // 3) Fallback: same host (dev/prod)
  if (typeof window !== 'undefined' && window.location) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/ws`;
  }

  // 4) آخر حل
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

    this.reconnectDelayMax = Number.isFinite(options.reconnectDelayMax)
      ? options.reconnectDelayMax
      : 15000;

    // Ping (اختياري)
    this.pingEnabled =
      typeof options.pingEnabled === 'boolean' ? options.pingEnabled : false;

    this.pingIntervalMs = Number.isFinite(options.pingIntervalMs)
      ? options.pingIntervalMs
      : 25000;

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

    // رسائل قبل فتح الاتصال
    this.messageQueue = [];
    this.maxQueueSize = Number.isFinite(options.maxQueueSize) ? options.maxQueueSize : 200;

    this._pingTimer = null;
    this._lastConnectTs = 0;
  }

  connect(nextUrl) {
    if (nextUrl) this.url = nextUrl;

    // Prevent double connect
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.manualClose = false;
    this._lastConnectTs = Date.now();
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

      // Flush queued messages
      this._flushQueue();

      // Start ping if enabled
      this._startPing();
    };

    this.ws.onmessage = (event) => this._handleMessage(event);
    this.ws.onerror = (event) => this._handleError(event);

    this.ws.onclose = () => {
      this._stopPing();
      this._updateStatus('closed');
      this.ws = null;

      if (!this.manualClose && this.reconnectEnabled) {
        this._scheduleReconnect();
      } else if (this.manualClose) {
        this._updateStatus('disconnected');
      }
    };
  }

  close() {
    this.manualClose = true;
    this._stopPing();

    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    this._updateStatus('disconnected');
  }

  // Alias آمن (لو أي كود يستعمل disconnect)
  disconnect() {
    this.close();
  }

  send(message) {
    // إذا غير مفتوح: خزّنه (Queue) بدل ما يضيع
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this._enqueue(message);
      // وجرّب connect تلقائيًا لو مو شغال
      if (this.connectionStatus !== 'connecting' && this.connectionStatus !== 'open') {
        this.connect();
      }
      return;
    }

    try {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      this.ws.send(payload);
    } catch (error) {
      this._handleError(error);
    }
  }

  subscribe(channel, callback, options = {}) {
    if (!channel || typeof callback !== 'function') {
      console.warn('[WebSocketService] Invalid subscribe call.');
      return () => {};
    }

    // Auto-connect افتراضيًا
    const autoConnect = options.autoConnect !== false;
    if (autoConnect && this.connectionStatus !== 'open') this.connect();

    if (!this.subscribers[channel]) this.subscribers[channel] = new Set();
    this.subscribers[channel].add(callback);

    // Optional: tell backend subscribe (لو الباكيند يدعم)
    if (options.backendSubscribe) {
      this.send({ action: 'subscribe', channel });
    }

    return () => {
      this.subscribers[channel]?.delete(callback);
      if (this.subscribers[channel] && this.subscribers[channel].size === 0) {
        delete this.subscribers[channel];
      }

      // Optional: tell backend unsubscribe
      if (options.backendSubscribe) {
        this.send({ action: 'unsubscribe', channel });
      }
    };
  }

  on(type, callback) {
    if (!this.globalListeners[type] || typeof callback !== 'function') {
      console.warn('[WebSocketService] Invalid global listener type:', type);
      return () => {};
    }

    this.globalListeners[type].add(callback);
    return () => this.globalListeners[type].delete(callback);
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

  _enqueue(message) {
    if (this.messageQueue.length >= this.maxQueueSize) {
      this.messageQueue.shift(); // drop oldest
    }
    this.messageQueue.push(message);
  }

  _flushQueue() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (!this.messageQueue.length) return;

    const queue = [...this.messageQueue];
    this.messageQueue = [];

    queue.forEach((m) => {
      try {
        const payload = typeof m === 'string' ? m : JSON.stringify(m);
        this.ws.send(payload);
      } catch (e) {
        // لو فشل، رجّعه للـ queue
        this._enqueue(m);
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

    // غير JSON => قناة raw
    let data = raw;
    try {
      data = JSON.parse(raw);
    } catch {
      this._emitChannel('raw', raw);
      return;
    }

    // يدعم:
    // { channel, payload }  |  { type, data }  |  { event, ... }
    const channel = data?.channel || data?.type || data?.event;
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

    // backoff + jitter
    const baseDelay = Math.min(
      this.reconnectDelayMax,
      this.reconnectDelayBase * this.reconnectAttempts
    );

    const jitter = Math.floor(Math.random() * 250);
    const delay = baseDelay + jitter;

    console.info(
      `[WebSocketService] Scheduling reconnect #${this.reconnectAttempts} in ${delay}ms`
    );

    setTimeout(() => {
      if (!this.manualClose) this.connect();
    }, delay);
  }

  _startPing() {
    if (!this.pingEnabled) return;
    this._stopPing();

    this._pingTimer = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      // Ping بسيط — عدّل لو الباكيند عندك يحتاج صيغة أخرى
      this.send({ type: 'ping', ts: Date.now() });
    }, this.pingIntervalMs);
  }

  _stopPing() {
    if (this._pingTimer) {
      clearInterval(this._pingTimer);
      this._pingTimer = null;
    }
  }
}

const websocketService = new WebSocketService();
export default websocketService;
