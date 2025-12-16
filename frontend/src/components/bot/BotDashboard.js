// frontend/src/components/bot/BotDashboard.js
import React, { useEffect } from "react";

import "../../styles/bot-integration.css";
import "./BotDashboard.css"; // إذا كان فاضي ما في مشكلة

import BotStatus from "./BotStatus";
import BotActivation from "./BotActivation";
import BotPerformance from "./BotPerformance";
import BotSettings from "./BotSettings";
import BotControls from "./BotControls";
import BotHistory from "./BotHistory";

import { useBot } from "../../context/BotContext";

export default function BotDashboard() {
  const {
    botStatus,
    hasActiveBot,
    loadBotStatus,
    loadBotPerformance,
    loadBotHistory,
    loading,
    error,
  } = useBot();

  useEffect(() => {
    // ضمان تحديث الداتا عند فتح الداشبورد
    loadBotStatus?.();
    loadBotPerformance?.();
    loadBotHistory?.();
  }, [loadBotStatus, loadBotPerformance, loadBotHistory]);

  return (
    <section className="bot-management-section">
      <div className="section-header">
        <h2>لوحة إدارة البوت</h2>

        <div className="bot-system-status">
          <span className={`status-indicator ${hasActiveBot ? "active" : ""}`} />
          <span>{hasActiveBot ? "نشط" : "غير نشط"}</span>

          <button
            className="quick-action-btn info"
            onClick={() => {
              loadBotStatus?.();
              loadBotPerformance?.();
              loadBotHistory?.();
            }}
            disabled={Boolean(loading)}
            type="button"
            style={{ marginInlineStart: 10 }}
          >
            {loading ? "..." : "تحديث الكل"}
          </button>
        </div>
      </div>

      {error ? <div className="bot-loading-fallback">⚠️ {String(error)}</div> : null}

      <div className="bot-components-grid">
        <div className="bot-component-card">
          <BotStatus status={botStatus} />
        </div>

        <div className="bot-component-card">
          <BotActivation />
        </div>

        <div className="bot-component-card">
          <BotControls />
        </div>

        <div className="bot-component-card">
          <BotPerformance />
        </div>

        <div className="bot-component-card" style={{ gridColumn: "1 / -1" }}>
          <BotHistory />
        </div>

        <div className="bot-component-card" style={{ gridColumn: "1 / -1" }}>
          <BotSettings />
        </div>
      </div>
    </section>
  );
}
