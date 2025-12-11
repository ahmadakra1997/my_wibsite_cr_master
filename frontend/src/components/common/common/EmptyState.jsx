// frontend/src/components/common/EmptyState.jsx
import React from 'react';

/**
 * EmptyState
 * مكوّن عام لعرض حالة عدم وجود بيانات (مراكز، أوامر، ...).
 * يُستخدم حالياً في:
 * - PositionManager (type="positions")
 */
const TYPE_CONFIG = {
  positions: {
    icon: '📂',
    title: 'لا توجد مراكز حالياً',
    description: 'ابدأ بفتح مركز جديد من شاشة التداول أو من استراتيجيات البوت.',
    actionText: 'بدء التداول',
    minHeight: 360,
  },
  default: {
    icon: '📄',
    title: 'لا توجد بيانات للعرض',
    description: 'لم يتم العثور على عناصر مطابقة في الوقت الحالي.',
    actionText: 'تحديث',
    minHeight: 260,
  },
};

const EmptyState = ({
  type = 'default',
  message,
  actionText,
  onAction,
  height,
}) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.default;

  const containerStyle = {
    direction: 'rtl',
    minHeight: height || config.minHeight,
    padding: '1.5rem',
    borderRadius: '16px',
    border: '1px dashed rgba(148,163,184,0.35)',
    background:
      'radial-gradient(circle at top, rgba(37,99,235,0.09), transparent 55%), rgba(15,23,42,0.85)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: '#e5e7eb',
  };

  const iconWrapperStyle = {
    width: '3rem',
    height: '3rem',
    borderRadius: '999px',
    border: '1px solid rgba(148,163,184,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.75rem',
    fontSize: '1.6rem',
    background:
      'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(56,189,248,0.12))',
  };

  const titleStyle = {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 600,
  };

  const descriptionStyle = {
    marginTop: '0.4rem',
    marginBottom: onAction ? '0.9rem' : 0,
    fontSize: '0.85rem',
    color: 'rgba(148,163,184,0.96)',
    maxWidth: '420px',
  };

  const buttonStyle = {
    marginTop: '0.2rem',
    padding: '0.45rem 1.4rem',
    borderRadius: '999px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
    background:
      'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(56,189,248,0.95))',
    color: '#0b1220',
    boxShadow: '0 10px 25px rgba(15,23,42,0.5)',
    display: onAction ? 'inline-flex' : 'none',
    alignItems: 'center',
    gap: '0.4rem',
  };

  const handleClick = () => {
    if (onAction) {
      onAction();
    }
  };

  return (
    <div className="empty-state" style={containerStyle}>
      <div style={iconWrapperStyle}>
        <span aria-hidden="true">{config.icon}</span>
      </div>

      <h3 style={titleStyle}>{message || config.title}</h3>

      <p style={descriptionStyle}>{config.description}</p>

      {onAction && (
        <button type="button" style={buttonStyle} onClick={handleClick}>
          <span>{actionText || config.actionText}</span>
          <span aria-hidden="true">↻</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
