import React, { useState, useMemo, useEffect } from 'react';
import { QUESTIONS } from './services/questions';
import { useProgress } from './hooks/useProgress';
import { StudyMode, QuestionType } from './types';
import Dashboard from './components/Dashboard';
import Flashcard from './components/Flashcard';
import { ArrowLeft, Save } from 'lucide-react';

const SESSION_KEY = 'safety_exam_session_v2';

interface SessionState {
  mode: StudyMode;
  queue: string[];
  index: number;
}

function App() {
  const { progress, updateProgress, resetProgress, loading } = useProgress();
  
  // Initialize state from local storage if available (Session Persistence)
  const [sessionData, setSessionData] = useState<SessionState>(() => {
    try {
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error("Failed to load session", e);
    }
    return {
        mode: StudyMode.DASHBOARD,
        queue: [],
        index: 0
    };
  });

  const [mode, setMode] = useState<StudyMode>(sessionData.mode);
  const [currentQueue, setCurrentQueue] = useState<string[]>(sessionData.queue);
  const [currentIndex, setCurrentIndex] = useState(sessionData.index);

  // Auto-save session whenever relevant state changes
  useEffect(() => {
    const stateToSave: SessionState = {
        mode,
        queue: currentQueue,
        index: currentIndex
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(stateToSave));
  }, [mode, currentQueue, currentIndex]);

  // Clear session when returning to dashboard manually
  const exitSession = () => {
      setMode(StudyMode.DASHBOARD);
      setCurrentQueue([]);
      setCurrentIndex(0);
      localStorage.removeItem(SESSION_KEY);
  };

  // Filter questions logic
  const startSession = (category?: string, type?: QuestionType) => {
    let candidates = QUESTIONS;

    // Filter by Category
    if (category) {
        candidates = candidates.filter(q => q.category === category);
    }

    // Filter by Type (New Feature)
    if (type) {
        candidates = candidates.filter(q => q.type === type);
    }

    let queue: string[] = [];

    if (category) {
        // Category mode: Sort by status (New > Learning > Mastered)
        queue = candidates
            .sort((a, b) => {
                const statusA = progress[a.id]?.status || 'new';
                const statusB = progress[b.id]?.status || 'new';
                
                // Priority: New/Learning first, Mastered last
                const score = (s: string) => s === 'mastered' ? 1 : 0;
                return score(statusA) - score(statusB) || (0.5 - Math.random());
            })
            .map(q => q.id);
    } else {
        // Smart Review: Prioritize Hard > Learning > New > Mastered
        queue = candidates
            .sort((a, b) => {
                const pA = progress[a.id];
                const pB = progress[b.id];
                
                // Weight: Hard(4) > New(3) > Learning(2) > Mastered(0)
                const getWeight = (id: string) => {
                    const p = progress[id];
                    if (!p) return 3; // New
                    if (p.difficultyScore > 2) return 4; // Hard
                    if (p.status === 'learning') return 2;
                    return 0;
                };

                return getWeight(b.id) - getWeight(a.id) || (0.5 - Math.random());
            })
            .slice(0, 30) // Batch size
            .map(q => q.id);
    }

    if (queue.length === 0) {
        alert("没有找到符合条件的题目！");
        return;
    }

    setCurrentQueue(queue);
    setCurrentIndex(0);
    setMode(StudyMode.STUDY);
  };

  const handleCardResult = (difficulty: 'easy' | 'hard') => {
    const currentQId = currentQueue[currentIndex];
    updateProgress(currentQId, difficulty);
    
    // Immediate navigation
    if (currentIndex < currentQueue.length - 1) {
        setCurrentIndex(prev => prev + 1);
    } else {
        alert("本次练习完成！");
        exitSession();
    }
  };

  const currentQuestion = useMemo(() => {
      if (mode !== StudyMode.STUDY) return null;
      return QUESTIONS.find(q => q.id === currentQueue[currentIndex]);
  }, [mode, currentQueue, currentIndex]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">加载数据中...</div>;

  return (
    // 使用 h-[100dvh] 确保在移动浏览器（如 Safari）中高度正确，避免地址栏跳动
    <div className="h-[100dvh] bg-slate-100 text-slate-800 font-sans overflow-hidden flex flex-col">
      {mode === StudyMode.DASHBOARD && (
        <div className="flex-grow overflow-y-auto">
            <Dashboard 
                progress={progress} 
                onStartCategory={startSession}
                onStartReview={() => startSession()}
                onReset={resetProgress}
            />
        </div>
      )}

      {mode === StudyMode.STUDY && currentQuestion && (
        <div className="flex flex-col h-full max-w-3xl mx-auto bg-slate-100 shadow-2xl min-w-0 animate-in fade-in duration-300 w-full relative">
            {/* Header */}
            <header className="bg-white px-6 py-4 flex items-center justify-between shadow-sm z-20 flex-shrink-0">
                <button 
                    onClick={exitSession}
                    className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors flex items-center gap-1"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">返回</span>
                </button>
                
                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        进度 {currentIndex + 1} / {currentQueue.length}
                        <span className="text-green-500 ml-1" title="进度已自动保存"><Save className="w-3 h-3 inline" /></span>
                    </span>
                    <div className="w-32 sm:w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                            style={{ width: `${((currentIndex + 1) / currentQueue.length) * 100}%` }}
                        />
                    </div>
                </div>
                
                <div className="w-16"></div> {/* Spacer for balance */}
            </header>

            {/* Content - 可滚动区域 */}
            <main className="flex-grow overflow-y-auto p-4 pt-6 pb-0">
                <Flashcard 
                    key={currentQuestion.id} 
                    question={currentQuestion}
                    onResult={handleCardResult}
                    onNext={() => {}} 
                />
            </main>
        </div>
      )}
    </div>
  );
}

export default App;