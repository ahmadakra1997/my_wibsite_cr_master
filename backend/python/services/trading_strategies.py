# backend/python/services/trading_strategies.py
"""
🎯 خدمات إستراتيجيات التداول المتقدمة - تغطية كاملة للكود الأصلي
الإصدار: 3.0.0 | المطور: Akraa Trading Team
"""

import asyncio
import logging
import math
import time
import traceback
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from decimal import Decimal, ROUND_DOWN
from enum import Enum
import numpy as np
import pandas as pd
import pytz
from scipy import stats

# Technical Analysis
import talib
import pandas_ta as ta

# Custom Imports
from models.trading_models import *

logger = logging.getLogger(__name__)

class StrategyType(Enum):
    """أنواع الإستراتيجيات"""
    STRONG_AKRAA_ICT = "strong_akraa_ict"
    GOLDEN_OPPORTUNITY = "golden_opportunity"
    AI_ENHANCED = "ai_enhanced"
    BREAKOUT = "breakout"
    MOMENTUM = "momentum"
    MEAN_REVERSION = "mean_reversion"

class SignalStrength(Enum):
    """قوة الإشارة"""
    VERY_STRONG = "very_strong"
    STRONG = "strong"
    MODERATE = "moderate"
    WEAK = "weak"
    VERY_WEAK = "very_weak"

class AdvancedTradingStrategies:
    """إستراتيجيات التداول المتقدمة - تغطية كاملة للكود الأصلي"""
    
    def __init__(self):
        self.timezone = pytz.timezone('Asia/Riyadh')
        
        # إعدادات ICT من الكود الأصلي
        self.ict_settings = {
            '1m': {'atr_length': 6, 'sl_multiplier': 1.0, 'tp_multiplier': 1.5, 'min_confidence': 0.55, 'volume_threshold': 0.55},
            '5m': {'atr_length': 10, 'sl_multiplier': 1.5, 'tp_multiplier': 2.0, 'min_confidence': 0.65, 'volume_threshold': 0.7},
            '15m': {'atr_length': 14, 'sl_multiplier': 1.7, 'tp_multiplier': 5.0, 'min_confidence': 0.65, 'volume_threshold': 0.75},
            '1h': {'atr_length': 14, 'sl_multiplier': 1.7, 'tp_multiplier': 7.0, 'min_confidence': 0.65, 'volume_threshold': 0.75},
            '4h': {'atr_length': 16, 'sl_multiplier': 1.8, 'tp_multiplier': 2.6, 'min_confidence': 0.75, 'volume_threshold': 0.85}
        }
        
        # إعدادات التوقيت الذكي
        self.optimal_trading_hours = [2, 3, 4, 5, 13, 14, 15, 16]
        
        # إعدادات الفرص الذهبية
        self.golden_opportunity_config = {
            'min_opportunity_score': 60,
            'confidence_boost_threshold': 0.15,
            'volume_multiplier_threshold': 2.5
        }
        
        # تتبع الإشارات
        self.signal_history: Dict[str, List] = {}
        self.strategy_performance: Dict[str, Dict] = {}
        
        logger.info("🎯 تم تهيئة إستراتيجيات التداول المتقدمة")

    async def analyze_strong_akraa_ict(self, symbol: str, ohlcv_data: List[List[float]], 
                                     timeframe: str = '1h') -> Optional[TradingSignal]:
        """
        تحليل إستراتيجية Strong Akraa ICT المتقدمة من الكود الأصلي
        """
        try:
            if len(ohlcv_data) < 100:
                return None

            # تحديث إعدادات ICT للفريم الزمني الحالي
            ict_config = self.ict_settings.get(timeframe, self.ict_settings['1h'])
            
            # تحويل البيانات إلى DataFrame
            df = pd.DataFrame(ohlcv_data, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            
            # حساب مؤشرات ICT
            ict_analysis = await self._calculate_ict_indicators(df, ict_config, symbol)
            
            if not ict_analysis['signal_detected']:
                return None

            # حساب ATR للتوقف والأرباح
            atr = await self._calculate_atr(df, ict_config['atr_length'])
            current_price = df['close'].iloc[-1]
            
            # مستويات الدخول والخروج
            entry_price = current_price
            stop_loss = entry_price - (atr * ict_config['sl_multiplier'])
            take_profit = entry_price + (atr * ict_config['tp_multiplier'])
            
            # حساب قوة الإشارة
            signal_strength = await self._calculate_ict_signal_strength(df, ict_analysis, timeframe)
            
            if signal_strength['confidence'] < ict_config['min_confidence']:
                return None

            # تحليل الحجم
            volume_ok = await self._check_volume_conditions(df, ict_config['volume_threshold'])
            if not volume_ok:
                return None

            # إنشاء إشارة التداول
            signal = TradingSignal(
                symbol=symbol,
                signal=AIPredictionType.BUY,
                strength=signal_strength['strength'],
                confidence=signal_strength['confidence'],
                timestamp=datetime.utcnow(),
                entry_price=float(entry_price),
                stop_loss=float(stop_loss),
                take_profit=float(take_profit),
                timeframe=TimeFrame(timeframe),
                source=StrategyType.STRONG_AKRAA_ICT.value,
                reasoning=signal_strength['reasoning']
            )
            
            # تسجيل الإشارة
            await self._record_signal(symbol, signal, StrategyType.STRONG_AKRAA_ICT)
            
            logger.info(f"🎯 إشارة ICT لـ {symbol}: قوة {signal_strength['strength']}, ثقة {signal_strength['confidence']:.2f}")
            
            return signal

        except Exception as e:
            logger.error(f"❌ خطأ في تحليل ICT لـ {symbol}: {traceback.format_exc()}")
            return None

    async def _calculate_ict_indicators(self, df: pd.DataFrame, ict_config: Dict, symbol: str) -> Dict[str, Any]:
        """حساب مؤشرات ICT المتقدمة"""
        try:
            # HL2 (متوسط أعلى وأقل سعر)
            df['hl2'] = (df['high'] + df['low']) / 2
            
            # البيانات الحالية والسابقة
            current_close = df['close'].iloc[-1]
            prev_close = df['close'].iloc[-2]
            current_hl2 = df['hl2'].iloc[-1]
            prev_hl2 = df['hl2'].iloc[-2]
            current_low = df['low'].iloc[-1]
            prev_low = df['low'].iloc[-2]
            current_open = df['open'].iloc[-1]
            
            # شروط إشارة الشراء ICT
            buy_conditions = [
                current_close > current_hl2,
                current_close > prev_close,
                current_hl2 > prev_hl2,
                current_close > current_open,
                current_low > prev_low
            ]
            
            signal_detected = all(buy_conditions)
            
            # حساب قوة الإشارة
            price_strength = (current_close - prev_close) / prev_close
            volume_strength = df['volume'].iloc[-1] / df['volume'].iloc[-20:].mean()
            
            return {
                'signal_detected': signal_detected,
                'price_strength': price_strength,
                'volume_strength': volume_strength,
                'current_hl2': current_hl2,
                'prev_hl2': prev_hl2
            }
            
        except Exception as e:
            logger.error(f"❌ خطأ في حساب مؤشرات ICT: {str(e)}")
            return {'signal_detected': False}

    async def _calculate_atr(self, df: pd.DataFrame, period: int) -> float:
        """حساب Average True Range"""
        try:
            high = df['high'].values
            low = df['low'].values
            close = df['close'].values
            
            atr = talib.ATR(high, low, close, timeperiod=period)
            return float(atr[-1]) if not np.isnan(atr[-1]) else 0.0
            
        except Exception as e:
            logger.warning(f"⚠️ خطأ في حساب ATR: {str(e)}")
            return 0.02 * df['close'].iloc[-1]  # قيمة افتراضية

    async def _calculate_ict_signal_strength(self, df: pd.DataFrame, ict_analysis: Dict, timeframe: str) -> Dict[str, Any]:
        """حساب قوة إشارة ICT"""
        try:
            strength_factors = []
            reasoning = []
            
            # قوة السعر
            price_strength = abs(ict_analysis['price_strength'])
            if price_strength > 0.01:
                strength_factors.append(0.3)
                reasoning.append("زخم سعري قوي")
            elif price_strength > 0.005:
                strength_factors.append(0.15)
                reasoning.append("زخم سعري معتدل")
            else:
                strength_factors.append(0.05)
                reasoning.append("زخم سعري ضعيف")
            
            # قوة الحجم
            volume_strength = ict_analysis['volume_strength']
            if volume_strength > 1.5:
                strength_factors.append(0.3)
                reasoning.append("حجم تداول عالي")
            elif volume_strength > 1.2:
                strength_factors.append(0.2)
                reasoning.append("حجم تداول جيد")
            else:
                strength_factors.append(0.1)
                reasoning.append("حجم تداول منخفض")
            
            # قوة الاتجاه
            trend_strength = await self._calculate_trend_strength(df)
            strength_factors.append(trend_strength * 0.4)
            reasoning.append(f"قوة اتجاه: {trend_strength:.2f}")
            
            # حساب القوة الإجمالية
            total_strength = sum(strength_factors)
            confidence = min(total_strength, 0.95)  # حد أقصى للثقة
            
            # تحديد قوة الإشارة
            if confidence >= 0.7:
                signal_strength = SignalStrength.VERY_STRONG
            elif confidence >= 0.6:
                signal_strength = SignalStrength.STRONG
            elif confidence >= 0.5:
                signal_strength = SignalStrength.MODERATE
            elif confidence >= 0.4:
                signal_strength = SignalStrength.WEAK
            else:
                signal_strength = SignalStrength.VERY_WEAK
            
            return {
                'strength': signal_strength.value,
                'confidence': confidence,
                'reasoning': reasoning,
                'factors': {
                    'price_strength': price_strength,
                    'volume_strength': volume_strength,
                    'trend_strength': trend_strength
                }
            }
            
        except Exception as e:
            logger.error(f"❌ خطأ في حساب قوة الإشارة: {str(e)}")
            return {'strength': SignalStrength.VERY_WEAK.value, 'confidence': 0.3, 'reasoning': ['خطأ في الحساب']}

    async def _calculate_trend_strength(self, df: pd.DataFrame) -> float:
        """حساب قوة الاتجاه"""
        try:
            # استخدام ADX كمقياس لقوة الاتجاه
            adx = talib.ADX(df['high'], df['low'], df['close'], timeperiod=14)
            current_adx = adx.iloc[-1] if not np.isnan(adx.iloc[-1]) else 0
            
            # تطبيع بين 0 و 1
            trend_strength = min(current_adx / 50.0, 1.0)
            return trend_strength
            
        except Exception as e:
            logger.warning(f"⚠️ خطأ في حساب قوة الاتجاه: {str(e)}")
            return 0.5

    async def _check_volume_conditions(self, df: pd.DataFrame, volume_threshold: float) -> bool:
        """التحقق من شروط الحجم"""
        try:
            current_volume = df['volume'].iloc[-1]
            avg_volume = df['volume'].iloc[-20:].mean()
            
            volume_ratio = current_volume / avg_volume
            return volume_ratio >= volume_threshold
            
        except Exception as e:
            logger.warning(f"⚠️ خطأ في فحص الحجم: {str(e)}")
            return True

    async def detect_golden_opportunities(self, symbol: str, ohlcv_data: List[List[float]]) -> Dict[str, Any]:
        """
        كشف الفرص الذهبية المتقدمة من الكود الأصلي
        """
        try:
            if len(ohlcv_data) < 100:
                return {'is_golden_opportunity': False, 'opportunity_score': 0}
            
            df = pd.DataFrame(ohlcv_data, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            
            opportunity_score = 0
            opportunity_signals = []
            confidence_boost = 0.0
            
            # 1. تحليل التقاء المتوسطات المتحركة الذهبية
            ma_convergence = await self._analyze_golden_ma_convergence(df, symbol)
            if ma_convergence['detected']:
                opportunity_score += 35
                confidence_boost += 0.15
                opportunity_signals.append(f"🎯 تقاء ذهبي للمتوسطات ({ma_convergence['type']})")
            
            # 2. كشف نمط الابتلاع الصاعد القوي
            bullish_engulfing = await self._detect_advanced_bullish_engulfing(df)
            if bullish_engulfing['detected']:
                opportunity_score += 25
                confidence_boost += 0.12
                opportunity_signals.append(f"📈 ابتلاع صاعد قوي (قوة: {bullish_engulfing['strength']:.1%})")
            
            # 3. تحليل كثافة الشراء المؤسسي
            institutional_buying = await self._analyze_institutional_buying_pressure(df)
            if institutional_buying['detected']:
                opportunity_score += 30
                confidence_boost += 0.18
                opportunity_signals.append("🏛 ضغط شراء مؤسسي")
            
            # 4. كشف الاختراق الحجمي
            volume_breakout = await self._detect_volume_breakout(df)
            if volume_breakout['detected']:
                opportunity_score += 20
                confidence_boost += 0.10
                opportunity_signals.append(f"💥 اختراق حجمي (x{volume_breakout['multiplier']:.1f})")
            
            # 5. تحليل الزخم التسعيري المتسارع
            momentum_acceleration = await self._analyze_momentum_acceleration(df)
            if momentum_acceleration['detected']:
                opportunity_score += 20
                confidence_boost += 0.08
                opportunity_signals.append("🚀 تسارع زخمي")
            
            # تحديد مستوى الفرصة
            opportunity_level = "عالية" if opportunity_score >= 70 else "متوسطة" if opportunity_score >= 40 else "منخفضة"
            is_golden_opportunity = opportunity_score >= self.golden_opportunity_config['min_opportunity_score']
            
            result = {
                'is_golden_opportunity': is_golden_opportunity,
                'opportunity_score': opportunity_score,
                'opportunity_level': opportunity_level,
                'confidence_boost': confidence_boost,
                'signals': opportunity_signals,
                'timestamp': datetime.utcnow().timestamp()
            }
            
            if is_golden_opportunity:
                logger.info(f"🎯 كشف فرصة ذهبية لـ {symbol}: {opportunity_score}/100")
                
                # إنشاء إشارة تداول للفرصة الذهبية
                signal = await self._create_golden_opportunity_signal(symbol, df, result)
                if signal:
                    await self._record_signal(symbol, signal, StrategyType.GOLDEN_OPPORTUNITY)
            
            return result
            
        except Exception as e:
            logger.error(f"❌ خطأ في كشف الفرص الذهبية لـ {symbol}: {str(e)}")
            return {
                'is_golden_opportunity': False,
                'opportunity_score': 0,
                'confidence_boost': 0.0,
                'signals': []
            }

    async def _analyze_golden_ma_convergence(self, df: pd.DataFrame, symbol: str) -> Dict[str, Any]:
        """تحليل التقاء المتوسطات المتحركة الذهبية"""
        try:
            closes = df['close'].values
            
            # حساب المتوسطات المتعددة
            ma_fast = talib.SMA(closes, timeperiod=9)
            ma_medium = talib.SMA(closes, timeperiod=21)
            ma_slow = talib.SMA(closes, timeperiod=50)
            ma_volume = talib.SMA(closes, timeperiod=200)
            
            if any(np.isnan([ma_fast[-1], ma_medium[-1], ma_slow[-1], ma_volume[-1]])):
                return {'detected': False, 'type': 'بيانات ناقصة'}
            
            # التحقق من الترتيب الذهبي للمتوسطات
            golden_order = (
                ma_fast[-1] > ma_medium[-1] > ma_slow[-1] and
                closes[-1] > ma_fast[-1] and
                ma_fast[-1] > ma_medium[-1] * 1.005  # تأكيد المسافة
            )
            
            # التقاء ثلاثي (إشارة قوية جداً)
            triple_convergence = (
                ma_fast[-1] > ma_medium[-1] and
                ma_medium[-1] > ma_slow[-1] and
                ma_slow[-1] > ma_volume[-1] and
                all(np.diff([ma_fast[-1], ma_medium[-1], ma_slow[-1], ma_volume[-1]]) > 0)
            )
            
            if triple_convergence:
                return {'detected': True, 'type': 'تقاء ثلاثي ذهبي'}
            elif golden_order:
                return {'detected': True, 'type': 'ترتيب ذهبي'}
            
            return {'detected': False, 'type': 'لا يوجد تقاء'}
            
        except Exception as e:
            logger.error(f"❌ خطأ في تحليل المتوسطات لـ {symbol}: {str(e)}")
            return {'detected': False, 'type': 'خطأ'}

    async def _detect_advanced_bullish_engulfing(self, df: pd.DataFrame) -> Dict[str, Any]:
        """كشف متقدم لأنماط الابتلاع الصاعدة"""
        try:
            if len(df) < 3:
                return {'detected': False, 'strength': 0.0}
            
            current = df.iloc[-1]
            prev = df.iloc[-2]
            
            current_open, current_close, current_high, current_low = current['open'], current['close'], current['high'], current['low']
            prev_open, prev_close, prev_high, prev_low = prev['open'], prev['close'], prev['high'], prev['low']
            
            # ابتلاع صاعد أساسي
            basic_engulfing = (
                prev_close < prev_open and  # شمعة هابطة سابقة
                current_close > current_open and  # شمعة صاعدة حالية
                current_open < prev_close and  # فتح أقل من إغلاق السابقة
                current_close > prev_open  # إغلاق أعلى من فتح السابقة
            )
            
            if not basic_engulfing:
                return {'detected': False, 'strength': 0.0}
            
            # حساب قوة الابتلاع
            engulfing_size = (current_close - current_open) / (prev_open - prev_close)
            body_ratio = (current_close - current_open) / (current_high - current_low)
            
            # شروط القوة
            strength = 0.0
            if engulfing_size > 2.0:
                strength += 0.6
            if body_ratio > 0.7:  # جسم قوي
                strength += 0.4
            if current_close > prev_high:  # اختراق القمة السابقة
                strength += 0.3
            
            strength = min(strength, 1.0)
            
            return {
                'detected': strength > 0.5,
                'strength': strength,
                'engulfing_size': engulfing_size
            }
            
        except Exception as e:
            logger.error(f"❌ خطأ في كشف الابتلاع: {str(e)}")
            return {'detected': False, 'strength': 0.0}

    async def _analyze_institutional_buying_pressure(self, df: pd.DataFrame) -> Dict[str, Any]:
        """تحليل ضغط الشراء المؤسسي (محاكاة)"""
        try:
            # في التطبيق الحقيقي، سيتم جلب بيانات العمق من المنصة
            # هذه محاكاة بناء على تحليل الحجم والسعر
            
            volume_surge = df['volume'].iloc[-1] > df['volume'].iloc[-20:].mean() * 2
            price_strength = (df['close'].iloc[-1] - df['open'].iloc[-1]) / df['open'].iloc[-1] > 0.01
            low_volatility = (df['high'].iloc[-1] - df['low'].iloc[-1]) / df['close'].iloc[-1] < 0.02
            
            institutional_pressure = volume_surge and price_strength and low_volatility
            
            return {
                'detected': institutional_pressure,
                'pressure_score': 0.7 if institutional_pressure else 0.3,
                'volume_surge': volume_surge
            }
            
        except Exception as e:
            logger.error(f"❌ خطأ في تحليل الضغط المؤسسي: {str(e)}")
            return {'detected': False, 'pressure_score': 0.0}

    async def _detect_volume_breakout(self, df: pd.DataFrame) -> Dict[str, Any]:
        """كشف الاختراق الحجمي المتقدم"""
        try:
            current_volume = df['volume'].iloc[-1]
            avg_volume_20 = df['volume'].iloc[-20:].mean()
            avg_volume_50 = df['volume'].iloc[-50:].mean()
            
            volume_multiplier_20 = current_volume / avg_volume_20
            volume_multiplier_50 = current_volume / avg_volume_50
            
            volume_breakout = (
                volume_multiplier_20 > 3.0 or
                volume_multiplier_50 > 2.5
            )
            
            max_multiplier = max(volume_multiplier_20, volume_multiplier_50)
            
            return {
                'detected': volume_breakout,
                'multiplier': max_multiplier,
                'multiplier_20': volume_multiplier_20,
                'multiplier_50': volume_multiplier_50
            }
            
        except Exception as e:
            logger.error(f"❌ خطأ في كشف الاختراق الحجمي: {str(e)}")
            return {'detected': False, 'multiplier': 0.0}

    async def _analyze_momentum_acceleration(self, df: pd.DataFrame) -> Dict[str, Any]:
        """تحليل تسارع الزخم السعري"""
        try:
            closes = df['close'].values
            
            if len(closes) < 15:
                return {'detected': False, 'acceleration': 0.0}
            
            roc_5 = (closes[-1] - closes[-5]) / closes[-5] if len(closes) >= 5 else 0
            roc_10 = (closes[-1] - closes[-10]) / closes[-10] if len(closes) >= 10 else 0
            roc_15 = (closes[-1] - closes[-15]) / closes[-15] if len(closes) >= 15 else 0
            
            acceleration = (roc_5 - roc_10) - (roc_10 - roc_15)
            momentum_acceleration = acceleration > 0.001 and roc_5 > 0
            
            return {
                'detected': momentum_acceleration,
                'acceleration': acceleration,
                'roc_5': roc_5,
                'roc_10': roc_10
            }
            
        except Exception as e:
            logger.error(f"❌ خطأ في تحليل التسارع: {str(e)}")
            return {'detected': False, 'acceleration': 0.0}

    async def _create_golden_opportunity_signal(self, symbol: str, df: pd.DataFrame, opportunity_data: Dict) -> Optional[TradingSignal]:
        """إنشاء إشارة تداول للفرصة الذهبية"""
        try:
            current_price = df['close'].iloc[-1]
            
            # حساب مستويات الدخول والخوء للفرصة الذهبية
            atr = await self._calculate_atr(df, 14)
            entry_price = current_price
            stop_loss = entry_price - (atr * 1.5)  # وقف خسارة أكثر تحفظاً للفرص الذهبية
            take_profit = entry_price + (atr * 3.0)  # هدف ربح أعلى
            
            # تعزيز الثقة بناء على نتيجة الفرصة الذهبية
            base_confidence = 0.7
            enhanced_confidence = min(base_confidence + opportunity_data['confidence_boost'], 0.95)
            
            signal = TradingSignal(
                symbol=symbol,
                signal=AIPredictionType.BUY,
                strength=SignalStrength.VERY_STRONG.value,
                confidence=enhanced_confidence,
                timestamp=datetime.utcnow(),
                entry_price=float(entry_price),
                stop_loss=float(stop_loss),
                take_profit=float(take_profit),
                timeframe=TimeFrame.ONE_HOUR,
                source=StrategyType.GOLDEN_OPPORTUNITY.value,
                reasoning=opportunity_data['signals']
            )
            
            return signal
            
        except Exception as e:
            logger.error(f"❌ خطأ في إنشاء إشارة الفرصة الذهبية: {str(e)}")
            return None

    async def analyze_smart_timing(self, symbol: str) -> Dict[str, Any]:
        """
        نظام التوقيت الذكي المتوافق مع جميع الفريمات
        """
        try:
            current_hour = datetime.now().hour
            
            # إعدادات توقيت مختلفة لكل فريم
            timing_configs = {
                '1m': {
                    'optimal_periods': [(0, 4), (8, 12), (13, 17), (16, 20)],
                    'priority': 'سرعة التنفيذ'
                },
                '5m': {
                    'optimal_periods': [(1, 5), (9, 13), (14, 18)],
                    'priority': 'التوازن'
                },
                '1h': {
                    'optimal_periods': [(2, 6), (13, 17)],
                    'priority': 'الدقة'
                },
                '4h': {
                    'optimal_periods': [(3, 7), (14, 18)],
                    'priority': 'الاتجاه'
                }
            }
            
            # استخدام إعدادات الساعة كافتراضية
            config = timing_configs.get('1h', timing_configs['1h'])
            is_optimal = False
            reason = "فترة عادية"
            
            for start, end in config['optimal_periods']:
                if start <= current_hour <= end:
                    is_optimal = True
                    reason = f"فترة مثالية ({config['priority']})"
                    break
            
            return {
                'optimal': is_optimal, 
                'reason': reason, 
                'current_hour': current_hour,
                'priority': config['priority']
            }
            
        except Exception as e:
            logger.error(f"❌ خطأ في تحليل التوقيت الذكي: {str(e)}")
            return {'optimal': False, 'reason': 'خطأ في التحليل', 'current_hour': datetime.now().hour}

    async def generate_comprehensive_signal(self, symbol: str, ohlcv_data: List[List[float]], 
                                         ai_prediction: Optional[AIPrediction] = None,
                                         timeframe: str = '1h') -> Optional[TradingSignal]:
        """
        توليد إشارة تداول شاملة تجمع بين جميع الإستراتيجيات
        """
        try:
            signals = []
            confidences = []
            reasoning = []
            
            # 1. تحليل ICT
            ict_signal = await self.analyze_strong_akraa_ict(symbol, ohlcv_data, timeframe)
            if ict_signal:
                signals.append(ict_signal)
                confidences.append(ict_signal.confidence)
                reasoning.extend(ict_signal.reasoning)
            
            # 2. تحليل الفرص الذهبية
            golden_opportunity = await self.detect_golden_opportunities(symbol, ohlcv_data)
            if golden_opportunity['is_golden_opportunity']:
                # إنشاء إشارة من الفرصة الذهبية
                df = pd.DataFrame(ohlcv_data, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
                golden_signal = await self._create_golden_opportunity_signal(symbol, df, golden_opportunity)
                if golden_signal:
                    signals.append(golden_signal)
                    confidences.append(golden_signal.confidence)
                    reasoning.extend(golden_signal.reasoning)
            
            # 3. تحليل التوقيت الذكي
            timing_analysis = await self.analyze_smart_timing(symbol)
            if timing_analysis['optimal']:
                reasoning.append(f"🕒 {timing_analysis['reason']}")
                # تعزيز الثقة في الفترات المثالية
                timing_boost = 0.05
                confidences = [c + timing_boost for c in confidences]
            
            # 4. دمج مع تنبؤات الذكاء الاصطناعي
            if ai_prediction and ai_prediction.confidence > 0.6:
                ai_reasoning = f"🤖 تنبؤ ذكاء اصطناعي: {ai_prediction.prediction.value} (ثقة: {ai_prediction.confidence:.2f})"
                reasoning.append(ai_reasoning)
                confidences.append(ai_prediction.confidence)
            
            if not signals:
                return None
            
            # حساب متوسط الثقة
            avg_confidence = sum(confidences) / len(confidences)
            
            # استخدام أقوى إشارة كأساس
            best_signal = max(signals, key=lambda x: x.confidence)
            
            # تحديث الإشارة النهائية
            comprehensive_signal = TradingSignal(
                symbol=symbol,
                signal=best_signal.signal,
                strength=best_signal.strength,
                confidence=avg_confidence,
                timestamp=datetime.utcnow(),
                entry_price=best_signal.entry_price,
                stop_loss=best_signal.stop_loss,
                take_profit=best_signal.take_profit,
                timeframe=best_signal.timeframe,
                source="comprehensive_analysis",
                reasoning=reasoning
            )
            
            await self._record_signal(symbol, comprehensive_signal, StrategyType.AI_ENHANCED)
            
            logger.info(f"🎯 إشارة شاملة لـ {symbol}: ثقة {avg_confidence:.2f}, {len(signals)} إستراتيجية")
            
            return comprehensive_signal
            
        except Exception as e:
            logger.error(f"❌ خطأ في توليد الإشارة الشاملة لـ {symbol}: {traceback.format_exc()}")
            return None

    async def _record_signal(self, symbol: str, signal: TradingSignal, strategy_type: StrategyType):
        """تسجيل الإشارة للتتبع والتحليل"""
        try:
            if symbol not in self.signal_history:
                self.signal_history[symbol] = []
            
            signal_record = {
                'timestamp': datetime.utcnow(),
                'signal': signal.dict(),
                'strategy_type': strategy_type.value,
                'symbol': symbol
            }
            
            self.signal_history[symbol].append(signal_record)
            
            # الاحتفاظ فقط بآخر 500 إشارة
            if len(self.signal_history[symbol]) > 500:
                self.signal_history[symbol] = self.signal_history[symbol][-500:]
                
        except Exception as e:
            logger.warning(f"⚠️ تعذر تسجيل الإشارة: {str(e)}")

    async def get_strategy_performance(self, symbol: str = None, days: int = 30) -> Dict[str, Any]:
        """الحصول على أداء الإستراتيجيات"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            performance = {
                'total_signals': 0,
                'successful_signals': 0,
                'total_profit': 0.0,
                'strategy_breakdown': {},
                'timeframe_analysis': {},
                'overall_success_rate': 0.0
            }
            
            # تحليل الإشارات المسجلة
            for sym, signals in self.signal_history.items():
                if symbol and sym != symbol:
                    continue
                
                for signal_record in signals:
                    if signal_record['timestamp'] >= start_date:
                        performance['total_signals'] += 1
                        
                        strategy_type = signal_record['strategy_type']
                        if strategy_type not in performance['strategy_breakdown']:
                            performance['strategy_breakdown'][strategy_type] = {
                                'count': 0,
                                'successful': 0,
                                'total_profit': 0.0
                            }
                        
                        performance['strategy_breakdown'][strategy_type]['count'] += 1
            
            # حساب معدل النجاح الإجمالي
            if performance['total_signals'] > 0:
                performance['overall_success_rate'] = performance['successful_signals'] / performance['total_signals']
            
            return performance
            
        except Exception as e:
            logger.error(f"❌ خطأ في حساب أداء الإستراتيجيات: {str(e)}")
            return {}

    async def optimize_strategy_parameters(self, symbol: str, ohlcv_data: List[List[float]]) -> Dict[str, Any]:
        """تحسين معاملات الإستراتيجية بناء على الأداء السابق"""
        try:
            if len(ohlcv_data) < 200:
                return {'optimized': False, 'reason': 'بيانات غير كافية'}
            
            df = pd.DataFrame(ohlcv_data, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            
            # تحليل التقلبات التاريخية
            volatility = df['close'].pct_change().std()
            avg_volume = df['volume'].mean()
            
            # تحسين معاملات ICT بناء على التقلبات
            base_atr_multiplier = 1.5
            optimized_multiplier = base_atr_multiplier * (1 + volatility * 10)  # تكييف مع التقلب
            
            # تحسين عتبة الثقة بناء على الحجم
            base_confidence = 0.6
            volume_factor = min(avg_volume / df['volume'].iloc[-100:].mean(), 2.0)
            optimized_confidence = base_confidence * volume_factor
            
            return {
                'optimized': True,
                'parameters': {
                    'atr_multiplier': min(optimized_multiplier, 3.0),
                    'confidence_threshold': min(optimized_confidence, 0.8),
                    'volatility_adjustment': volatility,
                    'volume_factor': volume_factor
                },
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ خطأ في تحسين المعاملات: {str(e)}")
            return {'optimized': False, 'reason': str(e)}

# نسخة مبسطة للاستخدام السريع
class SimpleTradingStrategies:
    """إستراتيجيات تداول مبسطة"""
    
    def __init__(self):
        self.advanced_strategies = AdvancedTradingStrategies()
    
    async def get_trading_signal(self, symbol: str, ohlcv_data: List[List[float]]) -> Optional[TradingSignal]:
        """الحصول على إشارة تداول مبسطة"""
        return await self.advanced_strategies.generate_comprehensive_signal(symbol, ohlcv_data)
    
    async def check_golden_opportunity(self, symbol: str, ohlcv_data: List[List[float]]) -> bool:
        """التحقق من وجود فرصة ذهبية"""
        opportunity = await self.advanced_strategies.detect_golden_opportunities(symbol, ohlcv_data)
        return opportunity['is_golden_opportunity']

# إنشاء نسخة عالمية
trading_strategies = AdvancedTradingStrategies()