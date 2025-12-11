"""
محسن الاستعلامات المتقدم - الإصدار 4.0
نظام تحسين استعلامات شامل مع تحليلات أداء متقدمة وتوصيات ذكية
"""

import os
import logging
import time
import sqlparse
import re
import statistics
import hashlib
from typing import Dict, List, Optional, Any, Tuple, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from functools import wraps
import threading
from concurrent.futures import ThreadPoolExecutor
import json
import psutil

# إعداد المسجل المتقدم
logger = logging.getLogger(__name__)

class QueryType(Enum):
    """أنواع الاستعلامات الموسعة"""
    SELECT = "SELECT"
    INSERT = "INSERT" 
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    JOIN = "JOIN"
    AGGREGATE = "AGGREGATE"
    SUBQUERY = "SUBQUERY"
    COMPLEX_JOIN = "COMPLEX_JOIN"
    WINDOW_FUNCTION = "WINDOW_FUNCTION"
    CTE = "CTE"
    UNION = "UNION"

class OptimizationLevel(Enum):
    """مستويات التحسين الموسعة"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium" 
    LOW = "low"
    OPTIMAL = "optimal"
    EMERGENCY = "emergency"

class IndexType(Enum):
    """أنواع الفهارس"""
    BTREE = "btree"
    HASH = "hash"
    GIN = "gin"
    GIST = "gist"
    FULLTEXT = "fulltext"

@dataclass
class QueryAnalysis:
    """تحليل استعلام متقدم"""
    query_id: str
    query_text: str
    query_type: QueryType
    execution_time: float
    rows_affected: int
    optimization_suggestions: List[str]
    optimization_level: OptimizationLevel
    performance_metrics: Dict[str, Any]
    query_complexity: int
    index_analysis: Dict[str, Any]
    resource_usage: Dict[str, float]
    timestamp: datetime = field(default_factory=datetime.now)

@dataclass
class QueryPattern:
    """نمط استعلام متقدم"""
    pattern_hash: str
    normalized_query: str
    frequency: int
    avg_execution_time: float
    max_execution_time: float
    min_execution_time: float
    optimization_opportunities: List[str]
    last_executed: datetime
    execution_history: List[float] = field(default_factory=list)

@dataclass
class IndexRecommendation:
    """توصية فهرس متقدمة"""
    table_name: str
    column_names: List[str]
    index_type: IndexType
    expected_benefit: float
    creation_cost: float
    priority: int
    reason: str
    sql_statement: str

@dataclass
class PerformanceReport:
    """تقرير أداء متكامل"""
    period_start: datetime
    period_end: datetime
    total_queries: int
    slow_queries: int
    avg_execution_time: float
    performance_distribution: Dict[OptimizationLevel, int]
    top_slow_queries: List[QueryAnalysis]
    index_recommendations: List[IndexRecommendation]
    system_recommendations: List[str]
    resource_utilization: Dict[str, float]

class AdvancedQueryOptimizer:
    """
    محسن الاستعلامات المتقدم مع تحليلات شاملة وتوصيات ذكية
    """
    
    def __init__(self):
        self.query_history: List[QueryAnalysis] = []
        self.query_patterns: Dict[str, QueryPattern] = {}
        self.performance_thresholds = self._load_performance_thresholds()
        self.optimization_rules = self._load_optimization_rules()
        self.index_recommendations: List[IndexRecommendation] = []
        self.performance_monitor = QueryPerformanceMonitor()
        self.setup_optimizer()
        
        # خلفية تنظيف البيانات القديمة
        self._start_background_cleanup()
    
    def _load_performance_thresholds(self) -> Dict[str, float]:
        """تحميل عتبات الأداء المتقدمة"""
        return {
            'slow_query_threshold': float(os.getenv('SLOW_QUERY_THRESHOLD', '1.0')),
            'critical_query_threshold': float(os.getenv('CRITICAL_QUERY_THRESHOLD', '5.0')),
            'high_cost_threshold': float(os.getenv('HIGH_COST_THRESHOLD', '1000')),
            'frequent_query_threshold': int(os.getenv('FREQUENT_QUERY_THRESHOLD', '10')),
            'memory_usage_threshold': float(os.getenv('QUERY_MEMORY_THRESHOLD', '100')),  # MB
            'complexity_threshold': int(os.getenv('COMPLEXITY_THRESHOLD', '10'))
        }
    
    def _load_optimization_rules(self) -> Dict[str, Any]:
        """تحميل قواعد التحسين المتقدمة"""
        return {
            'index_optimization': {
                'enabled': True,
                'min_benefit': 0.3,
                'max_indexes_per_table': 5
            },
            'query_restructuring': {
                'enabled': True,
                'complexity_threshold': 5,
                'enable_subquery_to_join': True,
                'enable_predicate_pushdown': True
            },
            'caching_strategy': {
                'enabled': True,
                'frequency_threshold': 5,
                'result_size_threshold': 1000
            },
            'resource_optimization': {
                'enabled': True,
                'memory_usage_threshold': 100,  # MB
                'enable_batch_processing': True
            }
        }
    
    def setup_optimizer(self):
        """إعداد المحسن المتقدم"""
        try:
            # تحميل قواعد التحسين من ملف إذا موجود
            self._load_optimization_rules_from_file()
            
            # بدء مراقبة الأداء
            self.performance_monitor.start_monitoring()
            
            logger.info("✅ تم إعداد محسن الاستعلامات المتقدم")
            
        except Exception as e:
            logger.error(f"❌ خطأ في إعداد المحسن: {e}")
            raise
    
    def _load_optimization_rules_from_file(self):
        """تحميل قواعد التحسين من ملف خارجي"""
        try:
            rules_file = os.getenv('QUERY_OPTIMIZATION_RULES_FILE', 'query_optimization_rules.json')
            if os.path.exists(rules_file):
                with open(rules_file, 'r', encoding='utf-8') as f:
                    external_rules = json.load(f)
                    self.optimization_rules.update(external_rules)
                logger.info(f"✅ تم تحميل قواعد التحسين من {rules_file}")
        except Exception as e:
            logger.warning(f"⚠️  لا يمكن تحميل قواعد التحسين الخارجية: {e}")
    
    def _start_background_cleanup(self):
        """بدء تنظيف الخلفية للبيانات القديمة"""
        def cleanup_old_data():
            while True:
                try:
                    self._cleanup_old_queries()
                    self._cleanup_old_patterns()
                    time.sleep(3600)  # كل ساعة
                except Exception as e:
                    logger.error(f"❌ خطأ في تنظيف البيانات: {e}")
                    time.sleep(300)  # انتظار 5 دقائق عند الخطأ
        
        cleanup_thread = threading.Thread(target=cleanup_old_data, daemon=True)
        cleanup_thread.start()
    
    def _cleanup_old_queries(self):
        """تنظيف الاستعلامات القديمة"""
        try:
            cutoff_time = datetime.now() - timedelta(hours=24)  # احتفظ بيوم واحد
            initial_count = len(self.query_history)
            self.query_history = [
                q for q in self.query_history 
                if q.timestamp > cutoff_time
            ]
            removed_count = initial_count - len(self.query_history)
            if removed_count > 0:
                logger.debug(f"🧹 تم تنظيف {removed_count} استعلام قديم")
        except Exception as e:
            logger.error(f"❌ خطأ في تنظيف الاستعلامات: {e}")
    
    def _cleanup_old_patterns(self):
        """تنظيف الأنماط القديمة"""
        try:
            cutoff_time = datetime.now() - timedelta(days=7)  # احتفظ بأسبوع
            patterns_to_remove = []
            
            for pattern_hash, pattern in self.query_patterns.items():
                if pattern.last_executed < cutoff_time and pattern.frequency < 5:
                    patterns_to_remove.append(pattern_hash)
            
            for pattern_hash in patterns_to_remove:
                del self.query_patterns[pattern_hash]
            
            if patterns_to_remove:
                logger.debug(f"🧹 تم تنظيف {len(patterns_to_remove)} نمط قديم")
                
        except Exception as e:
            logger.error(f"❌ خطأ في تنظيف الأنماط: {e}")
    
    def analyze_query(self, query_text: str, execution_time: float, 
                     rows_affected: int = 0, context: Dict = None) -> QueryAnalysis:
        """تحليل استعلام متقدم مع تقييم شامل"""
        try:
            start_analysis_time = time.time()
            
            query_id = self._generate_query_id(query_text)
            query_type = self._classify_query_advanced(query_text)
            
            # تحليل متقدم للأداء
            performance_metrics = self._analyze_query_performance_advanced(
                query_text, execution_time, rows_affected, context
            )
            
            # تحليل الفهارس المتقدم
            index_analysis = self._analyze_index_usage_advanced(query_text)
            
            # تحليل التعقيد
            query_complexity = self._calculate_query_complexity_advanced(query_text)
            
            # تحليل استخدام الموارد
            resource_usage = self._analyze_resource_usage(query_text, execution_time, rows_affected)
            
            # اقتراحات التحسين المتقدمة
            optimization_suggestions = self._generate_advanced_optimization_suggestions(
                query_text, performance_metrics, index_analysis, query_type, query_complexity
            )
            
            # تحديد مستوى التحسين
            optimization_level = self._determine_optimization_level_advanced(
                execution_time, performance_metrics, len(optimization_suggestions), query_complexity
            )
            
            analysis = QueryAnalysis(
                query_id=query_id,
                query_text=query_text,
                query_type=query_type,
                execution_time=execution_time,
                rows_affected=rows_affected,
                optimization_suggestions=optimization_suggestions,
                optimization_level=optimization_level,
                performance_metrics=performance_metrics,
                query_complexity=query_complexity,
                index_analysis=index_analysis,
                resource_usage=resource_usage
            )
            
            # تحديث البيانات
            self._update_query_history(analysis)
            self._update_query_patterns(analysis)
            self._update_index_recommendations(analysis, index_analysis)
            
            analysis_time = time.time() - start_analysis_time
            logger.debug(f"⏱️  وقت تحليل الاستعلام: {analysis_time:.4f} ثانية")
            
            return analysis
            
        except Exception as e:
            logger.error(f"❌ خطأ في تحليل الاستعلام: {e}")
            return self._create_error_analysis(query_text, str(e))
    
    def _generate_query_id(self, query_text: str) -> str:
        """إنشاء معرف فريد للاستعلام"""
        query_hash = hashlib.md5(query_text.encode('utf-8')).hexdigest()[:8]
        timestamp = int(time.time())
        return f"query_{timestamp}_{query_hash}"
    
    def _classify_query_advanced(self, query_text: str) -> QueryType:
        """تصنيف متقدم لنوع الاستعلام"""
        try:
            query_upper = query_text.upper().strip()
            parsed = sqlparse.parse(query_text)
            
            if not parsed:
                return QueryType.SELECT
            
            statement = parsed[0]
            first_token = statement.token_first(skip_cm=True, skip_ws=True)
            
            if not first_token:
                return QueryType.SELECT
            
            # تحليل متقدم للاستعلام
            if first_token.value.upper() == 'WITH':
                return QueryType.CTE
            
            # تحليل أنواع JOIN
            if any(token.value.upper() == 'JOIN' for token in statement.flatten()):
                join_count = sum(1 for token in statement.flatten() if token.value.upper() == 'JOIN')
                if join_count >= 3:
                    return QueryType.COMPLEX_JOIN
                else:
                    return QueryType.JOIN
            
            # تحليل الدوال النافذة
            if any('OVER()' in token.value.upper() for token in statement.flatten()):
                return QueryType.WINDOW_FUNCTION
            
            # تحليل UNION
            if any(token.value.upper() == 'UNION' for token in statement.flatten()):
                return QueryType.UNION
            
            # تحليل الاستعلامات الفرعية
            subquery_count = query_upper.count('SELECT') - 1
            if subquery_count > 0:
                return QueryType.SUBQUERY
            
            # تحليل الدوال المجمعة
            aggregate_functions = ['COUNT(', 'SUM(', 'AVG(', 'MAX(', 'MIN(', 'GROUP_CONCAT(']
            if any(func in query_upper for func in aggregate_functions):
                return QueryType.AGGREGATE
            
            # التصنيف الأساسي
            query_type_map = {
                'SELECT': QueryType.SELECT,
                'INSERT': QueryType.INSERT,
                'UPDATE': QueryType.UPDATE,
                'DELETE': QueryType.DELETE
            }
            
            return query_type_map.get(first_token.value.upper(), QueryType.SELECT)
            
        except Exception as e:
            logger.error(f"❌ خطأ في تصنيف الاستعلام: {e}")
            return QueryType.SELECT
    
    def _analyze_query_performance_advanced(self, query_text: str, execution_time: float,
                                          rows_affected: int, context: Dict) -> Dict[str, Any]:
        """تحليل أداء استعلام متقدم"""
        try:
            metrics = {
                'execution_time': execution_time,
                'rows_affected': rows_affected,
                'query_complexity': self._calculate_query_complexity_advanced(query_text),
                'index_usage_estimate': self._estimate_index_usage_advanced(query_text),
                'potential_bottlenecks': self._identify_advanced_bottlenecks(query_text),
                'memory_estimate': self._estimate_memory_usage_advanced(query_text, rows_affected),
                'io_estimate': self._estimate_io_operations(query_text, rows_affected),
                'is_slow_query': execution_time > self.performance_thresholds['slow_query_threshold'],
                'is_critical_query': execution_time > self.performance_thresholds['critical_query_threshold'],
                'execution_plan_quality': self._estimate_execution_plan_quality(query_text)
            }
            
            # إضافة مقاييس إضافية من السياق
            if context:
                metrics.update({
                    'connection_pool_usage': context.get('connection_pool_usage'),
                    'database_load': context.get('database_load'),
                    'concurrent_queries': context.get('concurrent_queries'),
                    'cache_hit_rate': context.get('cache_hit_rate'),
                    'lock_wait_time': context.get('lock_wait_time')
                })
            
            # تحليل اتجاهات الأداء
            metrics['performance_trend'] = self._analyze_performance_trend(query_text, execution_time)
            
            return metrics
            
        except Exception as e:
            logger.error(f"❌ خطأ في تحليل الأداء: {e}")
            return {'error': str(e)}
    
    def _calculate_query_complexity_advanced(self, query_text: str) -> int:
        """حساب تعقيد استعلام متقدم"""
        try:
            complexity_score = 0
            query_upper = query_text.upper()
            
            # عوامل التعقيد مع أوزان
            complexity_factors = {
                'num_tables': (len(re.findall(r'\b(FROM|JOIN)\s+(\w+)', query_upper, re.IGNORECASE)), 2),
                'num_conditions': (len(re.findall(r'\b(WHERE|AND|OR|HAVING)\b', query_upper, re.IGNORECASE)), 1),
                'num_aggregates': (len(re.findall(r'\b(COUNT|SUM|AVG|MAX|MIN|GROUP_CONCAT)\s*\(', query_upper, re.IGNORECASE)), 2),
                'num_subqueries': (len(re.findall(r'\(\s*SELECT', query_upper, re.IGNORECASE)), 3),
                'num_joins': (len(re.findall(r'\b(INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|FULL\s+JOIN)\b', query_upper, re.IGNORECASE)), 2),
                'num_group_by': (len(re.findall(r'\bGROUP BY\b', query_upper, re.IGNORECASE)), 2),
                'num_order_by': (len(re.findall(r'\bORDER BY\b', query_upper, re.IGNORECASE)), 1),
                'num_unions': (len(re.findall(r'\bUNION\b', query_upper, re.IGNORECASE)), 3),
                'query_length': (len(query_text) // 100, 0.5)  # كل 100 حرف
            }
            
            for factor, (value, weight) in complexity_factors.items():
                complexity_score += value * weight
            
            # عقوبات لأنماط معقدة
            if 'DISTINCT' in query_upper and 'GROUP BY' in query_upper:
                complexity_score += 5  # تكرار غير ضروري
            
            if 'LIKE' in query_upper and '%' in query_text:
                complexity_score += 3  # بحث نمط
            
            return int(complexity_score)
            
        except Exception as e:
            logger.error(f"❌ خطأ في حساب التعقيد: {e}")
            return 0
    
    def _estimate_index_usage_advanced(self, query_text: str) -> Dict[str, Any]:
        """تقدير متقدم لاستخدام الفهارس"""
        try:
            parsed = sqlparse.parse(query_text)
            if not parsed:
                return {'error': 'لا يمكن تحليل الاستعلام'}
            
            statement = parsed[0]
            index_analysis = {
                'potential_indexes': [],
                'suggested_indexes': [],
                'full_table_scan_risk': False,
                'index_merge_possible': False,
                'covering_index_possible': False,
                'missing_indexes': []
            }
            
            # استخراج الجداول
            tables = self._extract_tables(statement)
            
            # استخراج شروط WHERE
            where_conditions = self._extract_where_conditions(statement)
            
            # استخراج أعمدة JOIN
            join_conditions = self._extract_join_conditions(statement)
            
            # تحليل شروط WHERE للفهارس
            for table, conditions in where_conditions.items():
                for column, operator in conditions:
                    index_analysis['potential_indexes'].append({
                        'table': table,
                        'column': column,
                        'operator': operator,
                        'type': 'WHERE'
                    })
            
            # تحليل شروط JOIN للفهارس
            for table, conditions in join_conditions.items():
                for column, operator in conditions:
                    index_analysis['potential_indexes'].append({
                        'table': table,
                        'column': column,
                        'operator': operator,
                        'type': 'JOIN'
                    })
            
            # تحديد خطر المسح الكامل
            if not index_analysis['potential_indexes'] and 'WHERE' in query_text.upper():
                index_analysis['full_table_scan_risk'] = True
            
            # اقتراح فهارس تغطية
            select_columns = self._extract_select_columns(statement)
            for table, columns in select_columns.items():
                if len(columns) <= 5:  # عدد أعمدة معقول
                    index_analysis['covering_index_possible'] = True
                    index_analysis['suggested_indexes'].append({
                        'table': table,
                        'columns': columns,
                        'type': 'COVERING',
                        'reason': 'يمكن للفهرس تغطية جميع الأعمدة المطلوبة'
                    })
            
            return index_analysis
            
        except Exception as e:
            logger.error(f"❌ خطأ في تقدير الفهارس: {e}")
            return {'error': str(e)}
    
    def _extract_tables(self, statement) -> List[str]:
        """استخراج الجداول من الاستعلام"""
        tables = []
        try:
            from_clause = None
            for token in statement.tokens:
                if token.is_keyword and token.value.upper() == 'FROM':
                    from_clause = token
                    break
            
            if from_clause:
                # استخراج أسماء الجداول بعد FROM
                for token in statement.tokens[statement.tokens.index(from_clause) + 1:]:
                    if hasattr(token, 'value') and token.value.strip():
                        tables.append(token.value.strip())
                        break
            
            # استخراج جداول JOIN
            for token in statement.flatten():
                if token.is_keyword and token.value.upper() in ['JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN']:
                    # الجدول التالي لـ JOIN
                    join_index = statement.tokens.index(token)
                    if join_index + 1 < len(statement.tokens):
                        next_token = statement.tokens[join_index + 1]
                        if hasattr(next_token, 'value') and next_token.value.strip():
                            tables.append(next_token.value.strip())
            
            return list(set(tables))
        except:
            return []
    
    def _extract_where_conditions(self, statement) -> Dict[str, List[Tuple[str, str]]]:
        """استخراج شروط WHERE"""
        conditions = {}
        try:
            where_found = False
            current_conditions = []
            
            for token in statement.flatten():
                if token.is_keyword and token.value.upper() == 'WHERE':
                    where_found = True
                    continue
                
                if where_found:
                    if token.is_keyword and token.value.upper() in ['GROUP', 'ORDER', 'LIMIT']:
                        break
                    
                    if hasattr(token, 'value'):
                        # استخراج الأعمدة والمشغلات
                        condition_text = token.value
                        column_matches = re.findall(r'(\w+)\s*([=<>!]+)', condition_text)
                        for column, operator in column_matches:
                            # افتراض أن الجدول هو الأول (يمكن تحسين هذا)
                            table = self._extract_tables(statement)[0] if self._extract_tables(statement) else 'unknown'
                            if table not in conditions:
                                conditions[table] = []
                            conditions[table].append((column, operator))
            
            return conditions
        except:
            return {}
    
    def _extract_join_conditions(self, statement) -> Dict[str, List[Tuple[str, str]]]:
        """استخراج شروط JOIN"""
        conditions = {}
        try:
            for token in statement.flatten():
                if token.is_keyword and token.value.upper() in ['JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN']:
                    # البحث عن ON بعد JOIN
                    join_index = statement.tokens.index(token)
                    for i in range(join_index + 1, min(join_index + 10, len(statement.tokens))):
                        next_token = statement.tokens[i]
                        if next_token.is_keyword and next_token.value.upper() == 'ON':
                            # استخراج الشروط بعد ON
                            on_conditions = []
                            for j in range(i + 1, min(i + 10, len(statement.tokens))):
                                condition_token = statement.tokens[j]
                                if hasattr(condition_token, 'value'):
                                    condition_text = condition_token.value
                                    column_matches = re.findall(r'(\w+\.\w+)\s*=\s*(\w+\.\w+)', condition_text)
                                    for col1, col2 in column_matches:
                                        table1 = col1.split('.')[0]
                                        column1 = col1.split('.')[1]
                                        if table1 not in conditions:
                                            conditions[table1] = []
                                        conditions[table1].append((column1, '='))
                            break
            
            return conditions
        except:
            return {}
    
    def _extract_select_columns(self, statement) -> Dict[str, List[str]]:
        """استخراج الأعمدة المحددة في SELECT"""
        columns = {}
        try:
            select_found = False
            current_columns = []
            
            for token in statement.flatten():
                if token.is_keyword and token.value.upper() == 'SELECT':
                    select_found = True
                    continue
                
                if select_found and token.is_keyword and token.value.upper() == 'FROM':
                    break
                
                if select_found and hasattr(token, 'value'):
                    # استخراج أسماء الأعمدة
                    column_text = token.value
                    column_matches = re.findall(r'\b(\w+(?:\.\w+)?)\b', column_text)
                    for column_match in column_matches:
                        if '.' in column_match:
                            table, column = column_match.split('.')
                            if table not in columns:
                                columns[table] = []
                            if column != '*':
                                columns[table].append(column)
            
            return columns
        except:
            return {}
    
    def _identify_advanced_bottlenecks(self, query_text: str) -> List[str]:
        """تحديد اختناقات متقدمة"""
        bottlenecks = []
        query_upper = query_text.upper()
        
        # تحليل الأنماط المكلفة
        expensive_patterns = [
            (r'LIKE\s+[\'"]%[^\'"]', "استخدام LIKE مع بداية % يمنع استخدام الفهارس"),
            (r'SELECT \*', "استخدام SELECT * يجلب أعمدة غير ضرورية"),
            (r'WHERE\s+[^=]+\([^)]+\)', "استخدام الدوال على الأعمدة في WHERE يمنع استخدام الفهارس"),
            (r'JOIN.*ON.*\bOR\b', "شروط OR في JOIN قد تمنع التحسين"),
            (r'DISTINCT.*GROUP BY', "استخدام DISTINCT مع GROUP BY قد يكون زائداً"),
            (r'HAVING.*WHERE', "شروط HAVING يمكن نقلها إلى WHERE"),
            (r'IN\s*\(\s*SELECT', "استخدام IN مع استعلام فرعي قد يكون بطيئاً"),
            (r'NOT IN', "استخدام NOT IN قد يكون بطيئاً مع مجموعات كبيرة"),
            (r'ORDER BY RAND\(\)', "استخدام ORDER BY RAND() مكلف جداً")
        ]
        
        for pattern, message in expensive_patterns:
            if re.search(pattern, query_upper, re.IGNORECASE):
                bottlenecks.append(message)
        
        return bottlenecks
    
    def _estimate_memory_usage_advanced(self, query_text: str, rows_affected: int) -> Dict[str, float]:
        """تقدير متقدم لاستخدام الذاكرة"""
        try:
            # تقدير أساسي بناءً على عدد الصفوف
            base_memory = rows_affected * 1024  # 1KB لكل صف
            
            # عوامل التعديل
            complexity = self._calculate_query_complexity_advanced(query_text)
            memory_multiplier = 1 + (complexity * 0.05)
            
            # تحليل نوع الاستعلام
            query_type = self._classify_query_advanced(query_text)
            type_multipliers = {
                QueryType.AGGREGATE: 1.5,
                QueryType.JOIN: 1.8,
                QueryType.COMPLEX_JOIN: 2.5,
                QueryType.SUBQUERY: 1.7,
                QueryType.UNION: 1.6,
                QueryType.WINDOW_FUNCTION: 1.4
            }
            
            type_multiplier = type_multipliers.get(query_type, 1.0)
            
            estimated_memory = base_memory * memory_multiplier * type_multiplier
            
            return {
                'estimated_memory_bytes': estimated_memory,
                'estimated_memory_mb': estimated_memory / 1024 / 1024,
                'complexity_factor': complexity,
                'type_multiplier': type_multiplier
            }
        except Exception as e:
            logger.error(f"❌ خطأ في تقدير الذاكرة: {e}")
            return {'estimated_memory_bytes': 0, 'estimated_memory_mb': 0, 'complexity_factor': 0}
    
    def _estimate_io_operations(self, query_text: str, rows_affected: int) -> Dict[str, Any]:
        """تقدير عمليات الإدخال/الإخراج"""
        try:
            # تقدير تقريبي لعمليات I/O
            query_type = self._classify_query_advanced(query_text)
            
            io_estimates = {
                'estimated_reads': rows_affected,
                'estimated_writes': 0,
                'io_intensity': 'low'
            }
            
            if query_type in [QueryType.INSERT, QueryType.UPDATE, QueryType.DELETE]:
                io_estimates['estimated_writes'] = rows_affected
                io_estimates['io_intensity'] = 'medium'
            
            if rows_affected > 10000:
                io_estimates['io_intensity'] = 'high'
            
            return io_estimates
        except Exception as e:
            logger.error(f"❌ خطأ في تقدير I/O: {e}")
            return {'estimated_reads': 0, 'estimated_writes': 0, 'io_intensity': 'unknown'}
    
    def _estimate_execution_plan_quality(self, query_text: str) -> str:
        """تقدير جودة خطة التنفيذ"""
        try:
            score = 0
            query_upper = query_text.upper()
            
            # عوامل إيجابية
            if 'WHERE' in query_upper:
                score += 2
            
            if 'INDEX' in query_upper:
                score += 3
            
            if 'LIMIT' in query_upper:
                score += 1
            
            # عوامل سلبية
            if 'SELECT *' in query_upper:
                score -= 2
            
            if 'LIKE \'%' in query_upper:
                score -= 3
            
            if 'ORDER BY RAND()' in query_upper:
                score -= 4
            
            # تحديد الجودة
            if score >= 3:
                return 'excellent'
            elif score >= 0:
                return 'good'
            elif score >= -2:
                return 'fair'
            else:
                return 'poor'
                
        except:
            return 'unknown'
    
    def _analyze_performance_trend(self, query_text: str, current_time: float) -> str:
        """تحليل اتجاهات الأداء"""
        try:
            query_hash = self._create_query_hash(query_text)
            pattern = self.query_patterns.get(query_hash)
            
            if not pattern or len(pattern.execution_history) < 3:
                return 'insufficient_data'
            
            # تحليل الاتجاه
            recent_times = pattern.execution_history[-5:]  # آخر 5 تنفيذات
            if len(recent_times) >= 3:
                trend = statistics.mean(recent_times[-3:]) - statistics.mean(recent_times[:3])
                
                if trend > current_time * 0.1:  # تدهور بأكثر من 10%
                    return 'deteriorating'
                elif trend < -current_time * 0.1:  # تحسن بأكثر من 10%
                    return 'improving'
                else:
                    return 'stable'
            
            return 'stable'
        except:
            return 'unknown'
    
    def _analyze_resource_usage(self, query_text: str, execution_time: float, rows_affected: int) -> Dict[str, float]:
        """تحليل استخدام الموارد"""
        try:
            memory_estimate = self._estimate_memory_usage_advanced(query_text, rows_affected)
            io_estimate = self._estimate_io_operations(query_text, rows_affected)
            
            return {
                'cpu_usage_estimate': execution_time * 1000,  # تقدير استهلاك CPU
                'memory_usage_mb': memory_estimate.get('estimated_memory_mb', 0),
                'io_operations': io_estimate.get('estimated_reads', 0) + io_estimate.get('estimated_writes', 0),
                'execution_time': execution_time
            }
        except Exception as e:
            logger.error(f"❌ خطأ في تحليل الموارد: {e}")
            return {'cpu_usage_estimate': 0, 'memory_usage_mb': 0, 'io_operations': 0, 'execution_time': execution_time}
    
    def _generate_advanced_optimization_suggestions(self, query_text: str, 
                                                  performance_metrics: Dict,
                                                  index_analysis: Dict,
                                                  query_type: QueryType,
                                                  query_complexity: int) -> List[str]:
        """توليد اقتراحات تحسين متقدمة"""
        suggestions = []
        
        # اقتراحات بناءً على نوع الاستعلام
        type_suggestions = self._get_query_type_suggestions(query_type, query_text)
        suggestions.extend(type_suggestions)
        
        # اقتراحات الفهارس
        if self.optimization_rules['index_optimization']['enabled']:
            index_suggestions = self._suggest_advanced_indexes(query_text, index_analysis, performance_metrics)
            suggestions.extend(index_suggestions)
        
        # إعادة هيكلة الاستعلام
        if self.optimization_rules['query_restructuring']['enabled']:
            restructuring_suggestions = self._suggest_advanced_restructuring(query_text, query_type, query_complexity)
            suggestions.extend(restructuring_suggestions)
        
        # استراتيجيات التخزين المؤقت
        if self.optimization_rules['caching_strategy']['enabled']:
            caching_suggestions = self._suggest_advanced_caching(query_text, performance_metrics, query_type)
            suggestions.extend(caching_suggestions)
        
        # تحسين الموارد
        if self.optimization_rules['resource_optimization']['enabled']:
            resource_suggestions = self._suggest_resource_optimizations(query_text, performance_metrics)
            suggestions.extend(resource_suggestions)
        
        return suggestions[:15]  # إرجاع أول 15 اقتراح فقط
    
    def _get_query_type_suggestions(self, query_type: QueryType, query_text: str) -> List[str]:
        """اقتراحات مخصصة بناءً على نوع الاستعلام"""
        suggestions = []
        query_upper = query_text.upper()
        
        if query_type == QueryType.JOIN:
            if 'LEFT JOIN' in query_upper and 'IS NULL' in query_upper:
                suggestions.append("فكر في استخدام NOT EXISTS بدلاً من LEFT JOIN ... IS NULL")
            
            if query_upper.count('JOIN') > 3:
                suggestions.append("عدد JOINs كبير - فكر في إعادة تصميم الاستعلام أو استخدام استعلامات فرعية")
        
        elif query_type == QueryType.SUBQUERY:
            if 'IN' in query_upper and '(SELECT' in query_upper:
                suggestions.append("فكر في تحويل IN (SELECT) إلى EXISTS أو JOIN")
        
        elif query_type == QueryType.AGGREGATE:
            if 'DISTINCT' in query_upper and 'GROUP BY' in query_upper:
                suggestions.append("استخدام DISTINCT مع GROUP BY قد يكون زائداً عن الحاجة")
        
        elif query_type == QueryType.UNION:
            suggestions.append("فكر في استخدام UNION ALL بدلاً من UNION إذا لم تكن هناك تكرارات")
        
        return suggestions
    
    def _suggest_advanced_indexes(self, query_text: str, index_analysis: Dict, 
                                performance_metrics: Dict) -> List[str]:
        """اقتراح فهارس متقدمة"""
        suggestions = []
        
        if index_analysis.get('full_table_scan_risk'):
            suggestions.append("🔴 خطر المسح الكامل للجدول - أضف فهارس على أعمدة WHERE")
        
        for suggested_index in index_analysis.get('suggested_indexes', []):
            if suggested_index['type'] == 'COVERING':
                suggestions.append(f"🟢 فهرس تغطية مقترح على {suggested_index['table']}.{suggested_index['columns']}")
            else:
                suggestions.append(f"🟡 فهرس مقترح على {suggested_index['table']}.{suggested_index['column']}")
        
        # اقتراح فهارس مركبة
        where_conditions = []
        for condition in index_analysis.get('potential_indexes', []):
            if condition['type'] == 'WHERE':
                where_conditions.append(condition)
        
        if len(where_conditions) >= 2:
            tables = {}
            for condition in where_conditions:
                table = condition['table']
                if table not in tables:
                    tables[table] = []
                tables[table].append(condition['column'])
            
            for table, columns in tables.items():
                if len(columns) >= 2:
                    suggestions.append(f"🟠 فهرس مركب مقترح على {table} ({', '.join(columns[:3])})")
        
        return suggestions
    
    def _suggest_advanced_restructuring(self, query_text: str, query_type: QueryType, 
                                      query_complexity: int) -> List[str]:
        """اقتراح إعادة هيكلة متقدمة"""
        suggestions = []
        query_upper = query_text.upper()
        
        if query_complexity > self.performance_thresholds['complexity_threshold']:
            suggestions.append("تعقيد الاستعلام مرتفع - فكر في تقسيمه إلى استعلامات أصغر")
        
        if self.optimization_rules['query_restructuring']['enable_subquery_to_join']:
            if query_type == QueryType.SUBQUERY and 'IN' in query_upper:
                suggestions.append("يمكن تحويل الاستعلام الفرعي IN إلى JOIN لتحسين الأداء")
        
        if self.optimization_rules['query_restructuring']['enable_predicate_pushdown']:
            if 'HAVING' in query_upper and 'WHERE' in query_upper:
                suggestions.append("تحقق إذا كان يمكن نقل بعض شروط HAVING إلى WHERE")
        
        if 'ORDER BY' in query_upper and 'LIMIT' not in query_upper:
            suggestions.append("إضافة LIMIT إلى الاستعلامات مع ORDER BY يمكن أن يحسن الأداء")
        
        return suggestions
    
    def _suggest_advanced_caching(self, query_text: str, performance_metrics: Dict, 
                                query_type: QueryType) -> List[str]:
        """اقتراح استراتيجيات تخزين مؤقت متقدمة"""
        suggestions = []
        
        if performance_metrics['is_slow_query']:
            suggestions.append("هذا الاستعلام بطيء - مثالي للتخزين المؤقت")
        
        if query_type in [QueryType.SELECT, QueryType.AGGREGATE]:
            if performance_metrics.get('rows_affected', 0) < self.optimization_rules['caching_strategy']['result_size_threshold']:
                suggestions.append("نتيجة الاستعلام صغيرة - مناسبة للتخزين المؤقت")
        
        if performance_metrics.get('execution_plan_quality') == 'poor':
            suggestions.append("خطة التنفيذ ضعيفة - التخزين المؤقت يمكن أن يحسن الأداء")
        
        return suggestions
    
    def _suggest_resource_optimizations(self, query_text: str, performance_metrics: Dict) -> List[str]:
        """اقتراح تحسينات الموارد"""
        suggestions = []
        
        memory_usage = performance_metrics.get('resource_usage', {}).get('memory_usage_mb', 0)
        if memory_usage > self.optimization_rules['resource_optimization']['memory_usage_threshold']:
            suggestions.append(f"استخدام الذاكرة مرتفع ({memory_usage:.1f}MB) - فكر في تحسين الاستعلام")
        
        if performance_metrics.get('io_estimate', {}).get('io_intensity') == 'high':
            suggestions.append("كثافة I/O عالية - فكر في تحسين الفهارس أو تقسيم البيانات")
        
        if self.optimization_rules['resource_optimization']['enable_batch_processing']:
            if performance_metrics.get('rows_affected', 0) > 1000:
                suggestions.append("عدد الصف كبير - فكر في المعالجة الدفعية")
        
        return suggestions
    
    def _determine_optimization_level_advanced(self, execution_time: float, 
                                             performance_metrics: Dict, 
                                             suggestion_count: int,
                                             query_complexity: int) -> OptimizationLevel:
        """تحديد مستوى تحسين متقدم"""
        # عوامل الترجيح
        time_factor = 0.4
        complexity_factor = 0.3
        suggestion_factor = 0.3
        
        # تسجيل الوقت
        time_score = 0
        if execution_time > self.performance_thresholds['critical_query_threshold']:
            time_score = 1.0
        elif execution_time > self.performance_thresholds['slow_query_threshold']:
            time_score = 0.7
        elif execution_time > self.performance_thresholds['slow_query_threshold'] / 2:
            time_score = 0.3
        
        # تسجيل التعقيد
        complexity_score = 0
        if query_complexity > self.performance_thresholds['complexity_threshold'] * 1.5:
            complexity_score = 1.0
        elif query_complexity > self.performance_thresholds['complexity_threshold']:
            complexity_score = 0.7
        elif query_complexity > self.performance_thresholds['complexity_threshold'] / 2:
            complexity_score = 0.3
        
        # تسجيل الاقتراحات
        suggestion_score = min(suggestion_count / 10.0, 1.0)
        
        # النتيجة الإجمالية
        total_score = (time_score * time_factor + 
                      complexity_score * complexity_factor + 
                      suggestion_score * suggestion_factor)
        
        # تحديد المستوى
        if total_score >= 0.8:
            return OptimizationLevel.EMERGENCY
        elif total_score >= 0.6:
            return OptimizationLevel.CRITICAL
        elif total_score >= 0.4:
            return OptimizationLevel.HIGH
        elif total_score >= 0.2:
            return OptimizationLevel.MEDIUM
        elif total_score > 0:
            return OptimizationLevel.LOW
        else:
            return OptimizationLevel.OPTIMAL
    
    def _create_query_hash(self, query_text: str) -> str:
        """إنشاء هاش فريد للاستعلام"""
        try:
            # تطبيع الاستعلام
            normalized = re.sub(r'\s+', ' ', query_text.upper().strip())
            normalized = re.sub(r'\d+', '?', normalized)
            normalized = re.sub(r"'[^']*'", '?', normalized)
            normalized = re.sub(r'"[^"]*"', '?', normalized)
            
            # إنشاء الهاش
            return hashlib.md5(normalized.encode('utf-8')).hexdigest()
        except:
            return hashlib.md5(query_text.encode('utf-8')).hexdigest()
    
    def _update_query_history(self, analysis: QueryAnalysis):
        """تحديث سجل الاستعلامات"""
        self.query_history.append(analysis)
        
        # الاحتفاظ بآخر 5000 استعلام فقط
        if len(self.query_history) > 5000:
            self.query_history = self.query_history[-5000:]
    
    def _update_query_patterns(self, analysis: QueryAnalysis):
        """تحديث أنماط الاستعلامات المتقدمة"""
        try:
            query_hash = self._create_query_hash(analysis.query_text)
            
            if query_hash not in self.query_patterns:
                self.query_patterns[query_hash] = QueryPattern(
                    pattern_hash=query_hash,
                    normalized_query=re.sub(r'\s+', ' ', analysis.query_text.upper().strip()),
                    frequency=1,
                    avg_execution_time=analysis.execution_time,
                    max_execution_time=analysis.execution_time,
                    min_execution_time=analysis.execution_time,
                    optimization_opportunities=analysis.optimization_suggestions,
                    last_executed=analysis.timestamp,
                    execution_history=[analysis.execution_time]
                )
            else:
                pattern = self.query_patterns[query_hash]
                pattern.frequency += 1
                pattern.execution_history.append(analysis.execution_time)
                
                # تحديث الإحصائيات
                pattern.avg_execution_time = statistics.mean(pattern.execution_history)
                pattern.max_execution_time = max(pattern.execution_history)
                pattern.min_execution_time = min(pattern.execution_history)
                pattern.last_executed = analysis.timestamp
                
                # تحديث فرص التحسين
                for suggestion in analysis.optimization_suggestions:
                    if suggestion not in pattern.optimization_opportunities:
                        pattern.optimization_opportunities.append(suggestion)
                
                # الاحتفاظ بآخر 50 تنفيذ فقط
                if len(pattern.execution_history) > 50:
                    pattern.execution_history = pattern.execution_history[-50:]
                    
        except Exception as e:
            logger.error(f"❌ خطأ في تحديث الأنماط: {e}")
    
    def _update_index_recommendations(self, analysis: QueryAnalysis, index_analysis: Dict):
        """تحديث توصيات الفهارس"""
        try:
            for suggested_index in index_analysis.get('suggested_indexes', []):
                # حساب الفائدة المتوقعة
                expected_benefit = self._calculate_index_benefit(analysis, suggested_index)
                
                if expected_benefit > self.optimization_rules['index_optimization']['min_benefit']:
                    recommendation = IndexRecommendation(
                        table_name=suggested_index.get('table', 'unknown'),
                        column_names=suggested_index.get('columns', [suggested_index.get('column', 'unknown')]),
                        index_type=IndexType.BTREE,
                        expected_benefit=expected_benefit,
                        creation_cost=self._estimate_index_creation_cost(suggested_index),
                        priority=self._calculate_index_priority(expected_benefit, analysis),
                        reason=suggested_index.get('reason', 'تحسين الأداء'),
                        sql_statement=self._generate_index_sql(suggested_index)
                    )
                    
                    # إضافة أو تحديث التوصية
                    self._add_or_update_index_recommendation(recommendation)
                    
        except Exception as e:
            logger.error(f"❌ خطأ في تحديث توصيات الفهارس: {e}")
    
    def _calculate_index_benefit(self, analysis: QueryAnalysis, suggested_index: Dict) -> float:
        """حساب فائدة الفهرس المتوقعة"""
        try:
            base_score = 0.0
            
            # فائدة بناءً على نوع الاستعلام
            query_type_benefits = {
                QueryType.SELECT: 0.7,
                QueryType.JOIN: 0.8,
                QueryType.WHERE: 0.9,
                QueryType.ORDER_BY: 0.6
            }
            
            base_score = query_type_benefits.get(analysis.query_type, 0.5)
            
            # تعديل بناءً على وقت التنفيذ
            if analysis.execution_time > self.performance_thresholds['slow_query_threshold']:
                base_score *= 1.5
            
            # تعديل بناءً على التكرار
            query_hash = self._create_query_hash(analysis.query_text)
            pattern = self.query_patterns.get(query_hash)
            if pattern and pattern.frequency > 10:
                base_score *= 1.3
            
            return min(base_score, 1.0)
            
        except:
            return 0.5
    
    def _estimate_index_creation_cost(self, suggested_index: Dict) -> float:
        """تقدير تكلفة إنشاء الفهرس"""
        try:
            base_cost = 1.0
            num_columns = len(suggested_index.get('columns', [1]))
            
            # تكلفة أعلى للفهارس المركبة
            if num_columns > 1:
                base_cost *= (1 + (num_columns * 0.2))
            
            return base_cost
        except:
            return 1.0
    
    def _calculate_index_priority(self, expected_benefit: float, analysis: QueryAnalysis) -> int:
        """حساب أولوية الفهرس"""
        try:
            priority = int(expected_benefit * 100)
            
            # زيادة الأولوية للاستعلامات البطيئة
            if analysis.execution_time > self.performance_thresholds['slow_query_threshold']:
                priority += 20
            
            # زيادة الأولوية للاستعلامات المتكررة
            query_hash = self._create_query_hash(analysis.query_text)
            pattern = self.query_patterns.get(query_hash)
            if pattern and pattern.frequency > 5:
                priority += 15
            
            return min(priority, 100)
        except:
            return 50
    
    def _generate_index_sql(self, suggested_index: Dict) -> str:
        """إنشاء عبارة SQL للفهرس"""
        try:
            table_name = suggested_index.get('table', 'table_name')
            columns = suggested_index.get('columns', ['column_name'])
            index_name = f"idx_{table_name}_{'_'.join(columns)}"
            
            return f"CREATE INDEX {index_name} ON {table_name} ({', '.join(columns)});"
        except:
            return "CREATE INDEX idx_name ON table_name (column);"
    
    def _add_or_update_index_recommendation(self, new_recommendation: IndexRecommendation):
        """إضافة أو تحديث توصية فهرس"""
        try:
            # البحث عن توصية موجودة
            existing_index = None
            for i, rec in enumerate(self.index_recommendations):
                if (rec.table_name == new_recommendation.table_name and 
                    rec.column_names == new_recommendation.column_names):
                    existing_index = i
                    break
            
            if existing_index is not None:
                # تحديث التوصية الموجودة
                existing_rec = self.index_recommendations[existing_index]
                if new_recommendation.expected_benefit > existing_rec.expected_benefit:
                    self.index_recommendations[existing_index] = new_recommendation
            else:
                # إضافة توصية جديدة
                self.index_recommendations.append(new_recommendation)
                
            # ترتيب التوصيات حسب الأولوية
            self.index_recommendations.sort(key=lambda x: x.priority, reverse=True)
            
            # الاحتفاظ بأعلى 50 توصية فقط
            if len(self.index_recommendations) > 50:
                self.index_recommendations = self.index_recommendations[:50]
                
        except Exception as e:
            logger.error(f"❌ خطأ في إضافة توصية الفهرس: {e}")
    
    def _create_error_analysis(self, query_text: str, error: str) -> QueryAnalysis:
        """إنشاء تحليل خطأ"""
        return QueryAnalysis(
            query_id=f"error_{int(time.time())}",
            query_text=query_text,
            query_type=QueryType.SELECT,
            execution_time=0,
            rows_affected=0,
            optimization_suggestions=[f"خطأ في التحليل: {error}"],
            optimization_level=OptimizationLevel.CRITICAL,
            performance_metrics={'error': error},
            query_complexity=0,
            index_analysis={},
            resource_usage={}
        )
    
    def get_comprehensive_performance_report(self, hours: int = 24) -> PerformanceReport:
        """الحصول على تقرير أداء شامل"""
        try:
            cutoff_time = datetime.now() - timedelta(hours=hours)
            recent_queries = [q for q in self.query_history if q.timestamp > cutoff_time]
            
            if not recent_queries:
                return PerformanceReport(
                    period_start=cutoff_time,
                    period_end=datetime.now(),
                    total_queries=0,
                    slow_queries=0,
                    avg_execution_time=0,
                    performance_distribution={},
                    top_slow_queries=[],
                    index_recommendations=[],
                    system_recommendations=["لا توجد استعلامات حديثة للتحليل"],
                    resource_utilization={}
                )
            
            # الإحصائيات الأساسية
            execution_times = [q.execution_time for q in recent_queries]
            slow_queries = [q for q in recent_queries 
                          if q.execution_time > self.performance_thresholds['slow_query_threshold']]
            
            # توزيع مستويات التحسين
            performance_distribution = {}
            for level in OptimizationLevel:
                performance_distribution[level] = len(
                    [q for q in recent_queries if q.optimization_level == level]
                )
            
            # أعلى الاستعلامات البطيئة
            top_slow_queries = sorted(
                [q for q in recent_queries if q.optimization_level in [OptimizationLevel.CRITICAL, OptimizationLevel.EMERGENCY]],
                key=lambda x: x.execution_time,
                reverse=True
            )[:10]
            
            # استخدام الموارد
            total_memory = sum(q.resource_usage.get('memory_usage_mb', 0) for q in recent_queries)
            total_cpu = sum(q.resource_usage.get('cpu_usage_estimate', 0) for q in recent_queries)
            
            resource_utilization = {
                'avg_memory_usage_mb': total_memory / len(recent_queries) if recent_queries else 0,
                'avg_cpu_usage': total_cpu / len(recent_queries) if recent_queries else 0,
                'total_queries': len(recent_queries),
                'peak_memory_usage_mb': max([q.resource_usage.get('memory_usage_mb', 0) for q in recent_queries]) if recent_queries else 0
            }
            
            return PerformanceReport(
                period_start=cutoff_time,
                period_end=datetime.now(),
                total_queries=len(recent_queries),
                slow_queries=len(slow_queries),
                avg_execution_time=statistics.mean(execution_times) if execution_times else 0,
                performance_distribution=performance_distribution,
                top_slow_queries=top_slow_queries,
                index_recommendations=self.index_recommendations[:10],  # أهم 10 توصيات
                system_recommendations=self._generate_system_recommendations(recent_queries),
                resource_utilization=resource_utilization
            )
            
        except Exception as e:
            logger.error(f"❌ خطأ في إنشاء تقرير الأداء: {e}")
            return PerformanceReport(
                period_start=datetime.now() - timedelta(hours=hours),
                period_end=datetime.now(),
                total_queries=0,
                slow_queries=0,
                avg_execution_time=0,
                performance_distribution={},
                top_slow_queries=[],
                index_recommendations=[],
                system_recommendations=[f"خطأ في إنشاء التقرير: {str(e)}"],
                resource_utilization={}
            )
    
    def _generate_system_recommendations(self, queries: List[QueryAnalysis]) -> List[str]:
        """توليد توصيات النظام"""
        recommendations = []
        
        if not queries:
            return ["لا توجد بيانات كافية لتوليد التوصيات"]
        
        # نسبة الاستعلامات البطيئة
        slow_queries = [q for q in queries if q.execution_time > self.performance_thresholds['slow_query_threshold']]
        slow_percentage = (len(slow_queries) / len(queries)) * 100
        
        if slow_percentage > 30:
            recommendations.append(f"🚨 نسبة عالية من الاستعلامات البطيئة ({slow_percentage:.1f}%) - مراجعة عاجلة مطلوبة")
        elif slow_percentage > 15:
            recommendations.append(f"⚠️  نسبة متوسطة من الاستعلامات البطيئة ({slow_percentage:.1f}%) - تحسينات مستحبة")
        
        # توزيع أنواع الاستعلامات
        query_types = {}
        for query in queries:
            query_types[query.query_type] = query_types.get(query.query_type, 0) + 1
        
        # تحليل التعقيد
        avg_complexity = statistics.mean([q.query_complexity for q in queries])
        if avg_complexity > 15:
            recommendations.append("📊 متوسط تعقيد الاستعلامات مرتفع - فكر في تبسيط الاستعلامات المعقدة")
        
        # تحليل استخدام الذاكرة
        avg_memory = statistics.mean([q.resource_usage.get('memory_usage_mb', 0) for q in queries])
        if avg_memory > 50:
            recommendations.append(f"🧠 متوسط استخدام الذاكرة مرتفع ({avg_memory:.1f}MB) - فكر في تحسين استعلامات الذاكرة")
        
        # توصيات بناءً على الأنماط
        pattern_recommendations = self._generate_pattern_based_recommendations()
        recommendations.extend(pattern_recommendations)
        
        return recommendations[:10]  # إرجاع أول 10 توصيات فقط
    
    def _generate_pattern_based_recommendations(self) -> List[str]:
        """توليد توصيات بناءً على الأنماط"""
        recommendations = []
        
        try:
            # تحليل الأنماط الحرجة
            critical_patterns = []
            for pattern in self.query_patterns.values():
                if (pattern.avg_execution_time > self.performance_thresholds['critical_query_threshold'] and 
                    pattern.frequency > 5):
                    critical_patterns.append(pattern)
            
            if critical_patterns:
                recommendations.append(f"🔍 تم اكتشاف {len(critical_patterns)} نمط استعلام حرج يحتاج تحسين عاجل")
            
            # تحليل الأنماط المتكررة
            frequent_patterns = []
            for pattern in self.query_patterns.values():
                if pattern.frequency > 20:
                    frequent_patterns.append(pattern)
            
            if frequent_patterns:
                recommendations.append(f"🔄 تم اكتشاف {len(frequent_patterns)} نمط استعلام متكرر - مثالي للتخزين المؤقت")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"❌ خطأ في توليد توصيات الأنماط: {e}")
            return []
    
    def get_query_patterns_report(self) -> Dict[str, Any]:
        """الحصول على تقرير أنماط الاستعلامات"""
        try:
            critical_patterns = []
            frequent_patterns = []
            optimized_patterns = []
            
            for pattern in self.query_patterns.values():
                if pattern.avg_execution_time > self.performance_thresholds['critical_query_threshold']:
                    critical_patterns.append(pattern)
                elif pattern.frequency > self.performance_thresholds['frequent_query_threshold']:
                    frequent_patterns.append(pattern)
                elif pattern.avg_execution_time < self.performance_thresholds['slow_query_threshold'] / 2:
                    optimized_patterns.append(pattern)
            
            return {
                'total_patterns': len(self.query_patterns),
                'critical_patterns_count': len(critical_patterns),
                'frequent_patterns_count': len(frequent_patterns),
                'optimized_patterns_count': len(optimized_patterns),
                'critical_patterns': [
                    {
                        'pattern': p.normalized_query[:100] + '...' if len(p.normalized_query) > 100 else p.normalized_query,
                        'frequency': p.frequency,
                        'avg_execution_time': p.avg_execution_time,
                        'optimization_opportunities': p.optimization_opportunities[:3]
                    }
                    for p in critical_patterns[:5]  # أول 5 أنماط حرجة فقط
                ],
                'frequent_patterns': [
                    {
                        'pattern': p.normalized_query[:100] + '...' if len(p.normalized_query) > 100 else p.normalized_query,
                        'frequency': p.frequency,
                        'avg_execution_time': p.avg_execution_time
                    }
                    for p in frequent_patterns[:5]  # أول 5 أنماط متكررة فقط
                ]
            }
        except Exception as e:
            logger.error(f"❌ خطأ في إنشاء تقرير الأنماط: {e}")
            return {'error': str(e)}
    
    def optimize_query_execution(self, query_text: str, context: Dict = None) -> Dict[str, Any]:
        """تحسين تنفيذ الاستعلام مع إرجاع خطة التحسين"""
        try:
            # محاكاة تنفيذ الاستعلام
            start_time = time.time()
            
            # هنا سيتم تنفيذ الاستعلام الفعلي في التطبيق الحقيقي
            # للمثال، سنستخدم وقت تنفيذ وهمي
            execution_time = 0.1  # وقت تنفيذ افتراضي
            
            # تحليل الاستعلام
            analysis = self.analyze_query(query_text, execution_time, 0, context)
            
            # إنشاء خطة التحسين
            optimization_plan = {
                'original_query': query_text,
                'analysis': analysis,
                'optimization_strategies': [],
                'expected_improvement': 0.0,
                'execution_plan': self._generate_execution_plan(query_text, analysis)
            }
            
            # تطبيق استراتيجيات التحسين
            if analysis.optimization_suggestions:
                optimization_plan['optimization_strategies'] = analysis.optimization_suggestions[:5]
                optimization_plan['expected_improvement'] = self._estimate_improvement(analysis)
            
            optimization_plan['total_analysis_time'] = time.time() - start_time
            
            return optimization_plan
            
        except Exception as e:
            logger.error(f"❌ خطأ في تحسين تنفيذ الاستعلام: {e}")
            return {'error': str(e)}
    
    def _generate_execution_plan(self, query_text: str, analysis: QueryAnalysis) -> Dict[str, Any]:
        """إنشاء خطة تنفيذ للاستعلام"""
        try:
            return {
                'query_type': analysis.query_type.value,
                'estimated_rows': analysis.rows_affected,
                'estimated_cost': analysis.execution_time * 1000,  # تقدير التكلفة
                'recommended_indexes': analysis.index_analysis.get('suggested_indexes', [])[:3],
                'bottlenecks': analysis.performance_metrics.get('potential_bottlenecks', [])[:3],
                'memory_requirements': analysis.resource_usage.get('memory_usage_mb', 0),
                'io_operations': analysis.performance_metrics.get('io_estimate', {}).get('estimated_reads', 0)
            }
        except:
            return {}
    
    def _estimate_improvement(self, analysis: QueryAnalysis) -> float:
        """تقدير نسبة التحسين المتوقعة"""
        try:
            base_improvement = 0.0
            
            # تحسين بناءً على مستوى التحسين
            improvement_factors = {
                OptimizationLevel.EMERGENCY: 0.7,
                OptimizationLevel.CRITICAL: 0.5,
                OptimizationLevel.HIGH: 0.3,
                OptimizationLevel.MEDIUM: 0.2,
                OptimizationLevel.LOW: 0.1,
                OptimizationLevel.OPTIMAL: 0.0
            }
            
            base_improvement = improvement_factors.get(analysis.optimization_level, 0.0)
            
            # تعديل بناءً على عدد الاقتراحات
            suggestion_factor = min(len(analysis.optimization_suggestions) / 10.0, 1.0)
            base_improvement *= (1 + suggestion_factor * 0.5)
            
            return min(base_improvement, 0.9)  # حد أقصى 90% تحسن
            
        except:
            return 0.0
    
    def export_optimization_data(self, file_path: str) -> bool:
        """تصدير بيانات التحسين إلى ملف"""
        try:
            export_data = {
                'export_timestamp': datetime.now().isoformat(),
                'performance_thresholds': self.performance_thresholds,
                'optimization_rules': self.optimization_rules,
                'query_patterns_count': len(self.query_patterns),
                'index_recommendations_count': len(self.index_recommendations),
                'recent_performance_report': self.get_comprehensive_performance_report(24).__dict__,
                'top_index_recommendations': [
                    {
                        'table': rec.table_name,
                        'columns': rec.column_names,
                        'priority': rec.priority,
                        'expected_benefit': rec.expected_benefit,
                        'sql': rec.sql_statement
                    }
                    for rec in self.index_recommendations[:10]
                ]
            }
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✅ تم تصدير بيانات التحسين إلى {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ خطأ في تصدير البيانات: {e}")
            return False
    
    def import_optimization_data(self, file_path: str) -> bool:
        """استيراد بيانات التحسين من ملف"""
        try:
            if not os.path.exists(file_path):
                logger.error(f"❌ ملف الاستيراد غير موجود: {file_path}")
                return False
            
            with open(file_path, 'r', encoding='utf-8') as f:
                import_data = json.load(f)
            
            # تطبيق البيانات المستوردة (يمكن تخصيص هذا حسب الحاجة)
            if 'performance_thresholds' in import_data:
                self.performance_thresholds.update(import_data['performance_thresholds'])
            
            if 'optimization_rules' in import_data:
                self.optimization_rules.update(import_data['optimization_rules'])
            
            logger.info(f"✅ تم استيراد بيانات التحسين من {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ خطأ في استيراد البيانات: {e}")
            return False

class QueryPerformanceMonitor:
    """مراقب أداء الاستعلامات"""
    
    def __init__(self):
        self.is_monitoring = False
        self.monitor_thread = None
    
    def start_monitoring(self):
        """بدء مراقبة الأداء"""
        if self.is_monitoring:
            return
        
        self.is_monitoring = True
        self.monitor_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitor_thread.start()
        logger.info("🔍 بدء مراقبة أداء الاستعلامات")
    
    def stop_monitoring(self):
        """إيقاف مراقبة الأداء"""
        self.is_monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5.0)
        logger.info("🛑 إيقاف مراقبة أداء الاستعلامات")
    
    def _monitoring_loop(self):
        """حلقة المراقبة"""
        while self.is_monitoring:
            try:
                # مراقبة استخدام موارد النظام
                system_metrics = self._collect_system_metrics()
                
                # تسجيل المقاييس إذا كانت هناك مشاكل
                if system_metrics['cpu_usage'] > 80 or system_metrics['memory_usage'] > 85:
                    logger.warning(f"⚠️  استخدام عالي للموارد: CPU {system_metrics['cpu_usage']}%, Memory {system_metrics['memory_usage']}%")
                
                time.sleep(60)  # التحقق كل دقيقة
                
            except Exception as e:
                logger.error(f"❌ خطأ في مراقبة الأداء: {e}")
                time.sleep(300)  # انتظار 5 دقائق عند الخطأ
    
    def _collect_system_metrics(self) -> Dict[str, float]:
        """جمع مقاييس النظام"""
        try:
            cpu_usage = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                'cpu_usage': cpu_usage,
                'memory_usage': memory.percent,
                'memory_available': memory.available / 1024 / 1024 / 1024,  # GB
                'disk_usage': disk.percent,
                'disk_free': disk.free / 1024 / 1024 / 1024  # GB
            }
        except Exception as e:
            logger.error(f"❌ خطأ في جمع مقاييس النظام: {e}")
            return {}

# مصحح لتحسين الاستعلامات
def query_optimizer(decorated_function):
    """مصحح لتحسين وتتبع الاستعلامات"""
    @wraps(decorated_function)
    async def async_wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await decorated_function(*args, **kwargs)
            execution_time = time.time() - start_time
            
            # تحليل الاستعلام إذا كان بطيئاً أو معقداً
            if execution_time > 0.5:  # عتبة الوقت
                query_text = kwargs.get('query') or args[0] if args else 'unknown'
                optimizer = AdvancedQueryOptimizer()
                optimizer.analyze_query(query_text, execution_time)
            
            return result
        except Exception as e:
            logger.error(f"❌ خطأ في تنفيذ الاستعلام: {e}")
            raise
    
    @wraps(decorated_function)
    def sync_wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = decorated_function(*args, **kwargs)
            execution_time = time.time() - start_time
            
            # تحليل الاستعلام إذا كان بطيئاً أو معقداً
            if execution_time > 0.5:  # عتبة الوقت
                query_text = kwargs.get('query') or args[0] if args else 'unknown'
                optimizer = AdvancedQueryOptimizer()
                optimizer.analyze_query(query_text, execution_time)
            
            return result
        except Exception as e:
            logger.error(f"❌ خطأ في تنفيذ الاستعلام: {e}")
            raise
    
    return async_wrapper if asyncio.iscoroutinefunction(decorated_function) else sync_wrapper

# النسخة العالمية للخدمة
query_optimizer_service = AdvancedQueryOptimizer()

# دوال التوافق
def analyze_query(query_text: str, execution_time: float, **kwargs) -> QueryAnalysis:
    """دالة التوافق لتحليل الاستعلام"""
    return query_optimizer_service.analyze_query(query_text, execution_time, **kwargs)

def get_performance_report(hours: int = 24) -> PerformanceReport:
    """دالة التوافق للحصول على تقرير الأداء"""
    return query_optimizer_service.get_comprehensive_performance_report(hours)

def optimize_query(query_text: str, **kwargs) -> Dict[str, Any]:
    """دالة التوافق لتحسين الاستعلام"""
    return query_optimizer_service.optimize_query_execution(query_text, kwargs)

if __name__ == "__main__":
    # اختبار الخدمة المتقدمة
    async def test_advanced_optimizer():
        print("🧪 اختبار محسن الاستعلامات المتقدم...")
        
        # استعلامات اختبار
        test_queries = [
            "SELECT * FROM users WHERE age > 30 AND city = 'New York'",
            "SELECT u.name, o.amount FROM users u JOIN orders o ON u.id = o.user_id WHERE o.amount > 1000",
            "SELECT COUNT(*), department FROM employees GROUP BY department HAVING COUNT(*) > 5",
            "SELECT * FROM products WHERE name LIKE '%apple%' OR description LIKE '%fruit%'"
        ]
        
        for i, query in enumerate(test_queries):
            print(f"\n--- استعلام اختبار {i+1} ---")
            print(f"الاستعلام: {query}")
            
            analysis = query_optimizer_service.analyze_query(query, 0.5, 100)
            print(f"نوع الاستعلام: {analysis.query_type.value}")
            print(f"مستوى التحسين: {analysis.optimization_level.value}")
            print(f"اقتراحات التحسين: {analysis.optimization_suggestions[:3]}")
        
        # تقرير الأداء
        report = query_optimizer_service.get_comprehensive_performance_report(1)
        print(f"\n📊 تقرير الأداء:")
        print(f"إجمالي الاستعلامات: {report.total_queries}")
        print(f"الاستعلامات البطيئة: {report.slow_queries}")
        print(f"متوسط وقت التنفيذ: {report.avg_execution_time:.4f} ثانية")
    
    import asyncio
    asyncio.run(test_advanced_optimizer())
