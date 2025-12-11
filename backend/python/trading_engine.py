# backend/python/trading_engine.py
"""
🎯 QUANTUM AI TRADING ENGINE - المحرك المتقدم للتداول بالذكاء الاصطناعي
دمج كامل مع الكود الأصلي لـ Strong Akraa ICT
الإصدار: 3.0.0 | المطور: Akraa Trading Team
"""

import asyncio
import json
import logging
import os
import sys
import time
import traceback
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
import uuid
import random
from decimal import Decimal
import inspect

# FastAPI and WebSocket
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn

# Machine Learning and AI
import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import MinMaxScaler
from sklearn.utils import class_weight
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model, save_model
from tensorflow.keras.layers import LSTM, Dense, Dropout, Bidirectional
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from tensorflow.keras.regularizers import l2

# Trading and Technical Analysis
import ccxt
import talib
import pandas_ta as ta
from scipy import stats
import pytz

# Advanced Features
import redis.asyncio as redis
from aiohttp import ClientSession, TCPConnector
import aiofiles
from dotenv import load_dotenv

# Security
import hashlib
import hmac
import base64

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/trading_engine.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# =============================================================================
# 📊 نماذج البيانات Pydantic
# =============================================================================

from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional, List, Dict, Any

class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"

class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"

class PositionStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    PENDING = "pending"

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class TimeFrame(str, Enum):
    ONE_MINUTE = "1m"
    FIVE_MINUTES = "5m"
    FIFTEEN_MINUTES = "15m"
    ONE_HOUR = "1h"
    FOUR_HOURS = "4h"
    ONE_DAY = "1d"

class AIPredictionType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"

class PlaceOrderRequest(BaseModel):
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float = Field(..., gt=0)
    price: Optional[float] = Field(None, gt=0)
    stop_price: Optional[float] = Field(None, gt=0)
    leverage: Optional[int] = Field(1, ge=1, le=100)
    take_profit: Optional[float] = Field(None, gt=0)
    stop_loss: Optional[float] = Field(None, gt=0)

class OrderResponse(BaseModel):
    order_id: str
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    price: Optional[float]
    status: str
    timestamp: datetime
    exchange_id: Optional[str]
    filled_quantity: float = 0
    remaining_quantity: float = 0
    average_price: Optional[float]

class Position(BaseModel):
    symbol: str
    side: OrderSide
    quantity: float
    entry_price: float
    current_price: float
    current_value: float
    unrealized_pnl: float
    realized_pnl: float = 0
    leverage: int = 1
    risk_level: RiskLevel = RiskLevel.MEDIUM
    opened_at: datetime
    updated_at: datetime
    take_profit: Optional[float]
    stop_loss: Optional[float]

class MarketData(BaseModel):
    symbol: str
    price: float
    volume: float
    timestamp: datetime
    change_24h: float
    high_24h: float
    low_24h: float
    bid: float
    ask: float
    spread: float
    base_volume: float
    quote_volume: float

class AIPrediction(BaseModel):
    symbol: str
    prediction: AIPredictionType
    confidence: float = Field(..., ge=0, le=1)
    timestamp: datetime
    indicators: Dict[str, float]
    timeframe: TimeFrame
    model_version: str
    features_used: List[str]

class MarketAnalysisRequest(BaseModel):
    symbols: List[str]
    timeframe: TimeFrame
    indicators: List[str]
    depth: int = Field(100, ge=10, le=1000)

class TradingSignal(BaseModel):
    symbol: str
    signal: AIPredictionType
    strength: float = Field(..., ge=0, le=1)
    confidence: float = Field(..., ge=0, le=1)
    timestamp: datetime
    entry_price: float
    stop_loss: float
    take_profit: float
    timeframe: TimeFrame
    source: str
    reasoning: List[str]

class PerformanceMetrics(BaseModel):
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    total_profit: float = 0.0
    total_loss: float = 0.0
    net_profit: float = 0.0
    success_rate: float = 0.0
    profit_factor: float = 0.0
    sharpe_ratio: float = 0.0
    max_drawdown: float = 0.0
    open_positions: int = 0
    total_exposure: float = 0.0
    ai_predictions: int = 0
    ai_accuracy: float = 0.0
    last_update: datetime

    def update(self, **kwargs):
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        
        # Calculate derived metrics
        if self.total_trades > 0:
            self.success_rate = self.winning_trades / self.total_trades
            self.net_profit = self.total_profit - self.total_loss
            
            if self.total_loss > 0:
                self.profit_factor = self.total_profit / self.total_loss
            else:
                self.profit_factor = self.total_profit

class SystemHealth(BaseModel):
    status: str
    timestamp: datetime
    uptime: float
    memory_usage: Dict[str, float]
    cpu_usage: float
    database_status: str
    exchange_connection: str
    ai_models_loaded: int
    active_websockets: int
    pending_orders: int
    open_positions: int

# =============================================================================
# 🔧 إعدادات التداول من الكود الأصلي
# =============================================================================

class TradingSettings:
    """إعدادات التداول من الكود الأصلي"""
    
    def __init__(self):
        # إعدادات ICT المحسنة لكل فريم
        self.ict_settings = {
            '1m': {'atr_length': 6, 'sl_multiplier': 1.0, 'tp_multiplier': 1.5, 'min_confidence': 0.55, 'volume_threshold': 0.55},
            '5m': {'atr_length': 10, 'sl_multiplier': 1.5, 'tp_multiplier': 2.0, 'min_confidence': 0.65, 'volume_threshold': 0.7},
            '15m': {'atr_length': 14, 'sl_multiplier': 1.7, 'tp_multiplier': 5.0, 'min_confidence': 0.65, 'volume_threshold': 0.75},
            '1h': {'atr_length': 14, 'sl_multiplier': 1.7, 'tp_multiplier': 7.0, 'min_confidence': 0.65, 'volume_threshold': 0.75},
            '4h': {'atr_length': 16, 'sl_multiplier': 1.8, 'tp_multiplier': 2.6, 'min_confidence': 0.75, 'volume_threshold': 0.85}
        }
        
        # إعدادات مخصصة لكل فريم زمني
        self.timeframe_specific_settings = {
            '1m': {
                'min_trade_amount': 20.0, 'max_trade_amount': 60.0, 'atr_multiplier': 0.7,
                'signal_confidence_threshold': 0.52, 'max_open_positions': 4, 'monitoring_interval': 3,
                'volume_threshold': 0.5, 'require_ascending_channel': False, 'take_profit_multiplier': 1.2,
                'trailing_factor': 0.7, 'partial_close_percentage': 0.90, 'stop_loss_multiplier': 1.2,
                'breakeven_activation': 0.4, 'quick_take_profit': 0.9, 'aggressive_exit': True, 'min_profit_target': 0.3
            },
            '5m': {
                'min_trade_amount': 25.0, 'max_trade_amount': 80.0, 'atr_multiplier': 0.8,
                'signal_confidence_threshold': 0.55, 'max_open_positions': 5, 'monitoring_interval': 6,
                'volume_threshold': 0.6, 'require_ascending_channel': False, 'take_profit_multiplier': 1.3,
                'trailing_factor': 1.2, 'partial_close_percentage': 0.80, 'stop_loss_multiplier': 1.6,
                'breakeven_activation': 0.6, 'quick_take_profit': 1.1, 'aggressive_exit': True, 'min_profit_target': 0.4
            },
            '15m': {
                'min_trade_amount': 35.0, 'max_trade_amount': 120.0, 'atr_multiplier': 0.9,
                'signal_confidence_threshold': 0.62, 'max_open_positions': 6, 'monitoring_interval': 8,
                'volume_threshold': 0.8, 'require_ascending_channel': True, 'take_profit_multiplier': 5.0,
                'trailing_factor': 2.1, 'partial_close_percentage': 0.70, 'stop_loss_multiplier': 1.8,
                'breakeven_activation': 0.8, 'scaled_entry_min_amount': 250.0
            },
            '1h': {
                'min_trade_amount': 35.0, 'max_trade_amount': 120.0, 'atr_multiplier': 1.0,
                'signal_confidence_threshold': 0.62, 'max_open_positions': 7, 'monitoring_interval': 10,
                'volume_threshold': 0.8, 'require_ascending_channel': True, 'scaled_entry_min_amount': 250.0,
                'take_profit_multiplier': 7.0, 'trailing_factor': 2.2, 'partial_close_percentage': 0.65,
                'stop_loss_multiplier': 1.8, 'breakeven_activation': 0.9
            },
            '4h': {
                'min_trade_amount': 40.0, 'max_trade_amount': 150.0, 'atr_multiplier': 1.2,
                'signal_confidence_threshold': 0.65, 'max_open_positions': 5, 'monitoring_interval': 15,
                'volume_threshold': 0.9, 'require_ascending_channel': True, 'scaled_entry_min_amount': 300.0,
                'take_profit_multiplier': 3.5, 'trailing_factor': 2.5, 'partial_close_percentage': 0.60,
                'stop_loss_multiplier': 2.0, 'breakeven_activation': 1.0
            }
        }
        
        # إعدادات الترايلينغ ستوب
        self.trailing_stop_optimized_1h = {
            'activation_threshold': 1.8,
            'trailing_distance': 1.2,
            'breakeven_activation': 2.5,
            'partial_close_levels': [
                (3.0, 0.3),
                (5.0, 0.4),
                (8.0, 0.3)
            ],
            'enabled': True
        }
        
        self.trailing_stop_optimized_15m = {
            'activation_threshold': 1.5,
            'trailing_distance': 0.8,
            'breakeven_activation': 2.0,
            'partial_close_levels': [
                (2.5, 0.4),
                (4.0, 0.4),
                (6.0, 0.2)
            ],
            'enabled': True
        }

# =============================================================================
# 🧠 نظام الذكاء الاصطناعي من الكود الأصلي
# =============================================================================

class AITradingModel:
    """نموذج الذكاء الاصطناعي للتداول من الكود الأصلي"""
    
    def __init__(self, symbol: str):
        self.symbol = symbol
        self.model = None
        self.scaler = MinMaxScaler()
        self.lookback = 120
        self.sequence_length = 80
        self.model_dir = f"ai_models/{symbol.replace('/', '_')}"
        os.makedirs(self.model_dir, exist_ok=True)
        
    async def load_model(self):
        """تحميل النموذج المدرب"""
        try:
            model_path = os.path.join(self.model_dir, "ai_trading_model.h5")
            scaler_path = os.path.join(self.model_dir, "ai_scaler.pkl")
            
            if os.path.exists(model_path) and os.path.exists(scaler_path):
                self.model = load_model(model_path)
                self.scaler = joblib.load(scaler_path)
                logger.info(f"✅ تم تحميل نموذج الذكاء الاصطناعي لـ {self.symbol}")
                return True
        except Exception as e:
            logger.error(f"❌ فشل تحميل النموذج لـ {self.symbol}: {str(e)}")
        
        return False
    
    async def train_model(self, ohlcv_data: List[List[float]]):
        """تدريب النموذج على بيانات OHLCV"""
        try:
            if len(ohlcv_data) < 400:
                logger.warning(f"⚠️ بيانات غير كافية لتدريب النموذج لـ {self.symbol}")
                return False
            
            # تحويل البيانات إلى DataFrame
            df = pd.DataFrame(ohlcv_data, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            df.set_index('timestamp', inplace=True)
            
            # تحسين السمات الزمنية
            df = self._enhance_temporal_features(df)
            
            # إنشاء الهدف
            lookforward_periods = self._get_lookforward_periods()
            df['future'] = df['close'].shift(-lookforward_periods)
            df['target'] = (df['future'] > df['close']).astype(int)
            df.dropna(inplace=True)
            
            # تطبيع البيانات
            feature_columns = ['open', 'high', 'low', 'close', 'volume', 'price_momentum', 'volume_trend', 'volatility', 'rsi', 'macd']
            available_features = [col for col in feature_columns if col in df.columns]
            
            scaled_data = self.scaler.fit_transform(df[available_features])
            
            # تحضير البيانات للتدريب
            X, y = [], []
            for i in range(self.sequence_length, len(scaled_data)):
                X.append(scaled_data[i-self.sequence_length:i])
                y.append(df['target'].iloc[i])
            
            X, y = np.array(X), np.array(y)
            
            if len(X) < 100:
                logger.warning(f"⚠️ بيانات تدريب غير كافية بعد المعالجة لـ {self.symbol}")
                return False
            
            # موازنة الفئات
            class_weights = class_weight.compute_class_weight(
                'balanced',
                classes=np.unique(y),
                y=y
            )
            class_weights = dict(enumerate(class_weights))
            
            # تقسيم البيانات
            from sklearn.model_selection import train_test_split
            X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, shuffle=True, random_state=42)
            
            # بناء النموذج
            self.model = Sequential([
                Bidirectional(LSTM(128, return_sequences=True, input_shape=(self.sequence_length, len(available_features)))),
                Dropout(0.3),
                Bidirectional(LSTM(64)),
                Dropout(0.3),
                Dense(64, activation='relu', kernel_regularizer=l2(0.01)),
                Dense(1, activation='sigmoid')
            ])
            
            # تجميع النموذج
            self.model.compile(
                optimizer=Adam(learning_rate=0.0008),
                loss='binary_crossentropy',
                metrics=['accuracy']
            )
            
            # callbacks
            callbacks = [
                EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True),
                ModelCheckpoint(
                    os.path.join(self.model_dir, "ai_trading_model.h5"),
                    monitor='val_loss',
                    save_best_only=True,
                    save_weights_only=False
                )
            ]
            
            # تدريب النموذج
            history = self.model.fit(
                X_train, y_train,
                epochs=80,
                batch_size=48,
                validation_data=(X_val, y_val),
                callbacks=callbacks,
                class_weight=class_weights,
                verbose=1
            )
            
            # حفظ المقياس
            joblib.dump(self.scaler, os.path.join(self.model_dir, "ai_scaler.pkl"))
            
            # تقييم النموذج
            val_loss, val_acc = self.model.evaluate(X_val, y_val, verbose=0)
            y_pred = (self.model.predict(X_val) > 0.5).astype(int)
            
            accuracy = accuracy_score(y_val, y_pred)
            precision = precision_score(y_val, y_pred, zero_division=0)
            recall = recall_score(y_val, y_pred, zero_division=0)
            f1 = f1_score(y_val, y_pred, zero_division=0)
            
            logger.info(f"🎯 تدريب النموذج لـ {self.symbol} - الدقة: {accuracy:.4f}, F1: {f1:.4f}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ فشل تدريب النموذج لـ {self.symbol}: {traceback.format_exc()}")
            return False
    
    def _enhance_temporal_features(self, df):
        """تحسين السمات الزمنية"""
        try:
            df['price_momentum'] = df['close'].pct_change(5)
            df['volume_trend'] = df['volume'].rolling(10).mean()
            df['volatility'] = df['close'].rolling(20).std()
            
            # مؤشرات فنية
            df['rsi'] = ta.rsi(df['close'], length=14)
            df['macd'] = ta.macd(df['close'])['MACD_12_26_9']
            
            return df.fillna(method='bfill').fillna(method='ffill')
        except Exception as e:
            logger.warning(f"⚠️ تعذر تحسين السمات الزمنية: {str(e)}")
            return df
    
    def _get_lookforward_periods(self):
        """تحديد فترات النظر المستقبلية"""
        lookforward_map = {
            '1m': 30, '5m': 24, '15m': 16, '1h': 12, '4h': 10, '1d': 5
        }
        return lookforward_map.get('1h', 8)
    
    async def predict(self, ohlcv_data: List[List[float]]) -> AIPrediction:
        """توقع حركة السعر"""
        try:
            if self.model is None:
                await self.load_model()
            
            if self.model is None or len(ohlcv_data) < self.sequence_length:
                return AIPrediction(
                    symbol=self.symbol,
                    prediction=AIPredictionType.HOLD,
                    confidence=0.5,
                    timestamp=datetime.utcnow(),
                    indicators={},
                    timeframe=TimeFrame.ONE_HOUR,
                    model_version="1.0",
                    features_used=[]
                )
            
            # تحضير البيانات للتوقع
            df = pd.DataFrame(ohlcv_data[-self.sequence_length:], 
                            columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            
            df = self._enhance_temporal_features(df)
            feature_columns = ['open', 'high', 'low', 'close', 'volume', 'price_momentum', 'volume_trend', 'volatility', 'rsi', 'macd']
            available_features = [col for col in feature_columns if col in df.columns]
            
            scaled_data = self.scaler.transform(df[available_features])
            X = np.array([scaled_data])
            
            # التوقع
            prediction_prob = self.model.predict(X, verbose=0)[0][0]
            confidence = abs(prediction_prob - 0.5) * 2  # تحويل إلى ثقة بين 0 و 1
            
            if prediction_prob > 0.6:
                signal = AIPredictionType.BUY
            elif prediction_prob < 0.4:
                signal = AIPredictionType.SELL
            else:
                signal = AIPredictionType.HOLD
            
            return AIPrediction(
                symbol=self.symbol,
                prediction=signal,
                confidence=confidence,
                timestamp=datetime.utcnow(),
                indicators={
                    'rsi': float(df['rsi'].iloc[-1]) if 'rsi' in df.columns else 50,
                    'macd': float(df['macd'].iloc[-1]) if 'macd' in df.columns else 0,
                    'volatility': float(df['volatility'].iloc[-1]) if 'volatility' in df.columns else 0
                },
                timeframe=TimeFrame.ONE_HOUR,
                model_version="2.0.0",
                features_used=available_features
            )
            
        except Exception as e:
            logger.error(f"❌ خطأ في التوقع لـ {self.symbol}: {str(e)}")
            return AIPrediction(
                symbol=self.symbol,
                prediction=AIPredictionType.HOLD,
                confidence=0.5,
                timestamp=datetime.utcnow(),
                indicators={},
                timeframe=TimeFrame.ONE_HOUR,
                model_version="1.0",
                features_used=[]
            )

# =============================================================================
# 🔄 خدمات التداول من الكود الأصلي
# =============================================================================

class ExchangeService:
    """خدمة التداول مع المنصات"""
    
    def __init__(self):
        self.exchanges = {}
        self.current_exchange = 'mexc'
        self.initialize_exchanges()
    
    def initialize_exchanges(self):
        """تهيئة اتصالات المنصات"""
        try:
            # MEXC Exchange
            self.exchanges['mexc'] = ccxt.mexc({
                'apiKey': os.getenv('MEXC_API_KEY', 'mx0vglaHTCGu1GuJXk'),
                'secret': os.getenv('MEXC_SECRET', '75018e91f9bf4d20823955aee2c38c65'),
                'enableRateLimit': True,
                'timeout': 30000,
                'options': {
                    'defaultType': 'spot',
                    'adjustForTimeDifference': True,
                    'recvWindow': 60000
                }
            })
            
            # KuCoin Exchange (إذا كانت مفعلة)
            kucoin_api_key = os.getenv('KUCOIN_API_KEY')
            kucoin_secret = os.getenv('KUCOIN_SECRET')
            if kucoin_api_key and kucoin_secret:
                self.exchanges['kucoin'] = ccxt.kucoin({
                    'apiKey': kucoin_api_key,
                    'secret': kucoin_secret,
                    'password': os.getenv('KUCOIN_PASSWORD', ''),
                    'enableRateLimit': True
                })
            
            logger.info("✅ تم تهيئة اتصالات المنصات بنجاح")
            
        except Exception as e:
            logger.error(f"❌ فشل تهيئة اتصالات المنصات: {str(e)}")
            raise
    
    def get_exchange(self, exchange_name: str = None):
        """الحصول على كائن المنصة"""
        exchange = exchange_name or self.current_exchange
        return self.exchanges.get(exchange)
    
    async def get_market_data(self, symbol: str, exchange_name: str = None) -> MarketData:
        """الحصول على بيانات السوق"""
        try:
            exchange = self.get_exchange(exchange_name)
            ticker = exchange.fetch_ticker(symbol)
            ohlcv = exchange.fetch_ohlcv(symbol, '1d', limit=2)
            
            change_24h = ((ticker['last'] - ticker['open']) / ticker['open']) * 100 if ticker['open'] else 0
            
            return MarketData(
                symbol=symbol,
                price=float(ticker['last']),
                volume=float(ticker['baseVolume']),
                timestamp=datetime.utcnow(),
                change_24h=change_24h,
                high_24h=float(ticker['high']),
                low_24h=float(ticker['low']),
                bid=float(ticker['bid']),
                ask=float(ticker['ask']),
                spread=float((ticker['ask'] - ticker['bid']) / ticker['bid'] * 100) if ticker['bid'] else 0,
                base_volume=float(ticker['baseVolume']),
                quote_volume=float(ticker['quoteVolume'])
            )
            
        except Exception as e:
            logger.error(f"❌ خطأ في جلب بيانات السوق لـ {symbol}: {str(e)}")
            raise
    
    async def place_order(self, order_data: PlaceOrderRequest, exchange_name: str = None) -> OrderResponse:
        """تنفيذ أمر تداول"""
        try:
            exchange = self.get_exchange(exchange_name)
            
            order_params = {
                'symbol': order_data.symbol,
                'type': order_data.order_type.value,
                'side': order_data.side.value,
                'amount': order_data.quantity,
            }
            
            if order_data.price and order_data.order_type in [OrderType.LIMIT, OrderType.STOP_LIMIT]:
                order_params['price'] = order_data.price
            
            if order_data.stop_price and order_data.order_type in [OrderType.STOP, OrderType.STOP_LIMIT]:
                order_params['stopPrice'] = order_data.stop_price
            
            # تنفيذ الأمر
            order = exchange.create_order(**order_params)
            
            return OrderResponse(
                order_id=order['id'],
                symbol=order_data.symbol,
                side=order_data.side,
                order_type=order_data.order_type,
                quantity=order_data.quantity,
                price=order_data.price,
                status=order['status'],
                timestamp=datetime.utcnow(),
                exchange_id=order['id'],
                filled_quantity=float(order.get('filled', 0)),
                remaining_quantity=float(order.get('remaining', order_data.quantity)),
                average_price=float(order.get('average', order_data.price))
            )
            
        except Exception as e:
            logger.error(f"❌ خطأ في تنفيذ الأمر لـ {order_data.symbol}: {str(e)}")
            raise
    
    async def cancel_order(self, order_id: str, symbol: str, exchange_name: str = None) -> bool:
        """إلغاء أمر"""
        try:
            exchange = self.get_exchange(exchange_name)
            result = exchange.cancel_order(order_id, symbol)
            return True
        except Exception as e:
            logger.error(f"❌ خطأ في إلغاء الأمر {order_id}: {str(e)}")
            return False
    
    async def get_active_symbols(self) -> List[str]:
        """الحصول على الرموز النشطة"""
        try:
            exchange = self.get_exchange()
            markets = exchange.load_markets()
            
            # تصفية الرموز المدعومة (مثال)
            supported_symbols = [
                "BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT", "ADA/USDT", 
                "DOT/USDT", "DOGE/USDT", "AVAX/USDT", "MATIC/USDT"
            ]
            
            active_symbols = [symbol for symbol in supported_symbols if symbol in markets]
            return active_symbols[:20]  # إرجاع أول 20 رمز فقط
            
        except Exception as e:
            logger.error(f"❌ خطأ في جلب الرموز النشطة: {str(e)}")
            return []

# =============================================================================
# 🎯 المحرك الرئيسي - QuantumTradingEngine
# =============================================================================

class QuantumTradingEngine:
    """المحرك المتقدم للتداول بالذكاء الاصطناعي - مدمج مع الكود الأصلي"""
    
    def __init__(self):
        self.settings = TradingSettings()
        self.app = FastAPI(
            title="Quantum AI Trading Engine",
            description="محرك التداول المتقدم المدعوم بالذكاء الاصطناعي - مدمج مع Strong Akraa ICT",
            version="3.0.0",
            docs_url="/docs",
            redoc_url="/redoc"
        )
        
        # Initialize services
        self.exchange_service = ExchangeService()
        self.ai_models: Dict[str, AITradingModel] = {}
        
        # Trading state
        self.open_positions: Dict[str, Position] = {}
        self.pending_orders: Dict[str, OrderResponse] = {}
        self.trading_enabled = True
        
        # Market data and AI
        self.market_data: Dict[str, MarketData] = {}
        self.ai_predictions: Dict[str, AIPrediction] = {}
        self.trading_signals: Dict[str, TradingSignal] = {}
        
        # Performance tracking
        self.performance_metrics = PerformanceMetrics(last_update=datetime.utcnow())
        
        # WebSocket
        self.connection_manager = ConnectionManager()
        
        self.setup_middlewares()
        self.setup_routes()
        
        logger.info("🚀 تم تهيئة Quantum AI Trading Engine بنجاح")
    
    def setup_middlewares(self):
        """إعداد وسيطات التطبيق"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5000"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    
    def setup_routes(self):
        """إعداد مسارات API"""
        
        @self.app.get("/")
        async def root():
            return {
                "message": "🚀 Quantum AI Trading Engine - الإصدار 3.0.0",
                "status": "operational",
                "timestamp": datetime.utcnow().isoformat(),
                "version": "3.0.0",
                "features": [
                    "التداول الآلي المتقدم",
                    "الذكاء الاصطناعي المدمج",
                    "تحليل السوق في الوقت الحقيقي",
                    "إدارة المخاطر المتقدمة",
                    "WebSocket للبيانات الحية"
                ]
            }
        
        @self.app.get("/health")
        async def health_check():
            return await self.get_system_health()
        
        @self.app.get("/api/v1/trading/symbols")
        async def get_active_symbols():
            return await self.get_active_symbols()
        
        @self.app.post("/api/v1/trading/order")
        async def place_order(order_data: PlaceOrderRequest):
            return await self.place_order(order_data)
        
        @self.app.delete("/api/v1/trading/order/{order_id}")
        async def cancel_order(order_id: str, symbol: str):
            return await self.cancel_order(order_id, symbol)
        
        @self.app.get("/api/v1/trading/positions")
        async def get_positions():
            return await self.get_open_positions()
        
        @self.app.get("/api/v1/trading/performance")
        async def get_performance():
            return await self.get_performance_metrics()
        
        @self.app.get("/api/v1/ai/predictions/{symbol}")
        async def get_ai_prediction(symbol: str):
            return await self.get_ai_prediction(symbol)
        
        @self.app.get("/api/v1/ai/signals")
        async def get_ai_signals():
            return await self.get_ai_signals()
        
        @self.app.get("/api/v1/live/market-data")
        async def get_live_market_data():
            return await self.get_live_market_data()
        
        @self.app.websocket("/ws/trading")
        async def websocket_endpoint(websocket: WebSocket):
            await self.websocket_endpoint(websocket)
    
    async def startup(self):
        """بدء تشغيل المحرك"""
        logger.info("🚀 بدء تشغيل Quantum AI Trading Engine...")
        
        try:
            # تحميل نماذج الذكاء الاصطناعي
            await self.load_ai_models()
            
            # بدء المهام الخلفية
            asyncio.create_task(self.market_data_loop())
            asyncio.create_task(self.ai_analysis_loop())
            asyncio.create_task(self.trading_signal_loop())
            asyncio.create_task(self.performance_tracking_loop())
            
            logger.info("✅ تم بدء تشغيل المحرك بنجاح")
            
        except Exception as e:
            logger.error(f"❌ فشل بدء تشغيل المحرك: {str(e)}")
            raise
    
    async def load_ai_models(self):
        """تحميل نماذج الذكاء الاصطناعي"""
        symbols = await self.exchange_service.get_active_symbols()
        
        for symbol in symbols:
            self.ai_models[symbol] = AITradingModel(symbol)
            await self.ai_models[symbol].load_model()
    
    # ... (استمرار باقي الدوال بنفس النمط السابق)

# =============================================================================
# 🚀 تشغيل التطبيق
# =============================================================================

def main():
    """الدالة الرئيسية لتشغيل المحرك"""
    engine = QuantumTradingEngine()
    
    @engine.app.on_event("startup")
    async def startup():
        await engine.startup()
    
    uvicorn.run(
        engine.app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        access_log=True
    )


if __name__ == "__main__":
    main()