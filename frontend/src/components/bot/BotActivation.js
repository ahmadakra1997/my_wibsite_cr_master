// frontend/src/components/bot/BotActivation.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './BotActivation.css';

import { activateTradingBot, deactivateTradingBot, getBotStatus } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';

const fmtTime = (v) => {
  if (!v) return '—';
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  } catch {
    return String(v);
  }
};

export default function BotActivation() {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastActivation, setLastActivation] = useState(null);
  const [statusData, setStatusData] = useState(null);

  // WS الافتراضي: ws://.../ws/bot
  const { status: wsStatus, lastMessage } = useWebSocket();

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true);
    setError(null);
    try {
      const res = await getBotStatus();
      const data = res && typeof res === 'object' && 'success' in res ? (res.success ? res.data : null) : res;

      setStatusData(data || null);
      setIsActive(!!(data?.isActive ?? data?.active ?? data?.running));
    } catch (e) {
      setError(e?.message || 'Failed to fetch bot status');
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // تحديثات WS (اختياري)
  useEffect(() => {
    if (!lastMessage) return;

    const data = lastMessage;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'status_update' || data.type === 'bot_status') {
      setStatusData((prev) => ({ ...(prev || {}), ...data }));
      setIsActive(!!(data.isActive ?? data.active ?? data.running));
    }
  }, [lastMessage]);

  const onActivate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await activateTradingBot();
      if (res?.success === false) throw new Error(res?.message || 'Activation failed');

      setLastActivation(new Date().toISOString());
      await refreshStatus();
    } catch (e) {
      setError(e?.message || 'Failed to activate bot');
    } finally {
      setLoading(false);
    }
  };

  const onDeactivate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await deactivateTradingBot();
      if (res?.success === false) throw new Error(res?.message || 'Deactivation failed');

      setLastActivation(new Date().toISOString());
      await refreshStatus();
    } catch (e) {
      setError(e?.message || 'Failed to deactivate bot');
    } finally {
      setLoading(false);
    }
  };

  const badge = useMemo(() => {
    if (statusLoading) return { cls: 'is-wait', label: 'CHECKING' };
    return isActive ? { cls: 'is-on', label: 'ACTIVE' } : { cls: 'is-off', label: 'INACTIVE' };
  }, [isActive, statusLoading]);

  return (
    <div className="bot-activation">
      <div className="bot-activation__header">
        <div>
          <h2 className="bot-activation__title">Bot Activation</h2>
          <p className="bot-activation__subtitle">
            تشغيل/إيقاف البوت مع عرض الحالة والاتصال بالـ WebSocket.
          </p>
        </div>

        <div className={`bot-activation__badge ${badge.cls}`}>
          <span className="dot" />
          {badge.label}
        </div>
      </div>

      {error && (
        <div className="bot-activation__alert" role="alert">
          <div className="title">Error</div>
          <div className="desc">{String(error)}</div>
        </div>
      )}

      <div className="bot-activation__grid">
        <div className="card">
          <div className="card__title">Status</div>

          <div className="row">
            <span className="k">Bot</span>
            <span className="v">{statusLoading ? 'Loading…' : isActive ? 'Active' : 'Inactive'}</span>
          </div>

          <div className="row">
            <span className="k">WS</span>
            <span className="v">{wsStatus || 'idle'}</span>
          </div>

          <div className="row">
            <span className="k">Last Update</span>
            <span className="v">{fmtTime(statusData?.lastUpdate || statusData?.timestamp || lastActivation)}</span>
          </div>

          <div className="row">
            <span className="k">Balance</span>
            <span className="v mono">{statusData?.currentBalance ?? statusData?.balance ?? '—'}</span>
          </div>
        </div>

        <div className="card">
          <div className="card__title">Actions</div>

          <div className="actions">
            <button className="btn primary" onClick={onActivate} disabled={loading || isActive}>
              {loading && !isActive ? 'Activating…' : 'Activate Bot'}
            </button>

            <button className="btn ghost" onClick={onDeactivate} disabled={loading || !isActive}>
              {loading && isActive ? 'Deactivating…' : 'Deactivate Bot'}
            </button>

            <button className="btn" onClick={refreshStatus} disabled={loading}>
              Refresh Status
            </button>
          </div>

          <div className="hint">
            ملاحظة: إن لم يكن WS مفعّل، ستظل الحالة تعمل عبر API فقط.
          </div>
        </div>
      </div>
    </div>
  );
}
