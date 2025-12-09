import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, HelpCircle, Eye, ArrowRight, BookOpen } from 'lucide-react';
import { Question } from '../types';

interface FlashcardProps {
  question: Question;
  onResult: (difficulty: 'easy' | 'hard') => void;
  onNext: () => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ question, onResult, onNext }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  // 当题目切换时重置状态
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
        // 正确答案：高亮、放大、绿色背景
        return 'bg-green-100 border-green-500 ring-4 ring-green-100 z-10 transform scale-105 shadow-xl';
      }
      // 其他答案：淡化、透明度降低
      return 'bg-gray-50 border-gray-100 text-gray-300 opacity-40 scale-95';
    }
    // 默认状态
    return 'bg-white border-gray-200 text-gray-700 hover:border-indigo-200 hover:bg-slate-50';
  };

  const getTextStyle = (optKey: string) => {
      if (showAnswer && isCorrect(optKey)) {
          return 'text-green-800 font-bold text-2xl'; // 正确答案文字变大
      }
      return 'text-lg';
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col min-h-[600px]">
      <div className="relative flex-grow w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* 顶部信息栏 */}
        <div className="bg-slate-50 px-8 py-5 flex justify-between items-center border-b border-slate-100">
           <div className="flex items-center gap-3">
               <span className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm font-bold shadow-sm">
                    {question.category}
               </span>
               <span className="text-sm text-slate-500 font-medium">
                   ID: {question.id}
               </span>
           </div>
           <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
               {question.type === 'single' ? '单选题' : question.type === 'multiple' ? '多选题' : '判断题'}
           </span>
        </div>

        {/* 核心内容区 */}
        <div className="flex-grow p-8 overflow-y-auto">
            
            {/* 1. 题目 */}
            <h2 className="text-3xl font-extrabold text-slate-800 leading-normal mb-10 tracking-tight">
              {question.question}
            </h2>

            {/* 2. 选项区域 */}
            <div className="space-y-4">
                {question.type === 'judgment' ? (
                     <div className="flex gap-6 mt-8">
                        {/* 判断题 - 正确选项 */}
                        <div className={`flex-1 py-8 text-center rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2
                            ${showAnswer ? (question.answer === '√' ? 'bg-green-100 border-green-500 scale-105 shadow-xl' : 'opacity-30 grayscale') : 'bg-white border-gray-200'}
                        `}>
                            <span className={`text-4xl font-bold ${showAnswer && question.answer === '√' ? 'text-green-600' : 'text-gray-400'}`}>√</span>
                            <span className="text-sm font-bold text-gray-500 uppercase">正确</span>
                        </div>

                        {/* 判断题 - 错误选项 */}
                        <div className={`flex-1 py-8 text-center rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2
                            ${showAnswer ? (question.answer === '×' ? 'bg-green-100 border-green-500 scale-105 shadow-xl' : 'opacity-30 grayscale') : 'bg-white border-gray-200'}
                        `}>
                            <span className={`text-4xl font-bold ${showAnswer && question.answer === '×' ? 'text-green-600' : 'text-gray-400'}`}>×</span>
                            <span className="text-sm font-bold text-gray-500 uppercase">错误</span>
                        </div>
                     </div>
                ) : (
                    // 选择题选项
                    question.options?.map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        return (
                            <div 
                                key={idx} 
                                className={`p-6 rounded-2xl border-2 flex items-center gap-5 transition-all duration-300 ${getOptionStyle(letter)}`}
                            >
                                <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full text-xl font-bold transition-colors
                                    ${showAnswer && isCorrect(letter) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}
                                `}>
                                    {letter}
                                </div>
                                <span className={`${getTextStyle(letter)} transition-all duration-300 leading-relaxed`}>
                                    {opt}
                                </span>
                                {showAnswer && isCorrect(letter) && (
                                    <CheckCircle className="ml-auto w-8 h-8 text-green-600 flex-shrink-0" />
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {/* 3. 解析区域 (仅显示答案时出现) */}
            <AnimatePresence>
                {showAnswer && question.explanation && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="mt-10 p-6 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl shadow-sm"
                    >
                        <div className="flex items-center gap-2 text-amber-800 font-black text-sm uppercase mb-3 tracking-wider">
                            <BookOpen className="w-4 h-4" />
                            <span>专家解析</span>
                        </div>
                        <p className="text-amber-900 text-lg leading-relaxed font-medium">
                            {question.explanation}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 底部留白 */}
            <div className="h-32"></div>
        </div>

        {/* 底部操作栏 (固定悬浮) */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-xl border-t border-slate-100 z-50">
            {!showAnswer ? (
                <button 
                    onClick={() => setShowAnswer(true)}
                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                    <Eye className="w-6 h-6" />
                    查看正确答案
                </button>
            ) : (
                <div className="flex gap-4">
                    <button
                        onClick={() => onResult('hard')}
                        className="flex-1 py-4 bg-orange-100 text-orange-700 border-2 border-orange-200 rounded-xl font-bold text-lg hover:bg-orange-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <HelpCircle className="w-6 h-6" />
                        没记住 / 较难
                    </button>
                    <button
                        onClick={() => onResult('easy')}
                        className="flex-[2] py-4 bg-indigo-600 text-white border-2 border-indigo-600 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="mr-1">下一题</span>
                        <ArrowRight className="w-6 h-6" />
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Flashcard;