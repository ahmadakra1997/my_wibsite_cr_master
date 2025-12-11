# backend/python/services/batch_processor.py
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor
import logging
from typing import List, Any, Callable
import time

class BatchProcessor:
    """
    معالج دُفعات متقدم للبيانات الكبيرة - يحسن الأداء مع الحفاظ على الوظائف
    """
    
    def __init__(self, max_workers: int = 5, batch_size: int = 50):
        self.max_workers = max_workers
        self.batch_size = batch_size
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
    
    def process_batch_sync(self, data_list: List[Any], process_func: Callable):
        """
        معالجة دُفعات للمهام المتزامنة - تحسين أداء العمليات المجمعة
        """
        results = []
        
        # تقسيم البيانات إلى دفعات
        batches = [data_list[i:i + self.batch_size] 
                  for i in range(0, len(data_list), self.batch_size)]
        
        for batch in batches:
            try:
                # معالجة الدفعة (نفس الوظائف الحالية)
                batch_results = list(self.executor.map(process_func, batch))
                results.extend(batch_results)
                
                logging.info(f"✅ Processed batch of {len(batch)} items")
                
                # إراحة بسيطة لمنع الحمل الزائد
                time.sleep(0.01)
                
            except Exception as e:
                logging.error(f"❌ Batch processing error: {e}")
                # الاستمرار في المعالجة مع الاحتفاظ بالبيانات المتبقية
                continue
        
        return results  # نفس هيكل المخرجات الأصلي
    
    async def process_batch_async(self, data_list: List[Any], process_func: Callable):
        """
        معالجة دُفعات غير متزامنة للبيانات في الوقت الحقيقي
        """
        async def process_single(session, item):
            """معالجة عنصر فردي - باستخدام الوظائف الحالية"""
            try:
                return await process_func(session, item)
            except Exception as e:
                logging.error(f"Async processing error: {e}")
                return None
        
        async with aiohttp.ClientSession() as session:
            tasks = [process_single(session, item) for item in data_list]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
        # تصفية النتائج الفاشلة
        successful_results = [r for r in results if not isinstance(r, Exception) and r is not None]
        logging.info(f"🔄 Async batch processed: {len(successful_results)}/{len(data_list)} successful")
        
        return successful_results

# تطبيق نظام الدفعات على خدمات التداول الحالية
batch_processor = BatchProcessor(max_workers=10, batch_size=100)

def process_multiple_orders_optimized(orders_data):
    """
    نسخة محسنة من معالجة الطلبات المتعددة - نفس الوظيفة مع أداء أفضل
    """
    from backend.python.services.exchange_service import ExchangeService
    
    exchange_service = ExchangeService()
    
    def process_single_order(order_data):
        # استخدام الوظيفة الأصلية بدون تعديل
        return exchange_service.place_order(
            symbol=order_data['symbol'],
            order_type=order_data['order_type'],
            quantity=order_data['quantity'],
            price=order_data.get('price')
        )
    
    # معالجة الدفعات مع الحفاظ على النتائج الأصلية
    return batch_processor.process_batch_sync(orders_data, process_single_order)
