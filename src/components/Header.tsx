import React from 'react';
import {
  BookOpen,
  LogOut,
  ShieldCheck,
  User,
  History,
  Shield,
} from 'lucide-react';
import type { AuthUser } from '../services/api';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  onBack?: () => void;
  showBack?: boolean;
  backText?: string;
  user?: AuthUser | null;
  onLogout?: () => void;
  currentView?: string;
  onNavigate?: (view: 'subjects' | 'history' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  badge,
  onBack,
  showBack = false,
  backText = 'Quay lại',
  user,
  onLogout,
  currentView = 'subjects',
  onNavigate,
}) => {
  return (
    <header className="pt-4 pb-6 text-center relative px-4">
      {/* Top Navbar: Navigation & User info */}
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Left: Back button or Main logo */}
        <div className="flex items-center gap-2">
          {showBack && onBack ? (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-purple-700 transition-colors bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-sm cursor-pointer"
            >
              <span aria-hidden="true">&larr;</span> {backText}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-left">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                <BookOpen className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="hidden sm:block">
                <span className="font-extrabold text-sm text-slate-800 tracking-tight">Hệ Thống Ôn Tập</span>
                <span className="block text-[10px] text-purple-600 font-semibold uppercase">Trực tuyến</span>
              </div>
            </div>
          )}
        </div>

        {/* Center: Nav links if logged in (Ẩn khi đang xem danh sách bài học của một môn hoặc khi đang làm bài) */}
        {user && onNavigate && currentView !== 'lessons' && currentView !== 'quiz' && (
          <nav className="flex items-center gap-1 bg-white/80 backdrop-blur-md p-1 rounded-2xl border border-slate-200/80 shadow-sm text-xs">
            <button
              onClick={() => onNavigate('subjects')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === 'subjects' || currentView === 'lessons'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Môn học</span>
            </button>

            <button
              onClick={() => onNavigate('history')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === 'history'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Lịch sử làm bài</span>
            </button>

            {user.role === 'ADMIN' && (
              <button
                onClick={() => onNavigate('admin')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm'
                    : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span>Quản trị Admin</span>
              </button>
            )}
          </nav>
        )}

        {/* Right: User Profile + Logout */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 sm:gap-2.5 bg-white py-1 px-2.5 sm:px-3 rounded-full border border-slate-200/80 shadow-sm text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <User className="w-4 h-4 text-purple-600" />
                <span>{user.fullName || user.username}</span>
                {user.role === 'ADMIN' && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                    Admin
                  </span>
                )}
              </div>

              <div className="w-[1px] h-4 bg-slate-200" />

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-slate-500 hover:text-rose-600 transition-colors font-medium flex items-center gap-1 cursor-pointer"
                  title="Đăng xuất khỏi hệ thống"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Title Section */}
      {title && (
        <div className="mt-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 bg-clip-text text-transparent">
            {title}
          </h1>

          {badge ? (
            <div className="mt-2">
              <span className="inline-block px-4 py-1 rounded-full bg-white text-xs sm:text-sm font-medium text-purple-800 border border-purple-200 shadow-sm">
                {badge}
              </span>
            </div>
          ) : (
            subtitle && (
              <p className="mt-1 text-xs sm:text-sm md:text-base font-normal text-slate-500 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )
          )}
        </div>
      )}
    </header>
  );
};
