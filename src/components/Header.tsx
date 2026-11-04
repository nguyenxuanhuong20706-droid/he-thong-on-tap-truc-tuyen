import React from 'react';
import { BookOpen } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  onBack?: () => void;
  showBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Ôn tập Lịch sử Đảng Cộng sản Việt Nam',
  subtitle = 'Chọn bài để bắt đầu ôn tập',
  badge,
  onBack,
  showBack = false,
}) => {
  return (
    <header className="pt-10 pb-6 text-center relative px-4">
      {showBack && onBack && (
        <div className="max-w-5xl mx-auto flex items-center mb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-sm"
          >
            <span aria-hidden="true">&larr;</span> Danh sách bài
          </button>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        {!showBack && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5d5fef] to-[#8b5cf6] flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <BookOpen className="w-6 h-6 stroke-[2.2]" />
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#5d5fef] via-[#7c3aed] to-[#8b5cf6] bg-clip-text text-transparent">
          {title}
        </h1>
      </div>

      {badge ? (
        <div className="mt-3">
          <span className="inline-block px-4 py-1 rounded-full bg-white text-xs sm:text-sm font-medium text-slate-500 border border-slate-200 shadow-sm">
            {badge}
          </span>
        </div>
      ) : (
        subtitle && (
          <p className="mt-2 text-sm sm:text-base font-normal text-slate-500">
            {subtitle}
          </p>
        )
      )}
    </header>
  );
};

