import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check credentials and route accordingly
    if (email === "sarah@neverlandcreative.com" && password === "password123") {
      localStorage.setItem("userRole", "client");
      localStorage.setItem("userEmail", email);
      navigate("/portal/overview");
    } else if (email === "hamish@goagentflow.com" && password === "password123") {
      localStorage.setItem("userRole", "staff");
      localStorage.setItem("userEmail", email);
      navigate("/hubs");
    } else {
      alert("Invalid credentials. Please use demo credentials.");
    }
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
      
      <Card className="w-full max-w-md relative z-10 p-8 md:p-12 shadow-xl border-0 bg-white/95 backdrop-blur-sm animate-fade-in">
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
              disabled
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-gradient-blue to-gradient-blue/90 text-white shadow-lg opacity-60 cursor-not-allowed"
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
              Sign in with Microsoft (Illustrative)
            </Button>

            {/* OR Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[hsl(var(--gradient-purple))]/20"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-[hsl(var(--medium-grey))]">Or</span>
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
              <Button 
                type="submit"
                className="w-full h-12 text-base font-semibold bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
              >
                Sign In
              </Button>
            </form>

            {/* Demo Credentials Section */}
            <div className="pt-4 space-y-3">
              <p className="text-sm text-[hsl(var(--medium-grey))] text-center font-medium">
                Demo Credentials
              </p>
              <div className="grid gap-3">
                {/* Client Demo */}
                <Card 
                  className="p-4 cursor-pointer hover:border-[hsl(var(--gradient-blue))] hover:shadow-md transition-all duration-200"
                  onClick={() => fillDemoCredentials("sarah@neverlandcreative.com", "password123")}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[hsl(var(--bold-royal-blue))]">Client Login</p>
                    <p className="text-xs text-[hsl(var(--medium-grey))]">sarah@neverlandcreative.com</p>
                    <p className="text-xs text-[hsl(var(--medium-grey))]">password123</p>
                  </div>
                </Card>
                
                {/* Staff Demo */}
                <Card 
                  className="p-4 cursor-pointer hover:border-[hsl(var(--deep-navy))] hover:shadow-md transition-all duration-200"
                  onClick={() => fillDemoCredentials("hamish@goagentflow.com", "password123")}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[hsl(var(--deep-navy))]">AgentFlow Staff</p>
                    <p className="text-xs text-[hsl(var(--medium-grey))]">hamish@goagentflow.com</p>
                    <p className="text-xs text-[hsl(var(--medium-grey))]">password123</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4">
            <p className="text-sm text-medium-grey">
              © 2025 AgentFlow. All rights reserved.
            </p>
          </div>
        </div>
      </Card>

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
