export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('CUSTOM_API_URL');
    if (custom) return custom.trim().replace(/\/$/, '');
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.trim().replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
    return 'https://certainly-franchise-cant-dover.trycloudflare.com/api';
  }
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err: any) {
    if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      API_BASE_URL.startsWith('http://localhost')
    ) {
      throw new Error(
        `Không thể kết nối API (${API_BASE_URL}): Website đang chạy trên HTTPS (GitHub Pages) mà chưa được cấu hình biến môi trường VITE_API_URL trỏ về máy chủ backend công khai.`
      );
    }
    if (err?.message === 'Failed to fetch' || err?.name === 'TypeError') {
      throw new Error(
        `Không thể kết nối đến máy chủ API (${API_BASE_URL}). Vui lòng kiểm tra kết nối mạng hoặc đảm bảo máy chủ backend đang hoạt động.`
      );
    }
    throw err;
  }
}

// In-memory access token storage (Never stored in localStorage!)
let currentAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  currentAccessToken = token;
};

export const getAccessToken = () => currentAccessToken;

export interface AuthUser {
  id: string;
  username: string;
  role: 'ADMIN' | 'USER';
  fullName?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface SubjectItem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  isPaid: boolean;
  price: number;
  isPublished: boolean;
  orderIndex: number;
  lessonCount: number;
  questionCount: number;
  hasAccess: boolean;
  isPermanent: boolean;
  expiresAt: string | null;
  remainingDays: number | null;
  accessBadgeText: string;
}

export interface LessonDetail {
  id: string;
  slug: string;
  lessonNumber: number;
  title: string;
  description?: string;
  isActive: boolean;
  questionCount: number;
  status: 'available' | 'coming_soon';
}

export interface SubjectDetail extends SubjectItem {
  lessons: LessonDetail[];
}

export interface QuizQuestionOption {
  id: string;
  key: string;
  displayKey?: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  displayNumber?: number;
  questionNumber: number;
  content: string;
  questionType?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'FILL_BLANKS' | 'MATCHING' | 'TRUE_FALSE_GROUP' | 'DRAG_DROP' | 'MULTI_COLUMN_DRAG_DROP';
  explanation?: string;
  correctKey?: string | null;
  metadata?: any;
  options: QuizQuestionOption[];
  lesson?: { id: string; title: string; lessonNumber: number };
}

export interface QuizData {
  attemptId?: string;
  parentAttemptId?: string | null;
  resumed?: boolean;
  draftAnswers?: Record<string, string[]>;
  lesson: {
    id: string;
    slug: string;
    lessonNumber: number;
    title: string;
    description?: string;
  };
  subject: {
    id: string;
    slug: string;
    title: string;
    isPaid: boolean;
  };
  totalQuestions: number;
  questions: QuizQuestion[];
}

export interface QuizReviewItem {
  questionId: string;
  displayNumber?: number;
  questionContent: string;
  questionType?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'FILL_BLANKS' | 'MATCHING' | 'TRUE_FALSE_GROUP' | 'DRAG_DROP' | 'MULTI_COLUMN_DRAG_DROP';
  selectedKey: string | null;
  selectedOptionIds?: string[];
  textAnswer?: string | null;
  correctKey: string;
  isCorrect: boolean;
  explanation: string | null;
  isRetried?: boolean;
  metadata?: any;
  options?: Array<{
    id: string;
    displayKey: string;
    key: string;
    text: string;
    isCorrect: boolean;
  }>;
}

export interface QuizSubmitResult {
  attemptId: string;
  retryAttemptId?: string;
  hasRetriedWrong?: boolean;
  score: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  completedAt: string;
  review: QuizReviewItem[];
}

export interface QuizAttemptHistoryItem {
  id: string;
  subjectTitle: string;
  subjectSlug: string;
  lessonTitle: string;
  lessonNumber: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  completedAt: string;
  hasRetriedWrong?: boolean;
}

export interface QuizAttemptDetailResponse {
  id: string;
  subjectTitle: string;
  lessonTitle: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  completedAt: string;
  hasRetriedWrong?: boolean;
  review?: QuizReviewItem[];
  answers: Array<{
    questionId: string;
    content: string;
    selectedKey: string | null;
    correctKey: string | null;
    isCorrect: boolean;
    options: Array<{
      key: string;
      text: string;
      isCorrect: boolean;
    }>;
  }>;
}

export interface AdminDashboardData {
  message: string;
  adminUser: string;
  statistics: {
    totalUsers: number;
    activeUsers: number;
    activeSessions: number;
    totalSubjects: number;
    totalLessons: number;
    totalQuestions: number;
    totalQuizAttempts: number;
    totalGrantedAccess: number;
    totalAuditLogs: number;
  };
}

export interface AdminUserItem {
  id: string;
  username: string;
  fullName?: string | null;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  deviceTransferCount: number;
  isTotpEnabled?: boolean;
  activeDevice?: {
    deviceId: string;
    deviceName: string;
    lastSeenAt: string;
    createdAt: string;
  } | null;
  hasActiveSession: boolean;
  createdAt: string;
  attemptCount: number;
  activeSubjectCount: number;
}

export interface DeviceTransferAuditItem {
  id: string;
  userId: string;
  oldDeviceId: string | null;
  newDeviceId: string | null;
  transferType: 'TRANSFER' | 'RECOVERY';
  reason: string;
  createdAt: string;
  user: { id: string; username: string; fullName: string | null };
  admin: { id: string; username: string; fullName: string | null };
}

export interface CheckDeviceResponse {
  status: 'ADMIN' | 'BINDING_REQUIRED' | 'DEVICE_MATCH' | 'DEVICE_MISMATCH' | 'READY';
  isTotpEnabled?: boolean;
  registeredDeviceName?: string;
  deviceId?: string;
  message?: string;
  challenge: string;
}

export interface UserSubjectAccessItem {
  subjectId: string;
  slug: string;
  title: string;
  hasAccess: boolean;
  grantedAt: string | null;
  expiresAt: string | null;
}

export interface UserAccessDetailResponse {
  user: {
    id: string;
    username: string;
    fullName?: string | null;
    role: 'ADMIN' | 'USER';
  };
  subjects: UserSubjectAccessItem[];
}

export interface AuditLogItem {
  id: string;
  adminId: string;
  adminName: string;
  userId: string;
  userName: string;
  subjectId: string;
  subjectTitle: string;
  action: 'GRANT' | 'REVOKE';
  note?: string | null;
  createdAt: string;
}

const authHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (currentAccessToken) {
    headers['Authorization'] = `Bearer ${currentAccessToken}`;
  }
  return headers;
};

export const api = {
  // ==================== AUTH ====================
  async checkDevice(username: string, deviceId?: string): Promise<CheckDeviceResponse> {
    const res = await safeFetch(`${API_BASE_URL}/auth/check-device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, deviceId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi kiểm tra thiết bị');
    }
    return data;
  },

  async bindDevice(payload: {
    username: string;
    password: string;
    activationCode: string;
    deviceId: string;
    deviceName: string;
    publicKey: string;
    challenge: string;
    signature: string;
  }): Promise<AuthResponse & { device: { deviceId: string; deviceName: string } }> {
    const res = await safeFetch(`${API_BASE_URL}/auth/bind-device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message || 'Liên kết thiết bị thất bại';
      throw new Error(msg);
    }

    setAccessToken(data.accessToken);
    return data;
  },

  async login(
    username: string,
    password: string,
    deviceData?: {
      deviceId?: string;
      deviceName?: string;
      publicKey?: string;
      challenge?: string;
      signature?: string;
    },
  ): Promise<AuthResponse | { mfaRequired: true; mfaTicket: string }> {
    const res = await safeFetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username,
        password,
        ...deviceData,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message || 'Đăng nhập thất bại';
      throw new Error(msg);
    }

    if (data.mfaRequired) {
      return data;
    }

    setAccessToken(data.accessToken);
    return data;
  },

  async mfaVerify(mfaTicket: string, totpCode: string): Promise<AuthResponse> {
    const res = await safeFetch(`${API_BASE_URL}/auth/mfa-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ mfaTicket, totpCode }),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message || 'Mã xác thực không chính xác';
      throw new Error(msg);
    }

    setAccessToken(data.accessToken);
    return data;
  },

  async adminMfaSetup(): Promise<{ secret: string; otpauthUrl: string }> {
    const res = await safeFetch(`${API_BASE_URL}/auth/admin/mfa/setup`, {
      method: 'POST',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi thiết lập MFA');
    return data;
  },

  async adminMfaEnable(secret: string, totpCode: string): Promise<{ message: string }> {
    const res = await safeFetch(`${API_BASE_URL}/auth/admin/mfa/enable`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ secret, totpCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi kích hoạt MFA');
    return data;
  },

  async adminMfaDisable(totpCode: string): Promise<{ message: string }> {
    const res = await safeFetch(`${API_BASE_URL}/auth/admin/mfa/disable`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ totpCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi tắt MFA');
    return data;
  },

  async refreshToken(): Promise<AuthResponse> {
    const res = await safeFetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) {
      setAccessToken(null);
      throw new Error(data.message || 'Phiên làm việc đã hết hạn');
    }

    setAccessToken(data.accessToken);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await safeFetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
      });
    } finally {
      setAccessToken(null);
    }
  },

  async getMe(): Promise<AuthUser> {
    const res = await safeFetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi tải thông tin tài khoản');
    }
    return data;
  },

  // ==================== SUBJECTS & QUIZ ====================
  async getSubjects(): Promise<SubjectItem[]> {
    const res = await safeFetch(`${API_BASE_URL}/subjects`, {
      method: 'GET',
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi tải danh sách môn học');
    }
    return data;
  },

  async getSubject(slug: string): Promise<SubjectDetail> {
    const res = await safeFetch(`${API_BASE_URL}/subjects/${slug}`, {
      method: 'GET',
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi tải thông tin môn học');
    }
    return data;
  },

  async startQuiz(
    lessonId: string,
    questionCount?: number,
    forceNew: boolean = false,
    questionIds?: string[],
  ): Promise<QuizData> {
    const res = await safeFetch(`${API_BASE_URL}/quiz/start`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ lessonId, questionCount, forceNew, questionIds }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi khởi tạo đề thi');
    }
    return data;
  },

  async getActiveAttempt(lessonId: string): Promise<QuizData | null> {
    const res = await safeFetch(`${API_BASE_URL}/quiz/attempt/active/${lessonId}`, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (res.status === 404) return null;
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi kiểm tra bài làm dở');
    }
    return data.hasActive ? data.data : null;
  },

  async saveDraftAnswer(
    attemptId: string,
    questionId: string,
    selectedOptionIds: string[],
  ): Promise<void> {
    try {
      await safeFetch(`${API_BASE_URL}/quiz/attempt/${attemptId}/draft`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ questionId, selectedOptionIds }),
      });
    } catch {
      // Non-blocking autosave
    }
  },

  async getLessonQuiz(lessonId: string): Promise<QuizData> {
    const res = await safeFetch(`${API_BASE_URL}/quiz/lesson/${lessonId}`, {
      method: 'GET',
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi tải đề bài');
    }
    return data;
  },

  async checkAnswer(
    lessonId: string,
    questionId: string,
    selectedOptionIdOrKey: string,
  ): Promise<{
    questionId: string;
    questionType?: string;
    selectedKey?: string;
    selectedOptionId?: string;
    selectedOptionIds?: string[];
    isCorrect: boolean;
    correctOptionId?: string | null;
    correctOptionIds?: string[];
    correctKey: string;
    explanation: string | null;
    options?: Array<{
      id: string;
      key: string;
      text: string;
      isCorrect: boolean;
    }>;
  }> {
    const res = await safeFetch(`${API_BASE_URL}/quiz/check-answer`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ lessonId, questionId, selectedKey: selectedOptionIdOrKey }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi kiểm tra đáp án');
    return data;
  },

  async submitQuiz(
    lessonId: string,
    answers: Record<string, string | string[]>,
    timeSpentSeconds: number,
    attemptId?: string,
  ): Promise<QuizSubmitResult> {
    const url = attemptId
      ? `${API_BASE_URL}/quiz/attempt/${attemptId}/submit`
      : `${API_BASE_URL}/quiz/submit`;

    const res = await safeFetch(url, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ lessonId, answers, timeSpentSeconds, attemptId }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi nộp bài thi');
    }
    return data;
  },

  async retryAttempt(attemptId: string): Promise<QuizData> {
    const res = await safeFetch(`${API_BASE_URL}/quiz/attempt/${attemptId}/retry`, {
      method: 'POST',
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi khởi tạo lượt làm lại câu sai');
    }
    return data;
  },

  async getQuizHistory(): Promise<QuizAttemptHistoryItem[]> {
    const res = await safeFetch(`${API_BASE_URL}/quiz/history`, {
      method: 'GET',
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi tải lịch sử làm bài');
    }
    return data;
  },

  async getQuizAttemptDetail(id: string): Promise<QuizAttemptDetailResponse> {
    const res = await safeFetch(`${API_BASE_URL}/quiz/attempt/${id}`, {
      method: 'GET',
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi tải chi tiết bài làm');
    }
    return {
      ...data,
      answers: data.answers || data.review || [],
      review: data.review || data.answers || [],
    };
  },

  async deleteQuizHistory(): Promise<{ message: string; deletedCount: number }> {
    const res = await safeFetch(`${API_BASE_URL}/quiz/history`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi xóa lịch sử làm bài');
    }
    return data;
  },

  // ==================== ADMIN: DASHBOARD ====================
  async adminGetDashboard(): Promise<AdminDashboardData> {
    const res = await safeFetch(`${API_BASE_URL}/admin/dashboard`, {
      method: 'GET',
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi tải dashboard quản trị');
    }
    return data;
  },

  // ==================== ADMIN: USERS ====================
  async adminGetUsers(search?: string): Promise<AdminUserItem[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const res = await safeFetch(`${API_BASE_URL}/admin/users?${params.toString()}`, {
      method: 'GET',
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi tải danh sách người dùng');
    }
    return data;
  },

  async adminCreateUser(payload: {
    username: string;
    password: string;
    fullName?: string;
  }): Promise<{ message: string; user: AdminUserItem; activationCode?: string }> {
    const res = await safeFetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi tạo tài khoản người dùng');
    }
    return data;
  },

  async adminResetDevice(
    userId: string,
    transferType: 'TRANSFER' | 'RECOVERY',
    reason: string,
  ): Promise<{ message: string; activationCode: string; transferCount: number; isWarning: boolean }> {
    const res = await safeFetch(`${API_BASE_URL}/admin/users/${userId}/reset-device`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ transferType, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi đặt lại thiết bị');
    return data;
  },

  async adminRevokeUserSession(userId: string): Promise<{ message: string }> {
    const res = await safeFetch(`${API_BASE_URL}/admin/users/${userId}/revoke-session`, {
      method: 'POST',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi thu hồi phiên');
    return data;
  },

  async adminGetDeviceTransfers(userId?: string): Promise<DeviceTransferAuditItem[]> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    const res = await safeFetch(`${API_BASE_URL}/admin/device-transfers?${params.toString()}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi tải lịch sử chuyển thiết bị');
    return data;
  },

  async adminUpdateUser(
    id: string,
    data: { fullName?: string },
  ): Promise<{ message: string; user: AdminUserItem }> {
    const res = await safeFetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });

    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Lỗi cập nhật người dùng');
    return body;
  },

  async adminResetPassword(id: string, password: string): Promise<{ message: string }> {
    const res = await safeFetch(`${API_BASE_URL}/admin/users/${id}/reset-password`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi đặt lại mật khẩu');
    }
    return data;
  },

  async adminToggleUserActive(
    id: string,
    isActive: boolean,
  ): Promise<{ message: string }> {
    const res = await safeFetch(`${API_BASE_URL}/admin/users/${id}/toggle-active`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ isActive }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi đổi trạng thái tài khoản');
    }
    return data;
  },

  async adminDeleteUser(id: string): Promise<{ message: string }> {
    const res = await safeFetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi xóa tài khoản');
    }
    return data;
  },

  // ==================== ADMIN: SUBJECT ACCESS & AUDIT ====================
  async adminGetUserAccess(userId: string): Promise<UserAccessDetailResponse> {
    const res = await safeFetch(`${API_BASE_URL}/admin/users/${userId}/access`, {
      method: 'GET',
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi tải quyền truy cập môn học');
    }
    return data;
  },

  async adminSetUserAccess(
    userId: string,
    subjectIds: string[],
    note?: string,
  ): Promise<{ message: string; addedCount: number; removedCount: number }> {
    const res = await safeFetch(`${API_BASE_URL}/admin/users/${userId}/access`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ subjectIds, note }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Lỗi cập nhật quyền truy cập');
    }
    return data;
  },

  async adminGrantAccess(
    userId: string,
    subjectId: string,
    note?: string,
  ): Promise<{ message: string }> {
    const res = await safeFetch(`${API_BASE_URL}/admin/grant-access`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ userId, subjectId, note }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi cấp quyền');
    return data;
  },

  async adminRevokeAccess(
    userId: string,
    subjectId: string,
    note?: string,
  ): Promise<{ message: string }> {
    const res = await safeFetch(`${API_BASE_URL}/admin/revoke-access`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ userId, subjectId, note }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi thu hồi quyền');
    return data;
  },

  async adminGetAuditLogs(limit = 100): Promise<AuditLogItem[]> {
    const res = await safeFetch(`${API_BASE_URL}/admin/audit-logs?limit=${limit}`, {
      method: 'GET',
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi tải nhật ký cấp quyền');
    return data;
  },

  // ==================== ADMIN: CONTENT MANAGEMENT ====================
  async adminCreateSubject(dto: {
    slug: string;
    title: string;
    description?: string;
    isPublished?: boolean;
    orderIndex?: number;
  }): Promise<{ message: string; subject: SubjectItem }> {
    const res = await safeFetch(`${API_BASE_URL}/admin/subjects`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(dto),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi tạo môn học');
    return data;
  },

  async adminUpdateSubject(
    id: string,
    dto: Partial<{ title: string; description: string; isPublished: boolean; orderIndex: number }>,
  ): Promise<{ message: string; subject: SubjectItem }> {
    const res = await safeFetch(`${API_BASE_URL}/admin/subjects/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(dto),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật môn học');
    return data;
  },

  async adminTogglePublishSubject(id: string): Promise<{ message: string; subject: SubjectItem }> {
    const res = await safeFetch(`${API_BASE_URL}/admin/subjects/${id}/toggle-publish`, {
      method: 'PATCH',
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi ẩn/hiện môn học');
    return data;
  },

  async adminCreateLesson(
    subjectId: string,
    dto: { slug: string; title: string; lessonNumber: number; description?: string; isActive?: boolean },
  ): Promise<{ message: string; lesson: LessonDetail }> {
    const res = await safeFetch(`${API_BASE_URL}/admin/subjects/${subjectId}/lessons`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(dto),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi tạo bài học');
    return data;
  },

  async adminUpdateLesson(
    id: string,
    dto: Partial<{ title: string; description: string; lessonNumber: number; isActive: boolean }>,
  ): Promise<{ message: string; lesson: LessonDetail }> {
    const res = await safeFetch(`${API_BASE_URL}/admin/lessons/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(dto),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật bài học');
    return data;
  },

  async adminDeleteLesson(id: string): Promise<{ message: string }> {
    const res = await safeFetch(`${API_BASE_URL}/admin/lessons/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi xóa bài học');
    return data;
  },

  async adminGetQuestions(lessonId?: string, subjectId?: string): Promise<QuizQuestion[]> {
    const params = new URLSearchParams();
    if (lessonId) params.append('lessonId', lessonId);
    if (subjectId) params.append('subjectId', subjectId);

    const res = await safeFetch(`${API_BASE_URL}/admin/questions?${params.toString()}`, {
      method: 'GET',
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi tải ngân hàng câu hỏi');
    return data;
  },

  async adminCreateQuestion(dto: {
    subjectId: string;
    lessonId: string;
    questionNumber: number;
    content: string;
    explanation?: string;
    options: Array<{ key: string; text: string; isCorrect: boolean }>;
  }): Promise<{ message: string; question: QuizQuestion }> {
    const res = await safeFetch(`${API_BASE_URL}/admin/questions`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(dto),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi tạo câu hỏi');
    return data;
  },

  async adminDeleteQuestion(id: string): Promise<{ message: string }> {
    const res = await safeFetch(`${API_BASE_URL}/admin/questions/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi xóa câu hỏi');
    return data;
  },
};
