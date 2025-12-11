# backend/python/services/strategy_discovery.py
import os
import ast
import inspect
from pathlib import Path
from typing import Dict, List, Optional, Any
import logging

class StrategyDiscovery:
    """نظام اكتشاف احترافي لاستراتيجيات التداول الحالية"""
    
    def __init__(self, project_root: str = "/workspaces/my_wibsite_cr"):
        self.project_root = Path(project_root)
        self.strategies = {}
        self.logger = logging.getLogger(__name__)
    
    def discover_existing_strategies(self) -> Dict[str, Any]:
        """اكتشاف جميع استراتيجيات التداول الموجودة في المشروع"""
        self.logger.info("🔍 اكتشاف استراتيجيات التداول الحالية...")
        
        strategy_locations = [
            "backend/python/services",
            "backend/python/strategies", 
            "backend/python/trading",
            "backend/python/bot"
        ]
        
        for location in strategy_locations:
            location_path = self.project_root / location
            if location_path.exists():
                self._scan_directory_for_strategies(location_path)
        
        self.logger.info(f"✅ تم اكتشاف {len(self.strategies)} استراتيجية")
        return self.strategies
    
    def _scan_directory_for_strategies(self, directory: Path):
        """مسح المجلد للعثور على استراتيجيات"""
        for py_file in directory.glob("**/*.py"):
            if py_file.name.startswith('__'):
                continue
                
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # تحليل الكود للعثور على استراتيجيات
                self._analyze_file_for_strategies(py_file, content)
                
            except Exception as e:
                self.logger.warning(f"⚠️ خطأ في تحليل {py_file}: {e}")
    
    def _analyze_file_for_strategies(self, file_path: Path, content: str):
        """تحليل الملف للعثور على استراتيجيات تداول"""
        try:
            tree = ast.parse(content)
            
            for node in ast.walk(tree):
                # البحث عن كلاسات الاستراتيجيات
                if isinstance(node, ast.ClassDef):
                    strategy_info = self._extract_strategy_info(node, file_path, content)
                    if strategy_info:
                        self.strategies[strategy_info['name']] = strategy_info
                
                # البحث عن دوال التداول
                elif isinstance(node, ast.FunctionDef):
                    function_info = self._extract_trading_function_info(node, file_path)
                    if function_info:
                        self.strategies[function_info['name']] = function_info
                        
        except Exception as e:
            self.logger.warning(f"⚠️ خطأ في تحليل AST لـ {file_path}: {e}")
    
    def _extract_strategy_info(self, class_node: ast.ClassDef, file_path: Path, content: str) -> Optional[Dict]:
        """استخراج معلومات الاستراتيجية من الكلاس"""
        class_name = class_node.name
        class_lower = class_name.lower()
        
        # كلمات مفتاحية تشير إلى استراتيجيات تداول
        strategy_keywords = ['strategy', 'trader', 'bot', 'algorithm', 'trading', 'signal']
        
        if any(keyword in class_lower for keyword in strategy_keywords):
            methods = [method.name for method in class_node.body if isinstance(method, ast.FunctionDef)]
            
            return {
                'name': class_name,
                'type': 'class',
                'file_path': str(file_path.relative_to(self.project_root)),
                'methods': methods,
                'has_trading_methods': any(self._is_trading_method(method) for method in methods),
                'description': self._extract_class_docstring(class_node)
            }
        
        return None
    
    def _extract_trading_function_info(self, function_node: ast.FunctionDef, file_path: Path) -> Optional[Dict]:
        """استخراج معلومات دالة التداول"""
        func_name = function_node.name
        func_lower = func_name.lower()
        
        # كلمات مفتاحية تشير إلى دوال تداول
        trading_keywords = ['trade', 'signal', 'buy', 'sell', 'analyze', 'predict', 'strategy']
        
        if any(keyword in func_lower for keyword in trading_keywords):
            return {
                'name': func_name,
                'type': 'function', 
                'file_path': str(file_path.relative_to(self.project_root)),
                'description': ast.get_docstring(function_node) or "No description"
            }
        
        return None
    
    def _is_trading_method(self, method_name: str) -> bool:
        """التحقق إذا كانت الدالة مرتبطة بالتداول"""
        trading_methods = ['execute', 'trade', 'signal', 'analyze', 'calculate', 'predict']
        return any(trading_method in method_name.lower() for trading_method in trading_methods)
    
    def _extract_class_docstring(self, class_node: ast.ClassDef) -> str:
        """استخراج docstring من الكلاس"""
        docstring = ast.get_docstring(class_node)
        return docstring or "No description available"
