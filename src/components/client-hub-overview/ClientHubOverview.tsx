/**
 * ClientHubOverview - Main container for client hub overview page
 *
 * "What matters to ME right now?" - The client-centric dashboard.
 *
 * Layout (mobile-first, responsive grid):
 * - Status Update (fortnightly agency update)
 * - Project Status (active projects with progress)
 * - Coming Soon cards for features in development
 *
 * @see docs/CLIENT_HUB_OVERVIEW_REDESIGN.md
 */

import { Link } from "react-router-dom";
import { FolderOpen, Calendar, BarChart3, History, Sparkles, MessageSquare } from "lucide-react";
import { useCurrentUser } from "@/hooks";
import { ProjectStatusCard, StatusUpdateCard } from "./index";
import { Card, CardContent } from "@/components/ui/card";
import { ComingSoonPlaceholder } from "@/components/ui/ComingSoonPlaceholder";

interface ClientHubOverviewProps {
  hubId: string;
  hubName?: string;
}

export function ClientHubOverview({ hubId, hubName }: ClientHubOverviewProps) {
  const { data: authData } = useCurrentUser();
  const userName = authData?.user?.displayName?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-[hsl(var(--warm-cream))]">
      <main
        className="max-w-7xl mx-auto p-6 md:p-8 space-y-6"
        role="main"
        aria-label="Client hub overview"
      >
        {/* Welcome Header */}
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))]">
            Welcome back, {userName}
          </h1>
          {hubName && (
            <p className="text-sm text-[hsl(var(--medium-grey))]">{hubName}</p>
          )}
        </header>

        {/* Status Update — fortnightly update from agency */}
        <section aria-label="Status update">
          <StatusUpdateCard hubId={hubId} />
        </section>

        {/* Main Grid: Responsive 2-column on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Projects */}
          <section aria-label="Project status">
            <ProjectStatusCard hubId={hubId} />
          </section>

          {/* Right Column: Coming Soon cards */}
          <div className="space-y-6">
            <section aria-label="Instant answers — coming soon">
              <Card>
                <CardContent className="pt-6">
                  <ComingSoonPlaceholder
                    icon={Sparkles}
                    title="Instant Answers"
                    description="Ask questions about your account and get immediate answers."
                  />
                </CardContent>
              </Card>
            </section>
            <section aria-label="Upcoming meetings — coming soon">
              <Card>
                <CardContent className="pt-6">
                  <ComingSoonPlaceholder
                    icon={Calendar}
                    title="Upcoming Meetings & Events"
                    description="Your upcoming meetings and key milestones, all in one place."
                  />
                </CardContent>
              </Card>
            </section>
            <section aria-label="Messages — coming soon">
              <Card>
                <CardContent className="pt-6">
                  <ComingSoonPlaceholder
                    icon={MessageSquare}
                    title="Messages"
                    description="Direct messaging with your agency team."
                  />
                </CardContent>
              </Card>
            </section>
          </div>
        </div>

        {/* Quick Links Footer - Minimal per spec Section 7 */}
        <footer className="pt-4 border-t border-[hsl(var(--medium-grey))]/20">
          <nav aria-label="Quick links">
            <ul className="flex flex-wrap justify-center gap-6">
              <li>
                <Link
                  to={`/portal/${hubId}/documents`}
                  className="flex items-center gap-2 text-sm text-[hsl(var(--medium-grey))] hover:text-[hsl(var(--bold-royal-blue))] transition-colors"
                >
                  <FolderOpen className="h-4 w-4" aria-hidden="true" />
                  Documents
                </Link>
              </li>
              <li>
                <Link
                  to={`/portal/${hubId}/meetings`}
                  className="flex items-center gap-2 text-sm text-[hsl(var(--medium-grey))]/60 hover:text-[hsl(var(--medium-grey))] transition-colors"
                >
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  Meetings
                  <span className="text-[10px] bg-[hsl(var(--medium-grey))]/10 px-1.5 py-0.5 rounded">Soon</span>
                </Link>
              </li>
              <li>
                <Link
                  to={`/portal/${hubId}/performance`}
                  className="flex items-center gap-2 text-sm text-[hsl(var(--medium-grey))]/60 hover:text-[hsl(var(--medium-grey))] transition-colors"
                >
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />
                  Performance
                  <span className="text-[10px] bg-[hsl(var(--medium-grey))]/10 px-1.5 py-0.5 rounded">Soon</span>
                </Link>
              </li>
              <li>
                <Link
                  to={`/portal/${hubId}/history`}
                  className="flex items-center gap-2 text-sm text-[hsl(var(--medium-grey))]/60 hover:text-[hsl(var(--medium-grey))] transition-colors"
                >
                  <History className="h-4 w-4" aria-hidden="true" />
                  History
                  <span className="text-[10px] bg-[hsl(var(--medium-grey))]/10 px-1.5 py-0.5 rounded">Soon</span>
                </Link>
              </li>
            </ul>
          </nav>
        </footer>
      </main>
    </div>
  );
}
