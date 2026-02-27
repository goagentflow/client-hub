import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import HubList from "./pages/HubList";
import HubDetail from "./pages/HubDetail";
import PortalDetail from "./pages/PortalDetail";
import LeadershipPortfolio from "./pages/LeadershipPortfolio";
import StaffLauncher from "./pages/StaffLauncher";
import NotFound from "./pages/NotFound";
import { RequireStaff, RequireAdmin, RequireClient } from "./routes/guards";
import { setUnauthorizedHandler, setTokenGetter, isMockApiEnabled, ApiRequestError } from "./services/api";
import { getAccessToken, completeMsalRedirect } from "./services/auth.service";

const NON_RETRIABLE = new Set([400, 401, 403, 404, 409, 422, 501]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiRequestError && NON_RETRIABLE.has(error.status)) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

// Wire MSAL token acquisition into API client (production only)
if (!isMockApiEnabled()) {
  setTokenGetter(getAccessToken);
}

/**
 * Registers the 401 handler to clear cache and redirect to login
 * Must be inside BrowserRouter for useNavigate access
 */
function UnauthorizedHandler() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      // Portal routes handle their own auth (email gate, password gate, etc.)
      // Don't redirect to login — let the portal page manage the flow.
      if (window.location.pathname.includes("/portal/")) return;
      qc.clear();
      navigate("/login", { replace: true });
    });
  }, [navigate, qc]);

  return null;
}

/**
 * Checks if MSAL redirect login completed during bootstrap.
 * If so, fetches user profile and navigates to the appropriate page.
 * Runs once on mount — no race condition because initializeMsal()
 * already resolved handleRedirectPromise() before React rendered.
 */
function MsalRedirectHandler() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    completeMsalRedirect().then((user) => {
      if (user) {
        qc.invalidateQueries({ queryKey: ["auth"] });
        navigate(user.role === "staff" ? "/launcher" : "/", { replace: true });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <UnauthorizedHandler />
        <MsalRedirectHandler />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/launcher"
            element={
              <RequireStaff>
                <StaffLauncher />
              </RequireStaff>
            }
          />
          <Route
            path="/hubs"
            element={
              <RequireStaff>
                <HubList />
              </RequireStaff>
            }
          />
          <Route
            path="/hub/:hubId/*"
            element={
              <RequireStaff>
                <HubDetail />
              </RequireStaff>
            }
          />
          <Route
            path="/portal/:hubId/*"
            element={
              <RequireClient>
                <PortalDetail />
              </RequireClient>
            }
          />
          <Route
            path="/leadership"
            element={
              <RequireAdmin>
                <LeadershipPortfolio />
              </RequireAdmin>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
