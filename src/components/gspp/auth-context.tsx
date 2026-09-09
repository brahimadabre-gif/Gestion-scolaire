"use client";

// ── Contexte d'authentification (session via cookie httpOnly) ──
import { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, MeResponse, type User } from "./api";
import { navigate } from "./router";

interface AuthContextValue {
  user: User | null;
  subscription: MeResponse["subscription"];
  licenseKey: MeResponse["licenseKey"];
  isLoading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  subscription: null,
  licenseKey: null,
  isLoading: true,
  isAdmin: false,
  isStaff: false,
  refresh: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isError } = useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: () => api.get<MeResponse>("/api/auth/me"),
    staleTime: 60_000,
    retry: false,
  });

  // ⚠ TanStack Query conserve les dernières données valides même en cas d'erreur 401 :
  // une session expirée/déconnectée doit renvoyer user = null (état d'erreur = non connecté).
  const user = isError ? null : (data?.user ?? null);

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      // Purge immédiate de l'état local puis revalidation
      queryClient.setQueryData(["me"], null);
      queryClient.removeQueries({ queryKey: ["me"] });
      queryClient.clear();
      navigate("/");
    }
  };

  const value: AuthContextValue = {
    user,
    subscription: user ? (data?.subscription ?? null) : null,
    licenseKey: user ? (data?.licenseKey ?? null) : null,
    isLoading,
    isAdmin: user?.role === "ADMIN",
    isStaff: user?.role === "ADMIN" || user?.role === "SUPPORT",
    refresh: async () => {
      await refetch();
    },
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
