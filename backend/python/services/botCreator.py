# backend/python/services/botCreator.py
import os
import requests
import json
import logging
from datetime import datetime, timedelta
import jwt
from database import db  # افتراض وجود اتصال قاعدة بيانات
from models.user import User  # افتراض وجود نموذج المستخدم

class BotCreatorService:
    def __init__(self):
        self.telegram_api_url = "https://api.telegram.org/bot"
        self.logger = logging.getLogger(__name__)
    
    async def create_user_bot(self, user_id, user_data):
        """إنشاء بوت تداول تلقائي للمستخدم"""
        try:
            # 1. التحقق من أهلية المستخدم
            is_eligible = await self.check_user_eligibility(user_id)
            if not is_eligible:
                raise Exception("المستخدم غير مؤهل لإنشاء بوت تداول")
            
            # 2. إنشاء بوت تلغرام
            bot_token = await self.create_telegram_bot(user_data)
            
            # 3. إنشاء تكوين البوت
            bot_config = await self.generate_bot_config(user_id, user_data, bot_token)
            
            # 4. حفظ بيانات البوت
            saved_bot = await self.save_bot_to_database(user_id, bot_config)
            
            # 5. بدء البوت
            await self.start_bot_instance(bot_token, bot_config)
            
            return {
                "success": True,
                "bot_token": bot_token,
                "bot_url": f"https://t.me/{saved_bot['bot_username']}",
                "bot_id": saved_bot["bot_id"],
                "configuration": bot_config
            }
            
        except Exception as e:
            self.logger.error(f"Error creating user bot: {str(e)}")
            raise Exception(f"فشل في إنشاء البوت: {str(e)}")
    
    async def check_user_eligibility(self, user_id):
        """التحقق من أهلية المستخدم لإنشاء البوت"""
        try:
            user = await User.find_by_id(user_id)
            
            if not user:
                raise Exception("المستخدم غير موجود")
            
            # التحقق من حالة الاشتراك
            if user.subscription.status != "active":
                raise Exception("يجب تفعيل الاشتراك أولاً")
            
            # التحقق من وجود دفعات ناجحة
            has_successful_payment = any(
                payment.status == "completed" and payment.type == "subscription"
                for payment in user.payment_history
            )
            
            if not has_successful_payment:
                raise Exception("لم يتم العثور على دفعات ناجحة")
            
            return True
            
        except Exception as e:
            raise Exception(f"خطأ في التحقق من الأهلية: {str(e)}")
    
    async def create_telegram_bot(self, user_data):
        """إنشاء بوت تلغرام جديد"""
        try:
            bot_father_token = os.getenv("BOT_FATHER_TOKEN")
            
            if not bot_father_token:
                # في حالة التطوير، استخدام token افتراضي
                self.logger.info("Using development bot token")
                return self.generate_development_token(user_data)
            
            bot_name = f"{user_data['personal_info']['name'].replace(' ', '_')}_Trading_Bot"
            
            response = requests.post(
                f"{self.telegram_api_url}{bot_father_token}/createNewBot",
                json={
                    "name": bot_name,
                    "description": f"بوت تداول تلقائي لـ {user_data['personal_info']['name']}"
                }
            )
            
            if response.json().get("ok"):
                return response.json()["result"]["token"]
            else:
                raise Exception(response.json().get("description", "Unknown error"))
                
        except Exception as e:
            self.logger.error(f"Error creating Telegram bot: {str(e)}")
            return self.generate_development_token(user_data)
    
    def generate_development_token(self, user_data):
        """إنشاء token تطوير للبوت"""
        import hashlib
        import time
        
        timestamp = str(int(time.time()))
        user_id = user_data['personal_info']['user_id']
        return f"dev_bot_{user_id}_{timestamp}_{hashlib.md5(user_id.encode()).hexdigest()[:8]}"
    
    async def generate_bot_config(self, user_id, user_data, bot_token):
        """إنشاء تكوين البوت"""
        user_settings = user_data.get("trading_settings", {})
        subscription = user_data.get("subscription", {})
        
        return {
            "user_id": user_id,
            "bot_token": bot_token,
            "trading_config": {
                "strategy": user_settings.get("strategy", {}).get("primary", "day_trading"),
                "risk_level": user_settings.get("risk_management", {}).get("risk_level", "moderate"),
                "exchanges": [
                    acc for acc in user_data.get("exchange_accounts", []) 
                    if acc.get("is_active", False)
                ],
                "indicators": user_settings.get("strategy", {}).get("indicators", {}),
                "risk_management": {
                    "stop_loss": user_settings.get("risk_management", {}).get("stop_loss", {}).get("percentage", 2),
                    "take_profit": user_settings.get("risk_management", {}).get("take_profit", {}).get("percentage", 5),
                    "max_drawdown": user_settings.get("risk_management", {}).get("max_drawdown", 10)
                }
            },
            "notification_config": {
                "telegram": user_settings.get("notifications", {}).get("telegram", {}).get("enabled", True),
                "email": user_settings.get("notifications", {}).get("email", {}).get("enabled", True)
            },
            "subscription_limits": {
                "max_trades": subscription.get("limits", {}).get("max_trades", 10),
                "max_exchanges": subscription.get("limits", {}).get("max_exchanges", 2)
            },
            "created": datetime.now().isoformat(),
            "version": "1.0.0"
        }
    
    async def save_bot_to_database(self, user_id, bot_config):
        """حفظ البوت في قاعدة البيانات"""
        try:
            user = await User.find_by_id(user_id)
            
            bot_data = {
                "bot_id": f"BOT_{int(datetime.now().timestamp())}_{user_id}",
                "bot_name": f"{user.personal_info['name']}_Trading_Bot",
                "telegram_bot_url": f"https://t.me/{user.personal_info['name'].replace(' ', '_')}_bot",
                "telegram_bot_token": bot_config["bot_token"],
                "status": "active",
                "created_at": datetime.now(),
                "configuration": bot_config["trading_config"],
                "performance": {
                    "total_trades": 0,
                    "successful_trades": 0,
                    "total_profit": 0,
                    "current_balance": 0,
                    "success_rate": 0
                }
            }
            
            # تحديث بيانات المستخدم
            user.trading_bots["active_bot"] = bot_data
            
            # إضافة إلى السجل
            user.trading_bots["bot_history"].append({
                "bot_id": bot_data["bot_id"],
                "bot_name": bot_data["bot_name"],
                "created": bot_data["created_at"],
                "status": "active"
            })
            
            await user.save()
            return bot_data
            
        except Exception as e:
            raise Exception(f"خطأ في حفظ البوت: {str(e)}")
    
    async def start_bot_instance(self, bot_token, bot_config):
        """بدء تشغيل البوت"""
        try:
            # هنا سيتم دمج مع نظام تشغيل البوتات الفعلي
            # يمكن استخدام threading أو async tasks
            
            self.logger.info(f"Starting bot for user {bot_config['user_id']}")
            
            # محاكاة بدء البوت
            bot_status = {
                "status": "running",
                "started_at": datetime.now(),
                "config": bot_config
            }
            
            return bot_status
            
        except Exception as e:
            raise Exception(f"فشل في بدء البوت: {str(e)}")
    
    async def stop_user_bot(self, user_id, bot_id):
        """إيقاف البوت"""
        try:
            user = await User.find_by_id(user_id)
            
            if user.trading_bots["active_bot"]["bot_id"] == bot_id:
                user.trading_bots["active_bot"]["status"] = "inactive"
                user.trading_bots["active_bot"]["last_active"] = datetime.now()
                
                # تحديث السجل
                for bot in user.trading_bots["bot_history"]:
                    if bot["bot_id"] == bot_id:
                        bot["deactivated"] = datetime.now()
                        bot["status"] = "inactive"
                        bot["reason"] = "Stopped by user"
                        break
                
                await user.save()
                return {"success": True, "message": "تم إيقاف البوت بنجاح"}
            else:
                raise Exception("البوت غير موجود أو غير نشط")
                
        except Exception as e:
            raise Exception(f"فشل في إيقاف البوت: {str(e)}")
    
    def get_bot_status(self, bot_config):
        """الحصول على حالة البوت"""
        return f"""
حالة البوت:
- الإستراتيجية: {bot_config['trading_config']['strategy']}
- مستوى المخاطرة: {bot_config['trading_config']['risk_level']}
- عدد المنصات: {len(bot_config['trading_config']['exchanges'])}
- حالة التشغيل: نشط
        """.strip()

# تصدير الخدمة
bot_creator_service = BotCreatorService()
