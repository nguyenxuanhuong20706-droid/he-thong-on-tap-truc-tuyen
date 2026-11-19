import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAccessToken } from '../services/api';
import type { AuthUser } from '../services/api';
import {
  getOrCreateDeviceKey,
  signChallenge,
  getCachedDeviceId,
} from '../services/deviceSecurity';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    username: string,
    password: string,
  ) => Promise<{ mfaRequired?: boolean; mfaTicket?: string } | void>;
  verifyMfa: (mfaTicket: string, totpCode: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Silent refresh on initial load
  useEffect(() => {
    let isMounted = true;
    const initializeAuth = async () => {
      try {
        const response = await api.refreshToken();
        if (isMounted) {
          setUser(response.user);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (
    username: string,
    password: string,
  ) => {
    const cachedDeviceId = getCachedDeviceId();

    // 1. Pre-check device status
    const check = await api.checkDevice(username, cachedDeviceId || undefined);

    if (check.status === 'ADMIN') {
      const res = await api.login(username, password);
      if ('mfaRequired' in res && res.mfaRequired) {
        return { mfaRequired: true, mfaTicket: res.mfaTicket };
      }
      setUser((res as any).user);
      return;
    }

    if (check.status === 'DEVICE_MISMATCH') {
      const regDevice = check.registeredDeviceName || 'thiết bị khác';
      throw new Error(
        `Tài khoản đã được liên kết với một thiết bị khác (${regDevice}). Mỗi tài khoản chỉ được phép sử dụng trên 1 thiết bị tin cậy duy nhất. Vui lòng liên hệ Quản trị viên để được hỗ trợ chuyển thiết bị.`,
      );
    }

    // AUTO_BIND hoặc DEVICE_MATCH: Lấy/sinh khóa thiết bị và ký thử thách mật mã
    const dev = await getOrCreateDeviceKey();
    let signature: string | undefined;
    if (check.challenge) {
      try {
        signature = await signChallenge(check.challenge);
      } catch {
        // Fallback if signing unavailable
      }
    }

    const res = await api.login(username, password, {
      deviceId: dev.deviceId,
      deviceName: dev.deviceName,
      publicKey: dev.publicKeyBase64,
      challenge: check.challenge,
      signature,
    });

    if ('mfaRequired' in res && res.mfaRequired) {
      return { mfaRequired: true, mfaTicket: res.mfaTicket };
    }

    setUser((res as any).user);
  };

  const verifyMfa = async (mfaTicket: string, totpCode: string) => {
    const res = await api.mfaVerify(mfaTicket, totpCode);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        verifyMfa,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
