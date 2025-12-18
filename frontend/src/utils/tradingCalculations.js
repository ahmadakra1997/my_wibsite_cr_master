// frontend/src/utils/tradingCalculations.js
/**
 * TradingCalculations
 * وظائف حسابية للتداول (واجهة أمامية):
 * - PnL / ROE / Notional / Fees / Drawdown / Performance summary
 * - لا تعتمد على backend
 */

const toNumber = (v, fallback = 0) => {
  const n = typeof v === 'string' ? Number(v.replace(/,/g, '').trim()) : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const calculateNotional = (price, qty) => {
  const p = toNumber(price);
  const q = toNumber(qty);
  return p * q;
};

export const calculatePnL = ({ entryPrice, exitPrice, qty, side = 'long' }) => {
  const entry = toNumber(entryPrice);
  const exit = toNumber(exitPrice);
  const q = toNumber(qty);

  const s = String(side).toLowerCase();
  if (!entry || !exit || !q) return 0;

  const diff = s === 'short' ? entry - exit : exit - entry;
  return diff * q;
};

export const calculateROE = ({ pnl, marginUsed }) => {
  const p = toNumber(pnl);
  const m = toNumber(marginUsed);
  if (!m) return 0;
  return (p / m) * 100;
};

export const calculateMarginUsed = ({ notional, leverage = 1 }) => {
  const n = toNumber(notional);
  const lev = Math.max(1, toNumber(leverage, 1));
  return n / lev;
};

export const calculateFees = ({ notional, feeRate = 0.0004 }) => {
  const n = toNumber(notional);
  const r = Math.max(0, toNumber(feeRate, 0));
  return n * r;
};

// تقريب شائع (ليس مطابق لكل بورصة، لكنه مفيد للواجهة)
export const estimateLiquidationPrice = ({ entryPrice, leverage = 1, side = 'long' }) => {
  const entry = toNumber(entryPrice);
  const lev = Math.max(1, toNumber(leverage, 1));
  if (!entry || lev <= 1) return entry;

  const s = String(side).toLowerCase();
  const liq = s === 'short' ? entry * (1 + 1 / lev) : entry * (1 - 1 / lev);
  return Math.max(0, liq);
};

export const calculateDrawdown = (equitySeries = []) => {
  const arr = Array.isArray(equitySeries) ? equitySeries.map((x) => toNumber(x, NaN)).filter(Number.isFinite) : [];
  if (!arr.length) return { maxDrawdownPct: 0, maxDrawdownAbs: 0 };

  let peak = arr[0];
  let maxDDAbs = 0;

  for (const v of arr) {
    if (v > peak) peak = v;
    const dd = peak - v;
    if (dd > maxDDAbs) maxDDAbs = dd;
  }

  const maxDrawdownPct = peak ? (maxDDAbs / peak) * 100 : 0;
  return { maxDrawdownPct, maxDrawdownAbs: maxDDAbs };
};

export const summarizeTrades = (trades = []) => {
  const items = Array.isArray(trades) ? trades : [];
  let wins = 0;
  let losses = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let totalPnL = 0;

  for (const t of items) {
    const pnl = toNumber(t.pnl ?? t.profit ?? t.realizedPnL, 0);
    totalPnL += pnl;
    if (pnl >= 0) {
      wins += 1;
      grossProfit += pnl;
    } else {
      losses += 1;
      grossLoss += Math.abs(pnl);
    }
  }

  const total = wins + losses;
  const winRate = total ? (wins / total) * 100 : 0;
  const profitFactor = grossLoss ? grossProfit / grossLoss : grossProfit ? Infinity : 0;

  return {
    totalTrades: total,
    wins,
    losses,
    winRate,
    totalPnL,
    grossProfit,
    grossLoss,
    profitFactor,
    avgPnL: total ? totalPnL / total : 0,
  };
};

const TradingCalculations = {
  toNumber,
  calculateNotional,
  calculatePnL,
  calculateROE,
  calculateMarginUsed,
  calculateFees,
  estimateLiquidationPrice,
  calculateDrawdown,
  summarizeTrades,
};

export default TradingCalculations;
