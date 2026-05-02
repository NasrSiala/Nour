import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useGetMe, getGetMeQueryKey, User, useLogin, useLogout } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react/src/custom-fetch";

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
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

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      localStorage.removeItem("schoolbox_token");
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, login: handleLogin, logout: handleLogout }}>
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
