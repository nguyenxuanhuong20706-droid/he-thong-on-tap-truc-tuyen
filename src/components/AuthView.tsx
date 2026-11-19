import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { getCachedDeviceId } from '../services/deviceSecurity';

export const AuthView: React.FC = () => {
  const { login, verifyMfa } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Device status banner
  const [isDeviceMismatch, setIsDeviceMismatch] = useState(false);
  const [mismatchDeviceName, setMismatchDeviceName] = useState<string>('');

  // MFA state
  const [mfaTicket, setMfaTicket] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const totpInputRef = useRef<HTMLInputElement>(null);

  // Check device status as user types username (on blur)
  const handleUsernameBlur = async () => {
    const trimmed = username.trim();
    if (!trimmed || trimmed.toLowerCase() === 'admin') return;

    try {
      const cachedDeviceId = getCachedDeviceId();
      const check = await api.checkDevice(trimmed, cachedDeviceId || undefined);

      if (check.status === 'DEVICE_MISMATCH') {
        setIsDeviceMismatch(true);
        setMismatchDeviceName(check.registeredDeviceName || 'thiết bị khác');
      } else {
        setIsDeviceMismatch(false);
      }
    } catch {
      // Ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await login(trimmedUsername, password);

      if (res && res.mfaRequired && res.mfaTicket) {
        setMfaTicket(res.mfaTicket);
        setTimeout(() => totpInputRef.current?.focus(), 100);
      }
    } catch (err: any) {
      const msg = err.message || 'Đăng nhập thất bại.';
      setError(msg);

      if (msg.includes('thiết bị khác') || msg.includes('chưa được liên kết')) {
        setIsDeviceMismatch(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaTicket || !totpCode.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      await verifyMfa(mfaTicket, totpCode.trim());
    } catch (err: any) {
      setError(err.message || 'Mã xác thực không chính xác');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-purple-50 to-indigo-100">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-purple-900/5 border border-purple-100 p-8 sm:p-10 relative overflow-hidden animate-fadeIn">
        {/* Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800" />

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-purple-500/25 mb-4">
            <Lock className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Hệ Thống Ôn Tập
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Bảo mật 1 tài khoản = 1 thiết bị tin cậy = 1 phiên đăng nhập
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Device Mismatch Banner */}
        {isDeviceMismatch && !error && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block font-semibold mb-0.5">Thiết bị chưa được ủy quyền</strong>
              Tài khoản này đang liên kết với thiết bị <strong>{mismatchDeviceName}</strong>. Vui lòng sử dụng đúng thiết bị đã đăng ký hoặc liên hệ Quản trị viên để đặt lại liên kết nếu bạn đổi máy.
            </div>
          </div>
        )}

        {/* MFA Screen */}
        {mfaTicket ? (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-900 flex items-center gap-2.5 mb-2">
              <ShieldCheck className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <div>
                Tài khoản Quản trị yêu cầu xác thực 2 bước (TOTP). Mở ứng dụng Google Authenticator để lấy mã.
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mã xác thực 6 chữ số
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  ref={totpInputRef}
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ví dụ: 123456"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 outline-none transition-all text-center tracking-widest text-lg font-bold"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || totpCode.length < 6}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Xác thực và Đăng nhập</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMfaTicket(null);
                setTotpCode('');
              }}
              className="w-full text-xs text-center text-slate-400 hover:text-slate-600 py-1"
            >
              Quay lại đăng nhập thường
            </button>
          </form>
        ) : (
          /* Normal / Binding Login Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  ref={usernameInputRef}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={handleUsernameBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      passwordInputRef.current?.focus();
                    }
                  }}
                  placeholder="Nhập username được cấp..."
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 outline-none transition-all text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập</span>
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-[11px] text-center text-slate-400 mt-6">
          Quên mật khẩu hoặc cần chuyển thiết bị? Liên hệ Quản trị viên hệ thống.
        </p>
      </div>
    </div>
  );
};
