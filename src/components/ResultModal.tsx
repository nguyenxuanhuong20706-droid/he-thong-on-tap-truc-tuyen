import React from 'react';
import type { QuizResult } from '../types/quiz';
import { Home, RotateCcw } from 'lucide-react';

interface ResultModalProps {
  isOpen: boolean;
  result: QuizResult;
  onHome: () => void;
  onRetry: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  result,
  onHome,
  onRetry,
}) => {
  if (!isOpen) return null;

  const { correctCount, wrongCount, totalQuestions, percentage } = result;

  // Custom feedback text based on performance
  let feedbackTitle = 'Cần ôn thêm!';
  let feedbackSub = 'thử lại lần nữa nhé!';

  if (percentage === 100) {
    feedbackTitle = 'Xuất sắc tuyệt đối!';
    feedbackSub = 'bạn đã nắm vững toàn bộ kiến thức!';
  } else if (percentage >= 80) {
    feedbackTitle = 'Rất xuất sắc!';
    feedbackSub = 'kết quả rất ấn tượng, tiếp tục phát huy nhé!';
  } else if (percentage >= 65) {
    feedbackTitle = 'Khá tốt!';
    feedbackSub = 'chỉ cần ôn thêm một chút là đạt điểm tối đa!';
  } else if (percentage >= 50) {
    feedbackTitle = 'Đạt yêu cầu!';
    feedbackSub = 'hãy ôn tập thêm để cải thiện kết quả nhé!';
  }

  // SVG Circular progress calculations
  const size = 130;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-[400px] w-full shadow-2xl border border-slate-100 text-center relative flex flex-col items-center">
        {/* Book Graphic */}
        <div className="w-16 h-14 mb-3 flex items-center justify-center relative">
          <svg
            className="w-14 h-14 drop-shadow-sm"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft book illustration resembling sample image */}
            <rect x="6" y="10" width="24" height="42" rx="3" fill="#60a5fa" />
            <rect x="34" y="10" width="24" height="42" rx="3" fill="#60a5fa" />
            <rect x="10" y="12" width="20" height="38" rx="2" fill="#eff6ff" />
            <rect x="34" y="12" width="20" height="38" rx="2" fill="#eff6ff" />
            <path
              d="M30 12 L30 50 M34 12 L34 50"
              stroke="#3b82f6"
              strokeWidth="2"
            />
            {/* Book spine curve */}
            <path
              d="M10 50 C20 48 28 50 32 53 C36 50 44 48 54 50"
              stroke="#2563eb"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">
          {feedbackTitle}
        </h2>

        {/* Subtitle */}
        <p className="text-slate-500 text-sm mb-6 font-normal">
          Bạn đúng {correctCount}/{totalQuestions} câu — {feedbackSub}
        </p>

        {/* Circular Progress Gauge */}
        <div className="relative mb-6 flex items-center justify-center">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress stroke */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#purpleGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient
                id="purpleGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#5d5fef" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Text inside circle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-extrabold text-[#5d5fef] leading-none">
              {percentage}%
            </span>
            <span className="text-xs text-slate-400 font-medium mt-1">
              {correctCount}/{totalQuestions} câu
            </span>
          </div>
        </div>

        {/* 3 Statistic Blocks */}
        <div className="grid grid-cols-3 gap-2.5 w-full mb-4">
          {/* Correct */}
          <div className="bg-[#eefcf4] rounded-2xl py-3 px-2 flex flex-col items-center justify-center">
            <span className="text-emerald-500 font-black text-2xl leading-none">
              {correctCount}
            </span>
            <span className="text-emerald-700 font-bold text-[11px] tracking-wider mt-1.5 uppercase">
              ĐÚNG
            </span>
          </div>

          {/* Wrong */}
          <div className="bg-[#fff5f5] rounded-2xl py-3 px-2 flex flex-col items-center justify-center">
            <span className="text-rose-500 font-black text-2xl leading-none">
              {wrongCount}
            </span>
            <span className="text-rose-700 font-bold text-[11px] tracking-wider mt-1.5 uppercase">
              SAI
            </span>
          </div>

          {/* Total */}
          <div className="bg-[#f8fafc] rounded-2xl py-3 px-2 flex flex-col items-center justify-center">
            <span className="text-slate-700 font-black text-2xl leading-none">
              {totalQuestions}
            </span>
            <span className="text-slate-500 font-bold text-[11px] tracking-wider mt-1.5 uppercase">
              TỔNG
            </span>
          </div>
        </div>

        {/* Unanswered notice if any */}
        {result.unansweredCount > 0 && (
          <p className="text-xs text-amber-600 font-medium mb-5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200/60">
            ⚠️ Còn {result.unansweredCount} câu chưa làm
          </p>
        )}
        {result.unansweredCount === 0 && <div className="mb-2" />}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            type="button"
            onClick={onHome}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-slate-600" />
            Trang chủ
          </button>

          <button
            type="button"
            onClick={onRetry}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#5d5fef] to-[#7c3aed] hover:from-[#4f51e0] hover:to-[#6d28d9] shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-white" />
            Làm lại
          </button>
        </div>
      </div>
    </div>
  );
};
