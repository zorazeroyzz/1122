import React, { useMemo } from 'react';
import { X, CheckCircle, BookOpen, AlertTriangle } from 'lucide-react';
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

  // Helper to check if option key is correct
  const isCorrect = (q: Question, key: string) => {
    if (Array.isArray(q.answer)) {
      return q.answer.includes(key);
    }
    return q.answer === key;
  };

  return (
    <div className="fixed inset-0 bg-slate-100 z-[100] flex flex-col animate-in slide-in-from-bottom-10 duration-200">
      {/* Header */}
      <div className={`px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0 ${type === 'mastered' ? 'bg-green-600' : 'bg-orange-500'}`}>
        <div className="flex items-center gap-3 text-white">
          {type === 'mastered' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-xs opacity-90">共 {questions.length} 题</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
            <BookOpen className="w-16 h-16 opacity-20" />
            <p>暂无相关题目</p>
          </div>
        ) : (
          categories.map(category => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2 px-2 sticky top-0 bg-slate-100/95 backdrop-blur py-2 z-10 border-b border-slate-200">
                <span className={`w-2 h-6 rounded-full ${type === 'mastered' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                <h3 className="font-bold text-slate-700">{category}</h3>
                <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                  {groupedQuestions[category].length}
                </span>
              </div>

              {groupedQuestions[category].map((q, idx) => (
                <div key={q.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                  <div className="flex gap-2 mb-3">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                       {q.type === 'single' ? '单选' : q.type === 'multiple' ? '多选' : '判断'}
                    </span>
                  </div>
                  
                  <h4 className="font-bold text-slate-800 mb-4 leading-relaxed">
                    {idx + 1}. {q.question}
                  </h4>

                  {/* Options Display */}
                  <div className="space-y-2">
                    {q.type === 'judgment' ? (
                      <div className="flex gap-4 mt-2">
                         <div className={`flex-1 p-3 rounded-lg border text-center font-bold flex items-center justify-center gap-2
                           ${q.answer === '√' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-50'}
                         `}>
                            <span>√</span> 正确
                         </div>
                         <div className={`flex-1 p-3 rounded-lg border text-center font-bold flex items-center justify-center gap-2
                           ${q.answer === '×' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-50'}
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
                            className={`p-3 rounded-lg border flex items-start gap-3 text-sm
                              ${correct 
                                ? 'bg-green-50 border-green-500 text-green-900 ring-1 ring-green-500' 
                                : 'bg-white border-slate-100 text-slate-500'}
                            `}
                          >
                            <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
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
                  
                  {/* Explanation Preview (Simple) */}
                  {q.explanation && (
                      <div className="mt-4 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                          <span className="font-bold mr-1">解析:</span> {q.explanation}
                      </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuestionListView;