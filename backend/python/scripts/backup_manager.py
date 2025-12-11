import os
import shutil
import json
from datetime import datetime
from typing import Dict, List

class BackupManager:
    def __init__(self):
        self.backup_dir = "backups"
        self.setup_backup_structure()
    
    def setup_backup_structure(self):
        """إعداد هيكل النسخ الاحتياطي"""
        os.makedirs(f"{self.backup_dir}/daily", exist_ok=True)
        os.makedirs(f"{self.backup_dir}/weekly", exist_ok=True)
        os.makedirs(f"{self.backup_dir}/configs", exist_ok=True)
    
    def create_comprehensive_backup(self) -> Dict:
        """إنشاء نسخة احتياطية شاملة"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_info = {
            'timestamp': timestamp,
            'backup_files': [],
            'total_size_mb': 0,
            'backup_type': 'comprehensive'
        }
        
        # نسخ الملفات المهمة
        critical_paths = [
            ('backend/python/services', 'services'),
            ('backend/python/monitoring', 'monitoring'),
            ('backend/python/utils', 'utils'),
            ('frontend/src/components', 'components'),
            ('frontend/src/services', 'frontend_services'),
            ('backend/python/config', 'config')
        ]
        
        for source_path, target_name in critical_paths:
            if os.path.exists(source_path):
                backup_path = f"{self.backup_dir}/daily/{timestamp}/{target_name}"
                shutil.copytree(source_path, backup_path)
                backup_info['backup_files'].append(target_name)
        
        # نسخ ملفات التكوين
        config_files = ['.env', 'requirements.txt', 'package.json']
        for config_file in config_files:
            if os.path.exists(config_file):
                shutil.copy2(config_file, f"{self.backup_dir}/configs/{config_file}.{timestamp}")
        
        # حساب الحجم
        backup_info['total_size_mb'] = self.calculate_backup_size(f"{self.backup_dir}/daily/{timestamp}")
        
        # حفظ معلومات النسخ الاحتياطي
        with open(f"{self.backup_dir}/daily/{timestamp}/backup_info.json", 'w') as f:
            json.dump(backup_info, f, indent=2)
        
        return backup_info
    
    def calculate_backup_size(self, path: str) -> float:
        """حساب حجم النسخة الاحتياطية"""
        total_size = 0
        for dirpath, dirnames, filenames in os.walk(path):
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                total_size += os.path.getsize(filepath)
        return total_size / (1024 * 1024)  # تحويل إلى MB

def create_final_backup():
    """إنشاء النسخة الاحتياطية النهائية للأسبوع الأول"""
    manager = BackupManager()
    backup_info = manager.create_comprehensive_backup()
    
    print("💾 النسخة الاحتياطية النهائية:")
    print(f"• الوقت: {backup_info['timestamp']}")
    print(f"• الملفات: {', '.join(backup_info['backup_files'])}")
    print(f"• الحجم: {backup_info['total_size_mb']:.2f} MB")
    print(f"• الموقع: backups/daily/{backup_info['timestamp']}/")

if __name__ == "__main__":
    create_final_backup()
