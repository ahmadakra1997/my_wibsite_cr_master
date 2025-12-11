# backend/python/analyze_project_structure.py
import os
import json
from pathlib import Path
from typing import Dict, List, Tuple
import ast
import logging

class ComprehensiveProjectAnalyzer:
    def __init__(self, project_root: str = "/workspaces/my_wibsite_cr"):
        self.project_root = Path(project_root)
        self.analysis_results = {}
        self.issues_found = []
        self.strengths_found = []
        
    def analyze_complete_project(self) -> Dict:
        """تحليل شامل للمشروع"""
        print("🔍 بدء التحليل الشامل للمشروع...")
        
        self.analysis_results = {
            'project_structure': self.analyze_directory_structure(),
            'code_quality': self.analyze_code_quality_metrics(),
            'architecture_analysis': self.analyze_architecture(),
            'dependencies_analysis': self.analyze_dependencies(),
            'security_analysis': self.analyze_security(),
            'performance_analysis': self.analyze_performance_potential(),
            'frontend_analysis': self.analyze_frontend(),
            'backend_analysis': self.analyze_backend(),
        }
        
        self.generate_recommendations()
        return self.analysis_results
    
    def analyze_directory_structure(self) -> Dict:
        """تحليل هيكل المجلدات"""
        structure = {
            'exists': {},
            'missing': [],
            'file_counts': {},
            'total_size': 0
        }
        
        expected_dirs = [
            'backend/python/services',
            'backend/python/monitoring', 
            'backend/python/scripts',
            'backend/python/config',
            'frontend/src/components',
            'frontend/src/services',
            'frontend/src/pages',
            'docs'
        ]
        
        for dir_path in expected_dirs:
            full_path = self.project_root / dir_path
            if full_path.exists():
                structure['exists'][dir_path] = len(list(full_path.rglob('*.py'))) + len(list(full_path.rglob('*.js')))
            else:
                structure['missing'].append(dir_path)
        
        # حساب الحجم الإجمالي
        for file_path in self.project_root.rglob('*'):
            if file_path.is_file():
                structure['total_size'] += file_path.stat().st_size
        
        structure['total_size_mb'] = structure['total_size'] / (1024 * 1024)
        return structure
    
    def analyze_code_quality_metrics(self) -> Dict:
        """تحليل مقاييس جودة الكود"""
        metrics = {
            'python_files': 0,
            'javascript_files': 0,
            'total_lines': 0,
            'average_complexity': 0,
            'class_count': 0,
            'function_count': 0,
            'issues': []
        }
        
        # تحليل ملفات Python
        for py_file in self.project_root.rglob('*.py'):
            if 'node_modules' in str(py_file) or '__pycache__' in str(py_file):
                continue
                
            metrics['python_files'] += 1
            file_metrics = self.analyze_python_file(py_file)
            metrics['total_lines'] += file_metrics['lines']
            metrics['class_count'] += file_metrics['classes']
            metrics['function_count'] += file_metrics['functions']
            
            if file_metrics['issues']:
                metrics['issues'].extend(file_metrics['issues'])
        
        # تحليل ملفات JavaScript
        for js_file in self.project_root.rglob('*.js'):
            if 'node_modules' in str(js_file):
                continue
            metrics['javascript_files'] += 1
        
        return metrics
    
    def analyze_python_file(self, file_path: Path) -> Dict:
        """تحليل ملف Python فردي"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            tree = ast.parse(content)
            
            issues = []
            classes = 0
            functions = 0
            lines = len(content.splitlines())
            
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    classes += 1
                    # التحقق من وجود docstring
                    if not ast.get_docstring(node):
                        issues.append(f"Class {node.name} missing docstring in {file_path.name}")
                
                elif isinstance(node, ast.FunctionDef):
                    functions += 1
                    if not ast.get_docstring(node):
                        issues.append(f"Function {node.name} missing docstring in {file_path.name}")
            
            return {
                'lines': lines,
                'classes': classes,
                'functions': functions,
                'issues': issues
            }
            
        except Exception as e:
            return {'lines': 0, 'classes': 0, 'functions': 0, 'issues': [f"Parse error: {e}"]}
    
    def analyze_architecture(self) -> Dict:
        """تحليل البنية المعمارية"""
        architecture = {
            'separation_of_concerns': 0,
            'modularity': 0,
            'reusability': 0,
            'issues': []
        }
        
        # التحقق من فصل الهموم
        backend_services = list((self.project_root / 'backend/python/services').glob('*.py'))
        frontend_components = list((self.project_root / 'frontend/src/components').glob('*.js'))
        
        if backend_services and frontend_components:
            architecture['separation_of_concerns'] = 8
        elif backend_services or frontend_components:
            architecture['separation_of_concerns'] = 5
            architecture['issues'].append("Partial separation of concerns")
        else:
            architecture['separation_of_concerns'] = 2
            architecture['issues'].append("Poor separation of concerns")
        
        # التحقق من التعدديية
        service_files = len(backend_services)
        if service_files > 5:
            architecture['modularity'] = 9
        elif service_files > 2:
            architecture['modularity'] = 6
        else:
            architecture['modularity'] = 3
            architecture['issues'].append("Low modularity - few service files")
        
        return architecture
    
    def analyze_dependencies(self) -> Dict:
        """تحليل التبعيات"""
        dependencies = {
            'python_deps': [],
            'node_deps': [],
            'missing_files': [],
            'version_issues': []
        }
        
        # تحليل requirements.txt
        req_file = self.project_root / 'backend/python/requirements.txt'
        if req_file.exists():
            with open(req_file, 'r') as f:
                dependencies['python_deps'] = [line.strip() for line in f if line.strip()]
        else:
            dependencies['missing_files'].append('requirements.txt')
        
        # تحليل package.json
        package_file = self.project_root / 'frontend/package.json'
        if package_file.exists():
            try:
                with open(package_file, 'r') as f:
                    import json
                    package_data = json.load(f)
                    dependencies['node_deps'] = list(package_data.get('dependencies', {}).keys())
            except:
                dependencies['version_issues'].append('Invalid package.json')
        else:
            dependencies['missing_files'].append('package.json')
        
        return dependencies
    
    def analyze_security(self) -> Dict:
        """تحليل الأمان"""
        security = {
            'score': 0,
            'issues': [],
            'strengths': []
        }
        
        # البحث عن معلومات حساسة
        sensitive_patterns = ['API_KEY', 'SECRET', 'PASSWORD', 'TOKEN']
        
        for file_path in self.project_root.rglob('*.py'):
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    for pattern in sensitive_patterns:
                        if pattern in content and 'example' not in content.lower():
                            security['issues'].append(f"Potential sensitive data in {file_path.name}")
            except:
                continue
        
        # التحقق من وجود .env
        env_file = self.project_root / '.env'
        env_example = self.project_root / '.env.example'
        
        if env_file.exists():
            security['strengths'].append("Environment variables properly managed")
            security['score'] += 3
        else:
            security['issues'].append("No .env file found")
        
        if env_example.exists():
            security['strengths'].append(".env.example provided for configuration")
            security['score'] += 2
        
        # تحليل إعدادات الأمان
        config_files = list(self.project_root.rglob('*config*.py'))
        if config_files:
            security['score'] += 2
            security['strengths'].append("Configuration files found")
        
        security['score'] = min(10, security['score'])
        return security
    
    def analyze_performance_potential(self) -> Dict:
        """تحليل إمكانيات الأداء"""
        performance = {
            'caching_potential': 0,
            'async_operations': 0,
            'optimization_opportunities': [],
            'strengths': []
        }
        
        # البحث عن عمليات غير متزامنة
        for file_path in self.project_root.rglob('*.py'):
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    if 'async' in content or 'await' in content:
                        performance['async_operations'] += 1
                    if 'cache' in content.lower():
                        performance['caching_potential'] += 1
            except:
                continue
        
        if performance['async_operations'] > 0:
            performance['strengths'].append("Async operations detected")
        
        if performance['caching_potential'] > 0:
            performance['strengths'].append("Caching implementation detected")
        
        return performance
    
    def analyze_frontend(self) -> Dict:
        """تحليل الواجهة الأمامية"""
        frontend = {
            'framework': 'Unknown',
            'components_count': 0,
            'state_management': 'Unknown',
            'issues': [],
            'strengths': []
        }
        
        # التحقق من إطار العمل
        package_file = self.project_root / 'frontend/package.json'
        if package_file.exists():
            try:
                with open(package_file, 'r') as f:
                    import json
                    package_data = json.load(f)
                    deps = package_data.get('dependencies', {})
                    
                    if 'react' in deps:
                        frontend['framework'] = 'React'
                        frontend['strengths'].append("Using React framework")
                    elif 'vue' in deps:
                        frontend['framework'] = 'Vue'
                    elif 'angular' in deps:
                        frontend['framework'] = 'Angular'
            except:
                frontend['issues'].append("Cannot parse package.json")
        
        # عد المكونات
        components_dir = self.project_root / 'frontend/src/components'
        if components_dir.exists():
            frontend['components_count'] = len(list(components_dir.rglob('*.js'))) + len(list(components_dir.rglob('*.jsx')))
        
        return frontend
    
    def analyze_backend(self) -> Dict:
        """تحليل الواجهة الخلفية"""
        backend = {
            'framework': 'Unknown',
            'services_count': 0,
            'api_structure': 'Unknown',
            'issues': [],
            'strengths': []
        }
        
        # عد الخدمات
        services_dir = self.project_root / 'backend/python/services'
        if services_dir.exists():
            backend['services_count'] = len(list(services_dir.glob('*.py')))
            backend['strengths'].append(f"Found {backend['services_count']} service files")
        
        # البحث عن إطار العمل
        for file_path in self.project_root.rglob('*.py'):
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    if 'flask' in content.lower():
                        backend['framework'] = 'Flask'
                    elif 'django' in content.lower():
                        backend['framework'] = 'Django'
                    elif 'fastapi' in content.lower():
                        backend['framework'] = 'FastAPI'
            except:
                continue
        
        return backend
    
    def generate_recommendations(self):
        """توليد توصيات بناءً على التحليل"""
        analysis = self.analysis_results
        
        # نقاط القوة
        if analysis['architecture_analysis']['separation_of_concerns'] >= 7:
            self.strengths_found.append("✅ بنية معمارية جيدة مع فصل واضح للهموم")
        
        if analysis['backend_analysis']['services_count'] > 3:
            self.strengths_found.append("✅ نظام خدمات متطور في الباكند")
        
        if analysis['frontend_analysis']['components_count'] > 5:
            self.strengths_found.append("✅ واجهة أمامية غنية بالمكونات")
        
        if analysis['security_analysis']['score'] >= 5:
            self.strengths_found.append("✅ إدارة جيدة للأمان والمفاتيح")
        
        # نقاط الضعف
        if analysis['dependencies_analysis']['missing_files']:
            self.issues_found.append("❌ ملفات التبعيات مفقودة: " + ", ".join(analysis['dependencies_analysis']['missing_files']))
        
        if analysis['code_quality']['issues']:
            self.issues_found.append(f"❌ مشاكل في جودة الكود: {len(analysis['code_quality']['issues'])} مشكلة")
        
        if analysis['architecture_analysis']['issues']:
            self.issues_found.extend([f"❌ {issue}" for issue in analysis['architecture_analysis']['issues']])
        
        if analysis['security_analysis']['issues']:
            self.issues_found.extend([f"🔒 {issue}" for issue in analysis['security_analysis']['issues']])
    
    def generate_detailed_report(self):
        """توليد تقرير مفصل"""
        analysis = self.analysis_results
        
        print("\n" + "="*80)
        print("📊 التقرير الشامل لمشروع التداول الآلي")
        print("="*80)
        
        print(f"\n📁 هيكل المشروع:")
        print(f"• الحجم الإجمالي: {analysis['project_structure']['total_size_mb']:.2f} MB")
        print(f"• المجلدات الموجودة: {len(analysis['project_structure']['exists'])}")
        print(f"• المجلدات المفقودة: {len(analysis['project_structure']['missing'])}")
        
        print(f"\n👨‍💻 جودة الكود:")
        print(f"• ملفات Python: {analysis['code_quality']['python_files']}")
        print(f"• ملفات JavaScript: {analysis['code_quality']['javascript_files']}")
        print(f"• إجمالي الأسطر: {analysis['code_quality']['total_lines']}")
        print(f"• الكلاسات: {analysis['code_quality']['class_count']}")
        print(f"• الدوال: {analysis['code_quality']['function_count']}")
        
        print(f"\n🏗️ البنية المعمارية:")
        print(f"• فصل الهموم: {analysis['architecture_analysis']['separation_of_concerns']}/10")
        print(f"• التعدديية: {analysis['architecture_analysis']['modularity']}/10")
        
        print(f"\n🔒 الأمان:")
        print(f"• درجة الأمان: {analysis['security_analysis']['score']}/10")
        
        print(f"\n⚡ الأداء:")
        print(f"• عمليات غير متزامنة: {analysis['performance_analysis']['async_operations']}")
        print(f"• إمكانيات التخزين المؤقت: {analysis['performance_analysis']['caching_potential']}")
        
        print(f"\n🎯 الواجهة الأمامية:")
        print(f"• الإطار: {analysis['frontend_analysis']['framework']}")
        print(f"• عدد المكونات: {analysis['frontend_analysis']['components_count']}")
        
        print(f"\n🔧 الواجهة الخلفية:")
        print(f"• الإطار: {analysis['backend_analysis']['framework']}")
        print(f"• عدد الخدمات: {analysis['backend_analysis']['services_count']}")
        
        print(f"\n💪 نقاط القوة الرئيسية:")
        for strength in self.strengths_found:
            print(f"  {strength}")
        
        print(f"\n⚠️ نقاط الضعف التي تحتاج تحسين:")
        for issue in self.issues_found:
            print(f"  {issue}")
        
        print(f"\n🚀 التوصيات الفورية:")
        print("  1. تحسين جودة الكود بإضافة التوثيق")
        print("  2. إكمال ملفات التبعيات المفقودة")
        print("  3. تعزيز نظام الأمان")
        print("  4. تطوير نظام الاختبارات")
        print("  5. تحسين إدارة الأخطاء")

def main():
    """الدالة الرئيسية"""
    analyzer = ComprehensiveProjectAnalyzer()
    analysis = analyzer.analyze_complete_project()
    analyzer.generate_detailed_report()

if __name__ == "__main__":
    main()
