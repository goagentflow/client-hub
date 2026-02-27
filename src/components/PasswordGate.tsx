/**
 * PasswordGate — full-screen password overlay for client portal access
 *
 * Uses the same simpleHash() function as the static landing pages
 * so the same password works in both places. The hash is sent to a
 * Supabase RPC function for server-side comparison — the stored hash
 * never leaves the database.
 */

import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { simpleHash } from "@/lib/hash";
import { api } from "@/services/api";

interface PasswordGateProps {
  hubId: string;
  companyName: string;
  onSuccess: () => void;
}

export function PasswordGate({ hubId, companyName, onSuccess }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = password.trim();
    if (!trimmed) return;

    setIsChecking(true);
    setError("");

    try {
      const result = await api.post<{ data: { valid: boolean; token?: string } }>(
        `/public/hubs/${hubId}/verify-password`,
        { passwordHash: simpleHash(trimmed) }
      );

      if (result.data.valid && result.data.token) {
        sessionStorage.setItem(`portal_token_${hubId}`, result.data.token);
        sessionStorage.setItem(`hub_access_${hubId}`, "true");
        onSuccess();
      } else {
        setError("Incorrect password. Please try again.");
        setPassword("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--warm-cream))]">
      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="https://www.goagentflow.com/assets/images/AgentFlowLogo.svg"
            alt="AgentFlow"
            className="h-12 w-auto"
          />
        </div>

        {/* Gate card */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-[hsl(var(--gradient-blue))]/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-[hsl(var(--gradient-blue))]" />
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--dark-grey))]">
              {companyName}
            </h1>
            <p className="text-sm text-[hsl(var(--medium-grey))]">
              Enter your password to access this hub
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-center text-lg"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-destructive text-center">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 text-white font-semibold"
              disabled={isChecking || !password.trim()}
            >
              {isChecking ? "Checking..." : "Access Hub"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[hsl(var(--medium-grey))]">
          Your password was included in your invitation email from AgentFlow.
        </p>
        <p className="mt-2 text-center text-xs text-[hsl(var(--medium-grey))]">
          By continuing, you confirm you're authorised by your organisation and agree to{" "}
          <a href="/hub-terms.html" className="underline hover:no-underline">Hub Terms</a>{" "}
          and{" "}
          <a href="/hub-privacy.html" className="underline hover:no-underline">Hub Privacy Notice</a>.
        </p>
      </div>
    </div>
  );
}
