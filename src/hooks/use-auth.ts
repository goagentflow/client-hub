/**
 * Authentication hooks
 *
 * Manages auth state and provides login/logout functionality.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { User, AuthMeResponse, HubAccessCheckResponse } from "@/types";
import {
  loginWithCredentials,
  getCurrentUser,
  checkHubAccess,
  logout,
  storeDemoSession,
} from "@/services";

// Query keys
export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  hubAccess: (hubId: string) => [...authKeys.all, "hub-access", hubId] as const,
};

/**
 * Hook to get current authenticated user
 */
export function useCurrentUser() {
  return useQuery<AuthMeResponse | null>({
    queryKey: authKeys.me(),
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

/**
 * Hook to check hub access
 */
export function useHubAccess(hubId: string) {
  return useQuery<HubAccessCheckResponse>({
    queryKey: authKeys.hubAccess(hubId),
    queryFn: () => checkHubAccess(hubId),
    enabled: !!hubId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<User, Error, { email: string; password: string }>({
    mutationFn: ({ email, password }) => loginWithCredentials(email, password),
    onSuccess: (user) => {
      storeDemoSession(user);
      queryClient.invalidateQueries({ queryKey: authKeys.all });

      if (user.role === "staff") {
        navigate("/hubs");
      } else {
        navigate("/");
      }
    },
  });
}


/**
 * Hook for logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<void, Error>({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      navigate("/login");
    },
  });
}

/**
 * Helper hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { data, isLoading } = useCurrentUser();
  return !isLoading && data !== null;
}

/**
 * Helper hook to get user role
 */
export function useUserRole(): "staff" | "client" | null {
  const { data } = useCurrentUser();
  return data?.user.role ?? null;
}
