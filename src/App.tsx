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
import NotFound from "./pages/NotFound";
import { RequireStaff, RequireAdmin, RequireClient } from "./routes/guards";
import { setUnauthorizedHandler, setTokenGetter, isMockApiEnabled } from "./services/api";
import { getAccessToken } from "./services/auth.service";

const queryClient = new QueryClient();

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
      qc.clear();
      navigate("/login", { replace: true });
    });
  }, [navigate, qc]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UnauthorizedHandler />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
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
