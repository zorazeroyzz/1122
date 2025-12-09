import React, { useState } from 'react';
import { QUESTIONS, getCategories } from '../services/questions';
import { ProgressMap, UserProgress, QuestionType } from '../types';
import { BookOpen, AlertTriangle, CheckCircle, Zap, X, ListFilter, CheckSquare, HelpCircle, ChevronRight } from 'lucide-react';
import QuestionListView from './QuestionListView';

interface DashboardProps {
  progress: ProgressMap;
  onStartCategory: (cat: string, type?: QuestionType) => void;
  onStartReview: () => void;
  onReset: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ progress, onStartCategory, onStartReview, onReset }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewListType, setViewListType] = useState<'mastered' | 'hard' | null>(null);
  
  const categories = getCategories();
  
  const totalQuestions = QUESTIONS.length;
  const progressValues = Object.values(progress) as UserProgress[];
  
  // 统计逻辑
  const masteredCount = progressValues.filter(p => p.status === 'mastered').length;
  const hardQuestionsCount = progressValues.filter(p => p.status === 'learning').length;
  const newQuestionsCount = totalQuestions - masteredCount - hardQuestionsCount;

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

  // 获取查看列表的题目数据
  const getListQuestions = () => {
      if (viewListType === 'mastered') {
          return QUESTIONS.filter(q => progress[q.id]?.status === 'mastered');
      }
      if (viewListType === 'hard') {
          return QUESTIONS.filter(q => progress[q.id]?.status === 'learning');
      }
      return [];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 relative">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">安全考核记忆大师</h1>
        <p className="text-slate-500">极速刷题模式：点击“下一题”即视为掌握。</p>
      </header>

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
            onClick={() => setViewListType('mastered')}
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
            onClick={() => setViewListType('hard')}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="mt-12 text-center pb-8">
          <button onClick={onReset} className="text-sm text-slate-400 hover:text-red-500 underline decoration-red-200">重置所有进度</button>
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
                    <p className="text-sm text-slate-500 mb-2">请选择要练习的题型：</p>
                    
                    <button 
                        onClick={() => onStartCategory(selectedCategory)}
                        className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-200 text-indigo-700 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <ListFilter className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-indigo-900">全部题型</span>
                        </div>
                        <span className="text-indigo-600 font-bold">{getCategoryStats(selectedCategory).total} 题</span>
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
      {viewListType && (
          <QuestionListView 
              title={viewListType === 'mastered' ? '已掌握题目列表' : '需攻克题目列表'}
              type={viewListType}
              questions={getListQuestions()}
              onClose={() => setViewListType(null)}
          />
      )}
    </div>
  );
};

export default Dashboard;