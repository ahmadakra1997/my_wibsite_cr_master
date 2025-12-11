# backend/python/services/risk_manager.py
"""
🛡️ خدمة إدارة المخاطر المتقدمة - تغطية كاملة للكود الأصلي
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

# Custom Imports
from models.trading_models import *

logger = logging.getLogger(__name__)

class RiskLevel(Enum):
    """مستويات المخاطرة"""
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"

class PositionAction(Enum):
    """الإجراءات على المراكز"""
    HOLD = "hold"
    REDUCE = "reduce"
    CLOSE = "close"
    HEDGE = "hedge"

class AdvancedRiskManager:
    """مدير المخاطر المتقدم - تغطية كاملة للكود الأصلي"""
    
    def __init__(self):
        self.timezone = pytz.timezone('Asia/Riyadh')
        
        # إعدادات المخاطرة من الكود الأصلي
        self.risk_config = self._load_risk_config()
        
        # إعدادات التراقيلينغ ستوب من الكود الأصلي
        self.trailing_stop_config = {
            '1h': {
                'activation_threshold': 1.8,
                'trailing_distance': 1.2,
                'breakeven_activation': 2.5,
                'partial_close_levels': [
                    (3.0, 0.3),
                    (5.0, 0.4),
                    (8.0, 0.3)
                ],
                'enabled': True
            },
            '15m': {
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
        }
        
        # حدود المخاطرة
        self.risk_limits = {
            'max_position_size': 2000.0,  # أقصى حجم للمركز
            'max_daily_loss': 500.0,      # أقصى خسارة يومية
            'max_portfolio_risk': 0.02,   # أقصى مخاطرة للمحفظة (2%)
            'max_drawdown': 0.1,          # أقصى تراجع (10%)
            'max_open_positions': 10,     # أقصى عدد مراكز مفتوحة
        }
        
        # تتبع المخاطرة
        self.risk_metrics: Dict[str, Any] = {}
        self.position_risks: Dict[str, Dict] = {}
        self.daily_performance: Dict[str, float] = {}
        
        logger.info("🛡️ تم تهيئة مدير المخاطر المتقدم")

    def _load_risk_config(self) -> Dict[str, Any]:
        """تحميل إعدادات المخاطرة من الكود الأصلي"""
        return {
            'default_stop_loss_pct': 0.02,      # 2% وقف خسارة افتراضي
            'default_take_profit_pct': 0.04,    # 4% هدف ربح افتراضي
            'max_risk_per_trade': 0.01,         # 1% أقصى مخاطرة لكل صفقة
            'volatility_adjustment': True,
            'correlation_protection': True,
            'dynamic_position_sizing': True,
            'emergency_stop_loss': 0.05,        # 5% وقف خسارة طارئ
            'min_risk_reward_ratio': 2.0,       # أقل نسبة مخاطرة/عائد
        }

    async def assess_position_risk(self, position: Position, market_data: MarketData) -> Dict[str, Any]:
        """تقييم مخاطرة المركز بشكل متقدم"""
        try:
            risk_assessment = {
                'position_id': f"{position.symbol}_{position.side.value}",
                'symbol': position.symbol,
                'current_risk_level': RiskLevel.MEDIUM,
                'recommended_action': PositionAction.HOLD,
                'risk_score': 0.0,
                'unrealized_pnl_pct': 0.0,
                'exposure_pct': 0.0,
                'volatility_risk': 0.0,
                'correlation_risk': 0.0,
                'liquidity_risk': 0.0,
                'timestamp': datetime.utcnow()
            }
            
            # حساب نسبة الربح/الخسارة غير المحققة
            risk_assessment['unrealized_pnl_pct'] = position.unrealized_pnl / position.current_value
            
            # حساب نسبة التعرض
            risk_assessment['exposure_pct'] = position.current_value / self.risk_limits['max_position_size']
            
            # تقييم مخاطرة التقلب
            risk_assessment['volatility_risk'] = await self._assess_volatility_risk(position, market_data)
            
            # تقييم مخاطرة الارتباط
            risk_assessment['correlation_risk'] = await self._assess_correlation_risk(position)
            
            # تقييم مخاطرة السيولة
            risk_assessment['liquidity_risk'] = await self._assess_liquidity_risk(position, market_data)
            
            # حساب درجة المخاطرة الإجمالية
            risk_score = self._calculate_risk_score(risk_assessment)
            risk_assessment['risk_score'] = risk_score
            
            # تحديد مستوى المخاطرة
            risk_assessment['current_risk_level'] = self._determine_risk_level(risk_score)
            
            # تحديد الإجراء الموصى به
            risk_assessment['recommended_action'] = self._determine_position_action(risk_assessment)
            
            # تحديث تتبع مخاطرة المركز
            self.position_risks[risk_assessment['position_id']] = risk_assessment
            
            return risk_assessment
            
        except Exception as e:
            logger.error(f"❌ خطأ في تقييم مخاطرة المركز {position.symbol}: {traceback.format_exc()}")
            return self._create_fallback_risk_assessment(position)

    async def _assess_volatility_risk(self, position: Position, market_data: MarketData) -> float:
        """تقييم مخاطرة التقلب"""
        try:
            # حساب التقلب التاريخي
            volatility = market_data.change_24h / 100.0  # تحويل النسبة المئوية
            
            # تكييف مع الرافعة المالية
            leverage_factor = min(position.leverage / 5.0, 3.0)
            
            # حساب مخاطرة التقلب
            volatility_risk = abs(volatility) * leverage_factor * 10
            
            return min(volatility_risk, 1.0)
            
        except Exception as e:
            logger.warning(f"⚠️ خطأ في تقييم مخاطرة التقلب: {str(e)}")
            return 0.5

    async def _assess_correlation_risk(self, position: Position) -> float:
        """تقييم مخاطرة الارتباط (محاكاة)"""
        try:
            # في التطبيق الحقيقي، سيتم حساب الارتباط مع المراكز الأخرى
            # هذه محاكاة مبسطة
            
            base_risk = 0.3
            
            # زيادة المخاطرة للعملات عالية التقلب
            high_volatility_symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
            if position.symbol in high_volatility_symbols:
                base_risk += 0.2
            
            return min(base_risk, 1.0)
            
        except Exception as e:
            logger.warning(f"⚠️ خطأ في تقييم مخاطرة الارتباط: {str(e)}")
            return 0.5

    async def _assess_liquidity_risk(self, position: Position, market_data: MarketData) -> float:
        """تقييم مخاطرة السيولة"""
        try:
            # استخدام السبريد كمؤشر للسيولة
            spread_pct = market_data.spread
            
            if spread_pct < 0.01:  # سبريد منخفض - سيولة عالية
                liquidity_risk = 0.1
            elif spread_pct < 0.05:  # سبريد معتدل - سيولة متوسطة
                liquidity_risk = 0.3
            else:  # سبريد مرتفع - سيولة منخفضة
                liquidity_risk = 0.7
            
            # تعديل بناء على حجم المركز
            size_factor = min(position.current_value / 1000.0, 2.0)
            liquidity_risk *= size_factor
            
            return min(liquidity_risk, 1.0)
            
        except Exception as e:
            logger.warning(f"⚠️ خطأ في تقييم مخاطرة السيولة: {str(e)}")
            return 0.5

    def _calculate_risk_score(self, risk_assessment: Dict[str, Any]) -> float:
        """حساب درجة المخاطرة الإجمالية"""
        try:
            weights = {
                'unrealized_pnl_pct': 0.3,
                'exposure_pct': 0.25,
                'volatility_risk': 0.2,
                'correlation_risk': 0.15,
                'liquidity_risk': 0.1
            }
            
            risk_score = 0.0
            
            # حساب الدرجة المرجحة
            for factor, weight in weights.items():
                value = abs(risk_assessment[factor])
                risk_score += value * weight
            
            # تطبيق عوامل التعديل
            if risk_assessment['unrealized_pnl_pct'] < -0.05:  # خسارة أكثر من 5%
                risk_score *= 1.5
            elif risk_assessment['unrealized_pnl_pct'] > 0.1:  # ربح أكثر من 10%
                risk_score *= 0.7
            
            return min(risk_score, 1.0)
            
        except Exception as e:
            logger.warning(f"⚠️ خطأ في حساب درجة المخاطرة: {str(e)}")
            return 0.5

    def _determine_risk_level(self, risk_score: float) -> RiskLevel:
        """تحديد مستوى المخاطرة"""
        if risk_score >= 0.8:
            return RiskLevel.VERY_HIGH
        elif risk_score >= 0.6:
            return RiskLevel.HIGH
        elif risk_score >= 0.4:
            return RiskLevel.MEDIUM
        elif risk_score >= 0.2:
            return RiskLevel.LOW
        else:
            return RiskLevel.VERY_LOW

    def _determine_position_action(self, risk_assessment: Dict[str, Any]) -> PositionAction:
        """تحديد الإجراء الموصى به على المركز"""
        risk_level = risk_assessment['current_risk_level']
        unrealized_pnl = risk_assessment['unrealized_pnl_pct']
        
        if risk_level == RiskLevel.VERY_HIGH:
            return PositionAction.CLOSE
        elif risk_level == RiskLevel.HIGH:
            return PositionAction.REDUCE
        elif risk_level == RiskLevel.MEDIUM:
            if unrealized_pnl < -0.03:  # خسارة أكثر من 3%
                return PositionAction.HEDGE
            else:
                return PositionAction.HOLD
        else:
            return PositionAction.HOLD

    def _create_fallback_risk_assessment(self, position: Position) -> Dict[str, Any]:
        """إنشاء تقييم مخاطرة احتياطي"""
        return {
            'position_id': f"{position.symbol}_{position.side.value}",
            'symbol': position.symbol,
            'current_risk_level': RiskLevel.MEDIUM,
            'recommended_action': PositionAction.HOLD,
            'risk_score': 0.5,
            'unrealized_pnl_pct': position.unrealized_pnl / position.current_value,
            'exposure_pct': position.current_value / self.risk_limits['max_position_size'],
            'volatility_risk': 0.5,
            'correlation_risk': 0.5,
            'liquidity_risk': 0.5,
            'timestamp': datetime.utcnow()
        }

    async def calculate_position_size(self, symbol: str, entry_price: float, 
                                    stop_loss_price: float, account_balance: float) -> float:
        """حجم المركز بناء على إدارة المخاطرة"""
        try:
            # حساب المخاطرة لكل وحدة
            price_risk = abs(entry_price - stop_loss_price)
            risk_per_unit = price_risk / entry_price
            
            if risk_per_unit <= 0:
                return 0.0
            
            # أقصى مخاطرة للصفقة
            max_risk_amount = account_balance * self.risk_config['max_risk_per_trade']
            
            # حساب حجم المركز
            position_size = max_risk_amount / risk_per_unit
            
            # تطبيق حدود حجم المركز
            max_position_size = self.risk_limits['max_position_size']
            position_size = min(position_size, max_position_size)
            
            # تقريب لأسفل لتجنب الكسور
            position_size = math.floor(position_size * 100) / 100
            
            logger.info(f"📊 حجم المركز لـ {symbol}: {position_size:.2f} (مخاطرة: {risk_per_unit:.2%})")
            
            return position_size
            
        except Exception as e:
            logger.error(f"❌ خطأ في حساب حجم المركز: {str(e)}")
            return 0.0

    async def validate_order(self, order_data: PlaceOrderRequest, account_balance: float, 
                           open_positions: List[Position]) -> Dict[str, Any]:
        """التحقق من صحة الأمر قبل التنفيذ"""
        try:
            validation_result = {
                'allowed': True,
                'reason': '',
                'suggested_adjustments': {},
                'risk_level': RiskLevel.LOW,
                'max_position_size': 0.0
            }
            
            # 1. التحقق من حجم المركز
            position_size_ok = await self._validate_position_size(order_data, account_balance)
            if not position_size_ok['allowed']:
                validation_result.update(position_size_ok)
                return validation_result
            
            # 2. التحقق من مخاطرة المحفظة
            portfolio_risk_ok = await self._validate_portfolio_risk(order_data, open_positions, account_balance)
            if not portfolio_risk_ok['allowed']:
                validation_result.update(portfolio_risk_ok)
                return validation_result
            
            # 3. التحقق من نسبة المخاطرة/العائد
            risk_reward_ok = await self._validate_risk_reward_ratio(order_data)
            if not risk_reward_ok['allowed']:
                validation_result.update(risk_reward_ok)
                return validation_result
            
            # 4. التحقق من حدود اليوم
            daily_limits_ok = await self._validate_daily_limits(order_data, open_positions)
            if not daily_limits_ok['allowed']:
                validation_result.update(daily_limits_ok)
                return validation_result
            
            # حساب حجم المركز المقترح
            if order_data.stop_loss:
                entry_price = order_data.price or await self._get_current_price(order_data.symbol)
                stop_loss_price = order_data.stop_loss
                suggested_size = await self.calculate_position_size(
                    order_data.symbol, entry_price, stop_loss_price, account_balance
                )
                validation_result['suggested_adjustments']['position_size'] = suggested_size
            
            logger.info(f"✅ التحقق من الأمر لـ {order_data.symbol}: مسموح")
            
            return validation_result
            
        except Exception as e:
            logger.error(f"❌ خطأ في التحقق من الأمر: {traceback.format_exc()}")
            return {
                'allowed': False,
                'reason': f'خطأ في التحقق: {str(e)}',
                'risk_level': RiskLevel.HIGH
            }

    async def _validate_position_size(self, order_data: PlaceOrderRequest, account_balance: float) -> Dict[str, Any]:
        """التحقق من حجم المركز"""
        try:
            # حساب قيمة المركز
            position_value = order_data.quantity * (order_data.price or await self._get_current_price(order_data.symbol))
            
            if position_value > self.risk_limits['max_position_size']:
                return {
                    'allowed': False,
                    'reason': f'حجم المركز ({position_value:.2f}) يتجاوز الحد الأقصى ({self.risk_limits["max_position_size"]:.2f})',
                    'risk_level': RiskLevel.HIGH
                }
            
            # التحقق من نسبة المخاطرة
            risk_per_trade = position_value / account_balance
            if risk_per_trade > self.risk_config['max_risk_per_trade']:
                return {
                    'allowed': False,
                    'reason': f'مخاطرة الصفقة ({risk_per_trade:.2%}) تتجاوز الحد المسموح ({self.risk_config["max_risk_per_trade"]:.2%})',
                    'risk_level': RiskLevel.HIGH
                }
            
            return {'allowed': True}
            
        except Exception as e:
            logger.error(f"❌ خطأ في التحقق من حجم المركز: {str(e)}")
            return {'allowed': False, 'reason': f'خطأ في حساب حجم المركز: {str(e)}', 'risk_level': RiskLevel.HIGH}

    async def _validate_portfolio_risk(self, order_data: PlaceOrderRequest, 
                                     open_positions: List[Position], account_balance: float) -> Dict[str, Any]:
        """التحقق من مخاطرة المحفظة"""
        try:
            # حساب إجمالي التعرض الحالي
            total_exposure = sum(pos.current_value for pos in open_positions)
            
            # حساب التع exposure الجديد
            new_position_value = order_data.quantity * (order_data.price or await self._get_current_price(order_data.symbol))
            total_exposure_after = total_exposure + new_position_value
            
            # التحقق من نسبة التع exposure
            exposure_ratio = total_exposure_after / account_balance
            
            if exposure_ratio > self.risk_limits['max_portfolio_risk']:
                return {
                    'allowed': False,
                    'reason': f'تعرض المحفظة ({exposure_ratio:.2%}) يتجاوز الحد المسموح ({self.risk_limits["max_portfolio_risk"]:.2%})',
                    'risk_level': RiskLevel.HIGH
                }
            
            # التحقق من عدد المراكز المفتوحة
            if len(open_positions) >= self.risk_limits['max_open_positions']:
                return {
                    'allowed': False,
                    'reason': f'عدد المراكز المفتوحة ({len(open_positions)}) يتجاوز الحد الأقصى ({self.risk_limits["max_open_positions"]})',
                    'risk_level': RiskLevel.MEDIUM
                }
            
            return {'allowed': True}
            
        except Exception as e:
            logger.error(f"❌ خطأ في التحقق من مخاطرة المحفظة: {str(e)}")
            return {'allowed': False, 'reason': f'خطأ في حساب مخاطرة المحفظة: {str(e)}', 'risk_level': RiskLevel.HIGH}

    async def _validate_risk_reward_ratio(self, order_data: PlaceOrderRequest) -> Dict[str, Any]:
        """التحقق من نسبة المخاطرة/العائد"""
        try:
            if not order_data.stop_loss or not order_data.take_profit:
                return {'allowed': True}  # تخطي إذا لم يتم تحديد وقف الخسارة أو هدف الربح
            
            entry_price = order_data.price or await self._get_current_price(order_data.symbol)
            
            risk = abs(entry_price - order_data.stop_loss)
            reward = abs(order_data.take_profit - entry_price)
            
            if risk <= 0:
                return {'allowed': True}  # تخطي إذا كانت المخاطرة صفر
            
            risk_reward_ratio = reward / risk
            
            if risk_reward_ratio < self.risk_config['min_risk_reward_ratio']:
                return {
                    'allowed': False,
                    'reason': f'نسبة المخاطرة/العائد ({risk_reward_ratio:.2f}) أقل من الحد الأدنى ({self.risk_config["min_risk_reward_ratio"]:.2f})',
                    'risk_level': RiskLevel.MEDIUM
                }
            
            return {'allowed': True}
            
        except Exception as e:
            logger.error(f"❌ خطأ في التحقق من نسبة المخاطرة/العائد: {str(e)}")
            return {'allowed': True}  # السماح في حالة الخطأ

    async def _validate_daily_limits(self, order_data: PlaceOrderRequest, open_positions: List[Position]) -> Dict[str, Any]:
        """التحقق من حدود اليوم"""
        try:
            today = datetime.now().date().isoformat()
            
            # حساب الخسائر اليومية
            if today not in self.daily_performance:
                self.daily_performance[today] = 0.0
            
            daily_loss = self.daily_performance[today]
            
            if daily_loss < -self.risk_limits['max_daily_loss']:
                return {
                    'allowed': False,
                    'reason': f'تم تجاوز الحد الأقصى للخسارة اليومية ({self.risk_limits["max_daily_loss"]:.2f})',
                    'risk_level': RiskLevel.HIGH
                }
            
            return {'allowed': True}
            
        except Exception as e:
            logger.error(f"❌ خطأ في التحقق من حدود اليوم: {str(e)}")
            return {'allowed': True}  # السماح في حالة الخطأ

    async def _get_current_price(self, symbol: str) -> float:
        """الحصول على السعر الحالي (محاكاة)"""
        # في التطبيق الحقيقي، سيتم جلب السعر من خدمة السوق
        return 100.0  # قيمة افتراضية

    async def manage_trailing_stop(self, position: Position, current_price: float, timeframe: str) -> Dict[str, Any]:
        """إدارة التراقيلينغ ستوب المتقدمة من الكود الأصلي"""
        try:
            if timeframe not in self.trailing_stop_config:
                timeframe = '1h'  # استخدام الإعدادات الافتراضية للساعة
            
            config = self.trailing_stop_config[timeframe]
            if not config['enabled']:
                return {'action': 'hold', 'new_stop_loss': None}
            
            # حساب نسبة الربح/الخسارة
            pnl_pct = (current_price - position.entry_price) / position.entry_price * 100
            
            action_result = {
                'action': 'hold',
                'new_stop_loss': position.stop_loss,
                'pnl_pct': pnl_pct,
                'reason': ''
            }
            
            # التحقق من تفعيل التراقيلينغ ستوب
            if pnl_pct >= config['activation_threshold']:
                # حساب وقف الخسارة الجديد
                new_stop_loss = current_price - (current_price * config['trailing_distance'] / 100)
                
                if new_stop_loss > position.stop_loss:
                    action_result.update({
                        'action': 'update_stop_loss',
                        'new_stop_loss': new_stop_loss,
                        'reason': f'تفعيل التراقيلينغ ستوب عند {pnl_pct:.2f}% ربح'
                    })
            
            # التحقق من تفعيل نقطة التعادل
            if pnl_pct >= config['breakeven_activation'] and position.stop_loss < position.entry_price:
                action_result.update({
                    'action': 'update_stop_loss',
                    'new_stop_loss': position.entry_price,
                    'reason': f'تفعيل نقطة التعادل عند {pnl_pct:.2f}% ربح'
                })
            
            # التحقق من الإغلاق الجزئي
            for level, close_pct in config['partial_close_levels']:
                if pnl_pct >= level and pnl_pct < level + 1.0:  # تجنب التكرار
                    action_result.update({
                        'action': 'partial_close',
                        'close_percentage': close_pct,
                        'reason': f'إغلاق جزئي {close_pct:.0%} عند {pnl_pct:.2f}% ربح'
                    })
                    break
            
            return action_result
            
        except Exception as e:
            logger.error(f"❌ خطأ في إدارة التراقيلينغ ستوب: {traceback.format_exc()}")
            return {'action': 'hold', 'new_stop_loss': None}

    async def calculate_dynamic_stop_loss(self, symbol: str, entry_price: float, 
                                        side: OrderSide, volatility: float) -> float:
        """حساب وقف الخسارة الديناميكي بناء على التقلب"""
        try:
            base_stop_pct = self.risk_config['default_stop_loss_pct']
            
            # تعديل وقف الخسارة بناء على التقلب
            volatility_adjustment = 1.0 + (volatility * 5)  # زيادة وقف الخساقة مع زيادة التقلب
            
            dynamic_stop_pct = base_stop_pct * volatility_adjustment
            
            # حساب وقف الخسارة
            if side == OrderSide.BUY:
                stop_loss_price = entry_price * (1 - dynamic_stop_pct)
            else:  # SELL
                stop_loss_price = entry_price * (1 + dynamic_stop_pct)
            
            logger.info(f"🛡️ وقف خسارة ديناميكي لـ {symbol}: {dynamic_stop_pct:.2%} (تقلب: {volatility:.2%})")
            
            return stop_loss_price
            
        except Exception as e:
            logger.error(f"❌ خطأ في حساب وقف الخسارة الديناميكي: {str(e)}")
            # استخدام وقف الخسارة الافتراضي
            if side == OrderSide.BUY:
                return entry_price * (1 - self.risk_config['default_stop_loss_pct'])
            else:
                return entry_price * (1 + self.risk_config['default_stop_loss_pct'])

    async def assess_system_risk(self, market_conditions: Dict[str, Any], 
                               open_positions: List[Position]) -> Dict[str, Any]:
        """تقييم مخاطرة النظام الشاملة"""
        try:
            system_risk = {
                'overall_risk_level': RiskLevel.LOW,
                'risk_factors': [],
                'recommended_actions': [],
                'market_volatility': 0.0,
                'portfolio_health': 0.0,
                'liquidity_conditions': 'normal',
                'timestamp': datetime.utcnow()
            }
            
            # تقييم تقلبات السوق
            market_volatility = await self._assess_market_volatility(market_conditions)
            system_risk['market_volatility'] = market_volatility
            
            if market_volatility > 0.8:
                system_risk['risk_factors'].append('تقلبات سوق عالية')
                system_risk['recommended_actions'].append('تقليل حجم المراكز')
            
            # تقييم صحة المحفظة
            portfolio_health = await self._assess_portfolio_health(open_positions)
            system_risk['portfolio_health'] = portfolio_health
            
            if portfolio_health < 0.5:
                system_risk['risk_factors'].append('صحة محفظة منخفضة')
                system_risk['recommended_actions'].append('إعادة توازن المحفظة')
            
            # تقييم ظروف السيولة
            liquidity_conditions = await self._assess_liquidity_conditions(market_conditions)
            system_risk['liquidity_conditions'] = liquidity_conditions
            
            if liquidity_conditions == 'low':
                system_risk['risk_factors'].append('سيولة منخفضة')
                system_risk['recommended_actions'].append('تجنب المراكز الكبيرة')
            
            # تحديد مستوى المخاطرة الإجمالي
            system_risk['overall_risk_level'] = self._determine_system_risk_level(system_risk)
            
            return system_risk
            
        except Exception as e:
            logger.error(f"❌ خطأ في تقييم مخاطرة النظام: {traceback.format_exc()}")
            return {
                'overall_risk_level': RiskLevel.MEDIUM,
                'risk_factors': ['خطأ في التقييم'],
                'recommended_actions': ['مراقبة النظام'],
                'market_volatility': 0.5,
                'portfolio_health': 0.5,
                'liquidity_conditions': 'unknown',
                'timestamp': datetime.utcnow()
            }

    async def _assess_market_volatility(self, market_conditions: Dict[str, Any]) -> float:
        """تقييم تقلبات السوق"""
        try:
            # محاكاة تقييم التقلبات
            # في التطبيق الحقيقي، سيتم تحليل بيانات السوق التاريخية
            
            volatility_indicators = [
                market_conditions.get('average_volatility', 0.02),
                market_conditions.get('vix_index', 20) / 100.0,
                market_conditions.get('fear_greed_index', 50) / 100.0
            ]
            
            avg_volatility = sum(volatility_indicators) / len(volatility_indicators)
            return min(avg_volatility, 1.0)
            
        except Exception as e:
            logger.warning(f"⚠️ خطأ في تقييم تقلبات السوق: {str(e)}")
            return 0.5

    async def _assess_portfolio_health(self, open_positions: List[Position]) -> float:
        """تقييم صحة المحفظة"""
        try:
            if not open_positions:
                return 1.0  # محفظة فارغة - صحة ممتازة
            
            total_value = sum(pos.current_value for pos in open_positions)
            total_pnl = sum(pos.unrealized_pnl for pos in open_positions)
            
            # حساب نسبة الربح/الخسارة
            pnl_ratio = total_pnl / total_value if total_value > 0 else 0
            
            # حساب صحة المحفظة (0 = سيئة, 1 = ممتازة)
            health_score = 0.5 + (pnl_ratio * 2)  # تحويل إلى مقياس 0-1
            
            return max(0.0, min(health_score, 1.0))
            
        except Exception as e:
            logger.warning(f"⚠️ خطأ في تقييم صحة المحفظة: {str(e)}")
            return 0.5

    async def _assess_liquidity_conditions(self, market_conditions: Dict[str, Any]) -> str:
        """تقييم ظروف السيولة"""
        try:
            # محاكاة تقييم السيولة
            spread = market_conditions.get('average_spread', 0.01)
            volume = market_conditions.get('average_volume', 1000000)
            
            if spread < 0.005 and volume > 500000:
                return 'high'
            elif spread < 0.02 and volume > 100000:
                return 'normal'
            else:
                return 'low'
                
        except Exception as e:
            logger.warning(f"⚠️ خطأ في تقييم ظروف السيولة: {str(e)}")
            return 'normal'

    def _determine_system_risk_level(self, system_risk: Dict[str, Any]) -> RiskLevel:
        """تحديد مستوى مخاطرة النظام"""
        risk_factors_count = len(system_risk['risk_factors'])
        market_volatility = system_risk['market_volatility']
        portfolio_health = system_risk['portfolio_health']
        
        risk_score = (risk_factors_count * 0.3) + (market_volatility * 0.4) + ((1 - portfolio_health) * 0.3)
        
        if risk_score >= 0.7:
            return RiskLevel.VERY_HIGH
        elif risk_score >= 0.5:
            return RiskLevel.HIGH
        elif risk_score >= 0.3:
            return RiskLevel.MEDIUM
        elif risk_score >= 0.2:
            return RiskLevel.LOW
        else:
            return RiskLevel.VERY_LOW

    async def get_risk_report(self, symbol: str = None) -> Dict[str, Any]:
        """توليد تقرير مخاطرة مفصل"""
        try:
            report = {
                'timestamp': datetime.utcnow(),
                'overall_risk_level': RiskLevel.LOW,
                'position_risks': {},
                'system_risks': {},
                'risk_metrics': {},
                'recommendations': []
            }
            
            # جمع مخاطر المراكز
            if symbol:
                if symbol in self.position_risks:
                    report['position_risks'][symbol] = self.position_risks[symbol]
            else:
                report['position_risks'] = self.position_risks
            
            # حساب المقاييس الإجمالية
            total_risk_score = 0.0
            high_risk_positions = 0
            
            for position_risk in self.position_risks.values():
                total_risk_score += position_risk['risk_score']
                if position_risk['current_risk_level'] in [RiskLevel.HIGH, RiskLevel.VERY_HIGH]:
                    high_risk_positions += 1
            
            if self.position_risks:
                avg_risk_score = total_risk_score / len(self.position_risks)
                report['risk_metrics']['average_risk_score'] = avg_risk_score
                report['risk_metrics']['high_risk_positions'] = high_risk_positions
                report['risk_metrics']['total_positions'] = len(self.position_risks)
            
            # تحديد مستوى المخاطرة الإجمالي
            if avg_risk_score >= 0.7:
                report['overall_risk_level'] = RiskLevel.VERY_HIGH
            elif avg_risk_score >= 0.5:
                report['overall_risk_level'] = RiskLevel.HIGH
            elif avg_risk_score >= 0.3:
                report['overall_risk_level'] = RiskLevel.MEDIUM
            elif avg_risk_score >= 0.2:
                report['overall_risk_level'] = RiskLevel.LOW
            else:
                report['overall_risk_level'] = RiskLevel.VERY_LOW
            
            # توليد التوصيات
            if high_risk_positions > 0:
                report['recommendations'].append(f'إغلاق أو تقليل {high_risk_positions} مراكز عالية المخاطرة')
            
            if avg_risk_score > 0.6:
                report['recommendations'].append('تقليل التعرض العام للسوق')
            
            return report
            
        except Exception as e:
            logger.error(f"❌ خطأ في توليد تقرير المخاطرة: {traceback.format_exc()}")
            return {
                'timestamp': datetime.utcnow(),
                'overall_risk_level': RiskLevel.MEDIUM,
                'error': str(e),
                'recommendations': ['مراجعة إعدادات المخاطرة']
            }

# نسخة مبسطة للاستخدام السريع
class SimpleRiskManager:
    """مدير مخاطر مبسط"""
    
    def __init__(self):
        self.advanced_manager = AdvancedRiskManager()
    
    async def check_trade_safety(self, symbol: str, quantity: float, price: float) -> bool:
        """التحقق من أمان الصفقة"""
        order_data = PlaceOrderRequest(
            symbol=symbol,
            side=OrderSide.BUY,
            order_type=OrderType.MARKET,
            quantity=quantity,
            price=price
        )
        
        validation = await self.advanced_manager.validate_order(order_data, 10000.0, [])
        return validation['allowed']
    
    async def get_position_risk(self, symbol: str, entry_price: float, current_price: float, quantity: float) -> str:
        """الحصول على مخاطرة المركز"""
        position = Position(
            symbol=symbol,
            side=OrderSide.BUY,
            quantity=quantity,
            entry_price=entry_price,
            current_price=current_price,
            current_value=current_price * quantity,
            unrealized_pnl=(current_price - entry_price) * quantity,
            opened_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        market_data = MarketData(
            symbol=symbol,
            price=current_price,
            volume=0,
            timestamp=datetime.utcnow(),
            change_24h=0,
            high_24h=current_price,
            low_24h=current_price,
            bid=current_price,
            ask=current_price,
            spread=0,
            base_volume=0,
            quote_volume=0
        )
        
        risk_assessment = await self.advanced_manager.assess_position_risk(position, market_data)
        return risk_assessment['current_risk_level'].value

# إنشاء نسخة عالمية
risk_manager = AdvancedRiskManager()