import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useGetMe, getGetMeQueryKey, User, useLogin, useLogout } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react/src/custom-fetch";
import { useQueryClient } from "@tanstack/react-query";

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterCredentials {
  username: string;
  password: string;
  fullName: string;
  role: "teacher" | "student";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("schoolbox_token"));

  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  const queryKey = getGetMeQueryKey();
  const { data: user, isLoading, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      queryKey,
    },
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const handleLogin = async (credentials: LoginCredentials) => {
    const res = await loginMutation.mutateAsync({ data: credentials });
    localStorage.setItem("schoolbox_token", res.token);
    setToken(res.token);
    await refetch();
  };

  const handleRegister = async (credentials: RegisterCredentials) => {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Registration failed");
    }
    const data = await res.json();
    localStorage.setItem("schoolbox_token", data.token);
    setToken(data.token);
    await refetch();
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      localStorage.removeItem("schoolbox_token");
      setToken(null);
      queryClient.clear();
    }
  };

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, login: handleLogin, register: handleRegister, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
