import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, BookOpen, AlertCircle, ArrowLeft } from 'lucide-react';
import { Question } from '../types';

interface FlashcardProps {
  question: Question;
  onResult: (difficulty: 'easy' | 'hard') => void;
  onNext: () => void;
  onPrev?: () => void;
  hasPrev?: boolean;
}

const Flashcard: React.FC<FlashcardProps> = ({ question, onResult, onPrev, hasPrev }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Motion values for swipe effect
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);
  const rotate = useTransform(x, [-200, 200], [-5, 5]);

  useEffect(() => {
    // Reset state when question changes
    setSelected([]);
    setIsSubmitted(false);
    x.set(0); // Reset position
  }, [question.id, x]);

  // Check correctness helper
  const checkAnswer = (userSelection: string[]) => {
    if (Array.isArray(question.answer)) {
      // Multiple choice check
      if (userSelection.length !== question.answer.length) return false;
      const sortedUser = [...userSelection].sort();
      const sortedAns = [...question.answer].sort();
      return sortedUser.every((val, index) => val === sortedAns[index]);
    } else {
      // Single choice check
      return userSelection.length === 1 && userSelection[0] === question.answer;
    }
  };

  const isCorrect = isSubmitted && checkAnswer(selected);

  const handleSelect = (key: string) => {
    if (isSubmitted) return;

    if (question.type === 'multiple') {
      setSelected(prev => 
        prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      );
    } else {
      // Single or Judgment: Select and auto-submit
      setSelected([key]);
      setIsSubmitted(true);
    }
  };

  const handleSubmitMultiple = () => {
    if (selected.length === 0) return;
    setIsSubmitted(true);
  };

  const handleNext = () => {
    onResult(isCorrect ? 'easy' : 'hard');
  };

  // Helper styles
  const getOptionStyle = (optKey: string) => {
    const isSelected = selected.includes(optKey);
    const isAns = Array.isArray(question.answer) 
        ? question.answer.includes(optKey) 
        : question.answer === optKey;

    if (isSubmitted) {
        if (isAns) return 'bg-green-50 border-green-500 ring-1 ring-green-500 z-10'; // Correct answer always green
        if (isSelected && !isAns) return 'bg-red-50 border-red-500 ring-1 ring-red-500 z-10'; // Wrong selection red
        return 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'; // Irrelevant options dimmed
    }
    
    // Normal interaction state
    if (isSelected) return 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 z-10 text-indigo-700';
    return 'bg-white border-slate-200 text-slate-700 active:bg-slate-50';
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-full">
      <motion.div 
        style={{ x, opacity, rotate, touchAction: 'pan-y' }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragDirectionLock
        onDragEnd={(e, { offset, velocity }) => {
          const swipeThreshold = 50;
          if (offset.x > swipeThreshold && hasPrev && onPrev) {
             onPrev();
          } else if (offset.x < -swipeThreshold && isSubmitted) {
             handleNext();
          }
        }}
        className="relative flex-grow w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col"
      >
        
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
            
            {/* Question */}
            <h2 className="text-lg font-bold text-slate-800 leading-snug mb-4 select-none">
              {question.question}
            </h2>

            {/* Options Area */}
            <div className="space-y-2 pb-24">
                {question.type === 'judgment' ? (
                     <div className="flex gap-3 mt-2">
                        {['√', '×'].map((opt) => (
                             <button 
                                key={opt}
                                disabled={isSubmitted}
                                onClick={() => handleSelect(opt)}
                                className={`flex-1 py-4 text-center rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 relative overflow-hidden select-none
                                    ${getOptionStyle(opt)}
                                `}
                            >
                                <span className={`text-2xl font-bold ${opt === '√' ? 'text-green-600' : 'text-red-500'}`}>{opt}</span>
                                <span className="text-xs font-bold text-slate-500">{opt === '√' ? '正确' : '错误'}</span>
                                {isSubmitted && selected.includes(opt) && (
                                    <div className="absolute right-2 top-2">
                                        {(Array.isArray(question.answer) ? question.answer.includes(opt) : question.answer === opt) 
                                            ? <CheckCircle className="w-5 h-5 text-green-500" />
                                            : <XCircle className="w-5 h-5 text-red-500" />
                                        }
                                    </div>
                                )}
                            </button>
                        ))}
                     </div>
                ) : (
                    question.options?.map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        const isSelected = selected.includes(letter);
                        const isAns = Array.isArray(question.answer) ? question.answer.includes(letter) : question.answer === letter;
                        
                        return (
                            <button 
                                key={idx}
                                disabled={isSubmitted} 
                                onClick={() => handleSelect(letter)}
                                className={`w-full p-3 rounded-lg border-2 flex items-start gap-3 transition-all text-sm leading-relaxed text-left relative select-none
                                    ${getOptionStyle(letter)}
                                `}
                            >
                                <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mt-0.5 transition-colors
                                    ${isSubmitted 
                                        ? (isAns ? 'bg-green-600 text-white' : (isSelected ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'))
                                        : (isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500')
                                    }
                                `}>
                                    {letter}
                                </div>
                                <span className={`flex-grow ${isSubmitted && isAns ? 'font-bold text-green-800' : ''}`}>
                                    {opt}
                                </span>
                                
                                {isSubmitted && isAns && (
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                )}
                                {isSubmitted && isSelected && !isAns && (
                                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                )}
                            </button>
                        )
                    })
                )}
            
                {/* Result Feedback & Explanation */}
                <AnimatePresence>
                    {isSubmitted && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt-6 p-4 rounded-xl border-l-4 shadow-sm ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}
                        >
                            <div className="flex items-center gap-2 font-bold mb-2">
                                {isCorrect ? (
                                    <>
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="text-green-800">回答正确！</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                        <span className="text-red-800">回答错误，已加入“需攻克”列表</span>
                                    </>
                                )}
                            </div>
                            
                            {!isCorrect && (
                                <div className="mb-2 text-sm">
                                    <span className="font-bold text-slate-700">正确答案：</span>
                                    <span className="font-bold text-green-600 ml-1">
                                        {Array.isArray(question.answer) ? question.answer.join('、') : question.answer}
                                    </span>
                                </div>
                            )}

                            {question.explanation && (
                                <div className="mt-2 pt-2 border-t border-black/5 text-sm">
                                    <div className="flex items-center gap-1 font-bold text-slate-700 mb-1 text-xs">
                                        <BookOpen className="w-3 h-3" />
                                        专家解析
                                    </div>
                                    <p className="text-slate-600 leading-relaxed">{question.explanation}</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur border-t border-slate-100 z-20 shadow-[-1px_-4px_20px_rgba(0,0,0,0.05)] flex gap-2">
            
            {hasPrev && (
                <button
                    onClick={onPrev}
                    className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    title="上一题"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
            )}

            {!isSubmitted ? (
                question.type === 'multiple' ? (
                     <button 
                        onClick={handleSubmitMultiple}
                        disabled={selected.length === 0}
                        className="flex-grow py-3 bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-indigo-700 text-white rounded-xl font-bold text-base shadow-md active:scale-[0.98] transition-all"
                    >
                        确认提交
                    </button>
                ) : (
                    <div className="flex-grow text-center text-xs text-slate-400 py-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        点击选项直接提交 / 向右滑动返回
                    </div>
                )
            ) : (
                <button 
                    onClick={handleNext}
                    className={`flex-grow py-3 text-white rounded-xl font-bold text-base shadow-md active:scale-[0.98] flex items-center justify-center gap-2 transition-transform ${isCorrect ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                    {isCorrect ? '太棒了，下一题' : '记住了，下一题'}
                    <ArrowRight className="w-5 h-5" />
                </button>
            )}
        </div>
      </motion.div>
    </div>
  );
};

export default Flashcard;