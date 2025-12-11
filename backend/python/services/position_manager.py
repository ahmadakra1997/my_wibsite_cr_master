# backend/python/services/position_manager.py
"""
📊 خدمة إدارة المراكز والأوامر المتقدمة - تغطية كاملة للكود الأصلي
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

# Custom Imports
from models.trading_models import *

logger = logging.getLogger(__name__)

class PositionStatus(Enum):
    """حالة المركز"""
    OPEN = "open"
    CLOSED = "closed"
    PARTIALLY_CLOSED = "partially_closed"
    PENDING_CLOSE = "pending_close"

class OrderStatus(Enum):
    """حالة الأمر"""
    PENDING = "pending"
    OPEN = "open"
    CLOSED = "closed"
    CANCELED = "canceled"
    EXPIRED = "expired"
    REJECTED = "rejected"

class AdvancedPositionManager:
    """مدير المراكز والأوامر المتقدم - تغطية كاملة للكود الأصلي"""
    
    def __init__(self):
        self.timezone = pytz.timezone('Asia/Riyadh')
        
        # تخزين المراكز والأوامر
        self.open_positions: Dict[str, Position] = {}
        self.closed_positions: Dict[str, Position] = {}
        self.pending_orders: Dict[str, OrderResponse] = {}
        self.order_history: Dict[str, List[OrderResponse]] = {}
        
        # إعدادات إدارة المراكز من الكود الأصلي
        self.position_config = self._load_position_config()
        
        # تتبع الأداء
        self.performance_metrics: Dict[str, Any] = {}
        self.daily_stats: Dict[str, Dict] = {}
        
        # إعدادات الموازنة التلقائية
        self.auto_rebalancing_config = {
            'enabled': True,
            'max_portfolio_exposure': 0.8,  # 80% أقصى تعرض للمحفظة
            'rebalance_threshold': 0.1,     # 10% عتبة إعادة الموازنة
            'check_interval': 300,          # كل 5 دقائق
        }
        
        logger.info("📊 تم تهيئة مدير المراكز المتقدم")

    def _load_position_config(self) -> Dict[str, Any]:
        """تحميل إعدادات إدارة المراكز من الكود الأصلي"""
        return {
            'max_open_positions': 10,
            'max_position_size': 2000.0,
            'auto_trailing_stop': True,
            'partial_close_enabled': True,
            'breakeven_stop_enabled': True,
            'auto_hedging': False,
            'position_scaling': True,
            'dynamic_sizing': True,
        }

    async def open_position(self, symbol: str, side: OrderSide, quantity: float,
                          entry_price: float, stop_loss: float, take_profit: float,
                          leverage: int = 1, timeframe: str = '1h') -> Position:
        """فتح مركز جديد"""
        try:
            position_id = f"{symbol}_{side.value}_{int(time.time())}"
            
            position = Position(
                symbol=symbol,
                side=side,
                quantity=quantity,
                entry_price=entry_price,
                current_price=entry_price,
                current_value=quantity * entry_price,
                unrealized_pnl=0.0,
                realized_pnl=0.0,
                leverage=leverage,
                risk_level=RiskLevel.MEDIUM,
                opened_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                take_profit=take_profit,
                stop_loss=stop_loss
            )
            
            self.open_positions[position_id] = position
            
            # تحديث الإحصائيات
            await self._update_position_stats(position_id, 'opened')
            
            logger.info(f"✅ تم فتح مركز جديد لـ {symbol}: {quantity} @ {entry_price}")
            
            return position
            
        except Exception as e:
            logger.error(f"❌ خطأ في فتح المركز لـ {symbol}: {traceback.format_exc()}")
            raise

    async def update_position_price(self, position_id: str, current_price: float) -> Position:
        """تحديث سعر المركز"""
        try:
            if position_id not in self.open_positions:
                raise ValueError(f"المركز {position_id} غير موجود")
            
            position = self.open_positions[position_id]
            
            # تحديث السعر والقيمة
            position.current_price = current_price
            position.current_value = position.quantity * current_price
            position.unrealized_pnl = (current_price - position.entry_price) * position.quantity
            position.updated_at = datetime.utcnow()
            
            # التحقق من وقف الخسارة وهدف الربح
            await self._check_position_triggers(position_id)
            
            return position
            
        except Exception as e:
            logger.error(f"❌ خطأ في تحديث سعر المركز {position_id}: {str(e)}")
            raise

    async def _check_position_triggers(self, position_id: str):
        """التحقق من محفزات المركز (وقف خسارة، هدف ربح)"""
        try:
            position = self.open_positions[position_id]
            current_price = position.current_price
            
            # التحقق من وقف الخسارة
            if position.stop_loss:
                if (position.side == OrderSide.BUY and current_price <= position.stop_loss) or \
                   (position.side == OrderSide.SELL and current_price >= position.stop_loss):
                    await self.close_position(position_id, "stop_loss")
                    return
            
            # التحقق من هدف الربح
            if position.take_profit:
                if (position.side == OrderSide.BUY and current_price >= position.take_profit) or \
                   (position.side == OrderSide.SELL and current_price <= position.take_profit):
                    await self.close_position(position_id, "take_profit")
                    return
            
            # إدارة التراقيلينغ ستوب التلقائي
            if self.position_config['auto_trailing_stop']:
                await self._manage_auto_trailing_stop(position_id)
            
            # الإغلاق الجزئي التلقائي
            if self.position_config['partial_close_enabled']:
                await self._manage_partial_close(position_id)
                
        except Exception as e:
            logger.error(f"❌ خطأ في التحقق من محفزات المركز {position_id}: {str(e)}")

    async def _manage_auto_trailing_stop(self, position_id: str):
        """إدارة التراقيلينغ ستوب التلقائي"""
        try:
            position = self.open_positions[position_id]
            current_price = position.current_price
            
            # حساب نسبة الربح/الخسارة
            pnl_pct = (current_price - position.entry_price) / position.entry_price * 100
            
            # إعدادات التراقيلينغ ستوب من الكود الأصلي
            trailing_config = {
                '1h': {'activation': 1.8, 'distance': 1.2},
                '15m': {'activation': 1.5, 'distance': 0.8}
            }
            
            config = trailing_config.get('1h', trailing_config['1h'])
            
            if pnl_pct >= config['activation']:
                # حساب وقف الخسارة الجديد
                new_stop_loss = current_price - (current_price * config['distance'] / 100)
                
                # تحديث إذا كان أفضل من الوقف الحالي
                if (position.side == OrderSide.BUY and new_stop_loss > position.stop_loss) or \
                   (position.side == OrderSide.SELL and new_stop_loss < position.stop_loss):
                    position.stop_loss = new_stop_loss
                    logger.info(f"🔄 تحديث التراقيلينغ ستوب لـ {position.symbol}: {new_stop_loss:.4f}")
            
            # تفعيل نقطة التعادل
            if self.position_config['breakeven_stop_enabled'] and pnl_pct >= 2.0:
                if (position.side == OrderSide.BUY and position.stop_loss < position.entry_price) or \
                   (position.side == OrderSide.SELL and position.stop_loss > position.entry_price):
                    position.stop_loss = position.entry_price
                    logger.info(f"⚖️ تفعيل نقطة التعادل لـ {position.symbol}")
                    
        except Exception as e:
            logger.error(f"❌ خطأ في إدارة التراقيلينغ ستوب: {str(e)}")

    async def _manage_partial_close(self, position_id: str):
        """الإدارة التلقائية للإغلاق الجزئي"""
        try:
            position = self.open_positions[position_id]
            current_price = position.current_price
            
            # حساب نسبة الربح
            profit_pct = (current_price - position.entry_price) / position.entry_price * 100
            
            # مستويات الإغلاق الجزئي من الكود الأصلي
            partial_close_levels = [
                (3.0, 0.3),  # إغلاق 30% عند 3% ربح
                (5.0, 0.4),  # إغلاق 40% عند 5% ربح
                (8.0, 0.3)   # إغلاق 30% عند 8% ربح
            ]
            
            for level, close_ratio in partial_close_levels:
                if profit_pct >= level and profit_pct < level + 1.0:
                    # تجنب التكرار
                    close_key = f"partial_close_{level}_{position_id}"
                    if close_key not in self.performance_metrics:
                        await self.partial_close_position(position_id, close_ratio)
                        self.performance_metrics[close_key] = datetime.utcnow()
                    break
                    
        except Exception as e:
            logger.error(f"❌ خطأ في الإغلاق الجزئي: {str(e)}")

    async def partial_close_position(self, position_id: str, close_ratio: float) -> bool:
        """إغلاق جزئي للمركز"""
        try:
            if position_id not in self.open_positions:
                return False
            
            position = self.open_positions[position_id]
            
            # حساب الكمية المطلوب إغلاقها
            close_quantity = position.quantity * close_ratio
            remaining_quantity = position.quantity - close_quantity
            
            if remaining_quantity <= 0:
                await self.close_position(position_id, "full_close")
                return True
            
            # حساب الربح المحقق
            realized_pnl = (position.current_price - position.entry_price) * close_quantity
            
            # تحديث المركز
            position.quantity = remaining_quantity
            position.current_value = remaining_quantity * position.current_price
            position.realized_pnl += realized_pnl
            position.unrealized_pnl = (position.current_price - position.entry_price) * remaining_quantity
            
            logger.info(f"📉 إغلاق جزئي لـ {position.symbol}: {close_ratio:.0%} (ربح: {realized_pnl:.2f})")
            
            # تحديث الإحصائيات
            await self._update_position_stats(position_id, 'partially_closed')
            
            return True
            
        except Exception as e:
            logger.error(f"❌ خطأ في الإغلاق الجزئي لـ {position_id}: {str(e)}")
            return False

    async def close_position(self, position_id: str, close_reason: str) -> bool:
        """إغلاق المركز بالكامل"""
        try:
            if position_id not in self.open_positions:
                return False
            
            position = self.open_positions[position_id]
            
            # حساب الربح/الخسارة النهائية
            final_pnl = (position.current_price - position.entry_price) * position.quantity
            
            # تحديث المركز
            position.realized_pnl += final_pnl
            position.unrealized_pnl = 0.0
            position.current_value = 0.0
            
            # نقل إلى المراكز المغلقة
            self.closed_positions[position_id] = position
            del self.open_positions[position_id]
            
            # تحديث الإحصائيات
            await self._update_position_stats(position_id, 'closed', close_reason, final_pnl)
            
            logger.info(f"🔒 إغلاق مركز {position.symbol}: {close_reason} (ربح: {final_pnl:.2f})")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ خطأ في إغلاق المركز {position_id}: {str(e)}")
            return False

    async def _update_position_stats(self, position_id: str, action: str, 
                                   close_reason: str = None, final_pnl: float = None):
        """تحديث إحصائيات المراكز"""
        try:
            today = datetime.utcnow().date().isoformat()
            
            if today not in self.daily_stats:
                self.daily_stats[today] = {
                    'opened_positions': 0,
                    'closed_positions': 0,
                    'total_profit': 0.0,
                    'total_loss': 0.0,
                    'winning_trades': 0,
                    'losing_trades': 0
                }
            
            stats = self.daily_stats[today]
            
            if action == 'opened':
                stats['opened_positions'] += 1
            elif action == 'closed':
                stats['closed_positions'] += 1
                
                if final_pnl is not None:
                    if final_pnl > 0:
                        stats['total_profit'] += final_pnl
                        stats['winning_trades'] += 1
                    else:
                        stats['total_loss'] += abs(final_pnl)
                        stats['losing_trades'] += 1
            
            # تحديث المقاييس الشاملة
            await self._update_overall_metrics()
            
        except Exception as e:
            logger.error(f"❌ خطأ في تحديث الإحصائيات: {str(e)}")

    async def _update_overall_metrics(self):
        """تحديث المقاييس الشاملة"""
        try:
            total_trades = 0
            winning_trades = 0
            total_profit = 0.0
            total_loss = 0.0
            
            for day_stats in self.daily_stats.values():
                total_trades += day_stats['closed_positions']
                winning_trades += day_stats['winning_trades']
                total_profit += day_stats['total_profit']
                total_loss += day_stats['total_loss']
            
            success_rate = winning_trades / total_trades if total_trades > 0 else 0
            net_profit = total_profit - total_loss
            profit_factor = total_profit / total_loss if total_loss > 0 else total_profit
            
            self.performance_metrics.update({
                'total_trades': total_trades,
                'winning_trades': winning_trades,
                'losing_trades': total_trades - winning_trades,
                'success_rate': success_rate,
                'total_profit': total_profit,
                'total_loss': total_loss,
                'net_profit': net_profit,
                'profit_factor': profit_factor,
                'last_updated': datetime.utcnow()
            })
            
        except Exception as e:
            logger.error(f"❌ خطأ في تحديث المقاييس الشاملة: {str(e)}")

    async def get_open_positions(self, symbol: str = None) -> List[Position]:
        """الحصول على المراكز المفتوحة"""
        try:
            if symbol:
                return [pos for pos in self.open_positions.values() if pos.symbol == symbol]
            else:
                return list(self.open_positions.values())
                
        except Exception as e:
            logger.error(f"❌ خطأ في جلب المراكز المفتوحة: {str(e)}")
            return []

    async def get_closed_positions(self, symbol: str = None, days: int = 30) -> List[Position]:
        """الحصول على المراكز المغلقة"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            positions = []
            for position in self.closed_positions.values():
                if position.updated_at >= cutoff_date:
                    if not symbol or position.symbol == symbol:
                        positions.append(position)
            
            return positions
            
        except Exception as e:
            logger.error(f"❌ خطأ في جلب المراكز المغلقة: {str(e)}")
            return []

    async def get_position_summary(self) -> Dict[str, Any]:
        """الحصول على ملخص المراكز"""
        try:
            open_positions = await self.get_open_positions()
            closed_positions = await self.get_closed_positions(days=7)
            
            total_exposure = sum(pos.current_value for pos in open_positions)
            total_unrealized_pnl = sum(pos.unrealized_pnl for pos in open_positions)
            total_realized_pnl = sum(pos.realized_pnl for pos in closed_positions)
            
            # تحليل حسب العملة
            symbol_analysis = {}
            for position in open_positions:
                if position.symbol not in symbol_analysis:
                    symbol_analysis[position.symbol] = {
                        'count': 0,
                        'total_value': 0.0,
                        'total_pnl': 0.0
                    }
                
                symbol_analysis[position.symbol]['count'] += 1
                symbol_analysis[position.symbol]['total_value'] += position.current_value
                symbol_analysis[position.symbol]['total_pnl'] += position.unrealized_pnl
            
            return {
                'open_positions_count': len(open_positions),
                'closed_positions_count': len(closed_positions),
                'total_exposure': total_exposure,
                'total_unrealized_pnl': total_unrealized_pnl,
                'total_realized_pnl': total_realized_pnl,
                'symbol_analysis': symbol_analysis,
                'performance_metrics': self.performance_metrics,
                'timestamp': datetime.utcnow()
            }
            
        except Exception as e:
            logger.error(f"❌ خطأ في توليد ملخص المراكز: {str(e)}")
            return {}

    async def manage_pending_orders(self):
        """إدارة الأوامر المعلقة"""
        try:
            orders_to_remove = []
            
            for order_id, order in self.pending_orders.items():
                try:
                    # التحقق من انتهاء صلاحية الأمر
                    if await self._is_order_expired(order):
                        orders_to_remove.append(order_id)
                        continue
                    
                    # التحقق من تنفيذ الأمر
                    if await self._is_order_filled(order):
                        await self._process_filled_order(order)
                        orders_to_remove.append(order_id)
                        
                except Exception as e:
                    logger.error(f"❌ خطأ في معالجة الأمر {order_id}: {str(e)}")
                    continue
            
            # إزالة الأوامر المنتهية
            for order_id in orders_to_remove:
                del self.pending_orders[order_id]
                
        except Exception as e:
            logger.error(f"❌ خطأ في إدارة الأوامر المعلقة: {str(e)}")

    async def _is_order_expired(self, order: OrderResponse) -> bool:
        """التحقق من انتهاء صلاحية الأمر"""
        try:
            # افترض أن الأمر ينتهي بعد 24 ساعة
            expiration_time = order.timestamp + timedelta(hours=24)
            return datetime.utcnow() > expiration_time
            
        except Exception as e:
            logger.warning(f"⚠️ خطأ في التحقق من انتهاء الأمر: {str(e)}")
            return False

    async def _is_order_filled(self, order: OrderResponse) -> bool:
        """التحقق من تنفيذ الأمر (محاكاة)"""
        try:
            # في التطبيق الحقيقي، سيتم التحقق من المنصة
            # هذه محاكاة - نفترض أن أوامر السوق تُنفذ فوراً
            return order.order_type == OrderType.MARKET
            
        except Exception as e:
            logger.warning(f"⚠️ خطأ في التحقق من تنفيذ الأمر: {str(e)}")
            return False

    async def _process_filled_order(self, order: OrderResponse):
        """معالجة الأمر المنفذ"""
        try:
            # تسجيل في السجل
            if order.symbol not in self.order_history:
                self.order_history[order.symbol] = []
            
            self.order_history[order.symbol].append(order)
            
            logger.info(f"✅ تم تنفيذ الأمر {order.order_id} لـ {order.symbol}")
            
        except Exception as e:
            logger.error(f"❌ خطأ في معالجة الأمر المنفذ: {str(e)}")

    async def auto_rebalance_portfolio(self, account_balance: float, target_allocation: Dict[str, float]) -> bool:
        """الموازنة التلقائية للمحفظة"""
        try:
            if not self.auto_rebalancing_config['enabled']:
                return False
            
            open_positions = await self.get_open_positions()
            total_exposure = sum(pos.current_value for pos in open_positions)
            
            # التحقق من تجاوز عتبة إعادة الموازنة
            current_exposure_ratio = total_exposure / account_balance
            if current_exposure_ratio <= self.auto_rebalancing_config['max_portfolio_exposure']:
                return False  # لا حاجة لإعادة الموازنة
            
            # حساب التوزيع الحالي
            current_allocation = {}
            for position in open_positions:
                if position.symbol not in current_allocation:
                    current_allocation[position.symbol] = 0.0
                current_allocation[position.symbol] += position.current_value
            
            # حساب التعديلات المطلوبة
            rebalance_actions = []
            for symbol, target_ratio in target_allocation.items():
                current_ratio = current_allocation.get(symbol, 0.0) / total_exposure
                difference = target_ratio - current_ratio
                
                if abs(difference) > self.auto_rebalancing_config['rebalance_threshold']:
                    adjustment_amount = difference * total_exposure
                    rebalance_actions.append({
                        'symbol': symbol,
                        'action': 'BUY' if difference > 0 else 'SELL',
                        'amount': abs(adjustment_amount),
                        'current_ratio': current_ratio,
                        'target_ratio': target_ratio
                    })
            
            # تنفيذ إعادة الموازنة
            for action in rebalance_actions:
                logger.info(f"🔄 إعادة موازنة {action['symbol']}: {action['action']} {action['amount']:.2f}")
                # في التطبيق الحقيقي، سيتم تنفيذ الأوامر هنا
            
            return len(rebalance_actions) > 0
            
        except Exception as e:
            logger.error(f"❌ خطأ في الموازنة التلقائية: {str(e)}")
            return False

    async def get_performance_analytics(self, days: int = 30) -> Dict[str, Any]:
        """الحصول على تحليلات الأداء المتقدمة"""
        try:
            closed_positions = await self.get_closed_positions(days=days)
            open_positions = await self.get_open_positions()
            
            analytics = {
                'period': f"{days} يوم",
                'total_closed_trades': len(closed_positions),
                'total_open_trades': len(open_positions),
                'win_rate': 0.0,
                'average_profit': 0.0,
                'average_loss': 0.0,
                'largest_win': 0.0,
                'largest_loss': 0.0,
                'profit_factor': 0.0,
                'sharpe_ratio': 0.0,
                'max_drawdown': 0.0,
                'daily_breakdown': {},
                'symbol_performance': {}
            }
            
            if not closed_positions:
                return analytics
            
            # حساب المقاييس الأساسية
            winning_trades = [t for t in closed_positions if t.realized_pnl > 0]
            losing_trades = [t for t in closed_positions if t.realized_pnl <= 0]
            
            analytics['win_rate'] = len(winning_trades) / len(closed_positions)
            analytics['average_profit'] = np.mean([t.realized_pnl for t in winning_trades]) if winning_trades else 0
            analytics['average_loss'] = np.mean([t.realized_pnl for t in losing_trades]) if losing_trades else 0
            analytics['largest_win'] = max([t.realized_pnl for t in winning_trades]) if winning_trades else 0
            analytics['largest_loss'] = min([t.realized_pnl for t in losing_trades]) if losing_trades else 0
            
            total_profit = sum(t.realized_pnl for t in winning_trades)
            total_loss = abs(sum(t.realized_pnl for t in losing_trades))
            analytics['profit_factor'] = total_profit / total_loss if total_loss > 0 else float('inf')
            
            # تحليل حسب اليوم
            for position in closed_positions:
                day = position.updated_at.date().isoformat()
                if day not in analytics['daily_breakdown']:
                    analytics['daily_breakdown'][day] = {
                        'trades': 0,
                        'profit': 0.0,
                        'winning_trades': 0
                    }
                
                analytics['daily_breakdown'][day]['trades'] += 1
                analytics['daily_breakdown'][day]['profit'] += position.realized_pnl
                if position.realized_pnl > 0:
                    analytics['daily_breakdown'][day]['winning_trades'] += 1
            
            # تحليل حسب العملة
            for position in closed_positions:
                if position.symbol not in analytics['symbol_performance']:
                    analytics['symbol_performance'][position.symbol] = {
                        'trades': 0,
                        'total_profit': 0.0,
                        'winning_trades': 0
                    }
                
                analytics['symbol_performance'][position.symbol]['trades'] += 1
                analytics['symbol_performance'][position.symbol]['total_profit'] += position.realized_pnl
                if position.realized_pnl > 0:
                    analytics['symbol_performance'][position.symbol]['winning_trades'] += 1
            
            return analytics
            
        except Exception as e:
            logger.error(f"❌ خطأ في تحليلات الأداء: {str(e)}")
            return {}

    async def emergency_close_all_positions(self, reason: str = "emergency") -> Dict[str, Any]:
        """إغلاق طارئ لجميع المراكز"""
        try:
            open_positions = await self.get_open_positions()
            results = {
                'total_positions': len(open_positions),
                'successfully_closed': 0,
                'failed_to_close': 0,
                'total_pnl': 0.0,
                'closed_positions': []
            }
            
            for position_id, position in list(self.open_positions.items()):
                try:
                    success = await self.close_position(position_id, f"emergency_{reason}")
                    if success:
                        results['successfully_closed'] += 1
                        results['total_pnl'] += position.unrealized_pnl
                        results['closed_positions'].append({
                            'symbol': position.symbol,
                            'pnl': position.unrealized_pnl,
                            'size': position.current_value
                        })
                    else:
                        results['failed_to_close'] += 1
                        
                except Exception as e:
                    logger.error(f"❌ فشل الإغلاق الطارئ لـ {position_id}: {str(e)}")
                    results['failed_to_close'] += 1
            
            logger.warning(f"🚨 الإغلاق الطارئ: {results['successfully_closed']}/{results['total_positions']} مراكز")
            
            return results
            
        except Exception as e:
            logger.error(f"❌ خطأ في الإغلاق الطارئ: {str(e)}")
            return {
                'total_positions': 0,
                'successfully_closed': 0,
                'failed_to_close': 0,
                'total_pnl': 0.0,
                'error': str(e)
            }

    async def get_risk_exposure_report(self) -> Dict[str, Any]:
        """تقرير تعرض المخاطرة"""
        try:
            open_positions = await self.get_open_positions()
            
            report = {
                'total_exposure': 0.0,
                'symbol_exposure': {},
                'side_exposure': {'BUY': 0.0, 'SELL': 0.0},
                'leverage_exposure': {},
                'risk_concentration': 0.0,
                'timestamp': datetime.utcnow()
            }
            
            for position in open_positions:
                report['total_exposure'] += position.current_value
                
                # التعرض حسب العملة
                if position.symbol not in report['symbol_exposure']:
                    report['symbol_exposure'][position.symbol] = 0.0
                report['symbol_exposure'][position.symbol] += position.current_value
                
                # التعرض حسب الاتجاه
                report['side_exposure'][position.side.value] += position.current_value
                
                # التعرض حسب الرافعة
                leverage_key = f"lev_{position.leverage}"
                if leverage_key not in report['leverage_exposure']:
                    report['leverage_exposure'][leverage_key] = 0.0
                report['leverage_exposure'][leverage_key] += position.current_value
            
            # حساب تركيز المخاطرة
            if report['total_exposure'] > 0:
                max_symbol_exposure = max(report['symbol_exposure'].values()) if report['symbol_exposure'] else 0
                report['risk_concentration'] = max_symbol_exposure / report['total_exposure']
            
            return report
            
        except Exception as e:
            logger.error(f"❌ خطأ في تقرير التعرض: {str(e)}")
            return {
                'total_exposure': 0.0,
                'error': str(e),
                'timestamp': datetime.utcnow()
            }

# نسخة مبسطة للاستخدام السريع
class SimplePositionManager:
    """مدير مراكز مبسط"""
    
    def __init__(self):
        self.advanced_manager = AdvancedPositionManager()
    
    async def open_trade(self, symbol: str, side: str, quantity: float, price: float) -> str:
        """فتح صفقة مبسطة"""
        order_side = OrderSide.BUY if side.lower() == 'buy' else OrderSide.SELL
        position = await self.advanced_manager.open_position(
            symbol, order_side, quantity, price, 
            price * 0.98, price * 1.04  # وقف خسارة وهدف ربح افتراضي
        )
        return f"position_{symbol}_{side}"
    
    async def get_portfolio_summary(self) -> Dict[str, Any]:
        """الحصول على ملخص المحفظة"""
        return await self.advanced_manager.get_position_summary()
    
    async def close_all_trades(self) -> bool:
        """إغلاق جميع الصفقات"""
        results = await self.advanced_manager.emergency_close_all_positions("manual_close")
        return results['successfully_closed'] > 0

# إنشاء نسخة عالمية
position_manager = AdvancedPositionManager()