import { useState, useEffect } from 'react';
import { ProgressMap, UserProgress } from '../types';

const STORAGE_KEY = 'safety_exam_progress_v1';

export const useProgress = () => {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProgress(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse progress", e);
      }
    }
    setLoading(false);
  }, []);

  const updateProgress = (questionId: string, difficulty: 'easy' | 'hard') => {
    setProgress(prev => {
      const current = prev[questionId] || {
        status: 'new',
        difficultyScore: 0,
        lastReviewed: 0,
        reviewCount: 0
      };

      const newReviewCount = current.reviewCount + 1;
      let newStatus: UserProgress['status'];
      let newScore: number;

      // 极速模式逻辑：
      // Easy -> 直接掌握 (Score 0)
      // Hard -> 进入攻坚区 (Score 5)
      if (difficulty === 'hard') {
        newStatus = 'learning';
        newScore = 5; 
      } else {
        newStatus = 'mastered';
        newScore = 0;
      }

      const updatedEntry: UserProgress = {
        status: newStatus,
        difficultyScore: newScore,
        lastReviewed: Date.now(),
        reviewCount: newReviewCount
      };

      const newState = {
        ...prev,
        [questionId]: updatedEntry
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  const resetProgress = () => {
    if(confirm("确定要重置所有学习进度吗？所有题目将变为“未学习”状态。")) {
        localStorage.removeItem(STORAGE_KEY);
        setProgress({});
        // 同时也清除当前的会话进度
        localStorage.removeItem('safety_exam_session_v2');
        window.location.reload(); // 强制刷新以确保所有状态清空
    }
  };

  return { progress, updateProgress, resetProgress, loading };
};