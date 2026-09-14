import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { apiRequest, setTokenStore } from "../api/client";
import { User } from "../types";

const REFRESH_TOKEN_KEY = "clin.refreshToken";

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "PATIENT" | "DOCTOR";
  patientProfile?: {
    dateOfBirth?: string;
    sex?: string;
    bloodType?: string;
    allergies?: string;
    emergencyContact?: string;
  };
  doctorProfile?: { specialty: string; licenseNumber: string; bio?: string };
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTokenStore({
      getAccessToken: () => accessTokenRef.current,
      getRefreshToken: () => refreshTokenRef.current,
      setTokens: (accessToken, refreshToken) => {
        accessTokenRef.current = accessToken;
        refreshTokenRef.current = refreshToken;
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken).catch(() => undefined);
      },
      clearTokens: () => {
        accessTokenRef.current = null;
        refreshTokenRef.current = null;
        setUser(null);
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => undefined);
      },
    });

    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (stored) {
          refreshTokenRef.current = stored;
          // No access token yet: this 401s, which makes the client silently
          // refresh using the stored refresh token, then retries and succeeds.
          const { user: me } = await apiRequest<{ user: User }>("/auth/me");
          setUser(me);
        }
      } catch {
        // Not logged in, or the stored refresh token is no longer valid.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{ accessToken: string; refreshToken: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    accessTokenRef.current = data.accessToken;
    refreshTokenRef.current = data.refreshToken;
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
    setUser(data.user);
  };

  const register = async (payload: RegisterPayload) => {
    await apiRequest("/auth/register", { method: "POST", body: JSON.stringify(payload) });
    await login(payload.email, payload.password);
  };

  const logout = async () => {
    const refreshToken = refreshTokenRef.current;
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    setUser(null);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => undefined);
    if (refreshToken) {
      apiRequest("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }).catch(() => undefined);
    }
  };

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
