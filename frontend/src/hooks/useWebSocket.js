// frontend/src/hooks/useWebSocket.js
// ✅ Hook موحد لاتصال WebSocket (يدعم: useWebSocket('channel') أو useWebSocket({options}))

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function buildDefaultWsUrl() {
  if (process.env.REACT_APP_WS_BOT_URL) return process.env.REACT_APP_WS_BOT_URL;

  const httpBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
  let url = httpBase.replace(/^http/i, 'ws');
  url = url.replace(/\/api\/?$/, '');
  return `${url}/ws/bot`;
}

const DEFAULT_WS_URL = buildDefaultWsUrl();

function normalizeArgs(arg1, arg2) {
  // useWebSocket('bot-status', { ... })
  if (typeof arg1 === 'string') {
    return { channel: arg1, ...(arg2 || {}) };
  }
  // useWebSocket({ ... })
  return { ...(arg1 || {}) };
}

export function useWebSocket(arg1 = {}, arg2 = {}) {
  const opts = useMemo(() => normalizeArgs(arg1, arg2), [arg1, arg2]);

  const {
    url = DEFAULT_WS_URL,
    channel = null,
    autoReconnect = true,
    reconnectInterval = 5000,
  } = opts;

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle | connecting | open | closed | error
  const [lastMessage, setLastMessage] = useState(null); // { data: string, json: object|null, channel?: string }

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const ws = wsRef.current;
    if (ws) {
      ws.onopen = null;
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;

      try {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      } catch (_) {}

      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    cleanup();
    setStatus('connecting');

    try {
      const finalUrl = channel
        ? `${url}${url.includes('?') ? '&' : '?'}channel=${encodeURIComponent(channel)}`
        : url;

      const socket = new WebSocket(finalUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setStatus('open');

        // (اختياري) رسالة اشتراك — إذا الباكيند يدعمها
        if (channel) {
          try {
            socket.send(JSON.stringify({ type: 'subscribe', channel }));
          } catch (_) {}
        }
      };

      socket.onclose = () => {
        setStatus('closed');

        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      socket.onerror = (err) => {
        console.error('[WebSocket error]', err);
        setStatus('error');
      };

      socket.onmessage = (event) => {
        const raw = event?.data;
        let parsed = null;

        try {
          parsed = JSON.parse(raw);
        } catch (_) {
          parsed = null;
        }

        // ✅ نوحّد شكل الرسالة ليصبح lastMessage.data متوفر (كما تتوقع BotSettings/BotActivation)
        setLastMessage({
          data: typeof raw === 'string' ? raw : String(raw),
          json: parsed,
          channel: channel || null,
        });
      };
    } catch (error) {
      console.error('[WebSocket connect error]', error);
      setStatus('error');
    }
  }, [autoReconnect, channel, cleanup, reconnectInterval, url]);

  useEffect(() => {
    connect();
    return () => cleanup(); // ✅ دائمًا نغلق الاتصال عند unmount
  }, [connect, cleanup]);

  const sendJson = useCallback((payload) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] محاولة إرسال والاتصال غير مفتوح');
      return false;
    }
    try {
      ws.send(JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error('[WebSocket send error]', error);
      return false;
    }
  }, []);

  return {
    status,
    lastMessage, // { data, json, channel }
    sendJson,
    reconnect: connect,
  };
}
