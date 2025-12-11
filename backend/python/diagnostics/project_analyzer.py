# backend/python/diagnostics/project_analyzer.py
import os
import sys
from pathlib import Path
import json

class ProjectAnalyzer:
    """محلل احترافي لهيكل المشروع"""
    
    def __init__(self, project_root="/workspaces/my_wibsite_cr"):
        self.project_root = project_root
        self.structure = {}
    
    def analyze_project_structure(self):
        """تحليل شامل لهيكل المشروع"""
        print("🔍 تحليل هيكل المشروع...")
        
        structure = {
            "backend": {
                "python": {"files": [], "dirs": []},
                "other": {"files": [], "dirs": []}
            },
            "frontend": {
                "src": {"files": [], "dirs": []},
                "public": {"files": [], "dirs": []}
            },
            "missing_critical": [],
            "existing_services": []
        }
        
        # مسح الباكند
        backend_path = Path(self.project_root) / "backend"
        if backend_path.exists():
            for item in backend_path.rglob("*"):
                if item.is_file():
                    rel_path = str(item.relative_to(backend_path))
                    if "python" in rel_path:
                        structure["backend"]["python"]["files"].append(rel_path)
                        if "service" in item.name:
                            structure["existing_services"].append(rel_path)
                    else:
                        structure["backend"]["other"]["files"].append(rel_path)
                elif item.is_dir():
                    rel_path = str(item.relative_to(backend_path))
                    if "python" in rel_path:
                        structure["backend"]["python"]["dirs"].append(rel_path)
                    else:
                        structure["backend"]["other"]["dirs"].append(rel_path)
        
        # مسح الفرونتند
        frontend_path = Path(self.project_root) / "frontend"
        if frontend_path.exists():
            for item in frontend_path.rglob("*"):
                if item.is_file():
                    rel_path = str(item.relative_to(frontend_path))
                    if "src" in rel_path:
                        structure["frontend"]["src"]["files"].append(rel_path)
                    else:
                        structure["frontend"]["public"]["files"].append(rel_path)
                elif item.is_dir():
                    rel_path = str(item.relative_to(frontend_path))
                    if "src" in rel_path:
                        structure["frontend"]["src"]["dirs"].append(rel_path)
                    else:
                        structure["frontend"]["public"]["dirs"].append(rel_path)
        
        # التحقق من الملفات الحرجة المفقودة
        critical_files = [
            "backend/python/services/exchange_service.py",
            "backend/python/services/risk_service.py", 
            "backend/python/test_existing_functionality.py",
            "backend/python/scripts/final_review.py"
        ]
        
        for critical_file in critical_files:
            if not (Path(self.project_root) / critical_file).exists():
                structure["missing_critical"].append(critical_file)
        
        return structure
    
    def generate_recommendations(self, structure):
        """توليد توصيات بناءً على التحليل"""
        recommendations = []
        
        if structure["missing_critical"]:
            recommendations.append({
                "priority": "HIGH",
                "action": "create_missing_files",
                "files": structure["missing_critical"],
                "reason": "ملفات حرجة مطلوبة للاختبار والتشغيل"
            })
        
        if not structure["existing_services"]:
            recommendations.append({
                "priority": "HIGH", 
                "action": "create_base_services",
                "reason": "لا توجد خدمات أساسية، يحتاج لإنشاء الهيكل الأساسي"
            })
        
        return recommendations

def main():
    """تشغيل التحليل"""
    analyzer = ProjectAnalyzer()
    structure = analyzer.analyze_project_structure()
    recommendations = analyzer.generate_recommendations(structure)
    
    print("\n📊 نتائج تحليل المشروع:")
    print(f"• ملفات باكند بايثون: {len(structure['backend']['python']['files'])}")
    print(f"• خدمات موجودة: {len(structure['existing_services'])}")
    print(f"• ملفات مفقودة: {len(structure['missing_critical'])}")
    
    if recommendations:
        print("\n🚀 التوصيات:")
        for rec in recommendations:
            print(f"  [{rec['priority']}] {rec['action']}: {rec['reason']}")

if __name__ == "__main__":
    main()
