/**
 * ClientHubOverview - Main container for client hub overview page
 *
 * "What matters to ME right now?" - The client-centric dashboard.
 *
 * Layout (mobile-first, responsive grid):
 * - Decisions first (urgency-sorted pending decisions)
 * - Quick Ask input (instant answers seeding)
 * - Project Status (active projects with progress)
 * - Upcoming (next meeting + milestones)
 * - Recent Messages (portal messages, not staff)
 *
 * @see docs/CLIENT_HUB_OVERVIEW_REDESIGN.md
 */

import { Link } from "react-router-dom";
import { FolderOpen, Calendar, BarChart3, History } from "lucide-react";
import { useCurrentUser } from "@/hooks";
import {
  DecisionsWaitingCard,
  QuickAskInput,
  ProjectStatusCard,
  StatusUpdateCard,
  UpcomingCard,
  RecentMessagesCard,
} from "./index";

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

        {/* Decisions First - Most Prominent (spec requirement) */}
        <section aria-label="Decisions awaiting your input">
          <DecisionsWaitingCard hubId={hubId} />
        </section>

        {/* Quick Ask - Below decisions */}
        <section aria-label="Quick question">
          <QuickAskInput hubId={hubId} />
        </section>

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

          {/* Right Column: Upcoming + Messages */}
          <div className="space-y-6">
            <section aria-label="Upcoming events">
              <UpcomingCard hubId={hubId} />
            </section>
            <section aria-label="Recent messages">
              <RecentMessagesCard hubId={hubId} />
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
                  className="flex items-center gap-2 text-sm text-[hsl(var(--medium-grey))] hover:text-[hsl(var(--bold-royal-blue))] transition-colors"
                >
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  Meetings
                </Link>
              </li>
              <li>
                <Link
                  to={`/portal/${hubId}/performance`}
                  className="flex items-center gap-2 text-sm text-[hsl(var(--medium-grey))] hover:text-[hsl(var(--bold-royal-blue))] transition-colors"
                >
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />
                  Performance
                </Link>
              </li>
              <li>
                <Link
                  to={`/portal/${hubId}/history`}
                  className="flex items-center gap-2 text-sm text-[hsl(var(--medium-grey))] hover:text-[hsl(var(--bold-royal-blue))] transition-colors"
                >
                  <History className="h-4 w-4" aria-hidden="true" />
                  History
                </Link>
              </li>
            </ul>
          </nav>
        </footer>
      </main>
    </div>
  );
}
