# backend/python/services/advanced_strategy_engine.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import logging
from enum import Enum
import asyncio
import warnings

from .strategy_discovery import StrategyDiscovery
from .advanced_cache_manager import cached, async_cached

class MarketRegime(Enum):
    """أنظمة السوق المختلفة"""
    TRENDING_UP = "trending_up"
    TRENDING_DOWN = "trending_down" 
    RANGING = "ranging"
    VOLATILE = "volatile"
    LOW_VOLATILITY = "low_volatility"

class StrategyType(Enum):
    """أنواع الاستراتيجيات"""
    MEAN_REVERSION = "mean_reversion"
    TREND_FOLLOWING = "trend_following"
    BREAKOUT = "breakout"
    MOMENTUM = "momentum"
    ARBITRAGE = "arbitrage"

class AdvancedStrategyEngine:
    """
    محرك استراتيجيات تداول متقدم مع الحفاظ الكامل على الاستراتيجيات الحالية
    وتطبيق تحليلات متقدمة للأسواق
    """
    
    def __init__(self, project_root: str = "/workspaces/my_wibsite_cr"):
        self.project_root = Path(project_root)
        self.discovery = StrategyDiscovery(project_root)
        self.existing_strategies = self.discovery.discover_existing_strategies()
        self.performance_tracker = StrategyPerformanceTracker()
        
        self.logger = logging.getLogger(__name__)
        self.logger.info(f"🚀 محرك الاستراتيجيات المتقدم - تم تحميل {len(self.existing_strategies)} استراتيجية")
    
    @cached(ttl=300, service_name="market_analysis")
    def analyze_market_regime(self, data: pd.DataFrame, symbol: str = None) -> MarketRegime:
        """
        تحليل متقدم لنظام السوق باستخدام مؤشرات متعددة
        """
        if len(data) < 50:
            return MarketRegime.RANGING
        
        try:
            # حساب المؤشرات الفنية المتقدمة
            indicators = self._calculate_advanced_indicators(data)
            
            # تحليل متعدد الأبعاد
            trend_strength = self._calculate_trend_strength(data)
            volatility_ratio = self._calculate_volatility_ratio(data)
            adx_value = indicators.get('adx', 0)
            rsi_value = indicators.get('rsi', 50)
            
            # تحديد نظام السوق
            if adx_value > 25 and trend_strength > 0.1:
                return MarketRegime.TRENDING_UP
            elif adx_value > 25 and trend_strength < -0.1:
                return MarketRegime.TRENDING_DOWN
            elif volatility_ratio > 0.02:
                return MarketRegime.VOLATILE
            elif volatility_ratio < 0.005:
                return MarketRegime.LOW_VOLATILITY
            else:
                return MarketRegime.RANGING
                
        except Exception as e:
            self.logger.warning(f"⚠️ خطأ في تحليل نظام السوق: {e}")
            return MarketRegime.RANGING
    
    def _calculate_advanced_indicators(self, data: pd.DataFrame) -> Dict[str, float]:
        """حساب مؤشرات فنية متقدمة"""
        closes = data['close'].values
        highs = data['high'].values
        lows = data['low'].values
        
        indicators = {}
        
        try:
            # RSI
            indicators['rsi'] = self._calculate_rsi(closes)
            
            # ADX (Average Directional Index)
            indicators['adx'] = self._calculate_adx(highs, lows, closes)
            
            # Bollinger Bands
            bb_upper, bb_lower, bb_middle = self._calculate_bollinger_bands(closes)
            indicators['bb_position'] = (closes[-1] - bb_lower[-1]) / (bb_upper[-1] - bb_lower[-1])
            
            # MACD
            macd, signal, histogram = self._calculate_macd(closes)
            indicators['macd'] = macd[-1] if len(macd) > 0 else 0
            
        except Exception as e:
            self.logger.warning(f"⚠️ خطأ في حساب المؤشرات: {e}")
        
        return indicators
    
    def _calculate_trend_strength(self, data: pd.DataFrame) -> float:
        """حساب قوة الاتجاه باستخدام الانحدار الخطي"""
        if len(data) < 20:
            return 0.0
        
        prices = data['close'].tail(20).values
        x = np.arange(len(prices))
        
        try:
            # انحدار خطي
            slope = np.polyfit(x, prices, 1)[0]
            # تسوية المنحدر بالنسبة لمتوسط السعر
            normalized_slope = slope / np.mean(prices)
            return float(normalized_slope)
        except:
            return 0.0
    
    def _calculate_volatility_ratio(self, data: pd.DataFrame) -> float:
        """حساب نسبة التقلب"""
        if len(data) < 20:
            return 0.0
        
        returns = data['close'].pct_change().dropna()
        volatility = returns.std()
        return float(volatility)
    
    def _calculate_rsi(self, prices: np.ndarray, period: int = 14) -> float:
        """حساب مؤشر RSI"""
        if len(prices) < period + 1:
            return 50.0
        
        deltas = np.diff(prices)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        avg_gains = np.convolve(gains, np.ones(period)/period, mode='valid')
        avg_losses = np.convolve(losses, np.ones(period)/period, mode='valid')
        
        if avg_losses[-1] == 0:
            return 100.0
        
        rs = avg_gains[-1] / avg_losses[-1]
        rsi = 100 - (100 / (1 + rs))
        return float(rsi)
    
    def _calculate_adx(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 14) -> float:
        """حساب مؤشر ADX (مبسط)"""
        if len(highs) < period * 2:
            return 0.0
        
        try:
            # حساب +DI و -DI
            high_diff = np.diff(highs)
            low_diff = -np.diff(lows)
            close_diff = np.diff(closes[:-1])  # تعديل للمطابقة
            
            plus_dm = np.where((high_diff > low_diff) & (high_diff > 0), high_diff, 0)
            minus_dm = np.where((low_diff > high_diff) & (low_diff > 0), low_diff, 0)
            
            # حساب TR
            tr1 = highs[1:] - lows[1:]
            tr2 = np.abs(highs[1:] - closes[:-1])
            tr3 = np.abs(lows[1:] - closes[:-1])
            tr = np.maximum.reduce([tr1, tr2, tr3])
            
            # حساب +DI و -DI
            plus_di = 100 * (pd.Series(plus_dm).rolling(period).mean() / pd.Series(tr).rolling(period).mean())
            minus_di = 100 * (pd.Series(minus_dm).rolling(period).mean() / pd.Series(tr).rolling(period).mean())
            
            # حساب ADX
            dx = 100 * np.abs(plus_di - minus_di) / (plus_di + minus_di)
            adx = dx.rolling(period).mean()
            
            return float(adx.iloc[-1]) if not adx.empty else 0.0
            
        except Exception as e:
            self.logger.warning(f"⚠️ خطأ في حساب ADX: {e}")
            return 0.0
    
    def _calculate_bollinger_bands(self, prices: np.ndarray, period: int = 20, std_dev: int = 2) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """حساب Bollinger Bands"""
        if len(prices) < period:
            return np.array([]), np.array([]), np.array([])
        
        middle_band = pd.Series(prices).rolling(period).mean()
        std = pd.Series(prices).rolling(period).std()
        
        upper_band = middle_band + (std * std_dev)
        lower_band = middle_band - (std * std_dev)
        
        return upper_band.values, lower_band.values, middle_band.values
    
    def _calculate_macd(self, prices: np.ndarray, fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """حساب MACD"""
        if len(prices) < slow:
            return np.array([]), np.array([]), np.array([])
        
        ema_fast = pd.Series(prices).ewm(span=fast).mean()
        ema_slow = pd.Series(prices).ewm(span=slow).mean()
        
        macd = ema_fast - ema_slow
        macd_signal = macd.ewm(span=signal).mean()
        macd_histogram = macd - macd_signal
        
        return macd.values, macd_signal.values, macd_histogram.values
    
    async def generate_trading_signals(self, symbol: str, market_data: pd.DataFrame, 
                                     strategy_type: Optional[StrategyType] = None) -> Dict[str, Any]:
        """
        توليد إشارات تداول متقدمة باستخدام استراتيجيات متعددة
        """
        try:
            # تحليل نظام السوق
            market_regime = self.analyze_market_regime(market_data, symbol)
            
            # اختيار الاستراتيجيات المناسبة
            suitable_strategies = self._select_strategies_for_regime(market_regime, strategy_type)
            
            # توليد الإشارات
            signals = await self._execute_strategies(suitable_strategies, symbol, market_data, market_regime)
            
            return {
                'symbol': symbol,
                'timestamp': datetime.now().isoformat(),
                'market_regime': market_regime.value,
                'signals': signals,
                'confidence': self._calculate_overall_confidence(signals)
            }
            
        except Exception as e:
            self.logger.error(f"❌ خطأ في توليد الإشارات: {e}")
            return self._generate_fallback_signals(symbol)
    
    def _select_strategies_for_regime(self, regime: MarketRegime, preferred_type: Optional[StrategyType]) -> List[Dict]:
        """اختيار الاستراتيجيات المناسبة لنظام السوق"""
        # تعيين الاستراتيجيات المناسبة لكل نظام
        regime_strategy_mapping = {
            MarketRegime.TRENDING_UP: [StrategyType.TREND_FOLLOWING, StrategyType.MOMENTUM],
            MarketRegime.TRENDING_DOWN: [StrategyType.TREND_FOLLOWING, StrategyType.BREAKOUT],
            MarketRegime.RANGING: [StrategyType.MEAN_REVERSION, StrategyType.ARBITRAGE],
            MarketRegime.VOLATILE: [StrategyType.BREAKOUT, StrategyType.MOMENTUM],
            MarketRegime.LOW_VOLATILITY: [StrategyType.MEAN_REVERSION, StrategyType.ARBITRAGE]
        }
        
        selected_types = regime_strategy_mapping.get(regime, [StrategyType.MEAN_REVERSION])
        
        if preferred_type and preferred_type in selected_types:
            selected_types = [preferred_type]
        
        # ترشيح الاستراتيجيات المتاحة
        available_strategies = []
        for strategy_name, strategy_info in self.existing_strategies.items():
            # محاولة استنتاج نوع الاستراتيجية
            inferred_type = self._infer_strategy_type(strategy_info)
            if inferred_type in selected_types:
                available_strategies.append(strategy_info)
        
        return available_strategies
    
    def _infer_strategy_type(self, strategy_info: Dict) -> StrategyType:
        """استنتاج نوع الاستراتيجية تلقائياً"""
        name_lower = strategy_info['name'].lower()
        description_lower = strategy_info.get('description', '').lower()
        
        if any(word in name_lower + description_lower for word in ['mean', 'reversion', 'oscillator']):
            return StrategyType.MEAN_REVERSION
        elif any(word in name_lower + description_lower for word in ['trend', 'following', 'momentum']):
            return StrategyType.TREND_FOLLOWING
        elif any(word in name_lower + description_lower for word in ['breakout', 'break']):
            return StrategyType.BREAKOUT
        elif any(word in name_lower + description_lower for word in ['arbitrage', 'arb']):
            return StrategyType.ARBITRAGE
        else:
            return StrategyType.MEAN_REVERSION  # افتراضي
    
    async def _execute_strategies(self, strategies: List[Dict], symbol: str, 
                                market_data: pd.DataFrame, regime: MarketRegime) -> List[Dict]:
        """تنفيذ الاستراتيجيات المختارة"""
        signals = []
        
        for strategy_info in strategies:
            try:
                signal = await self._execute_single_strategy(strategy_info, symbol, market_data, regime)
                if signal:
                    signals.append(signal)
            except Exception as e:
                self.logger.warning(f"⚠️ فشل تنفيذ الاستراتيجية {strategy_info['name']}: {e}")
        
        return signals
    
    async def _execute_single_strategy(self, strategy_info: Dict, symbol: str, 
                                     market_data: pd.DataFrame, regime: MarketRegime) -> Optional[Dict]:
        """تنفيذ استراتيجية فردية"""
        # محاولة استخدام الاستراتيجية الحقيقية إذا كانت موجودة
        if strategy_info['type'] == 'class' and strategy_info['has_trading_methods']:
            return await self._execute_class_strategy(strategy_info, symbol, market_data)
        else:
            # استخدام استراتيجية افتراضية
            return self._generate_default_signal(strategy_info, symbol, market_data, regime)
    
    async def _execute_class_strategy(self, strategy_info: Dict, symbol: str, 
                                    market_data: pd.DataFrame) -> Optional[Dict]:
        """تنفيذ استراتيجية كلاس حقيقية"""
        try:
            # محاولة استيراد وتنفيذ الاستراتيجية الحقيقية
            file_path = self.project_root / strategy_info['file_path']
            
            import importlib.util
            spec = importlib.util.spec_from_file_location(strategy_info['name'], file_path)
            if spec is None:
                return None
                
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            
            strategy_class = getattr(module, strategy_info['name'])
            instance = strategy_class()
            
            # محاولة استدعاء دوال التداول
            for method_name in strategy_info['methods']:
                if self._is_trading_method(method_name):
                    method = getattr(instance, method_name)
                    if callable(method):
                        result = method(symbol, market_data) if asyncio.iscoroutinefunction(method) else \
                                await method(symbol, market_data)
                        return {
                            'strategy': strategy_info['name'],
                            'signal': result.get('signal', 'HOLD'),
                            'confidence': result.get('confidence', 0.5),
                            'method': method_name
                        }
                        
        except Exception as e:
            self.logger.warning(f"⚠️ لا يمكن تنفيذ الاستراتيجية {strategy_info['name']}: {e}")
        
        return None
    
    def _generate_default_signal(self, strategy_info: Dict, symbol: str, 
                               market_data: pd.DataFrame, regime: MarketRegime) -> Dict:
        """توليد إشارة افتراضية بناءً على نوع الاستراتيجية"""
        strategy_type = self._infer_strategy_type(strategy_info)
        
        if strategy_type == StrategyType.MEAN_REVERSION:
            return self._mean_reversion_signal(market_data, strategy_info['name'])
        elif strategy_type == StrategyType.TREND_FOLLOWING:
            return self._trend_following_signal(market_data, strategy_info['name'])
        elif strategy_type == StrategyType.BREAKOUT:
            return self._breakout_signal(market_data, strategy_info['name'])
        else:
            return {
                'strategy': strategy_info['name'],
                'signal': 'HOLD',
                'confidence': 0.3,
                'reason': 'Default strategy'
            }
    
    def _mean_reversion_signal(self, data: pd.DataFrame, strategy_name: str) -> Dict:
        """إشارة ارتداد متوسط افتراضية"""
        if len(data) < 20:
            return {'signal': 'HOLD', 'confidence': 0.3, 'strategy': strategy_name}
        
        current_price = data['close'].iloc[-1]
        sma_20 = data['close'].tail(20).mean()
        std_20 = data['close'].tail(20).std()
        
        z_score = (current_price - sma_20) / std_20 if std_20 > 0 else 0
        
        if z_score > 2.0:
            return {'signal': 'SELL', 'confidence': min(0.8, abs(z_score)/4), 'strategy': strategy_name}
        elif z_score < -2.0:
            return {'signal': 'BUY', 'confidence': min(0.8, abs(z_score)/4), 'strategy': strategy_name}
        else:
            return {'signal': 'HOLD', 'confidence': 0.5, 'strategy': strategy_name}
    
    def _trend_following_signal(self, data: pd.DataFrame, strategy_name: str) -> Dict:
        """إشارة متابعة الاتجاه افتراضية"""
        if len(data) < 50:
            return {'signal': 'HOLD', 'confidence': 0.3, 'strategy': strategy_name}
        
        short_ma = data['close'].tail(20).mean()
        long_ma = data['close'].tail(50).mean()
        
        if short_ma > long_ma * 1.01:
            return {'signal': 'BUY', 'confidence': 0.7, 'strategy': strategy_name}
        elif short_ma < long_ma * 0.99:
            return {'signal': 'SELL', 'confidence': 0.7, 'strategy': strategy_name}
        else:
            return {'signal': 'HOLD', 'confidence': 0.4, 'strategy': strategy_name}
    
    def _breakout_signal(self, data: pd.DataFrame, strategy_name: str) -> Dict:
        """إشارة اختراق افتراضية"""
        if len(data) < 20:
            return {'signal': 'HOLD', 'confidence': 0.3, 'strategy': strategy_name}
        
        recent_high = data['high'].tail(20).max()
        recent_low = data['low'].tail(20).min()
        current_price = data['close'].iloc[-1]
        
        if current_price >= recent_high * 1.005:
            return {'signal': 'BUY', 'confidence': 0.6, 'strategy': strategy_name}
        elif current_price <= recent_low * 0.995:
            return {'signal': 'SELL', 'confidence': 0.6, 'strategy': strategy_name}
        else:
            return {'signal': 'HOLD', 'confidence': 0.5, 'strategy': strategy_name}
    
    def _calculate_overall_confidence(self, signals: List[Dict]) -> float:
        """حساب الثقة العامة في الإشارات"""
        if not signals:
            return 0.0
        
        confidences = [s.get('confidence', 0) for s in signals]
        return sum(confidences) / len(confidences)
    
    def _generate_fallback_signals(self, symbol: str) -> Dict:
        """إشارات احتياطية في حالة الفشل"""
        return {
            'symbol': symbol,
            'timestamp': datetime.now().isoformat(),
            'market_regime': 'unknown',
            'signals': [{
                'strategy': 'fallback',
                'signal': 'HOLD',
                'confidence': 0.1,
                'reason': 'System error'
            }],
            'confidence': 0.1
        }
