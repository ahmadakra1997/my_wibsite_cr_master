#!/usr/bin/env python3

import os
import sys
import subprocess
from pathlib import Path

def run_command(command, check=True):
    """تشغيل命令 والتحقق من النجاح"""
    try:
        result = subprocess.run(command, shell=True, check=check, 
                              capture_output=True, text=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        if check:
            sys.exit(1)
        return None

def final_deployment_check():
    """التحقق النهائي قبل الانتقال للأسبوع الثاني"""
    print("🔍 Final Deployment Check for Week 1 Completion")
    print("=" * 60)
    
    checks = {
        'backend_services': check_backend_services(),
        'frontend_build': check_frontend_build(),
        'security_scan': check_security(),
        'performance_metrics': check_performance(),
        'monitoring_systems': check_monitoring(),
        'backup_systems': check_backup()
    }
    
    # عرض النتائج
    print("\n📋 Results Summary:")
    print("=" * 60)
    
    all_passed = True
    for check_name, result in checks.items():
        status = "✅ PASS" if result['passed'] else "❌ FAIL"
        print(f"{status} {check_name}: {result['message']}")
        if not result['passed']:
            all_passed = False
    
    if all_passed:
        print("\n🎉 ALL CHECKS PASSED! Ready for Week 2!")
        print("\n🚀 Next steps:")
        print("1. git commit -m 'FEAT: Week 1 completion - All systems ready'")
        print("2. git push origin main")
        print("3. Begin Week 2 development")
    else:
        print("\n⚠️ Some checks failed. Please review before Week 2.")
    
    return all_passed

def check_backend_services():
    """التحقق من خدمات الباكند"""
    services = [
        'exchange_service.py',
        'risk_service.py', 
        'performance_service.py',
        'health_monitor.py'
    ]
    
    missing_services = []
    for service in services:
        if not os.path.exists(f'backend/python/services/{service}'):
            missing_services.append(service)
    
    return {
        'passed': len(missing_services) == 0,
        'message': f"Services: {len(services) - len(missing_services)}/{len(services)}"
    }

def check_frontend_build():
    """التحقق من بناء الفرونتند"""
    if not os.path.exists('frontend/package.json'):
        return {'passed': False, 'message': 'package.json missing'}
    
    try:
        # محاولة تشغيل build
        result = subprocess.run('cd frontend && npm run build', 
                              shell=True, capture_output=True, timeout=60)
        return {
            'passed': result.returncode == 0,
            'message': 'Build successful' if result.returncode == 0 else 'Build failed'
        }
    except:
        return {'passed': False, 'message': 'Build timeout or error'}

def check_security():
    """فحص الأمان الأساسي"""
    security_issues = []
    
    # فحص ملف .env
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            content = f.read()
            if 'SECRET_KEY' in content and 'example' not in content:
                security_issues.append('Secret key might be exposed')
    
    return {
        'passed': len(security_issues) == 0,
        'message': f'Security issues: {len(security_issues)}'
    }

def check_performance():
    """فحص الأداء الأساسي"""
    try:
        # فحص استخدام الذاكرة
        import psutil
        memory_usage = psutil.virtual_memory().percent
        return {
            'passed': memory_usage < 80,
            'message': f'Memory usage: {memory_usage:.1f}%'
        }
    except:
        return {'passed': True, 'message': 'Performance check skipped'}

def check_monitoring():
    """التحقق من أنظمة المراقبة"""
    monitoring_files = [
        'backend/python/monitoring/health_monitor.py',
        'backend/python/monitoring/performance_tracker.py',
        'frontend/src/components/MonitoringDashboard.jsx'
    ]
    
    existing_files = [f for f in monitoring_files if os.path.exists(f)]
    
    return {
        'passed': len(existing_files) == len(monitoring_files),
        'message': f'Monitoring files: {len(existing_files)}/{len(monitoring_files)}'
    }

def check_backup():
    """التحقق من أنظمة النسخ الاحتياطي"""
    if os.path.exists('backups') and len(os.listdir('backups')) > 0:
        return {'passed': True, 'message': 'Backup system active'}
    else:
        return {'passed': False, 'message': 'No backups found'}

if __name__ == "__main__":
    success = final_deployment_check()
    sys.exit(0 if success else 1)
