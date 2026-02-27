/**
 * Route guards for role-based access control
 *
 * Provides components to protect routes based on authentication and role.
 * - RequireAuth: Redirects to login if not authenticated
 * - RequireStaff: Blocks clients from staff routes
 * - RequireAdmin: Blocks non-admin staff from admin routes (e.g., /leadership)
 * - RequireClient: Blocks staff from client routes
 * - RequireHubAccess: Verifies user has access to specific hub
 */

import { Navigate, useLocation, useParams } from "react-router-dom";
import { useCurrentUser, useHubAccess } from "@/hooks";
import { hasAdminAccess } from "@/types";
import { isMockApiEnabled } from "@/services/api";

interface GuardProps {
  children: React.ReactNode;
}

/**
 * Loading spinner for auth checks
 */
function AuthLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#fdfaf6]">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#a6c3e8] border-t-transparent" />
        <p className="mt-4 text-[#6b6b6b]">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Access denied page
 */
function AccessDenied({ message }: { message: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-[#fdfaf6]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#3d5fa8]">Access Denied</h1>
        <p className="mt-2 text-[#6b6b6b]">{message}</p>
        <a
          href="/login"
          className="mt-4 inline-block rounded bg-[#3d5fa8] px-4 py-2 text-white hover:bg-[#2c3e50]"
        >
          Return to Login
        </a>
      </div>
    </div>
  );
}

/**
 * RequireAuth - Redirect to login if not authenticated
 */
export function RequireAuth({ children }: GuardProps) {
  const location = useLocation();
  const { data: authData, isLoading, isError } = useCurrentUser();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (isError || !authData) {
    // Save attempted location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * RequireStaff - Block clients from staff routes
 */
export function RequireStaff({ children }: GuardProps) {
  const { data: authData, isLoading } = useCurrentUser();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!authData) {
    return <Navigate to="/login" replace />;
  }

  if (authData.user.role !== "staff") {
    return <AccessDenied message="This area is restricted to AgentFlow staff." />;
  }

  return <>{children}</>;
}

/**
 * RequireAdmin - Block non-admin staff from admin routes
 *
 * Policy: Leadership views require staff role + admin permissions.
 * Non-admin staff are shown access denied; clients are redirected to login.
 */
export function RequireAdmin({ children }: GuardProps) {
  const { data: authData, isLoading } = useCurrentUser();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!authData) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAdminAccess(authData.user)) {
    return (
      <AccessDenied message="Leadership views require admin permissions. Contact your administrator if you believe you should have access." />
    );
  }

  return <>{children}</>;
}

/**
 * RequireClient - Block staff from client routes
 *
 * Policy: Staff cannot access client portal routes directly.
 * They use the staff "Preview Portal" feature in HubDetail instead.
 * This ensures clean separation between staff and client experiences.
 */
export function RequireClient({ children }: GuardProps) {
  const { data: authData, isLoading } = useCurrentUser();

  // When Supabase hubs are live, the portal handles its own password gate
  // so we skip the demo auth check entirely.
  if (!isMockApiEnabled()) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!authData) {
    return <Navigate to="/login" replace />;
  }

  if (authData.user.role !== "client") {
    // Staff attempting to access client routes are redirected to hub list
    return <Navigate to="/hubs" replace />;
  }

  return <>{children}</>;
}

/**
 * RequireHubAccess - Verify user has access to specific hub
 * Uses hubId from URL params
 */
export function RequireHubAccess({ children }: GuardProps) {
  const { hubId } = useParams<{ hubId: string }>();
  const { data: authData, isLoading: authLoading } = useCurrentUser();
  const { data: accessData, isLoading: accessLoading, isError } = useHubAccess(hubId || "");

  if (authLoading || accessLoading) {
    return <AuthLoading />;
  }

  if (!authData) {
    return <Navigate to="/login" replace />;
  }

  if (isError || !accessData?.hasAccess) {
    return <AccessDenied message="You don't have access to this hub." />;
  }

  return <>{children}</>;
}

/**
 * RedirectByRole - Redirect authenticated users to appropriate home page
 * Used on login page and root route
 */
export function RedirectByRole() {
  const { data: authData, isLoading } = useCurrentUser();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!authData) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  if (authData.user.role === "staff") {
    return <Navigate to="/launcher" replace />;
  }

  // Client: redirect to their first hub
  const firstHub = authData.hubAccess?.[0];
  if (firstHub) {
    return <Navigate to={`/portal/${firstHub.hubId}/overview`} replace />;
  }

  // Hub access list may be empty while membership tables are being built.
  // Check localStorage for a recent hub access (from portal password flow).
  const lastHubId = localStorage.getItem("hubAccessId");
  if (lastHubId) {
    return <Navigate to={`/portal/${lastHubId}/overview`} replace />;
  }

  // No hub access at all — show helpful message
  return (
    <div className="flex h-screen items-center justify-center bg-[#fdfaf6]">
      <div className="text-center max-w-md px-4">
        <h1 className="text-2xl font-bold text-[#3d5fa8]">No Hub Access</h1>
        <p className="mt-2 text-[#6b6b6b]">
          You don't have access to any hubs yet. Please contact the person who invited you,
          or use a direct portal link if you have one.
        </p>
      </div>
    </div>
  );
}
