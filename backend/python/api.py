# backend/python/api.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi import WebSocket, WebSocketDisconnect
# نحاول استيراد محرك التداول بدون فرض اسم كلاس محدد
try:
    import trading_engine  # يفترض وجود backend/python/trading_engine.py
except ImportError:
    trading_engine = None

app = FastAPI(title="Quantum Python Trading Engine", version="1.0.0")


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


@app.get("/health")
def health_check():
    return {"status": "ok", "engine_loaded": trading_engine is not None}


@app.post("/api/v1/trading/order")
def place_order(req: OrderRequest):
    if trading_engine is None:
        raise HTTPException(status_code=503, detail="trading_engine not loaded")

    # هنا تربط مع الوظيفة الفعلية في trading_engine
    # مثال: لو عندك دالة execute_order
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
def run_backtest(req: BacktestRequest):
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

# مسار WebSocket للتداول الحي
@app.websocket("/ws/trading")
async def trading_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        # حل مبدئي: نبقي الاتصال حي ونرسل نبضات بسيطة
        while True:
            try:
                _ = await websocket.receive_text()
            except Exception:
                # لو ما فيه رسائل من العميل نكمل عادي
                pass

            await websocket.send_json({
                "type": "heartbeat",
                "source": "python",
                "message": "Python trading WebSocket active"
            })
    except WebSocketDisconnect:
        print("🔌 تم قطع اتصال WebSocket مع عميل التداول")
        
@app.get("/api/v1/trading/status")
def engine_status():
    # نقطة سهلة يستعلم منها الـ Node عن حالة المحرك
    return {
        "status": "ok",
        "engine_loaded": trading_engine is not None,
    }
