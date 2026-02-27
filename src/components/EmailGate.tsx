/**
 * EmailGate — email verification overlay for client portal access.
 *
 * Step 1: Client enters their email
 * Step 2: Client enters 6-digit code received by email
 * On success: stores portal JWT in sessionStorage, device token in localStorage
 */

import { useState } from "react";
import { Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";

interface EmailGateProps {
  hubId: string;
  companyName: string;
  onSuccess: () => void;
}

export function EmailGate({ hubId, companyName, onSuccess }: EmailGateProps) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const startCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setIsLoading(true);
    setError("");

    try {
      await api.post(`/public/hubs/${hubId}/request-code`, { email: trimmed });
      setStep("code");
      startCooldown();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await api.post<{ data: { valid: boolean; token?: string; deviceToken?: string } }>(
        `/public/hubs/${hubId}/verify-code`,
        { email: email.trim().toLowerCase(), code }
      );

      if (result.data.valid && result.data.token) {
        sessionStorage.setItem(`portal_token_${hubId}`, result.data.token);
        sessionStorage.setItem(`hub_access_${hubId}`, "true");
        if (result.data.deviceToken) {
          localStorage.setItem(`device_token_${hubId}`, JSON.stringify({
            email: email.trim().toLowerCase(),
            token: result.data.deviceToken,
          }));
        }
        onSuccess();
      } else {
        setError("Invalid or expired code. Please try again.");
        setCode("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--warm-cream))]">
      <div className="w-full max-w-md px-6">
        <div className="flex justify-center mb-8">
          <img
            src="https://www.goagentflow.com/assets/images/AgentFlowLogo.svg"
            alt="AgentFlow"
            className="h-12 w-auto"
          />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-[hsl(var(--gradient-blue))]/10 flex items-center justify-center">
              {step === "email" ? (
                <Mail className="h-6 w-6 text-[hsl(var(--gradient-blue))]" />
              ) : (
                <ShieldCheck className="h-6 w-6 text-[hsl(var(--gradient-blue))]" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--dark-grey))]">
              {companyName}
            </h1>
            <p className="text-sm text-[hsl(var(--medium-grey))]">
              {step === "email"
                ? "Enter your email to access this hub"
                : `We've sent a code to ${email}`}
            </p>
          </div>

          {step === "email" ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-center text-lg"
                  autoFocus
                />
                {error && <p className="mt-2 text-sm text-destructive text-center">{error}</p>}
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 text-white font-semibold"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? "Sending..." : "Send Access Code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
                  autoFocus
                />
                {error && <p className="mt-2 text-sm text-destructive text-center">{error}</p>}
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 text-white font-semibold"
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => handleRequestCode()}
                  disabled={resendCooldown > 0}
                  className="h-auto text-sm"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                </Button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[hsl(var(--medium-grey))]">
          {step === "email"
            ? "We'll send a verification code to your email if you have access."
            : "Check your inbox. The code expires in 10 minutes."}
        </p>
        <p className="mt-2 text-center text-xs text-[hsl(var(--medium-grey))]">
          By continuing, you confirm you're authorised by your organisation and agree to{" "}
          <a href="/hub-terms.html" className="underline hover:no-underline">Hub Terms</a>{" "}
          ,{" "}
          <a href="/hub-privacy.html" className="underline hover:no-underline">Hub Privacy Notice</a>
          {" "}and{" "}
          <a href="/hub-cookie-notice.html" className="underline hover:no-underline">Hub Cookie Notice</a>.
        </p>
      </div>
    </div>
  );
}
