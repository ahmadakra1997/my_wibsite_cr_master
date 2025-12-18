// frontend/src/hooks/useWebSocket.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const normalizeBase = (raw) => String(raw || '').trim().replace(/\/+$/, '');

export function useWebSocket(channel) {
  const socketRef = useRef(null);
  const aliveRef = useRef(true);

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);

  const base = normalizeBase(process.env.REACT_APP_WS_URL || 'ws://localhost:8000');
  const url = useMemo(() => `${base}/ws/${channel}`, [base, channel]);

  const connect = useCallback(() => {
    try {
      setError(null);

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;

      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!aliveRef.current) return;
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        if (!aliveRef.current) return;
        setLastMessage(event);
      };

      ws.onerror = () => {
        if (!aliveRef.current) return;
        setError('WebSocket error');
      };

      ws.onclose = () => {
        if (!aliveRef.current) return;
        setIsConnected(false);
      };
    } catch (e) {
      setError(e?.message || 'Failed to connect');
    }
  }, [url]);

  const disconnect = useCallback(() => {
    const ws = socketRef.current;
    if (!ws) return;
    try {
      ws.close();
    } catch {
      // ignore
    } finally {
      socketRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message) => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;

    try {
      ws.send(typeof message === 'string' ? message : JSON.stringify(message));
      return true;
    } catch (e) {
      setError(e?.message || 'Send failed');
      return false;
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    connect();

    return () => {
      aliveRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  return { isConnected, lastMessage, error, sendMessage, disconnect };
}
