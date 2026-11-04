export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface Question {
  id: number;
  lessonId: string;
  questionNumber: number;
  question: string;
  options: {
    key: OptionKey;
    text: string;
  }[];
  correctAnswer: OptionKey;
}

export interface Lesson {
  id: string;
  number: number;
  title: string;
  description?: string;
  questionCount: number;
  status: 'available' | 'coming_soon';
}

export interface QuizResult {
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  totalQuestions: number;
  percentage: number;
}

