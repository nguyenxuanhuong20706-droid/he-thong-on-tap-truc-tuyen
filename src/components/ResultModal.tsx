import React from 'react';
import type { QuizResult } from '../types/quiz';

interface ResultModalProps {
  isOpen: boolean;
  result: QuizResult;
  onHome: () => void;
  onRetry: () => void;
  onReview?: () => void;
  onRetryWrong?: () => void;
  canRetryWrong?: boolean;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  result,
  onHome,
  onRetry,
  onReview,
  onRetryWrong,
  canRetryWrong = true,
}) => {
  if (!isOpen) return null;

  const { correctCount, wrongCount, totalQuestions, percentage } = result;
  const incorrectCount = wrongCount + (result.unansweredCount || 0);
  const showRetryWrongButton = Boolean(canRetryWrong && incorrectCount > 0 && onRetryWrong);

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
      <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-[420px] w-full shadow-2xl border border-slate-100 text-center relative flex flex-col items-center">
        {/* Book Graphic */}
        <div className="w-16 h-14 mb-3 flex items-center justify-center relative">
          <svg
            className="w-14 h-14 drop-shadow-sm"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="6" y="10" width="24" height="42" rx="3" fill="#60a5fa" />
            <rect x="34" y="10" width="24" height="42" rx="3" fill="#60a5fa" />
            <rect x="10" y="12" width="20" height="38" rx="2" fill="#eff6ff" />
            <rect x="34" y="12" width="20" height="38" rx="2" fill="#eff6ff" />
            <path
              d="M30 12 L30 50 M34 12 L34 50"
              stroke="#3b82f6"
              strokeWidth="2"
            />
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
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#gradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-slate-800 tracking-tight leading-none">
              {percentage}%
            </span>
            <span className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
              ĐIỂM SỐ
            </span>
          </div>
        </div>

        {/* Three Score Badges */}
        <div className="grid grid-cols-3 gap-2.5 w-full mb-4">
          <div className="bg-[#f0fdf4] rounded-2xl py-3 px-2 flex flex-col items-center justify-center">
            <span className="text-emerald-600 font-black text-2xl leading-none">
              {correctCount}
            </span>
            <span className="text-emerald-700 font-bold text-[11px] tracking-wider mt-1.5 uppercase">
              ĐÚNG
            </span>
          </div>

          <div className="bg-[#fff5f5] rounded-2xl py-3 px-2 flex flex-col items-center justify-center">
            <span className="text-rose-500 font-black text-2xl leading-none">
              {wrongCount}
            </span>
            <span className="text-rose-700 font-bold text-[11px] tracking-wider mt-1.5 uppercase">
              SAI
            </span>
          </div>

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
          <p className="text-xs text-amber-600 font-medium mb-4 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200/60">
            ⚠️ Còn {result.unansweredCount} câu chưa làm
          </p>
        )}

        {/* Action Buttons: Xem chi tiết - Làm lại câu sai - Trang chủ - Làm lượt mới */}
        <div className="space-y-2.5 w-full">
          {showRetryWrongButton ? (
            <>
              {/* Row 1: Xem chi tiết & Làm lại câu sai */}
              <div className="grid grid-cols-2 gap-2.5 w-full">
                {onReview && (
                  <button
                    type="button"
                    onClick={onReview}
                    className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
                  >
                    <span>Xem chi tiết</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onRetryWrong}
                  className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center justify-center cursor-pointer shadow-sm"
                  title={`Làm lại ${incorrectCount} câu chưa đúng`}
                >
                  <span>Làm lại câu sai ({incorrectCount})</span>
                </button>
              </div>

              {/* Row 2: Trang chủ & Làm lượt mới */}
              <div className="grid grid-cols-2 gap-2.5 w-full">
                <button
                  type="button"
                  onClick={onHome}
                  className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <span>Trang chủ</span>
                </button>

                <button
                  type="button"
                  onClick={onRetry}
                  className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 shadow-md shadow-purple-500/20 transition-all flex items-center justify-center cursor-pointer"
                >
                  <span>Làm lượt mới</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Khi không còn lượt làm lại câu sai (chỉ cho phép 1 lần) hoặc đã đúng tất cả */}
              <div className="grid grid-cols-2 gap-2.5 w-full">
                {onReview && (
                  <button
                    type="button"
                    onClick={onReview}
                    className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
                  >
                    <span>Xem chi tiết</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onHome}
                  className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer ${
                    !onReview ? 'col-span-2' : ''
                  }`}
                >
                  <span>Trang chủ</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onRetry}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 shadow-md shadow-purple-500/20 transition-all flex items-center justify-center cursor-pointer"
              >
                <span>Làm lượt mới</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
