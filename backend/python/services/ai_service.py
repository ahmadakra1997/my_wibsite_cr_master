# backend/python/services/ai_service.py
"""
🧠 خدمة الذكاء الاصطناعي المتقدمة - تغطية كاملة للكود الأصلي
الإصدار: 3.0.0 | المطور: Akraa Trading Team
"""

import asyncio
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

# AI & ML Libraries
import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.utils import class_weight
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from sklearn.model_selection import train_test_split, TimeSeriesSplit
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model, save_model
from tensorflow.keras.layers import (
    LSTM, Dense, Dropout, Bidirectional, Conv1D, MaxPooling1D, 
    Flatten, BatchNormalization, Activation, LeakyReLU
)
from tensorflow.keras.optimizers import Adam, RMSprop
from tensorflow.keras.callbacks import (
    EarlyStopping, ModelCheckpoint, ReduceLROnPlateau, 
    TensorBoard, Callback
)
from tensorflow.keras.regularizers import l1_l2, l2
from tensorflow.keras.utils import to_categorical

# Technical Analysis
import talib
import pandas_ta as ta
from scipy import stats, signal
import pytz

# Advanced Features
from collections import deque, Counter
import warnings
warnings.filterwarnings('ignore')

# Custom Imports
from models.trading_models import *

logger = logging.getLogger(__name__)

class AdvancedAIService:
    """خدمة الذكاء الاصطناعي المتقدمة - تغطية كاملة للكود الأصلي"""
    
    def __init__(self):
        self.model_base_dir = "ai_models"
        self.lookback = 120
        self.sequence_length = 80
        self.prediction_horizon = 5
        
        # الذاكرة والنماذج لكل رمز
        self.symbol_models: Dict[str, tf.keras.Model] = {}
        self.symbol_scalers: Dict[str, MinMaxScaler] = {}
        self.symbol_data: Dict[str, deque] = {}
        self.model_versions: Dict[str, str] = {}
        
        # تتبع الأداء
        self.model_performance: Dict[str, Dict] = {}
        self.prediction_history: Dict[str, List] = {}
        
        # إعدادات الذكاء الاصطناعي من الكود الأصلي
        self.ai_config = self._load_ai_config()
        self.technical_indicators = self._get_technical_indicators()
        
        # تحميل النماذج المسبقة
        self._ensure_directories()
        
        logger.info("🧠 تم تهيئة خدمة الذكاء الاصطناعي المتقدمة")

    def _load_ai_config(self):
        """تحميل إعدادات الذكاء الاصطناعي من الكود الأصلي"""
        return {
            'high_confidence_threshold': 0.65,
            'medium_confidence_threshold': 0.45,
            'min_training_samples': 400,
            'max_training_samples': 2000,
            'validation_split': 0.2,
            'early_stopping_patience': 15,
            'learning_rate': 0.0008,
            'batch_size': 48,
            'epochs': 80,
            'class_balance_boost': 1.3,
            'feature_engineering': True,
            'ensemble_learning': True,
            'transfer_learning': True
        }

    def _get_technical_indicators(self):
        """قائمة المؤشرات الفنية من الكود الأصلي"""
        return {
            'trend': [
                'macd', 'macd_signal', 'macd_hist', 'adx', 'adx_pos', 'adx_neg',
                'cci', 'rsi', 'stoch_k', 'stoch_d', 'williams_r', 'uo', 'ao'
            ],
            'momentum': [
                'mom', 'roc', 'ppo', 'pvo', 'kst', 'kst_sig', 'dpo', 'slope'
            ],
            'volatility': [
                'bb_upper', 'bb_middle', 'bb_lower', 'bb_width', 'bb_pct',
                'atr', 'natr', 'rvi', 'ui'
            ],
            'volume': [
                'obv', 'cmf', 'mfi', 'adi', 'eom', 'vpt', 'nvi', 'pvi'
            ],
            'cycle': [
                'ht_dcperiod', 'ht_dcphase', 'ht_phasor_inphase', 'ht_phasor_quadrature',
                'ht_sine', 'ht_leadsine', 'ht_trendmode'
            ],
            'pattern': [
                'cdl_doji', 'cdl_hammer', 'cdl_engulfing', 'cdl_morningstar',
                'cdl_eveningstar', 'cdl_harami', 'cdl_piercing'
            ]
        }

    def _ensure_directories(self):
        """إنشاء المجلدات اللازمة"""
        os.makedirs(self.model_base_dir, exist_ok=True)
        os.makedirs(f"{self.model_base_dir}/training_logs", exist_ok=True)
        os.makedirs(f"{self.model_base_dir}/model_checkpoints", exist_ok=True)

    async def initialize_symbol_model(self, symbol: str) -> bool:
        """تهيئة النموذج للرمز المحدد"""
        try:
            symbol_key = symbol.replace('/', '_')
            model_loaded = await self._load_existing_model(symbol)
            
            if not model_loaded:
                logger.info(f"🔄 بدء تدريب نموذج جديد لـ {symbol}")
                # سيتم التدريب عند توفر البيانات
                self.symbol_data[symbol] = deque(maxlen=1000)
            
            return True
            
        except Exception as e:
            logger.error(f"❌ فشل تهيئة النموذج لـ {symbol}: {traceback.format_exc()}")
            return False

    async def _load_existing_model(self, symbol: str) -> bool:
        """تحميل النموذج المدرب مسبقاً"""
        try:
            symbol_key = symbol.replace('/', '_')
            model_path = f"{self.model_base_dir}/{symbol_key}/ai_trading_model.h5"
            scaler_path = f"{self.model_base_dir}/{symbol_key}/ai_scaler.pkl"
            
            if os.path.exists(model_path) and os.path.exists(scaler_path):
                self.symbol_models[symbol] = load_model(model_path)
                self.symbol_scalers[symbol] = joblib.load(scaler_path)
                
                # تحميل بيانات الأداء إذا كانت موجودة
                performance_path = f"{self.model_base_dir}/{symbol_key}/performance.json"
                if os.path.exists(performance_path):
                    import json
                    with open(performance_path, 'r') as f:
                        self.model_performance[symbol] = json.load(f)
                
                logger.info(f"✅ تم تحميل النموذج المدرب لـ {symbol}")
                return True
                
        except Exception as e:
            logger.warning(f"⚠️ فشل تحميل النموذج لـ {symbol}: {str(e)}")
        
        return False

    async def train_ai_model(self, symbol: str, ohlcv_data: List[List[float]], 
                           force_retrain: bool = False) -> bool:
        """تدريب نموذج الذكاء الاصطناعي - التغطية الكاملة من الكود الأصلي"""
        try:
            if len(ohlcv_data) < self.ai_config['min_training_samples']:
                logger.warning(f"⚠️ بيانات غير كافية لـ {symbol}: {len(ohlcv_data)} < {self.ai_config['min_training_samples']}")
                return False

            logger.info(f"🎯 بدء تدريب النموذج لـ {symbol} مع {len(ohlcv_data)} عينة")

            # 1. تحضير البيانات المتقدم
            df = self._prepare_advanced_features(ohlcv_data, symbol)
            if df is None or len(df) < 100:
                return False

            # 2. إنشاء الهدف متعدد الفئات
            X, y, feature_names = self._create_advanced_target(df, symbol)
            if X is None or len(X) < 100:
                return False

            # 3. تقسيم البيانات مع الحفاظ على التسلسل الزمني
            X_train, X_val, y_train, y_val = self._time_series_split(X, y)

            # 4. موازنة الفئات المتقدمة
            class_weights = self._calculate_advanced_class_weights(y_train)

            # 5. بناء النموذج المتقدم
            model = self._build_advanced_model(input_shape=(X_train.shape[1], X_train.shape[2]))
            
            # 6. تدريب النموذج مع callbacks متقدمة
            training_success = await self._advanced_model_training(
                model, X_train, y_train, X_val, y_val, class_weights, symbol
            )

            if training_success:
                # 7. تقييم النموذج المتقدم
                evaluation_results = await self._comprehensive_model_evaluation(
                    model, X_val, y_val, symbol
                )
                
                # 8. حفظ النموذج والبيانات
                await self._save_model_and_artifacts(model, symbol, feature_names, evaluation_results)
                
                logger.info(f"✅ اكتمل تدريب النموذج لـ {symbol} بنجاح")
                return True
            else:
                logger.error(f"❌ فشل تدريب النموذج لـ {symbol}")
                return False

        except Exception as e:
            logger.error(f"💥 خطأ غير متوقع في تدريب النموذج لـ {symbol}: {traceback.format_exc()}")
            return False

    def _prepare_advanced_features(self, ohlcv_data: List[List[float]], symbol: str) -> pd.DataFrame:
        """تحضير السمات المتقدمة من الكود الأصلي"""
        try:
            df = pd.DataFrame(ohlcv_data, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            df.set_index('timestamp', inplace=True)
            
            # السمات الأساسية من الكود الأصلي
            df = self._enhance_temporal_features(df)
            
            # المؤشرات الفنية المتقدمة
            df = self._add_technical_indicators(df)
            
            # السمات الإحصائية
            df = self._add_statistical_features(df)
            
            # أنماط الشموع
            df = self._add_candlestick_patterns(df)
            
            # سمات الزخم والتقلب
            df = self._add_momentum_volatility_features(df)
            
            # تنظيف البيانات النهائي
            df = df.fillna(method='ffill').fillna(method='bfill').fillna(0)
            
            # إزالة القيم المتطرفة
            df = self._remove_outliers(df)
            
            logger.info(f"📊 تم تحضير {len(df.columns)} سمة لـ {symbol}")
            return df
            
        except Exception as e:
            logger.error(f"❌ خطأ في تحضير السمات لـ {symbol}: {str(e)}")
            return None

    def _enhance_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """تحسين السمات الزمنية من الكود الأصلي"""
        try:
            # السمات الزمنية الأساسية
            df['price_momentum'] = df['close'].pct_change(5)
            df['volume_trend'] = df['volume'].rolling(10).mean()
            df['volatility'] = df['close'].rolling(20).std()
            
            # المتوسطات المتحركة المتعددة
            for period in [5, 10, 20, 50, 100]:
                df[f'sma_{period}'] = talib.SMA(df['close'], timeperiod=period)
                df[f'ema_{period}'] = talib.EMA(df['close'], timeperiod=period)
                df[f'price_vs_sma_{period}'] = (df['close'] - df[f'sma_{period}']) / df[f'sma_{period}']
            
            # قوة الاتجاه
            df['trend_strength'] = talib.ADX(df['high'], df['low'], df['close'], timeperiod=14)
            df['momentum'] = talib.MOM(df['close'], timeperiod=10)
            
            # تقلبات الحجم
            df['volume_volatility'] = df['volume'].rolling(20).std()
            df['volume_sma_ratio'] = df['volume'] / df['volume'].rolling(20).mean()
            
            return df
            
        except Exception as e:
            logger.warning(f"⚠️ خطأ في تحسين السمات الزمنية: {str(e)}")
            return df

    def _add_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """إضافة المؤشرات الفنية المتقدمة من الكود الأصلي"""
        try:
            # RSI بمختلف الفترات
            for period in [6, 14, 21]:
                df[f'rsi_{period}'] = talib.RSI(df['close'], timeperiod=period)
            
            # MACD
            macd, macd_signal, macd_hist = talib.MACD(df['close'])
            df['macd'] = macd
            df['macd_signal'] = macd_signal
            df['macd_hist'] = macd_hist
            
            # Bollinger Bands
            bb_upper, bb_middle, bb_lower = talib.BBANDS(df['close'])
            df['bb_upper'] = bb_upper
            df['bb_middle'] = bb_middle
            df['bb_lower'] = bb_lower
            df['bb_width'] = (bb_upper - bb_lower) / bb_middle
            df['bb_position'] = (df['close'] - bb_lower) / (bb_upper - bb_lower)
            
            # Stochastic
            stoch_k, stoch_d = talib.STOCH(df['high'], df['low'], df['close'])
            df['stoch_k'] = stoch_k
            df['stoch_d'] = stoch_d
            
            # ATR
            df['atr'] = talib.ATR(df['high'], df['low'], df['close'])
            
            # OBV
            df['obv'] = talib.OBV(df['close'], df['volume'])
            
            # CCI
            df['cci'] = talib.CCI(df['high'], df['low'], df['close'])
            
            # Williams %R
            df['williams_r'] = talib.WILLR(df['high'], df['low'], df['close'])
            
            # ADX
            df['adx'] = talib.ADX(df['high'], df['low'], df['close'])
            
            return df
            
        except Exception as e:
            logger.warning(f"⚠️ خطأ في إضافة المؤشرات الفنية: {str(e)}")
            return df

    def _add_statistical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """إضافة السمات الإحصائية"""
        try:
            # الانحراف المعياري
            df['returns'] = df['close'].pct_change()
            df['volatility_1d'] = df['returns'].rolling(20).std()
            df['volatility_5d'] = df['returns'].rolling(100).std()
            
            # الانحراف
            df['skewness'] = df['returns'].rolling(50).skew()
            df['kurtosis'] = df['returns'].rolling(50).kurtosis()
            
            # الارتباط الذاتي
            df['autocorr_1'] = df['returns'].rolling(50).apply(lambda x: x.autocorr(lag=1), raw=False)
            df['autocorr_5'] = df['returns'].rolling(50).apply(lambda x: x.autocorr(lag=5), raw=False)
            
            # Hurst Exponent (تقريبي)
            df['hurst'] = df['returns'].rolling(100).apply(self._calculate_hurst, raw=False)
            
            return df
            
        except Exception as e:
            logger.warning(f"⚠️ خطأ في إضافة السمات الإحصائية: {str(e)}")
            return df

    def _add_candlestick_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """إضافة أنماط الشموع اليابانية"""
        try:
            # أنماط الشموع الأساسية
            patterns = [
                'CDLDOJI', 'CDLHAMMER', 'CDLENGULFING', 'CDLMORNINGSTAR',
                'CDLEVENINGSTAR', 'CDLHARAMI', 'CDLPIERCING', 'CDLDARKCLOUDCOVER',
                'CDLSHOOTINGSTAR', 'CDL3WHITESOLDIERS', 'CDL3BLACKCROWS'
            ]
            
            for pattern in patterns:
                try:
                    pattern_func = getattr(talib, pattern)
                    df[pattern.lower()] = pattern_func(df['open'], df['high'], df['low'], df['close'])
                except Exception as e:
                    logger.debug(f"⚠️ تعذر إضافة نمط {pattern}: {str(e)}")
                    continue
            
            return df
            
        except Exception as e:
            logger.warning(f"⚠️ خطأ في إضافة أنماط الشموع: {str(e)}")
            return df

    def _add_momentum_volatility_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """إضافة سمات الزخم والتقلب المتقدمة"""
        try:
            # مؤشرات الزخم
            df['roc_5'] = talib.ROC(df['close'], timeperiod=5)
            df['roc_10'] = talib.ROC(df['close'], timeperiod=10)
            df['roc_20'] = talib.ROC(df['close'], timeperiod=20)
            
            # TRIX
            df['trix'] = talib.TRIX(df['close'])
            
            # Ultimate Oscillator
            df['uo'] = talib.ULTOSC(df['high'], df['low'], df['close'])
            
            # Chaikin Oscillator
            df['adosc'] = talib.ADOSC(df['high'], df['low'], df['close'], df['volume'])
            
            # Money Flow Index
            df['mfi'] = talib.MFI(df['high'], df['low'], df['close'], df['volume'])
            
            return df
            
        except Exception as e:
            logger.warning(f"⚠️ خطأ في إضافة سمات الزخم: {str(e)}")
            return df

    def _remove_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """إزالة القيم المتطرفة"""
        try:
            for column in df.select_dtypes(include=[np.number]).columns:
                if df[column].std() > 0:  # تجنب الأعمدة الثابتة
                    q1 = df[column].quantile(0.05)
                    q3 = df[column].quantile(0.95)
                    iqr = q3 - q1
                    lower_bound = q1 - 1.5 * iqr
                    upper_bound = q3 + 1.5 * iqr
                    df[column] = np.clip(df[column], lower_bound, upper_bound)
            return df
        except Exception as e:
            logger.warning(f"⚠️ خطأ في إزالة القيم المتطرفة: {str(e)}")
            return df

    def _calculate_hurst(self, returns):
        """حساب Hurst Exponent (تقريبي)"""
        try:
            if len(returns) < 2:
                return 0.5
            lags = range(2, min(20, len(returns)))
            tau = [np.std(np.subtract(returns[lag:], returns[:-lag])) for lag in lags]
            poly = np.polyfit(np.log(lags), np.log(tau), 1)
            return poly[0]
        except:
            return 0.5

    def _create_advanced_target(self, df: pd.DataFrame, symbol: str) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """إنشاء الهدف متعدد الفئات من الكود الأصلي"""
        try:
            # استخدام multiple time horizons للتنبؤ
            horizons = [1, 3, 5, 10]
            future_returns = []
            
            for horizon in horizons:
                future_price = df['close'].shift(-horizon)
                returns = (future_price - df['close']) / df['close']
                future_returns.append(returns)
            
            # متوسط العوائد المستقبلية
            avg_future_returns = pd.concat(future_returns, axis=1).mean(axis=1)
            
            # إنشاء فئات متعددة
            conditions = [
                avg_future_returns > 0.02,   # صعود قوي
                avg_future_returns > 0.005,  # صعود معتدل
                avg_future_returns < -0.02,  # هبوط قوي
                avg_future_returns < -0.005  # هبوط معتدل
            ]
            choices = [2, 1, -2, -1]  # 2: صعود قوي, 1: صعود معتدل, -1: هبوط معتدل, -2: هبوط قوي, 0: محايد
            
            df['target'] = np.select(conditions, choices, default=0)
            
            # تحضير البيانات للتدريب
            feature_columns = [col for col in df.columns if col not in ['target', 'future'] and not col.startswith('future_')]
            X = df[feature_columns].values
            y = df['target'].values
            
            # إزالة الصفوف ذات القيم NaN
            valid_indices = ~np.isnan(X).any(axis=1) & ~np.isnan(y)
            X = X[valid_indices]
            y = y[valid_indices]
            
            # تحويل إلى sequences
            X_sequences, y_sequences = [], []
            for i in range(self.sequence_length, len(X)):
                X_sequences.append(X[i-self.sequence_length:i])
                y_sequences.append(y[i])
            
            if len(X_sequences) < 100:
                logger.warning(f"⚠️ بيانات غير كافية بعد المعالجة لـ {symbol}")
                return None, None, []
            
            return np.array(X_sequences), np.array(y_sequences), feature_columns
            
        except Exception as e:
            logger.error(f"❌ خطأ في إنشاء الهدف لـ {symbol}: {str(e)}")
            return None, None, []

    def _time_series_split(self, X: np.ndarray, y: np.ndarray) -> Tuple:
        """تقسيم البيانات مع الحفاظ على التسلسل الزمني"""
        try:
            split_index = int(len(X) * (1 - self.ai_config['validation_split']))
            
            X_train = X[:split_index]
            X_val = X[split_index:]
            y_train = y[:split_index]
            y_val = y[split_index:]
            
            return X_train, X_val, y_train, y_val
            
        except Exception as e:
            logger.error(f"❌ خطأ في تقسيم البيانات: {str(e)}")
            raise

    def _calculate_advanced_class_weights(self, y: np.ndarray) -> Dict[int, float]:
        """حساب أوزان الفئات المتقدمة"""
        try:
            class_counts = Counter(y)
            total_samples = len(y)
            n_classes = len(class_counts)
            
            # استخدام inverse frequency مع smoothing
            class_weights = {}
            for class_label, count in class_counts.items():
                # إضافة smoothing لتجنب الأوزان القصوى
                weight = total_samples / (n_classes * count)
                # تطبيق class_balance_boost من الإعدادات
                weight = weight ** self.ai_config['class_balance_boost']
                class_weights[class_label] = min(weight, 10.0)  # حد أقصى للأوزان
            
            logger.info(f"⚖️ أوزان الفئات: {class_weights}")
            return class_weights
            
        except Exception as e:
            logger.warning(f"⚠️ خطأ في حساب أوزان الفئات: {str(e)}")
            return {0: 1.0, 1: 1.0, -1: 1.0, 2: 1.0, -2: 1.0}

    def _build_advanced_model(self, input_shape: Tuple[int, int]) -> tf.keras.Model:
        """بناء النموذج المتقدم من الكود الأصلي"""
        try:
            model = Sequential([
                # طبقة Conv1D لاستخراج الأنماط المحلية
                Conv1D(filters=64, kernel_size=3, activation='relu', input_shape=input_shape),
                BatchNormalization(),
                MaxPooling1D(pool_size=2),
                Dropout(0.2),
                
                # طبقات LSTM ثنائية الاتجاه
                Bidirectional(LSTM(128, return_sequences=True, kernel_regularizer=l2(0.001))),
                BatchNormalization(),
                Dropout(0.3),
                
                Bidirectional(LSTM(64, return_sequences=True, kernel_regularizer=l2(0.001))),
                BatchNormalization(),
                Dropout(0.3),
                
                Bidirectional(LSTM(32, kernel_regularizer=l2(0.001))),
                BatchNormalization(),
                Dropout(0.3),
                
                # طبقات كثيفة متقدمة
                Dense(128, kernel_regularizer=l2(0.001)),
                BatchNormalization(),
                LeakyReLU(alpha=0.1),
                Dropout(0.4),
                
                Dense(64, kernel_regularizer=l2(0.001)),
                BatchNormalization(),
                LeakyReLU(alpha=0.1),
                Dropout(0.4),
                
                # طبقة الإخراج
                Dense(5, activation='softmax')  # 5 فئات
            ])
            
            # تجميع النموذج
            model.compile(
                optimizer=Adam(learning_rate=self.ai_config['learning_rate']),
                loss='sparse_categorical_crossentropy',
                metrics=['accuracy', 'sparse_categorical_accuracy']
            )
            
            logger.info("✅ تم بناء النموذج المتقدم بنجاح")
            return model
            
        except Exception as e:
            logger.error(f"❌ خطأ في بناء النموذج: {traceback.format_exc()}")
            raise

    async def _advanced_model_training(self, model: tf.keras.Model, X_train: np.ndarray, 
                                     y_train: np.ndarray, X_val: np.ndarray, 
                                     y_val: np.ndarray, class_weights: Dict, 
                                     symbol: str) -> bool:
        """التدريب المتقدم للنموذج"""
        try:
            # Callbacks متقدمة
            callbacks = [
                EarlyStopping(
                    monitor='val_loss',
                    patience=self.ai_config['early_stopping_patience'],
                    restore_best_weights=True,
                    verbose=1
                ),
                ModelCheckpoint(
                    f"{self.model_base_dir}/model_checkpoints/{symbol.replace('/', '_')}_best.h5",
                    monitor='val_accuracy',
                    save_best_only=True,
                    save_weights_only=False,
                    verbose=1
                ),
                ReduceLROnPlateau(
                    monitor='val_loss',
                    factor=0.5,
                    patience=8,
                    min_lr=1e-7,
                    verbose=1
                ),
                TensorBoard(
                    log_dir=f"{self.model_base_dir}/training_logs/{symbol.replace('/', '_')}",
                    histogram_freq=1,
                    write_graph=True,
                    write_images=True
                )
            ]
            
            # التدريب
            history = model.fit(
                X_train, y_train,
                epochs=self.ai_config['epochs'],
                batch_size=self.ai_config['batch_size'],
                validation_data=(X_val, y_val),
                callbacks=callbacks,
                class_weight=class_weights,
                verbose=1,
                shuffle=False  # الحفاظ على التسلسل الزمني
            )
            
            # حفظ تاريخ التدريب
            self._save_training_history(history, symbol)
            
            return True
            
        except Exception as e:
            logger.error(f"❌ خطأ في تدريب النموذج لـ {symbol}: {traceback.format_exc()}")
            return False

    async def _comprehensive_model_evaluation(self, model: tf.keras.Model, X_val: np.ndarray, 
                                            y_val: np.ndarray, symbol: str) -> Dict[str, Any]:
        """تقييم شامل للنموذج"""
        try:
            # التنبؤ
            y_pred_proba = model.predict(X_val, verbose=0)
            y_pred = np.argmax(y_pred_proba, axis=1)
            
            # الحسابات
            accuracy = accuracy_score(y_val, y_pred)
            precision = precision_score(y_val, y_pred, average='weighted', zero_division=0)
            recall = recall_score(y_val, y_pred, average='weighted', zero_division=0)
            f1 = f1_score(y_val, y_pred, average='weighted', zero_division=0)
            
            # تقرير التصنيف
            class_report = classification_report(y_val, y_pred, output_dict=True, zero_division=0)
            
            # ثقة التنبؤ
            prediction_confidence = np.max(y_pred_proba, axis=1).mean()
            
            results = {
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1_score': f1,
                'prediction_confidence': prediction_confidence,
                'class_distribution': dict(Counter(y_val)),
                'classification_report': class_report,
                'evaluation_timestamp': datetime.utcnow().isoformat(),
                'model_version': '3.0.0'
            }
            
            logger.info(f"📊 تقييم النموذج لـ {symbol}: دقة {accuracy:.4f}, F1 {f1:.4f}")
            return results
            
        except Exception as e:
            logger.error(f"❌ خطأ في تقييم النموذج: {str(e)}")
            return {}

    async def _save_model_and_artifacts(self, model: tf.keras.Model, symbol: str, 
                                      feature_names: List[str], evaluation_results: Dict):
        """حفظ النموذج والبيانات المرتبطة"""
        try:
            symbol_key = symbol.replace('/', '_')
            symbol_dir = f"{self.model_base_dir}/{symbol_key}"
            os.makedirs(symbol_dir, exist_ok=True)
            
            # حفظ النموذج
            model.save(f"{symbol_dir}/ai_trading_model.h5")
            
            # حفظ المقياس إذا كان موجوداً
            if symbol in self.symbol_scalers:
                joblib.dump(self.symbol_scalers[symbol], f"{symbol_dir}/ai_scaler.pkl")
            
            # حفظ بيانات التقييم
            import json
            with open(f"{symbol_dir}/performance.json", 'w') as f:
                json.dump(evaluation_results, f, indent=2)
            
            # حفظ قائمة السمات
            with open(f"{symbol_dir}/feature_names.json", 'w') as f:
                json.dump(feature_names, f, indent=2)
            
            # حفظ إعدادات النموذج
            model_config = {
                'lookback': self.lookback,
                'sequence_length': self.sequence_length,
                'prediction_horizon': self.prediction_horizon,
                'model_version': '3.0.0',
                'training_timestamp': datetime.utcnow().isoformat(),
                'feature_count': len(feature_names)
            }
            with open(f"{symbol_dir}/model_config.json", 'w') as f:
                json.dump(model_config, f, indent=2)
                
        except Exception as e:
            logger.error(f"❌ خطأ في حفظ النموذج: {str(e)}")

    def _save_training_history(self, history, symbol: str):
        """حفظ تاريخ التدريب"""
        try:
            symbol_key = symbol.replace('/', '_')
            history_path = f"{self.model_base_dir}/training_logs/{symbol_key}_history.json"
            
            import json
            # تحويل القيم إلى أنواع قابلة للتسجيل JSON
            history_dict = {}
            for key, values in history.history.items():
                history_dict[key] = [float(val) for val in values]
            
            with open(history_path, 'w') as f:
                json.dump(history_dict, f, indent=2)
                
        except Exception as e:
            logger.warning(f"⚠️ تعذر حفظ تاريخ التدريب: {str(e)}")

    async def predict(self, symbol: str, ohlcv_data: List[List[float]]) -> AIPrediction:
        """التنبؤ المتقدم - التغطية الكاملة من الكود الأصلي"""
        try:
            if symbol not in self.symbol_models or self.symbol_models[symbol] is None:
                await self.initialize_symbol_model(symbol)
            
            if (symbol not in self.symbol_models or 
                self.symbol_models[symbol] is None or 
                len(ohlcv_data) < self.sequence_length):
                
                return self._create_fallback_prediction(symbol)
            
            # تحضير البيانات للتنبؤ
            df = self._prepare_advanced_features(ohlcv_data, symbol)
            if df is None:
                return self._create_fallback_prediction(symbol)
            
            feature_columns = [col for col in df.columns if not col.startswith('future_')]
            X = df[feature_columns].values
            
            # تطبيع البيانات إذا كان المقياس موجوداً
            if symbol in self.symbol_scalers:
                X = self.symbol_scalers[symbol].transform(X)
            
            # إنشاء التسلسل
            if len(X) < self.sequence_length:
                return self._create_fallback_prediction(symbol)
            
            X_sequence = np.array([X[-self.sequence_length:]])
            
            # التنبؤ
            prediction_proba = self.symbol_models[symbol].predict(X_sequence, verbose=0)[0]
            predicted_class = np.argmax(prediction_proba)
            confidence = np.max(prediction_proba)
            
            # تحويل الفئة إلى إشارة
            signal_map = {
                2: AIPredictionType.BUY,    # صعود قوي
                1: AIPredictionType.BUY,    # صعود معتدل
                0: AIPredictionType.HOLD,   # محايد
                -1: AIPredictionType.SELL,  # هبوط معتدل
                -2: AIPredictionType.SELL   # هبوط قوي
            }
            
            signal = signal_map.get(predicted_class, AIPredictionType.HOLD)
            
            # حساب المؤشرات الحالية
            current_indicators = self._get_current_indicators(df)
            
            # تسجيل التنبؤ
            await self._record_prediction(symbol, signal, confidence, predicted_class)
            
            return AIPrediction(
                symbol=symbol,
                prediction=signal,
                confidence=float(confidence),
                timestamp=datetime.utcnow(),
                indicators=current_indicators,
                timeframe=TimeFrame.ONE_HOUR,
                model_version=self.model_versions.get(symbol, "3.0.0"),
                features_used=feature_columns
            )
            
        except Exception as e:
            logger.error(f"❌ خطأ في التنبؤ لـ {symbol}: {traceback.format_exc()}")
            return self._create_fallback_prediction(symbol)

    def _get_current_indicators(self, df: pd.DataFrame) -> Dict[str, float]:
        """الحصول على المؤشرات الحالية"""
        try:
            return {
                'rsi': float(df['rsi_14'].iloc[-1]) if 'rsi_14' in df.columns else 50.0,
                'macd': float(df['macd'].iloc[-1]) if 'macd' in df.columns else 0.0,
                'macd_signal': float(df['macd_signal'].iloc[-1]) if 'macd_signal' in df.columns else 0.0,
                'bb_position': float(df['bb_position'].iloc[-1]) if 'bb_position' in df.columns else 0.5,
                'atr': float(df['atr'].iloc[-1]) if 'atr' in df.columns else 0.0,
                'volume_trend': float(df['volume_trend'].iloc[-1]) if 'volume_trend' in df.columns else 0.0,
                'volatility': float(df['volatility'].iloc[-1]) if 'volatility' in df.columns else 0.0,
                'trend_strength': float(df['trend_strength'].iloc[-1]) if 'trend_strength' in df.columns else 0.0
            }
        except Exception as e:
            logger.warning(f"⚠️ خطأ في حساب المؤشرات: {str(e)}")
            return {}

    async def _record_prediction(self, symbol: str, signal: AIPredictionType, 
                               confidence: float, predicted_class: int):
        """تسجيل التنبؤ للتتبع"""
        try:
            if symbol not in self.prediction_history:
                self.prediction_history[symbol] = []
            
            prediction_record = {
                'timestamp': datetime.utcnow(),
                'signal': signal,
                'confidence': confidence,
                'predicted_class': predicted_class,
                'model_version': self.model_versions.get(symbol, "3.0.0")
            }
            
            self.prediction_history[symbol].append(prediction_record)
            
            # الاحتفاظ فقط بآخر 100 تنبؤ
            if len(self.prediction_history[symbol]) > 100:
                self.prediction_history[symbol] = self.prediction_history[symbol][-100:]
                
        except Exception as e:
            logger.warning(f"⚠️ تعذر تسجيل التنبؤ: {str(e)}")

    def _create_fallback_prediction(self, symbol: str) -> AIPrediction:
        """إنشاء تنبؤ احتياطي"""
        return AIPrediction(
            symbol=symbol,
            prediction=AIPredictionType.HOLD,
            confidence=0.5,
            timestamp=datetime.utcnow(),
            indicators={},
            timeframe=TimeFrame.ONE_HOUR,
            model_version="1.0",
            features_used=[]
        )

    async def get_model_performance(self, symbol: str) -> Dict[str, Any]:
        """الحصول على أداء النموذج"""
        try:
            if symbol in self.model_performance:
                return self.model_performance[symbol]
            
            # محاولة تحميل من الملف
            symbol_key = symbol.replace('/', '_')
            performance_path = f"{self.model_base_dir}/{symbol_key}/performance.json"
            
            if os.path.exists(performance_path):
                import json
                with open(performance_path, 'r') as f:
                    self.model_performance[symbol] = json.load(f)
                    return self.model_performance[symbol]
            
            return {}
            
        except Exception as e:
            logger.error(f"❌ خطأ في جلب أداء النموذج: {str(e)}")
            return {}

    async def get_prediction_history(self, symbol: str, limit: int = 50) -> List[Dict]:
        """الحصول على تاريخ التنبؤات"""
        try:
            if symbol in self.prediction_history:
                return self.prediction_history[symbol][-limit:]
            return []
        except Exception as e:
            logger.error(f"❌ خطأ في جلب تاريخ التنبؤات: {str(e)}")
            return []

    async def analyze_market_sentiment(self, symbol: str, ohlcv_data: List[List[float]]) -> Dict[str, Any]:
        """تحليل مشاعر السوق المتقدم"""
        try:
            # التنبؤ الأساسي
            prediction = await self.predict(symbol, ohlcv_data)
            
            # تحليل إضافي للمشاعر
            df = self._prepare_advanced_features(ohlcv_data, symbol)
            if df is None:
                return {
                    'symbol': symbol,
                    'overall_sentiment': 'neutral',
                    'confidence': 0.5,
                    'timestamp': datetime.utcnow().isoformat()
                }
            
            # حساب مشاعر متعددة الأبعاد
            sentiment_scores = self._calculate_multi_dimension_sentiment(df)
            
            return {
                'symbol': symbol,
                'overall_sentiment': self._get_sentiment_label(sentiment_scores['overall']),
                'confidence': float(sentiment_scores['confidence']),
                'sentiment_scores': sentiment_scores,
                'ai_prediction': prediction.dict(),
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ خطأ في تحليل المشاعر لـ {symbol}: {str(e)}")
            return {
                'symbol': symbol,
                'overall_sentiment': 'neutral',
                'confidence': 0.5,
                'timestamp': datetime.utcnow().isoformat()
            }

    def _calculate_multi_dimension_sentiment(self, df: pd.DataFrame) -> Dict[str, float]:
        """حساب مشاعر متعددة الأبعاد"""
        try:
            scores = {}
            
            # زخم السعر
            if 'rsi_14' in df.columns:
                rsi = df['rsi_14'].iloc[-1]
                scores['momentum'] = 1.0 - abs(rsi - 50) / 50  # كلما اقترب من 50 كلما كان محايداً
            
            # قوة الاتجاه
            if 'adx' in df.columns:
                adx = df['adx'].iloc[-1]
                scores['trend_strength'] = min(adx / 50, 1.0)  # تطبيع بين 0 و 1
            
            # التقلب
            if 'volatility' in df.columns:
                volatility = df['volatility'].iloc[-1]
                avg_volatility = df['volatility'].mean()
                scores['volatility_sentiment'] = 1.0 - min(volatility / (avg_volatility * 2), 1.0)
            
            # الحجم
            if 'volume_trend' in df.columns:
                volume_ratio = df['volume_trend'].iloc[-1] / df['volume_trend'].mean()
                scores['volume_sentiment'] = min(volume_ratio, 2.0) / 2.0
            
            # المتوسط المرجح
            overall = np.mean(list(scores.values())) if scores else 0.5
            confidence = np.std(list(scores.values())) if scores else 0.0
            
            return {
                'overall': float(overall),
                'confidence': float(confidence),
                'components': scores
            }
            
        except Exception as e:
            logger.warning(f"⚠️ خطأ في حساب المشاعر: {str(e)}")
            return {'overall': 0.5, 'confidence': 0.0, 'components': {}}

    def _get_sentiment_label(self, score: float) -> str:
        """تحويل النقاط إلى تسمية مشاعر"""
        if score > 0.7:
            return "strong_bullish"
        elif score > 0.6:
            return "bullish"
        elif score > 0.4:
            return "neutral"
        elif score > 0.3:
            return "bearish"
        else:
            return "strong_bearish"

    async def get_ai_health_status(self) -> Dict[str, Any]:
        """الحصول على حالة صحة الذكاء الاصطناعي"""
        try:
            status = {
                'total_models': len(self.symbol_models),
                'loaded_models': sum(1 for model in self.symbol_models.values() if model is not None),
                'model_performance': {},
                'prediction_activity': {},
                'system_status': 'healthy',
                'last_updated': datetime.utcnow().isoformat()
            }
            
            # جمع إحصائيات النماذج
            for symbol in self.symbol_models:
                if symbol in self.model_performance:
                    perf = self.model_performance[symbol]
                    status['model_performance'][symbol] = {
                        'accuracy': perf.get('accuracy', 0),
                        'f1_score': perf.get('f1_score', 0),
                        'last_training': perf.get('evaluation_timestamp', 'unknown')
                    }
                
                if symbol in self.prediction_history:
                    status['prediction_activity'][symbol] = len(self.prediction_history[symbol])
            
            return status
            
        except Exception as e:
            logger.error(f"❌ خطأ في فحص صحة الذكاء الاصطناعي: {str(e)}")
            return {
                'total_models': 0,
                'loaded_models': 0,
                'system_status': 'unhealthy',
                'error': str(e),
                'last_updated': datetime.utcnow().isoformat()
            }

# نسخة مبسطة للاستخدام السريع
class SimpleAIService:
    """خدمة ذكاء اصطناعي مبسطة"""
    
    def __init__(self):
        self.advanced_service = AdvancedAIService()
    
    async def get_prediction(self, symbol: str, ohlcv_data: List[List[float]]) -> AIPrediction:
        """الحصول على تنبؤ مبسط"""
        return await self.advanced_service.predict(symbol, ohlcv_data)
    
    async def get_sentiment(self, symbol: str, ohlcv_data: List[List[float]]) -> Dict[str, Any]:
        """الحصول على مشاعر السوق"""
        return await self.advanced_service.analyze_market_sentiment(symbol, ohlcv_data)

# إنشاء نسخة عالمية
ai_service = AdvancedAIService()