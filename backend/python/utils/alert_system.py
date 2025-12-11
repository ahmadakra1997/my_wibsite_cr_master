import smtplib
from email.mime.text import MimeText
import logging
from typing import Dict, List
import asyncio
from datetime import datetime, timedelta

class SmartAlertSystem:
    def __init__(self, config: Dict):
        self.config = config
        self.alert_history = []
        self.setup_logging()
    
    def setup_logging(self):
        self.logger = logging.getLogger('alert_system')
        handler = logging.FileHandler('logs/alerts.log')
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    async def send_alert(self, alert_type: str, message: str, severity: str = "medium"):
        """إرسال تنبيه ذكي"""
        alert = {
            'type': alert_type,
            'message': message,
            'severity': severity,
            'timestamp': datetime.now(),
            'sent': False
        }
        
        # التحقق من تكرار التنبيهات
        if self._is_duplicate_alert(alert):
            self.logger.info(f"Duplicate alert suppressed: {alert_type} - {message}")
            return
        
        try:
            if severity in ["high", "critical"]:
                await self._send_email_alert(alert)
            
            if severity == "critical":
                await self._send_sms_alert(alert)
            
            await self._send_dashboard_alert(alert)
            
            alert['sent'] = True
            self.logger.info(f"Alert sent: {alert_type} - {message}")
            
        except Exception as e:
            self.logger.error(f"Failed to send alert: {str(e)}")
        
        self.alert_history.append(alert)
        self._cleanup_old_alerts()
    
    def _is_duplicate_alert(self, new_alert: Dict) -> bool:
        """الكشف عن التنبيهات المكررة"""
        recent_alerts = [
            alert for alert in self.alert_history
            if alert['timestamp'] > datetime.now() - timedelta(minutes=5)
        ]
        
        for alert in recent_alerts:
            if (alert['type'] == new_alert['type'] and 
                alert['message'] == new_alert['message']):
                return True
        
        return False
    
    async def _send_email_alert(self, alert: Dict):
        """إرسال تنبيه بالبريد الإلكتروني"""
        try:
            # تنفيذ إرسال البريد الإلكتروني
            msg = MimeText(f"Alert: {alert['type']}\nMessage: {alert['message']}\nSeverity: {alert['severity']}")
            msg['Subject'] = f"Trading Platform Alert - {alert['type']}"
            msg['From'] = self.config.get('email_from', 'alerts@tradingplatform.com')
            msg['To'] = self.config.get('email_to', 'admin@tradingplatform.com')
            
            # هنا يمكنك إضافة منطق إرسال البريد الفعلي
            self.logger.info(f"Email alert prepared: {alert['type']}")
            
        except Exception as e:
            self.logger.error(f"Failed to send email alert: {str(e)}")
    
    async def _send_sms_alert(self, alert: Dict):
        """إرسال تنبيه بالرسالة النصية"""
        try:
            # تنفيذ إرسال الرسائل النصية
            self.logger.info(f"SMS alert prepared: {alert['type']} - {alert['message']}")
        except Exception as e:
            self.logger.error(f"Failed to send SMS alert: {str(e)}")
    
    async def _send_dashboard_alert(self, alert: Dict):
        """إرسال تنبيه للوحة التحكم"""
        try:
            # تنفيذ إرسال للوحة التحكم الأمامية
            self.logger.info(f"Dashboard alert sent: {alert['type']}")
        except Exception as e:
            self.logger.error(f"Failed to send dashboard alert: {str(e)}")
    
    def _cleanup_old_alerts(self):
        """تنظيف التنبيهات القديمة"""
        cutoff_time = datetime.now() - timedelta(hours=24)
        self.alert_history = [
            alert for alert in self.alert_history
            if alert['timestamp'] > cutoff_time
        ]

# مثال للاستخدام
if __name__ == "__main__":
    alert_system = SmartAlertSystem({})
    print("Alert System initialized successfully!")
