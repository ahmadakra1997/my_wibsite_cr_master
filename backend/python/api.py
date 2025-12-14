from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import random
import time

# نحاول استيراد محرك التداول بدون فرض اسم كلاس محدد
try:
    import trading_engine  # يفترض وجود backend/python/trading_engine.py
except ImportError:
    trading_engine = None


app = FastAPI(
    title="Quantum Python Trading Engine",
    version="1.0.0",
)


# ==========
# Models
# ==========


class OrderRequest(BaseModel):
    symbol: str
    side: str  # "buy" أو "sell"
    amount: float
    price: float | None = None
    leverage: int | None = None
    extra: dict | None = None


class BacktestRequest(BaseModel):
    symbol: str
    timeframe: str
    strategy: str
    start: str
    end: str
    initial_balance: float = 1000.0
    params: dict | None = None


# ==========
# Helpers
# ==========


def _timeframe_to_step_seconds(timeframe: str) -> int:
    """تحويل إطار زمني نصّي إلى حجم شمعة بالثواني."""
    tf = (timeframe or "1h").lower()
    mapping = {
        "1m": 60,
        "3m": 180,
        "5m": 300,
        "15m": 900,
        "30m": 1800,
        "1h": 3600,
        "4h": 4 * 3600,
        "1d": 24 * 3600,
    }
    return mapping.get(tf, 3600)


def _generate_mock_candles(
    symbol: str,
    timeframe: str,
    limit: int = 300,
) -> List[Dict[str, Any]]:
    """توليد بيانات تجريبية (OHLCV) في حال عدم توفر بيانات حقيقية من المحرك."""
    now = int(time.time())
    step = _timeframe_to_step_seconds(timeframe)
    candles: List[Dict[str, Any]] = []
    base_price = 30000.0 if symbol.upper().startswith("BTC") else 2000.0

    for i in range(limit - 1, -1, -1):
        ts = now - i * step
        drift = (random.random() - 0.5) * (base_price * 0.002)
        base_price = max(10.0, base_price + drift)
        open_price = base_price + (random.random() - 0.5) * (base_price * 0.001)
        close_price = base_price + (random.random() - 0.5) * (base_price * 0.001)
        high_price = max(open_price, close_price) + random.random() * (base_price * 0.0012)
        low_price = min(open_price, close_price) - random.random() * (base_price * 0.0012)
        volume = random.random() * 10.0

        candles.append(
            {
                "time": ts,
                "open": round(open_price, 2),
                "high": round(high_price, 2),
                "low": round(low_price, 2),
                "close": round(close_price, 2),
                "volume": round(volume, 3),
            }
        )

    return candles


def _generate_mock_ai_signals(
    symbol: Optional[str],
    timeframe: Optional[str],
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """إشارات ذكاء اصطناعي تجريبية للواجهة فقط."""
    base_symbol = (symbol or "BTCUSDT").upper()
    tf = timeframe or "1h"
    directions = ["long", "short"]
    types = ["entry", "exit", "watch"]
    strategies = ["Quantum Edge", "Momentum AI", "Volatility Sweep"]
    now = datetime.utcnow()

    signals: List[Dict[str, Any]] = []
    for idx in range(max(1, min(limit, 30))):
        t = now - timedelta(minutes=idx * 15)
        direction = random.choice(directions)
        sig_type = random.choice(types)
        confidence = random.uniform(55, 97)
        signals.append(
            {
                "id": f"mock-{idx}",
                "symbol": base_symbol,
                "type": sig_type,
                "direction": direction,
                "confidence": round(confidence, 1),
                "timeframe": tf,
                "strategy": random.choice(strategies),
                "time": t.isoformat(),
            }
        )
    return signals


def _generate_mock_positions(symbol: Optional[str] = None) -> List[Dict[str, Any]]:
    """مراكز تجريبية حتى تعمل PerformanceAnalytics و PositionManager بسلاسة."""
    base_symbol = (symbol or "BTCUSDT").upper()
    now = datetime.utcnow()
    positions: List[Dict[str, Any]] = []
    for idx in range(5):
        opened_at = now - timedelta(hours=idx * 5)
        closed = idx % 2 == 1
        entry_price = 29000 + idx * 500
        size = 0.01 * (idx + 1)
        side = "long" if idx % 2 == 0 else "short"
        pnl = random.uniform(-50, 120)

        pos: Dict[str, Any] = {
            "id": f"mock-pos-{idx}",
            "symbol": base_symbol,
            "side": side,  # 'long' | 'short'
            "size": size,
            "entryPrice": entry_price,
            "leverage": 5,
            "status": "closed" if closed else "open",
            "realizedPnl": round(pnl if closed else 0.0, 2),
            "pnl": round(pnl if closed else 0.0, 2),
            "openedAt": opened_at.isoformat(),
        }

        if closed:
            pos["closedAt"] = (opened_at + timedelta(hours=2)).isoformat()

        positions.append(pos)

    return positions


# ==========
# Endpoints
# ==========


@app.get("/health")
def health_check() -> Dict[str, Any]:
    """فحص بسيط لحالة الـ API ومحرك التداول."""
    return {
        "status": "ok",
        "engine_loaded": trading_engine is not None,
    }


@app.get("/api/v1/trading/status")
def engine_status() -> Dict[str, Any]:
    """نقطة استعلام مفيدة للـ frontend لمعرفة إمكانات المحرك."""
    capabilities: Dict[str, bool] = {
        "has_backtest": hasattr(trading_engine, "run_backtest") if trading_engine else False,
        "has_order": hasattr(trading_engine, "execute_order") if trading_engine else False,
        "has_chart": hasattr(trading_engine, "get_chart_data") if trading_engine else False,
        "has_ai_signals": hasattr(trading_engine, "get_ai_signals") if trading_engine else False,
        "has_positions": hasattr(trading_engine, "get_positions") if trading_engine else False,
    }

    return {
        "status": "ok",
        "engine_loaded": trading_engine is not None,
        "capabilities": capabilities,
    }


@app.post("/api/v1/trading/order")
def place_order(req: OrderRequest) -> Dict[str, Any]:
    """تنفيذ أمر تداول واحد عبر محرك التداول."""
    if trading_engine is None:
        raise HTTPException(status_code=503, detail="trading_engine not loaded")

    if hasattr(trading_engine, "execute_order"):
        result = trading_engine.execute_order(
            symbol=req.symbol,
            side=req.side,
            amount=req.amount,
            price=req.price,
            leverage=req.leverage,
            extra=req.extra or {},
        )
        return {"status": "ok", "result": result}

    raise HTTPException(status_code=501, detail="execute_order not implemented")


@app.post("/api/v1/trading/backtest")
def run_backtest(req: BacktestRequest) -> Dict[str, Any]:
    """تشغيل باك تست لاستراتيجية معينة."""
    if trading_engine is None:
        raise HTTPException(status_code=503, detail="trading_engine not loaded")

    if hasattr(trading_engine, "run_backtest"):
        result = trading_engine.run_backtest(
            symbol=req.symbol,
            timeframe=req.timeframe,
            strategy=req.strategy,
            start=req.start,
            end=req.end,
            initial_balance=req.initial_balance,
            params=req.params or {},
        )
        return {"status": "ok", "result": result}

    raise HTTPException(status_code=501, detail="run_backtest not implemented")


@app.get("/api/v1/trading/chart")
def get_chart(
    symbol: str,
    timeframe: str = "1h",
    limit: int = 300,
) -> Dict[str, Any]:
    """
    إرجاع بيانات الشموع لاستخدامها في LiveCharts / ChartDataService.
    الشكل المتوقَّع من الواجهة الأمامية:
    { symbol, timeframe, candles: [{time,open,high,low,close,volume}], volume: [...], metadata: {...} }
    """
    if trading_engine is not None and hasattr(trading_engine, "get_chart_data"):
        data = trading_engine.get_chart_data(
            symbol=symbol,
            timeframe=timeframe,
            limit=limit,
        )
        # يمكن أن يرجع المحرك مباشرة نفس البنية المطلوبة،
        # لذلك نمررها كما هي مع ضمان وجود symbol / timeframe.
        if isinstance(data, dict):
            data.setdefault("symbol", symbol)
            data.setdefault("timeframe", timeframe)
            return data

        # أو يعود كمصفوفة شموع مباشرة:
        if isinstance(data, list):
            candles = data
        else:
            candles = []
    else:
        candles = _generate_mock_candles(symbol, timeframe, limit)

    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "candles": candles,
        "volume": [c.get("volume", 0) for c in candles],
        "metadata": {
            "mock": trading_engine is None,
            "source": "python_engine" if trading_engine else "mock",
        },
    }


@app.get("/api/v1/trading/ai-signals")
def get_ai_signals(
    symbol: Optional[str] = None,
    timeframe: Optional[str] = None,
    limit: int = 20,
) -> Dict[str, Any]:
    """
    إرجاع إشارات ذكاء اصطناعي لاستخدامها في AISignals.jsx.
    """
    if trading_engine is not None and hasattr(trading_engine, "get_ai_signals"):
        signals = trading_engine.get_ai_signals(
            symbol=symbol,
            timeframe=timeframe,
            limit=limit,
        )
        return {"status": "ok", "signals": signals}

    # Fallback تجريبي
    signals = _generate_mock_ai_signals(symbol, timeframe, limit)
    return {"status": "ok", "signals": signals, "mock": True}


@app.get("/api/v1/trading/positions")
def get_positions(
    symbol: Optional[str] = None,
    status: Optional[str] = None,
) -> Dict[str, Any]:
    """
    إرجاع قائمة المراكز المفتوحة/المغلقة لاستخدامها في:
    - PerformanceAnalytics
    - PositionManager
    - PositionStats
    """
    if trading_engine is not None and hasattr(trading_engine, "get_positions"):
        positions = trading_engine.get_positions(
            symbol=symbol,
            status=status,
        )
        return {"status": "ok", "positions": positions}

    # Fallback تجريبي
    positions = _generate_mock_positions(symbol)
    if status:
        status_lower = status.lower()
        positions = [p for p in positions if p.get("status", "").lower() == status_lower]

    return {"status": "ok", "positions": positions, "mock": True}


# مسار WebSocket للتداول الحي
@app.websocket("/ws/trading")
async def trading_ws(websocket: WebSocket) -> None:
    """
    قناة WebSocket أساسية:
    - تبقي الاتصال حيّاً بإرسال heartbeat.
    - يمكن لاحقًا توسيعها لإرسال بث مباشر للأوامر/الأسعار.
    """
    await websocket.accept()
    try:
        while True:
            try:
                # نستقبل أي رسالة من العميل (أو نبقي الاتصال فقط)
                _ = await websocket.receive_text()
            except WebSocketDisconnect:
                # العميل أغلق الاتصال، نخرج من الحلقة بدون محاولة إرسال
                break

            # نرسل نبضة قلب بسيطة
            await websocket.send_json(
                {
                    "channel": "heartbeat",
                    "payload": {
                        "type": "heartbeat",
                        "source": "python",
                        "message": "Python trading WebSocket active",
                        "timestamp": int(time.time()),
                    },
                }
            )

    except WebSocketDisconnect:
        # تم قطع الاتصال أثناء الإرسال
        pass
    finally:
        print("🔌 تم قطع اتصال WebSocket مع عميل التداول")
