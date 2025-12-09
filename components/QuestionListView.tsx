import React, { useMemo, useState } from 'react';
import { X, CheckCircle, BookOpen, AlertTriangle, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { Question } from '../types';

interface QuestionListViewProps {
  title: string;
  type: 'mastered' | 'hard';
  questions: Question[];
  onClose: () => void;
}

const QuestionListView: React.FC<QuestionListViewProps> = ({ title, type, questions, onClose }) => {
  // Group questions by category
  const groupedQuestions = useMemo(() => {
    const groups: { [key: string]: Question[] } = {};
    questions.forEach(q => {
      if (!groups[q.category]) {
        groups[q.category] = [];
      }
      groups[q.category].push(q);
    });
    return groups;
  }, [questions]);

  const categories = Object.keys(groupedQuestions);
  
  // State to track collapsed categories
  const [collapsedCats, setCollapsedCats] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    setCollapsedCats(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Helper to check if option key is correct
  const isCorrect = (q: Question, key: string) => {
    if (Array.isArray(q.answer)) {
      return q.answer.includes(key);
    }
    return q.answer === key;
  };

  const getTypeBadgeStyle = (qType: string) => {
      switch(qType) {
          case 'single': return 'bg-blue-50 text-blue-600 border-blue-200';
          case 'multiple': return 'bg-purple-50 text-purple-600 border-purple-200';
          case 'judgment': return 'bg-orange-50 text-orange-600 border-orange-200';
          default: return 'bg-slate-50 text-slate-600 border-slate-200';
      }
  };

  const getTypeName = (qType: string) => {
      switch(qType) {
          case 'single': return '单选';
          case 'multiple': return '多选';
          case 'judgment': return '判断';
          default: return '未知';
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-100 z-[100] flex flex-col animate-in slide-in-from-bottom-10 duration-200">
      {/* Header */}
      <div className={`px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between shadow-md flex-shrink-0 ${type === 'mastered' ? 'bg-green-600' : 'bg-orange-500'}`}>
        <div className="flex items-center gap-3 text-white">
          {type === 'mastered' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          <div>
            <h2 className="text-lg sm:text-xl font-bold">{title}</h2>
            <p className="text-xs opacity-90 font-medium">共 {questions.length} 题</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors active:scale-95"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-4">
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
            <BookOpen className="w-16 h-16 opacity-20" />
            <p>暂无相关题目</p>
          </div>
        ) : (
          categories.map(category => {
            const isCollapsed = collapsedCats.includes(category);
            const catQuestions = groupedQuestions[category];
            
            return (
                <div key={category} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200">
                    {/* Collapsible Header */}
                    <button 
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 transition-colors border-b border-slate-100"
                    >
                        <div className="flex items-center gap-3">
                            {isCollapsed ? <ChevronRight className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                            <h3 className="font-bold text-slate-700 text-base">{category}</h3>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${type === 'mastered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                           {catQuestions.length}
                        </span>
                    </button>

                    {/* Questions List */}
                    {!isCollapsed && (
                        <div className="p-3 sm:p-4 bg-slate-50/50 space-y-4">
                             {catQuestions.map((q, idx) => (
                                <div key={q.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                                    {/* Question Header: Type + Text */}
                                    <div className="flex items-start gap-2 mb-3">
                                        <span className={`flex-shrink-0 text-[10px] sm:text-xs px-1.5 py-0.5 rounded border font-bold mt-0.5 ${getTypeBadgeStyle(q.type)}`}>
                                           {getTypeName(q.type)}
                                        </span>
                                        <h4 className="font-medium text-slate-800 text-sm sm:text-base leading-relaxed">
                                            <span className="text-slate-400 mr-1 text-xs">#{idx + 1}</span>
                                            {q.question}
                                        </h4>
                                    </div>

                                    {/* Options Display */}
                                    <div className="space-y-2 pl-1">
                                        {q.type === 'judgment' ? (
                                        <div className="flex gap-3 mt-2">
                                            <div className={`flex-1 p-2 rounded-lg border text-center text-sm font-bold flex items-center justify-center gap-2
                                            ${q.answer === '√' ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-50'}
                                            `}>
                                                <span>√</span> 正确
                                            </div>
                                            <div className={`flex-1 p-2 rounded-lg border text-center text-sm font-bold flex items-center justify-center gap-2
                                            ${q.answer === '×' ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-50'}
                                            `}>
                                                <span>×</span> 错误
                                            </div>
                                        </div>
                                        ) : (
                                        q.options?.map((opt, optIdx) => {
                                            const key = String.fromCharCode(65 + optIdx);
                                            const correct = isCorrect(q, key);
                                            return (
                                            <div 
                                                key={key}
                                                className={`p-2.5 rounded-lg border flex items-start gap-3 text-sm
                                                ${correct 
                                                    ? 'bg-green-50 border-green-500 text-green-900 ring-1 ring-green-500 shadow-sm' 
                                                    : 'bg-white border-slate-100 text-slate-500'}
                                                `}
                                            >
                                                <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold mt-0.5
                                                ${correct ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-400'}
                                                `}>
                                                {key}
                                                </span>
                                                <span className={correct ? 'font-bold' : ''}>{opt}</span>
                                                {correct && <CheckCircle className="w-4 h-4 text-green-600 ml-auto flex-shrink-0" />}
                                            </div>
                                            );
                                        })
                                        )}
                                    </div>
                                    
                                    {/* Explanation Preview */}
                                    {q.explanation && (
                                        <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 p-2.5 rounded-lg flex items-start gap-2">
                                            <BookOpen className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" />
                                            <div><span className="font-bold">解析:</span> {q.explanation}</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default QuestionListView;