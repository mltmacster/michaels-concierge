import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { getQueryKey } from "@trpc/react-query";
import { useCallback } from "react";

export function getIdentityErrorState(error: unknown) {
  if (error instanceof TRPCClientError) {
    switch (error.data?.code) {
      case "UNAUTHORIZED":
        return "unauthorized";
      case "FORBIDDEN":
        return "forbidden";
      case "SERVICE_UNAVAILABLE":
        return "unavailable";
    }
  }
  return "error";
}

export function useAuth() {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    retry: false,
    onSuccess: async () => {
      // Only a confirmed server logout may discard identity/private query data.
      // Cancel in-flight reads so an old response cannot restore the principal.
      await queryClient.cancelQueries();
      const identityQuery = queryClient.getQueryCache().find({
        queryKey: getQueryKey(trpc.auth.me, undefined, "query"),
        exact: true,
      });
      queryClient.removeQueries({
        predicate: query => query !== identityQuery,
      });
      utils.auth.me.setData(undefined, null);
    },
  });

  // A rejected mutation stays rejected and retains the session/cache. In
  // particular, UNAUTHORIZED is not a successful server-side revocation.
  const logout = useCallback(
    () => logoutMutation.mutateAsync(),
    [logoutMutation]
  );
  const refresh = useCallback(() => meQuery.refetch(), [meQuery]);
  const user = meQuery.data ?? null;
  const status = meQuery.isLoading
    ? "loading"
    : meQuery.error
      ? getIdentityErrorState(meQuery.error)
      : user
        ? "authenticated"
        : "anonymous";

  return {
    // Preserve the backend's user/admin role for existing unused layout callers.
    // identityRole/permissions inform display, never grant backend access.
    user,
    status,
    loading: meQuery.isLoading,
    refreshing: meQuery.isFetching && !meQuery.isLoading,
    authError: meQuery.error,
    error: meQuery.error ?? logoutMutation.error ?? null,
    isAuthenticated: status === "authenticated",
    logoutPending: logoutMutation.isPending,
    logoutError: logoutMutation.error,
    logoutState: logoutMutation.status,
    refresh,
    logout,
  };
}
