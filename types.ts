export type QuestionType = 'single' | 'multiple' | 'judgment';

export interface Question {
  id: string;
  category: string;
  type: QuestionType;
  question: string;
  options?: string[]; // Empty for judgment
  answer: string | string[]; // "A", ["A", "B"], "√", "×"
  explanation?: string;
}

export interface UserProgress {
  status: 'new' | 'learning' | 'mastered';
  difficultyScore: number; // 0 to 5, higher is harder
  lastReviewed: number;
  reviewCount: number;
}

export interface ProgressMap {
  [questionId: string]: UserProgress;
}

export enum StudyMode {
  DASHBOARD = 'DASHBOARD',
  STUDY = 'STUDY',
  REVIEW_HARD = 'REVIEW_HARD'
}
