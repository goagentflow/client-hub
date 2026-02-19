import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useLogin, useMsalLogin } from "@/hooks";
import { isMsalConfigured } from "@/config/msal";
import { isMockApiEnabled } from "@/services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: login, isPending, isError } = useLogin();
  const { mutate: msalLogin, isPending: isMsalPending, isError: isMsalError } = useMsalLogin();
  const msalAvailable = isMsalConfigured();
  const isDemoMode = isMockApiEnabled();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  const fillDemoCredentials = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradient background elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-gradient-blue/20 via-gradient-purple/20 to-transparent" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-gradient-purple/20 via-gradient-blue/10 to-transparent rounded-full blur-3xl" />
      
      <div className="w-full max-w-5xl relative z-10 animate-fade-in">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Side: Login Form */}
          <Card className="flex-1 p-8 md:p-12 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <div className="space-y-8">
              {/* Logo */}
              <div className="flex justify-center">
                <img 
                  src="https://www.goagentflow.com/assets/images/AgentFlowLogo.svg" 
                  alt="AgentFlow Logo" 
                  className="h-16 w-auto"
                />
              </div>

              {/* Welcome Content */}
              <div className="space-y-3 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-royal-blue">
                  Welcome to your AgentFlow Hub
                </h1>
                <p className="text-medium-grey text-base md:text-lg">
                  Sign in to access your proposal and collaborate with us
                </p>
              </div>

              {/* Sign In Button - Illustrative Only */}
              <div className="space-y-4">
                <Button
                  disabled={!msalAvailable || isMsalPending}
                  onClick={() => msalLogin()}
                  className={`w-full h-14 text-lg font-semibold bg-gradient-to-r from-gradient-blue to-gradient-blue/90 text-white shadow-lg ${
                    !msalAvailable ? "opacity-60 cursor-not-allowed" : "hover:shadow-xl transition-all duration-300"
                  }`}
                >
                  <svg
                    className="w-6 h-6 mr-3"
                    viewBox="0 0 23 23"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M11 0H0V11H11V0Z" fill="#F25022"/>
                    <path d="M23 0H12V11H23V0Z" fill="#7FBA00"/>
                    <path d="M11 12H0V23H11V12Z" fill="#00A4EF"/>
                    <path d="M23 12H12V23H23V12Z" fill="#FFB900"/>
                  </svg>
                  {isMsalPending ? "Signing in..." : msalAvailable ? "Sign in with Microsoft" : "Sign in with Microsoft (Not Configured)"}
                </Button>
                {isMsalError && (
                  <p className="text-sm text-red-600 text-center">
                    Microsoft sign-in failed. Please try again{isDemoMode ? " or use demo credentials below" : ""}.
                  </p>
                )}

                {/* Demo mode: show email/password form */}
                {isDemoMode && (
                  <>
                    {/* OR Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[hsl(var(--gradient-purple))]/20"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-[hsl(var(--medium-grey))]">Or use demo credentials</span>
                      </div>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[hsl(var(--dark-grey))]">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-[hsl(var(--dark-grey))]">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12"
                          required
                        />
                      </div>
                      {isError && (
                        <p className="text-sm text-red-600 text-center">
                          Invalid credentials. Please use demo credentials.
                        </p>
                      )}
                      <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full h-12 text-base font-semibold bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90 text-white shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-60"
                      >
                        {isPending ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pt-4">
                <p className="text-sm text-medium-grey">
                  © 2025 AgentFlow. All rights reserved.
                </p>
              </div>
            </div>
          </Card>

          {/* Right Side: Demo Credentials (only in demo/mock mode) */}
          {isDemoMode && <Card className="lg:w-96 p-6 md:p-8 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-[hsl(var(--bold-royal-blue))] mb-2">
                  Demo Credentials
                </h2>
                <p className="text-sm text-[hsl(var(--medium-grey))]">
                  Click a card below to auto-fill the login form
                </p>
              </div>

              <div className="space-y-3">
                {/* Staff Demo */}
                <Card
                  className="p-4 cursor-pointer hover:border-[hsl(var(--deep-navy))] hover:shadow-md transition-all duration-200 border-2"
                  onClick={() => fillDemoCredentials("hamish@goagentflow.com", "password123")}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[hsl(var(--deep-navy))]">AgentFlow Staff</p>
                    <p className="text-xs text-[hsl(var(--medium-grey))]">hamish@goagentflow.com</p>
                    <p className="text-xs text-[hsl(var(--sage-green))] mt-1">
                      Full access to Pitch Hubs + Client Hubs + Leadership
                    </p>
                  </div>
                </Card>

                {/* Divider with label */}
                <div className="pt-2">
                  <p className="text-xs font-semibold text-[hsl(var(--medium-grey))] uppercase tracking-wide">Client Logins</p>
                </div>

                {/* Sarah - Pitch Hub Client */}
                <Card
                  className="p-4 cursor-pointer hover:border-[hsl(var(--gradient-blue))] hover:shadow-md transition-all duration-200"
                  onClick={() => fillDemoCredentials("sarah@whitmorelaw.co.uk", "password123")}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[hsl(var(--bold-royal-blue))]">Sarah - Pitch Hub Client</p>
                    <p className="text-xs text-[hsl(var(--medium-grey))]">sarah@whitmorelaw.co.uk</p>
                    <p className="text-xs text-[hsl(var(--gradient-blue))] mt-1">
                      Prospect view: Proposal, Videos, Documents, Meetings
                    </p>
                  </div>
                </Card>

                {/* Alex - Client Hub Client */}
                <Card
                  className="p-4 cursor-pointer hover:border-[hsl(var(--rich-violet))] hover:shadow-md transition-all duration-200"
                  onClick={() => fillDemoCredentials("alex@meridiandigital.co", "password123")}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[hsl(var(--rich-violet))]">Alex - Client Hub Client</p>
                    <p className="text-xs text-[hsl(var(--medium-grey))]">alex@meridiandigital.co</p>
                    <p className="text-xs text-[hsl(var(--rich-violet))] mt-1">
                      Active client view: AI Answers, Decisions, Performance, History
                    </p>
                  </div>
                </Card>
              </div>

              {/* Hub Types Explanation */}
              <div className="pt-2 border-t border-[hsl(var(--gradient-purple))]/20">
                <p className="text-xs text-[hsl(var(--medium-grey))] leading-relaxed">
                  <strong>Pitch Hubs</strong> are for prospects (proposals, pitching).
                  <strong> Client Hubs</strong> are for active clients (projects, AI insights, decisions).
                </p>
              </div>
            </div>
          </Card>}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Login;
