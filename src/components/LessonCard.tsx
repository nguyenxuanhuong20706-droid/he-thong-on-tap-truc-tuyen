import React from 'react';
import type { Lesson } from '../types/quiz';
import { ArrowRight, FileText } from 'lucide-react';

interface LessonCardProps {
  lesson: Lesson;
  onSelect: (lessonId: string) => void;
  onComingSoon: () => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  onSelect,
  onComingSoon,
}) => {
  const isAvailable = lesson.status === 'available';

  const handleClick = () => {
    if (isAvailable) {
      onSelect(lesson.id);
    } else {
      onComingSoon();
    }
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`group relative bg-white rounded-3xl p-6 sm:p-7 border transition-all duration-200 flex flex-col justify-between text-left ${
        isAvailable
          ? 'border-slate-100 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-4px_rgba(93,95,239,0.15)] hover:-translate-y-1 cursor-pointer'
          : 'border-slate-100/80 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.03)] opacity-75 hover:opacity-90 cursor-pointer'
      }`}
    >
      <div>
        {/* Lesson Badge */}
        <div className="mb-4">
          <span className="inline-block bg-[#5d5fef] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm shadow-indigo-500/20">
            BÀI {lesson.number}
          </span>
        </div>

        {/* Lesson Title */}
        <h3 className="font-bold text-slate-900 text-lg leading-snug line-clamp-2 min-h-[3.25rem]">
          {lesson.title}
        </h3>
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-slate-500">
          <FileText className="w-4 h-4 text-rose-400 stroke-[2.2]" />
          <span className="font-medium text-xs sm:text-sm">
            {isAvailable ? `${lesson.questionCount} câu hỏi` : 'Sắp cập nhật'}
          </span>
        </div>

        <div
          className={`transition-all duration-200 ${
            isAvailable
              ? 'text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-1'
              : 'text-slate-300'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
