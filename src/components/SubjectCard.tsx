import React from 'react';
import type { SubjectItem } from '../services/api';
import { Layers, ArrowRight, Lock } from 'lucide-react';

interface SubjectCardProps {
  subject: SubjectItem;
  onEnter: (subject: SubjectItem) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  onEnter,
}) => {
  const isAccessible = Boolean(subject.hasAccess);

  return (
    <div
      className={`rounded-3xl p-6 sm:p-7 border transition-all duration-200 flex flex-col justify-between text-left ${
        isAccessible
          ? 'group bg-white border-purple-100/80 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-4px_rgba(124,58,237,0.12)] hover:-translate-y-1'
          : 'bg-slate-50/70 border-slate-200/80 opacity-65 cursor-not-allowed select-none'
      }`}
    >
      <div>
        {/* Tên môn học */}
        <h3
          className={`font-extrabold text-xl leading-snug mb-3 transition-colors ${
            isAccessible
              ? 'text-slate-900 group-hover:text-purple-700'
              : 'text-slate-400'
          }`}
        >
          {subject.title}
        </h3>

        {/* Số lượng bài học */}
        <div
          className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-xl border mb-6 ${
            isAccessible
              ? 'text-purple-700 bg-purple-50 border-purple-100'
              : 'text-slate-400 bg-slate-100 border-slate-200'
          }`}
        >
          <Layers className={`w-4 h-4 ${isAccessible ? 'text-purple-600' : 'text-slate-400'}`} />
          <span>{subject.lessonCount} bài học</span>
        </div>
      </div>

      {/* Nút hành động */}
      <div>
        {isAccessible ? (
          <button
            onClick={() => onEnter(subject)}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 group-hover:shadow-lg group-hover:shadow-purple-500/30 transition-all cursor-pointer"
          >
            <span>Vào làm bài</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        ) : (
          <div
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 text-slate-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed select-none border border-slate-200"
          >
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Đã bị khóa quyền truy cập</span>
          </div>
        )}
      </div>
    </div>
  );
};
