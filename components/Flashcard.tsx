import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Eye, ArrowRight, HelpCircle, BookOpen } from 'lucide-react';
import { Question } from '../types';

interface FlashcardProps {
  question: Question;
  onResult: (difficulty: 'easy' | 'hard') => void;
  onNext: () => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ question, onResult, onNext }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    setShowAnswer(false);
  }, [question.id]);

  const isCorrect = (optKey: string) => {
    if (Array.isArray(question.answer)) {
      return question.answer.includes(optKey);
    }
    return question.answer === optKey;
  };

  const getOptionStyle = (optKey: string) => {
    if (showAnswer) {
      if (isCorrect(optKey)) {
        return 'bg-green-50 border-green-500 ring-1 ring-green-500 z-10';
      }
      return 'bg-slate-50 border-slate-100 text-slate-400 opacity-60';
    }
    return 'bg-white border-slate-200 text-slate-700 active:bg-slate-50';
  };

  const getTextStyle = (optKey: string) => {
      if (showAnswer && isCorrect(optKey)) {
          return 'text-green-800 font-bold';
      }
      return '';
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-full">
      <div className="relative flex-grow w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Compact Header */}
        <div className="bg-slate-50 px-3 py-2 flex justify-between items-center border-b border-slate-100 flex-shrink-0">
           <div className="flex items-center gap-2">
               <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold whitespace-nowrap">
                    {question.category}
               </span>
               <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
                   #{question.id}
               </span>
           </div>
           <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
               {question.type === 'single' ? '单选' : question.type === 'multiple' ? '多选' : '判断'}
           </span>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-4 scroll-smooth overscroll-contain">
            
            {/* Question - Reduced size for mobile */}
            <h2 className="text-lg font-bold text-slate-800 leading-snug mb-4">
              {question.question}
            </h2>

            {/* Options */}
            <div className="space-y-2 pb-24">
                {question.type === 'judgment' ? (
                     <div className="flex gap-3 mt-2">
                        <button 
                            disabled={showAnswer}
                            onClick={() => {}} // Usually options in judgment aren't clicked to select, but here just visual
                            className={`flex-1 py-4 text-center rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1
                            ${showAnswer ? (question.answer === '√' ? 'bg-green-100 border-green-500' : 'opacity-40 border-slate-100 bg-slate-50') : 'bg-white border-slate-200'}
                        `}>
                            <span className={`text-2xl font-bold ${showAnswer && question.answer === '√' ? 'text-green-600' : 'text-slate-400'}`}>√</span>
                            <span className="text-xs font-bold text-slate-500">正确</span>
                        </button>

                        <button 
                             disabled={showAnswer}
                            className={`flex-1 py-4 text-center rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1
                            ${showAnswer ? (question.answer === '×' ? 'bg-green-100 border-green-500' : 'opacity-40 border-slate-100 bg-slate-50') : 'bg-white border-slate-200'}
                        `}>
                            <span className={`text-2xl font-bold ${showAnswer && question.answer === '×' ? 'text-green-600' : 'text-slate-400'}`}>×</span>
                            <span className="text-xs font-bold text-slate-500">错误</span>
                        </button>
                     </div>
                ) : (
                    question.options?.map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        return (
                            <div 
                                key={idx} 
                                className={`p-3 rounded-lg border-2 flex items-start gap-3 transition-all text-sm leading-relaxed ${getOptionStyle(letter)}`}
                            >
                                <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mt-0.5
                                    ${showAnswer && isCorrect(letter) ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'}
                                `}>
                                    {letter}
                                </div>
                                <span className={`flex-grow ${getTextStyle(letter)}`}>
                                    {opt}
                                </span>
                                {showAnswer && isCorrect(letter) && (
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                )}
                            </div>
                        )
                    })
                )}
            
                {/* Explanation */}
                <AnimatePresence>
                    {showAnswer && question.explanation && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900"
                        >
                            <div className="flex items-center gap-1 font-bold text-amber-700 mb-1 text-xs">
                                <BookOpen className="w-3 h-3" />
                                专家解析
                            </div>
                            {question.explanation}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* Compact Bottom Bar - Absolute Positioned */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur border-t border-slate-100 z-20 shadow-[-1px_-4px_20px_rgba(0,0,0,0.05)]">
            {!showAnswer ? (
                <button 
                    onClick={() => setShowAnswer(true)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-base shadow-md active:scale-[0.98] flex items-center justify-center gap-2 transition-transform"
                >
                    <Eye className="w-5 h-5" />
                    显示答案
                </button>
            ) : (
                <div className="flex gap-3">
                    <button
                        onClick={() => onResult('hard')}
                        className="flex-1 py-3 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl font-bold text-sm active:bg-orange-100 flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <HelpCircle className="w-4 h-4" />
                        需攻克
                    </button>
                    <button
                        onClick={() => onResult('easy')}
                        className="flex-[2] py-3 bg-indigo-600 text-white border border-indigo-600 rounded-xl font-bold text-base shadow-md active:bg-indigo-700 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                    >
                        下一题
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Flashcard;