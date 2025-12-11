// src/hooks/useWebSocket.js
// هوك موحد لاتصال WebSocket مع الباكيند (قناة البوت مثلاً)

import { useCallback, useEffect, useRef, useState } from 'react';

// نبني URL افتراضي للـ WebSocket من REACT_APP_WS_BOT_URL أو من REACT_APP_API_BASE_URL
function buildDefaultWsUrl() {
  if (process.env.REACT_APP_WS_BOT_URL) {
    return process.env.REACT_APP_WS_BOT_URL;
  }

  const httpBase =
    process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  // تحويل http -> ws و حذف /api في النهاية إن وجدت
  let url = httpBase.replace(/^http/i, 'ws');
  url = url.replace(/\/api\/?$/, '');
  return `${url}/ws/bot`;
}

const DEFAULT_WS_URL = buildDefaultWsUrl();

/**
 * useWebSocket
 *
 * @param {Object} options
 * @param {string} options.url - عنوان الـ WebSocket (اختياري)
 * @param {boolean} options.autoReconnect - إعادة الاتصال تلقائيًا
 * @param {number} options.reconnectInterval - زمن الانتظار قبل إعادة الاتصال
 */
export function useWebSocket(options = {}) {
  const {
    url = DEFAULT_WS_URL,
    autoReconnect = true,
    reconnectInterval = 5000,
  } = options;

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle | connecting | open | closed | error
  const [lastMessage, setLastMessage] = useState(null);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    cleanup();
    setStatus('connecting');

    try {
      const socket = new WebSocket(url);
      wsRef.current = socket;

      socket.onopen = () => {
        setStatus('open');
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
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch (e) {
          setLastMessage(event.data);
        }
      };
    } catch (error) {
      console.error('[WebSocket connect error]', error);
      setStatus('error');
    }
  }, [autoReconnect, reconnectInterval, cleanup, url]);

  useEffect(() => {
    connect();
    return () => {
      autoReconnect && cleanup();
    };
  }, [autoReconnect, cleanup, connect]);

  const sendJson = useCallback((payload) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] محاولة إرسال والاتصال غير مفتوح');
      return;
    }
    try {
      wsRef.current.send(JSON.stringify(payload));
    } catch (error) {
      console.error('[WebSocket send error]', error);
    }
  }, []);

  return {
    status,
    lastMessage,
    sendJson,
    reconnect: connect,
  };
}
