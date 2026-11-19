import React, { useState, useEffect } from 'react';
import {
  Users,
  RefreshCw,
  AlertCircle,
  Check,
  Ban,
  UserPlus,
  CheckCircle2,
  Trash2,
  Search,
  KeyRound,
  X,
  ShieldCheck,
  ShieldAlert,
  Copy,
  LogOut,
  History,
  Shield,
  Laptop,
} from 'lucide-react';
import {
  api,
  type AdminUserItem,
  type SubjectItem,
  type UserAccessDetailResponse,
  type DeviceTransferAuditItem,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AdminPortalProps {
  onClose: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'access' | 'transfers' | 'security'>('users');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [transfers, setTransfers] = useState<DeviceTransferAuditItem[]>([]);

  // Search & Filters for Users tab
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'locked'>('all');

  // Modals
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [createdUserResult, setCreatedUserResult] = useState<{
    username: string;
    password: string;
    activationCode?: string;
  } | null>(null);

  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<AdminUserItem | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Device Transfer Modal State
  const [isDeviceTransferOpen, setIsDeviceTransferOpen] = useState(false);
  const [selectedUserForDevice, setSelectedUserForDevice] = useState<AdminUserItem | null>(null);
  const [deviceTransferType, setDeviceTransferType] = useState<'TRANSFER' | 'RECOVERY'>('TRANSFER');
  const [deviceTransferReason, setDeviceTransferReason] = useState('');
  const [deviceTransferResult, setDeviceTransferResult] = useState<{
    activationCode: string;
    transferCount: number;
    isWarning: boolean;
  } | null>(null);

  // Access Management State (Synchronized)
  const [selectedUserIdForAccess, setSelectedUserIdForAccess] = useState<string>('');
  const [userAccessDetail, setUserAccessDetail] = useState<UserAccessDetailResponse | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [accessNote, setAccessNote] = useState('');

  // MFA State for Admin
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaTotpInput, setMfaTotpInput] = useState('');
  const [isMfaSettingUp, setIsMfaSettingUp] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Load all data
  const loadData = async () => {
    if (user?.role !== 'ADMIN') {
      onClose();
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const [uList, subList, tList] = await Promise.all([
        api.adminGetUsers(),
        api.getSubjects(),
        api.adminGetDeviceTransfers(),
      ]);

      setUsers(uList);
      setSubjects(subList);
      setTransfers(tList);

      const studentUsers = uList.filter((u) => u.role === 'USER');
      if (studentUsers.length > 0) {
        if (!selectedUserIdForAccess || !studentUsers.some((u) => u.id === selectedUserIdForAccess)) {
          setSelectedUserIdForAccess(studentUsers[0].id);
        }
      } else {
        setSelectedUserIdForAccess('');
        setUserAccessDetail(null);
        setSelectedSubjectIds([]);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi tải dữ liệu Quản trị');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Synchronize access details when selected user changes
  useEffect(() => {
    if (selectedUserIdForAccess) {
      api
        .adminGetUserAccess(selectedUserIdForAccess)
        .then((detail) => {
          setUserAccessDetail(detail);
          const activeIds = detail.subjects
            .filter((s) => s.hasAccess)
            .map((s) => s.subjectId);
          setSelectedSubjectIds(activeIds);
        })
        .catch((e) => setError(e.message));
    } else {
      setUserAccessDetail(null);
      setSelectedSubjectIds([]);
    }
  }, [selectedUserIdForAccess]);

  // Handle user creation
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) return;

    try {
      setIsLoading(true);
      setError(null);
      const res = await api.adminCreateUser({
        username: newUsername.trim(),
        password: newPassword,
        fullName: newFullName.trim() || undefined,
      });

      setCreatedUserResult({
        username: newUsername.trim(),
        password: newPassword,
        activationCode: res.activationCode,
      });

      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      showNotification(res.message);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Lỗi tạo tài khoản');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset || !resetNewPassword) return;

    try {
      setIsLoading(true);
      setError(null);
      const res = await api.adminResetPassword(selectedUserForReset.id, resetNewPassword);
      setIsResetPasswordOpen(false);
      setSelectedUserForReset(null);
      setResetNewPassword('');
      showNotification(res.message);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Lỗi đặt lại mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle toggle user active status
  const handleToggleUserActive = async (targetUser: AdminUserItem) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.adminToggleUserActive(targetUser.id, !targetUser.isActive);
      showNotification(res.message);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Lỗi cập nhật trạng thái người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (targetUser: AdminUserItem) => {
    const confirmed = window.confirm(
      `CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${targetUser.username}" khỏi cơ sở dữ liệu? Toàn bộ lịch sử làm bài và quyền truy cập sẽ bị xóa.`,
    );
    if (!confirmed) return;

    try {
      setIsLoading(true);
      setError(null);
      const res = await api.adminDeleteUser(targetUser.id);
      showNotification(res.message);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Lỗi xóa tài khoản');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Device Transfer / Reset
  const handleOpenDeviceTransfer = (targetUser: AdminUserItem) => {
    setSelectedUserForDevice(targetUser);
    setDeviceTransferType('TRANSFER');
    setDeviceTransferReason('');
    setDeviceTransferResult(null);
    setIsDeviceTransferOpen(true);
  };

  const handleExecuteDeviceTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForDevice || !deviceTransferReason.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      const res = await api.adminResetDevice(
        selectedUserForDevice.id,
        deviceTransferType,
        deviceTransferReason.trim(),
      );

      setDeviceTransferResult(res);
      showNotification(res.message);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Lỗi đặt lại thiết bị');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Revoke Session Only
  const handleRevokeSession = async (targetUser: AdminUserItem) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.adminRevokeUserSession(targetUser.id);
      showNotification(res.message);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Lỗi thu hồi phiên');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Save Access
  const handleSaveAccess = async () => {
    if (!selectedUserIdForAccess) return;

    try {
      setIsLoading(true);
      setError(null);
      const res = await api.adminSetUserAccess(
        selectedUserIdForAccess,
        selectedSubjectIds,
        accessNote.trim() || undefined,
      );
      showNotification(res.message);
      setAccessNote('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Lỗi cập nhật quyền môn học');
    } finally {
      setIsLoading(false);
    }
  };

  // MFA Handlers
  const handleStartMfaSetup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.adminMfaSetup();
      setMfaSecret(res.secret);
      setIsMfaSettingUp(true);
    } catch (err: any) {
      setError(err.message || 'Lỗi khởi tạo MFA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmMfa = async () => {
    if (!mfaSecret || !mfaTotpInput.trim()) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.adminMfaEnable(mfaSecret, mfaTotpInput.trim());
      showNotification(res.message);
      setIsMfaSettingUp(false);
      setMfaSecret(null);
      setMfaTotpInput('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Mã xác thực không hợp lệ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    const code = window.prompt('Nhập mã TOTP 6 số từ Google Authenticator để xác nhận tắt MFA:');
    if (!code) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.adminMfaDisable(code.trim());
      showNotification(res.message);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Lỗi tắt MFA');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    if (userFilter === 'active' && !u.isActive) return false;
    if (userFilter === 'locked' && u.isActive) return false;

    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      const matchUsername = u.username.toLowerCase().includes(q);
      const matchFullName = (u.fullName || '').toLowerCase().includes(q);
      if (!matchUsername && !matchFullName) return false;
    }
    return true;
  });

  const studentUsers = users.filter((u) => u.role === 'USER');
  const currentAdminUser = users.find((u) => u.username === user?.username);

  if (user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl border border-purple-100 shadow-xl overflow-hidden animate-fadeIn text-left">
      {/* Top Header */}
      <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 bg-clip-text text-transparent">
            Quản Trị Hệ Thống
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Bảo mật 1 tài khoản = 1 thiết bị tin cậy = tối đa 1 phiên hoạt động
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-purple-100"
            title="Làm mới dữ liệu từ Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
          >
            Đóng cổng quản trị
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 overflow-x-auto text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-3.5 border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-700 bg-white font-bold'
              : 'border-transparent text-slate-600 hover:text-purple-600'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Tài khoản & Thiết bị ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('access')}
          className={`px-5 py-3.5 border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'access'
              ? 'border-purple-600 text-purple-700 bg-white font-bold'
              : 'border-transparent text-slate-600 hover:text-purple-600'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Phân quyền Môn học</span>
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`px-5 py-3.5 border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'transfers'
              ? 'border-purple-600 text-purple-700 bg-white font-bold'
              : 'border-transparent text-slate-600 hover:text-purple-600'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Lịch sử Đổi Thiết bị ({transfers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-5 py-3.5 border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'security'
              ? 'border-purple-600 text-purple-700 bg-white font-bold'
              : 'border-transparent text-slate-600 hover:text-purple-600'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Bảo mật & MFA Admin</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="m-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="m-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-800 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs font-bold text-rose-600 underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="p-6">
        {/* ==================== TAB 1: USERS & DEVICES ==================== */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Top controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Tìm theo username hoặc họ tên..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <select
                  value={userFilter}
                  onChange={(e: any) => setUserFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-purple-500 bg-white"
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Hoạt động</option>
                  <option value="locked">Bị khóa</option>
                </select>
              </div>

              <button
                onClick={() => setIsCreateUserOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Thêm học viên</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Tài khoản</th>
                    <th className="py-3 px-3">Họ và tên</th>
                    <th className="py-3 px-2">Vai trò</th>
                    <th className="py-3 px-3">Thiết bị tin cậy</th>
                    <th className="py-3 px-2 text-center">Đổi TB</th>
                    <th className="py-3 px-2 text-center">Phiên</th>
                    <th className="py-3 px-2 text-center">Môn cấp</th>
                    <th className="py-3 px-2 text-center">Bài làm</th>
                    <th className="py-3 px-2">Trạng thái</th>
                    <th className="py-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredUsers.map((u) => {
                    const isExceeded = u.deviceTransferCount >= 2;
                    return (
                      <tr key={u.id} className="hover:bg-purple-50/40 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900">{u.username}</td>
                        <td className="py-3 px-3">{u.fullName || '—'}</td>
                        <td className="py-3 px-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                              u.role === 'ADMIN'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        {/* Device info */}
                        <td className="py-3 px-3">
                          {u.role === 'ADMIN' ? (
                            <span className="text-[11px] text-slate-400">Không áp dụng</span>
                          ) : u.activeDevice ? (
                            <div>
                              <div className="font-semibold text-slate-800 flex items-center gap-1">
                                <Laptop className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate max-w-[140px]" title={u.activeDevice.deviceName}>
                                  {u.activeDevice.deviceName}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {u.activeDevice.deviceId.slice(0, 12)}...
                              </div>
                            </div>
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold">
                              Chưa liên kết
                            </span>
                          )}
                        </td>

                        {/* Device transfer counter */}
                        <td className="py-3 px-2 text-center">
                          {u.role === 'USER' ? (
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isExceeded
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : u.deviceTransferCount > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                              title={
                                isExceeded
                                  ? 'Cảnh báo: Tài khoản đã đạt hoặc vượt ngưỡng 2 lần đổi thiết bị khuyến nghị'
                                  : `${u.deviceTransferCount} lần đổi thiết bị`
                              }
                            >
                              {isExceeded && '⚠️ '}
                              {u.deviceTransferCount}/2
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Session status */}
                        <td className="py-3 px-2 text-center">
                          {u.hasActiveSession ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Đang online
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">
                              Offline
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-2 text-center font-bold text-purple-700">
                          {u.activeSubjectCount} môn
                        </td>
                        <td className="py-3 px-2 text-center">{u.attemptCount}</td>
                        <td className="py-3 px-2">
                          {u.isActive ? (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">
                              Bị khóa
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            {u.role === 'USER' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedUserIdForAccess(u.id);
                                    setActiveTab('access');
                                  }}
                                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
                                  title="Phân quyền môn học"
                                >
                                  Môn
                                </button>
                                <button
                                  onClick={() => handleOpenDeviceTransfer(u)}
                                  className={`px-2 py-1 font-bold rounded-lg transition-colors cursor-pointer text-[11px] ${
                                    isExceeded
                                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                                  }`}
                                  title="Đặt lại / Chuyển liên kết thiết bị"
                                >
                                  Đổi TB
                                </button>
                              </>
                            )}

                            {u.hasActiveSession && (
                              <button
                                onClick={() => handleRevokeSession(u)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Thu hồi phiên (giữ nguyên thiết bị tin cậy)"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedUserForReset(u);
                                setIsResetPasswordOpen(true);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer text-[11px]"
                              title="Đặt lại mật khẩu"
                            >
                              Đổi MK
                            </button>

                            {u.role !== 'ADMIN' && (
                              <>
                                <button
                                  onClick={() => handleToggleUserActive(u)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    u.isActive
                                      ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                      : 'text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                  title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Xóa vĩnh viễn tài khoản khỏi hệ thống"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-slate-400">
                        Không tìm thấy tài khoản phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: ACCESS MANAGEMENT ==================== */}
        {activeTab === 'access' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Chọn học viên để phân quyền:
              </label>
              <select
                value={selectedUserIdForAccess}
                onChange={(e) => setSelectedUserIdForAccess(e.target.value)}
                className="w-full max-w-md px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:border-purple-600 bg-white"
              >
                {studentUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} {u.fullName ? `(${u.fullName})` : ''} — Đang có {u.activeSubjectCount} môn
                  </option>
                ))}
              </select>
            </div>

            {userAccessDetail && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-slate-800">
                    Danh sách môn học hệ thống ({subjects.length} môn)
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSubjectIds(subjects.map((s) => s.id))}
                      className="text-xs text-purple-700 hover:underline font-bold cursor-pointer"
                    >
                      Chọn tất cả
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedSubjectIds([])}
                      className="text-xs text-slate-500 hover:underline cursor-pointer"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {subjects.map((sub) => {
                    const isChecked = selectedSubjectIds.includes(sub.id);
                    return (
                      <label
                        key={sub.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                          isChecked
                            ? 'bg-purple-50/70 border-purple-300 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubjectIds([...selectedSubjectIds, sub.id]);
                            } else {
                              setSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== sub.id));
                            }
                          }}
                          className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">{sub.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {sub.lessonCount} bài học • {sub.questionCount} câu hỏi
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú phân quyền (tùy chọn):</label>
                  <input
                    type="text"
                    value={accessNote}
                    onChange={(e) => setAccessNote(e.target.value)}
                    placeholder="ví dụ: Cấp quyền học kỳ 2..."
                    className="w-full max-w-md px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveAccess}
                    disabled={isLoading}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu phân quyền ({selectedSubjectIds.length} môn được chọn)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: DEVICE TRANSFERS AUDIT ==================== */}
        {activeTab === 'transfers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Lịch sử Chuyển và Đặt lại Thiết bị</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ghi lại mọi thao tác Admin cấp lại mã liên kết thiết bị mới, lý do và thời điểm.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Học viên</th>
                    <th className="py-3 px-4">Loại thao tác</th>
                    <th className="py-3 px-4">Admin thực hiện</th>
                    <th className="py-3 px-4">Lý do</th>
                    <th className="py-3 px-4">Thiết bị cũ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {transfers.map((t) => (
                    <tr key={t.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        {new Date(t.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{t.user?.username}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.transferType === 'TRANSFER'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.transferType === 'TRANSFER' ? 'Chuyển thiết bị mới' : 'Khôi phục sự cố'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800">{t.admin?.username}</td>
                      <td className="py-3 px-4 max-w-xs">{t.reason}</td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[10px]">
                        {t.oldDeviceId ? `${t.oldDeviceId.slice(0, 12)}...` : 'Chưa có'}
                      </td>
                    </tr>
                  ))}
                  {transfers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Chưa có lịch sử chuyển thiết bị nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: ADMIN SECURITY & MFA ==================== */}
        {activeTab === 'security' && (
          <div className="max-w-xl space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Xác thực hai bước Quản trị viên (TOTP MFA)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Sử dụng Google Authenticator, Microsoft Authenticator hoặc Bitwarden (hoàn toàn miễn phí, 0 đồng).
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-xs sm:text-sm">Trạng thái bảo vệ tài khoản</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {currentAdminUser?.isTotpEnabled ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 inline" /> Đang bật xác thực 2 bước (TOTP)
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold flex items-center gap-1">
                        <ShieldAlert className="w-4 h-4 text-amber-600 inline" /> Chưa bật xác thực 2 bước
                      </span>
                    )}
                  </div>
                </div>

                {currentAdminUser?.isTotpEnabled ? (
                  <button
                    onClick={handleDisableMfa}
                    className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                  >
                    Tắt MFA
                  </button>
                ) : (
                  <button
                    onClick={handleStartMfaSetup}
                    disabled={isMfaSettingUp}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Thiết lập ngay
                  </button>
                )}
              </div>

              {/* MFA Setup Wizard */}
              {isMfaSettingUp && mfaSecret && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-purple-200 space-y-4 animate-fadeIn">
                  <div className="text-xs text-slate-700 font-medium leading-relaxed">
                    <strong>Bước 1:</strong> Thêm khóa bí mật vào Google Authenticator:
                  </div>

                  <div className="p-3 bg-purple-50 rounded-xl font-mono text-center font-bold tracking-widest text-purple-900 text-sm select-all">
                    {mfaSecret}
                  </div>

                  <div className="text-xs text-slate-700 font-medium leading-relaxed">
                    <strong>Bước 2:</strong> Nhập mã 6 chữ số đang hiển thị trên ứng dụng để kích hoạt:
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={mfaTotpInput}
                      onChange={(e) => setMfaTotpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ví dụ: 123456"
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-center tracking-widest font-bold text-sm w-36 outline-none focus:border-purple-600"
                    />
                    <button
                      onClick={handleConfirmMfa}
                      disabled={mfaTotpInput.length < 6 || isLoading}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                    >
                      Xác nhận kích hoạt
                    </button>
                    <button
                      onClick={() => setIsMfaSettingUp(false)}
                      className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==================== MODAL: CREATE USER & ACTIVATION CODE ==================== */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-100 animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 text-lg">Tạo Tài Khoản Học Viên Mới</h3>
              <button onClick={() => setIsCreateUserOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdUserResult ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-sm text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Tài khoản đã tạo thành công!</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Tài khoản đã sẵn sàng! Học viên chỉ cần đăng nhập bằng Username và Mật khẩu trên thiết bị cần dùng. Hệ thống sẽ <strong>tự động liên kết và khóa thiết bị đó</strong> ngay trong lần đăng nhập đầu tiên.
                  </p>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl">
                  <div><strong>Tên đăng nhập:</strong> {createdUserResult.username}</div>
                  <div><strong>Mật khẩu:</strong> {createdUserResult.password}</div>
                  <div className="text-[11px] text-purple-700 font-medium">Hệ thống sẽ tự động khóa thiết bị đầu tiên khi học viên đăng nhập.</div>
                </div>

                <button
                  onClick={() => {
                    const text = `Tài khoản ôn tập:\n- Username: ${createdUserResult.username}\n- Mật khẩu: ${createdUserResult.password}\n(Hệ thống tự động khóa thiết bị đăng nhập đầu tiên)`;
                    navigator.clipboard.writeText(text);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedCode ? 'Đã sao chép!' : 'Sao chép thông tin gửi học viên'}</span>
                </button>

                <button
                  onClick={() => {
                    setCreatedUserResult(null);
                    setIsCreateUserOpen(false);
                  }}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-700"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên đăng nhập (username)</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="ví dụ: hocvien_k62"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mật khẩu ban đầu</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Họ và tên học viên (tùy chọn)</label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="ví dụ: Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="p-3 bg-purple-50 rounded-xl text-xs text-purple-900">
                  Hệ thống sẽ <strong>tự động liên kết trình duyệt đầu tiên</strong> mà học viên dùng để đăng nhập.
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateUserOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
                  >
                    Tạo tài khoản học viên
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL: DEVICE TRANSFER / RESET ==================== */}
      {isDeviceTransferOpen && selectedUserForDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-100 animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 text-lg">
                Đổi Thiết Bị: {selectedUserForDevice.username}
              </h3>
              <button
                onClick={() => {
                  setIsDeviceTransferOpen(false);
                  setDeviceTransferResult(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {deviceTransferResult ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-sm text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Thiết bị cũ đã thu hồi thành công!</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Toàn bộ phiên và liên kết thiết bị cũ đã bị hủy. Học viên chỉ cần đăng nhập bằng Username và Mật khẩu trên thiết bị mới, hệ thống sẽ <strong>tự động liên kết thiết bị mới</strong> đó.
                  </p>
                  <div className="text-[10px] text-slate-500 pt-1">
                    Số lần đổi thiết bị hiện tại: <strong>{deviceTransferResult.transferCount}/2</strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const text = `Tài khoản ${selectedUserForDevice.username} đã được đặt lại thiết bị. Bạn có thể đăng nhập trên thiết bị mới ngay bây giờ.`;
                    navigator.clipboard.writeText(text);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedCode ? 'Đã sao chép!' : 'Sao chép mã gửi học viên'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsDeviceTransferOpen(false);
                    setDeviceTransferResult(null);
                  }}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-700"
                >
                  Hoàn tất
                </button>
              </div>
            ) : (
              <form onSubmit={handleExecuteDeviceTransfer} className="space-y-4 text-xs sm:text-sm">
                {/* Warning if exceeded or reaching 2 transfers */}
                {selectedUserForDevice.deviceTransferCount >= 2 && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Cảnh báo chính sách:</strong> Tài khoản này đã đổi thiết bị{' '}
                      <strong>{selectedUserForDevice.deviceTransferCount}/2</strong> lần (đạt hoặc vượt khuyến nghị). Hãy xác minh kỹ trước khi duyệt.
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Loại lý do thao tác</label>
                  <select
                    value={deviceTransferType}
                    onChange={(e: any) => setDeviceTransferType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-purple-600 bg-white"
                  >
                    <option value="TRANSFER">Chuyển thiết bị mới (tính vào bộ đếm)</option>
                    <option value="RECOVERY">Khôi phục sự cố (cài lại Win, hỏng máy - không tăng bộ đếm)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lý do cụ thể (Bắt buộc ghi lịch sử)</label>
                  <textarea
                    required
                    minLength={3}
                    rows={3}
                    value={deviceTransferReason}
                    onChange={(e) => setDeviceTransferReason(e.target.value)}
                    placeholder="ví dụ: Học viên mua máy tính mới; hoặc Cài lại hệ điều hành..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 text-xs sm:text-sm"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed">
                  Thiết bị cũ sẽ bị hủy liên kết ngay. Toàn bộ phiên hiện tại bị thu hồi. Học viên cần nhập mã mới trên thiết bị mới để liên kết lại.
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDeviceTransferOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
                  >
                    Xác nhận đặt lại & Tạo mã mới
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL: RESET PASSWORD ==================== */}
      {isResetPasswordOpen && selectedUserForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-100 animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 text-lg">
                Đặt Lại Mật Khẩu: {selectedUserForReset.username}
              </h3>
              <button
                onClick={() => setIsResetPasswordOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới cho học viên"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900">
                Toàn bộ phiên đăng nhập hiện tại sẽ bị thu hồi. Thiết bị tin cậy vẫn được <strong>giữ nguyên</strong>, học viên chỉ cần đăng nhập lại bằng mật khẩu mới trên máy của mình.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
                >
                  Lưu mật khẩu mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
