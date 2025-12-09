import React, { useState, useMemo } from 'react';
import { QUESTIONS, getCategories } from '../services/questions';
import { ProgressMap, UserProgress, QuestionType, Question } from '../types';
import { BookOpen, AlertTriangle, CheckCircle, Zap, X, ListFilter, CheckSquare, HelpCircle, ChevronRight, Eye, History, Search, PieChart, TrendingUp, BarChart3, Lightbulb } from 'lucide-react';
import QuestionListView from './QuestionListView';

interface DashboardProps {
  progress: ProgressMap;
  onStartCategory: (cat: string, type?: QuestionType) => void;
  onStartReview: () => void;
  onReset: () => void;
}

// Helper interface for the active list view
interface ActiveListViewData {
  type: 'mastered' | 'hard' | 'study' | 'search';
  title: string;
  questions: Question[];
}

const CHANGELOG = [
  {
    version: 'v1.4',
    date: '2024-05-25',
    changes: [
      '新增“智能学习报告”：自动分析薄弱分类和短板题型，提供针对性复习建议。',
      '界面优化：调整了仪表盘布局，使学习状态更加直观。'
    ]
  },
  {
    version: 'v1.3',
    date: '2024-05-24',
    changes: [
      '新增全局搜索功能：支持通过关键词快速查找题目。',
      '题库校对：根据最新文档资料，对电气、动火、危化品、辐射防护等题库进行了全面校对，确保题干与选项一字不差。'
    ]
  },
  {
    version: 'v1.2',
    date: '2024-05-23',
    changes: [
      '全面修复题库信息：补全了电气、动火、危化品、辐射防护等章节中被省略号（...）代替的题干与选项，确保内容完整准确。',
      '修正题目逻辑：修复了部分多选题（如“完整的隔离包括”、“防异物控制”等）被错误录入为单选的问题。',
      '优化文本显示：修复了部分选项重复或格式错误的问题。'
    ]
  },
  {
    version: 'v1.1',
    date: '2024-05-22',
    changes: [
      '新增“速记背诵模式”：支持按分类只看未掌握题目，并直接高亮正确答案。',
      '优化答题体验：单选题和判断题选择后自动判断并跳转下一题。',
      '增加分类筛选功能：支持按单选、多选、判断题型进行专项练习。'
    ]
  },
  {
    version: 'v1.0',
    date: '2024-05-20',
    changes: [
      '应用发布：包含电气、动火、危化品等7大类安全考核题库。',
      '核心功能：支持错题自动加入“需攻克”列表，智能复习算法。'
    ]
  }
];

const Dashboard: React.FC<DashboardProps> = ({ progress, onStartCategory, onStartReview, onReset }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeListView, setActiveListView] = useState<ActiveListViewData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = getCategories();
  
  const totalQuestions = QUESTIONS.length;
  const progressValues = Object.values(progress) as UserProgress[];
  
  // 统计逻辑
  const masteredCount = progressValues.filter(p => p.status === 'mastered').length;
  const hardQuestionsCount = progressValues.filter(p => p.status === 'learning').length;
  const newQuestionsCount = totalQuestions - masteredCount - hardQuestionsCount;

  // Search Logic
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return QUESTIONS.filter(q => 
        q.question.toLowerCase().includes(lowerQuery) || 
        q.options?.some(o => o.toLowerCase().includes(lowerQuery))
    );
  }, [searchQuery]);

  // Report Analysis Logic
  const report = useMemo(() => {
    const catStats: Record<string, { total: number, hard: number, mastered: number }> = {};
    const typeStats: Record<string, { total: number, mastered: number }> = {
        'single': { total: 0, mastered: 0 },
        'multiple': { total: 0, mastered: 0 },
        'judgment': { total: 0, mastered: 0 }
    };

    QUESTIONS.forEach(q => {
        const p = progress[q.id];
        const status = p?.status || 'new';

        // Category
        if (!catStats[q.category]) catStats[q.category] = { total: 0, hard: 0, mastered: 0 };
        catStats[q.category].total++;
        if (status === 'learning') catStats[q.category].hard++;
        if (status === 'mastered') catStats[q.category].mastered++;

        // Type
        if (typeStats[q.type]) {
            typeStats[q.type].total++;
            if (status === 'mastered') typeStats[q.type].mastered++;
        }
    });

    // Find Weakest Category (Most Hard Questions, or Lowest Mastery Rate if tied)
    let weakestCat = '';
    let maxHard = -1;
    let minCatRate = 1.1;

    Object.entries(catStats).forEach(([cat, stats]) => {
        const rate = stats.total > 0 ? stats.mastered / stats.total : 0;
        if (stats.hard > maxHard) {
            maxHard = stats.hard;
            weakestCat = cat;
            minCatRate = rate;
        } else if (stats.hard === maxHard) {
            if (rate < minCatRate) {
                minCatRate = rate;
                weakestCat = cat;
            }
        }
    });

    // Find Weakest Type (Lowest Mastery Rate)
    let weakestType = '';
    let minTypeRate = 1.1;
    Object.entries(typeStats).forEach(([type, stats]) => {
        if (stats.total > 0) {
            const rate = stats.mastered / stats.total;
            if (rate < minTypeRate) {
                minTypeRate = rate;
                weakestType = type;
            }
        }
    });

    const typeNameMap: Record<string, string> = { 'single': '单选题', 'multiple': '多选题', 'judgment': '判断题' };

    return {
        weakestCategory: weakestCat,
        weakestCategoryHardCount: maxHard,
        weakestType: typeNameMap[weakestType] || '未知',
        weakestTypeRate: Math.round(minTypeRate * 100),
        overallRate: Math.round((masteredCount / totalQuestions) * 100)
    };
  }, [progress, masteredCount, totalQuestions]);

  const getCategoryStats = (cat: string) => {
      const qs = QUESTIONS.filter(q => q.category === cat);
      return {
          total: qs.length,
          single: qs.filter(q => q.type === 'single').length,
          multiple: qs.filter(q => q.type === 'multiple').length,
          judgment: qs.filter(q => q.type === 'judgment').length,
          mastered: qs.filter(q => progress[q.id]?.status === 'mastered').length
      };
  };

  // Open Mastered List
  const handleOpenMasteredList = () => {
    setActiveListView({
      type: 'mastered',
      title: '已掌握题目列表',
      questions: QUESTIONS.filter(q => progress[q.id]?.status === 'mastered')
    });
  };

  // Open Hard List
  const handleOpenHardList = () => {
    setActiveListView({
      type: 'hard',
      title: '需攻克题目列表',
      questions: QUESTIONS.filter(q => progress[q.id]?.status === 'learning')
    });
  };

  // Open Study Mode (Unmastered for specific category)
  const handleOpenStudyList = (category: string) => {
    // Filter questions: Belong to category AND (status is undefined/new OR status is learning)
    // i.e., status !== 'mastered'
    const unmasteredQuestions = QUESTIONS.filter(q => 
      q.category === category && progress[q.id]?.status !== 'mastered'
    );

    setActiveListView({
      type: 'study',
      title: `${category} - 速记背诵`,
      questions: unmasteredQuestions
    });
    setSelectedCategory(null); // Close the category modal
  };

  // Open Search Results
  const handleOpenSearchResults = () => {
      if (searchResults.length === 0) return;
      setActiveListView({
          type: 'search',
          title: `搜索结果: "${searchQuery}"`,
          questions: searchResults
      });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 relative">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">安全考核记忆大师</h1>
        <p className="text-slate-500">极速刷题模式：点击“下一题”即视为掌握。</p>
      </header>

      {/* Search Bar */}
      <div className="mb-8 relative group z-10">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            <Search className="w-5 h-5" />
        </div>
        <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索题目关键字..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
        />
        {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-2">
                <button 
                    onClick={handleOpenSearchResults}
                    className="w-full flex items-center justify-between p-3 hover:bg-indigo-50 rounded-lg transition-colors group/result"
                >
                    <span className="font-medium text-slate-700">找到 <span className="text-indigo-600 font-bold">{searchResults.length}</span> 个相关题目</span>
                    <span className="text-xs text-indigo-500 font-bold flex items-center gap-1 opacity-0 group-hover/result:opacity-100 transition-opacity">
                        查看详情 <ChevronRight className="w-4 h-4" />
                    </span>
                </button>
            </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
                <BookOpen className="w-5 h-5" />
                <span className="font-semibold text-sm">总题库</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{totalQuestions}</p>
        </div>
        
        {/* Clickable Mastered Card */}
        <button 
            onClick={handleOpenMasteredList}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-green-300 hover:shadow-md transition-all text-left relative group active:scale-95"
        >
            <div className="absolute top-4 right-4 text-slate-300 group-hover:text-green-500 transition-colors">
                <ChevronRight className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold text-sm">已掌握</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{masteredCount}</p>
            <span className="text-xs text-slate-400 mt-1 block">点击查看列表</span>
        </button>

        {/* Clickable Hard Card */}
        <button 
            onClick={handleOpenHardList}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-orange-300 hover:shadow-md transition-all text-left relative group active:scale-95"
        >
            <div className="absolute top-4 right-4 text-slate-300 group-hover:text-orange-500 transition-colors">
                <ChevronRight className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 text-orange-500 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold text-sm">需攻克</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{hardQuestionsCount}</p>
            <span className="text-xs text-slate-400 mt-1 block">点击查看列表</span>
        </button>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
                <Zap className="w-5 h-5" />
                <span className="font-semibold text-sm">新题/待学</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{newQuestionsCount}</p>
        </div>
      </div>

      {/* Main Action */}
      <div className="mb-10">
        <button 
            onClick={onStartReview}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-2xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-4 group"
        >
            <div className="p-3 bg-white/20 rounded-full group-hover:bg-white/30">
                <Zap className="w-8 h-8" fill="currentColor" />
            </div>
            <div className="text-left">
                <h3 className="text-xl font-bold">智能推荐练习</h3>
                <p className="text-indigo-100 text-sm">优先推送：{hardQuestionsCount} 道难题 + 新题</p>
            </div>
        </button>
      </div>

      {/* Categories */}
      <h2 className="text-xl font-bold text-slate-800 mb-4">分类专项突破</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {categories.map(cat => {
            const stats = getCategoryStats(cat);
            const percent = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;
            
            return (
                <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-left group relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="font-semibold text-lg text-slate-700 group-hover:text-indigo-600">{cat}</span>
                        <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-md">{stats.total} 题</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative z-10">
                        <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-right relative z-10">已掌握 {stats.mastered} / {stats.total}</p>
                </button>
            );
        })}
      </div>

      {/* Study Report Section */}
      <div className="mb-12 animate-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-800">智能学习报告</h2>
        </div>
        
        <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
            {masteredCount === 0 && hardQuestionsCount === 0 ? (
                <div className="text-center py-4 text-slate-500">
                    <p className="mb-2">尚未开始学习，暂无分析数据。</p>
                    <button onClick={onStartReview} className="text-indigo-600 font-bold hover:underline">立即开始第一次练习</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Overall Progress */}
                    <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="40" cy="40" r="36" stroke="#e2e8f0" strokeWidth="8" fill="transparent" />
                                <circle cx="40" cy="40" r="36" stroke="#4f46e5" strokeWidth="8" fill="transparent" strokeDasharray={`${2 * Math.PI * 36}`} strokeDashoffset={`${2 * Math.PI * 36 * (1 - report.overallRate / 100)}`} className="transition-all duration-1000 ease-out" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-slate-700">
                                {report.overallRate}%
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-700">整体掌握程度</h3>
                            <p className="text-sm text-slate-500">
                                {report.overallRate < 30 ? '起步阶段，继续加油！' : report.overallRate < 80 ? '稳步提升中！' : '表现优秀，保持状态！'}
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-slate-200 md:hidden"></div>

                    {/* Weakness Analysis */}
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-50 rounded-lg text-red-500 mt-0.5">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase">攻坚重点 (错题最多)</div>
                                <div className="font-bold text-slate-800">{report.weakestCategory || '暂无'}</div>
                                {report.weakestCategoryHardCount > 0 && (
                                    <div className="text-xs text-red-500 font-medium">包含 {report.weakestCategoryHardCount} 道待攻克题目</div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-50 rounded-lg text-amber-500 mt-0.5">
                                <BarChart3 className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase">短板题型 (掌握率最低)</div>
                                <div className="font-bold text-slate-800">{report.weakestType}</div>
                                <div className="text-xs text-slate-500">当前掌握率: {report.weakestTypeRate}%</div>
                            </div>
                        </div>
                    </div>

                    {/* Suggestion */}
                    <div className="md:col-span-2 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 items-start mt-2">
                        <Lightbulb className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-indigo-900 text-sm">AI 学习建议</h4>
                            <p className="text-sm text-indigo-700 mt-1">
                                {report.weakestCategoryHardCount > 0 
                                    ? `建议优先点击上方的“需攻克”列表，重点复习 ${report.weakestCategory} 中的错题。`
                                    : `建议针对 ${report.weakestCategory} 分类下的 ${report.weakestType} 进行专项强化练习。`
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Footer Actions & Changelog */}
      <div className="mt-16 pt-10 border-t border-slate-200">
          <div className="text-center mb-10">
              <button onClick={onReset} className="text-sm text-slate-400 hover:text-red-500 underline decoration-red-200 transition-colors">
                  重置所有学习进度
              </button>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6 text-slate-400">
                <History className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">更新日志</span>
            </div>
            
            <div className="space-y-8 pl-2 sm:pl-0">
              {CHANGELOG.map((log, index) => (
                <div key={index} className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 last:border-0 last:pb-0 pb-1">
                  <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-slate-50 ${index === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                  <div className="flex items-baseline gap-2 mb-2">
                      <span className={`text-sm font-bold ${index === 0 ? 'text-indigo-600' : 'text-slate-600'}`}>{log.version}</span>
                      <span className="text-xs text-slate-400 font-mono">{log.date}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {log.changes.map((change, i) => (
                      <li key={i} className="text-xs text-slate-500 leading-relaxed flex gap-2">
                        <span className="block w-1 h-1 bg-slate-300 rounded-full mt-1.5 flex-shrink-0" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="text-center mt-8 text-[10px] text-slate-300">
                &copy; 2024 安全考核记忆大师
            </div>
          </div>
      </div>

      {/* Category Selection Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-slate-50 p-6 flex justify-between items-center border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800">{selectedCategory}</h3>
                    <button 
                        onClick={() => setSelectedCategory(null)}
                        className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 grid gap-4">
                    {/* NEW FEATURE: Study Mode Button */}
                    <button
                        onClick={() => handleOpenStudyList(selectedCategory)}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all group mb-2"
                    >
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Eye className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <span className="font-bold text-lg block">速记背诵模式</span>
                                <span className="text-indigo-100 text-xs">只看未掌握 / 答案高亮</span>
                            </div>
                        </div>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                            {getCategoryStats(selectedCategory).total - getCategoryStats(selectedCategory).mastered} 题
                        </span>
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-300 text-xs">或者开始练习</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>
                    
                    <button 
                        onClick={() => onStartCategory(selectedCategory)}
                        className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                                <ListFilter className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-slate-700">全部题型练习</span>
                        </div>
                        <span className="text-slate-400 font-medium text-sm">{getCategoryStats(selectedCategory).total} 题</span>
                    </button>

                    <div className="grid grid-cols-3 gap-3">
                        <button 
                            onClick={() => onStartCategory(selectedCategory, 'single')}
                            disabled={getCategoryStats(selectedCategory).single === 0}
                            className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-slate-100 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            <span className="text-sm font-bold text-slate-700">单选题</span>
                            <span className="text-xs text-slate-400">{getCategoryStats(selectedCategory).single} 题</span>
                        </button>

                        <button 
                            onClick={() => onStartCategory(selectedCategory, 'multiple')}
                            disabled={getCategoryStats(selectedCategory).multiple === 0}
                            className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-slate-100 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckSquare className="w-6 h-6 text-blue-500" />
                            <span className="text-sm font-bold text-slate-700">多选题</span>
                            <span className="text-xs text-slate-400">{getCategoryStats(selectedCategory).multiple} 题</span>
                        </button>

                        <button 
                            onClick={() => onStartCategory(selectedCategory, 'judgment')}
                            disabled={getCategoryStats(selectedCategory).judgment === 0}
                            className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-slate-100 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <HelpCircle className="w-6 h-6 text-orange-500" />
                            <span className="text-sm font-bold text-slate-700">判断题</span>
                            <span className="text-xs text-slate-400">{getCategoryStats(selectedCategory).judgment} 题</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* List View Modal */}
      {activeListView && (
          <QuestionListView 
              title={activeListView.title}
              type={activeListView.type}
              questions={activeListView.questions}
              onClose={() => setActiveListView(null)}
          />
      )}
    </div>
  );
};

export default Dashboard;