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
import { FolderOpen, Calendar, BarChart3, History, Sparkles, FileText, ChevronRight } from "lucide-react";
import { useCurrentUser, usePortalDocuments } from "@/hooks";
import { StatusUpdateCard, RecentMessagesCard } from "./index";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComingSoonPlaceholder } from "@/components/ui/ComingSoonPlaceholder";
import { CATEGORY_COLOURS, CATEGORY_LABELS } from "@/lib/document-categories";

interface ClientHubOverviewProps {
  hubId: string;
  hubName?: string;
  contactName?: string;
  welcomeHeadline?: string;
  welcomeMessage?: string;
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-GB", { month: "short", day: "numeric" });

export function ClientHubOverview({
  hubId,
  hubName,
  contactName,
  welcomeHeadline,
  welcomeMessage,
}: ClientHubOverviewProps) {
  const { data: authData } = useCurrentUser();
  const displayName = authData?.user?.displayName?.trim();
  const fallbackName = contactName?.trim();
  const userName = (displayName || fallbackName || "").split(" ")[0] || "";
  const { data: recentDocsData } = usePortalDocuments(hubId, { pageSize: 3 });
  const recentDocs = recentDocsData?.items ?? [];

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
            {userName ? `Welcome back, ${userName}` : "Welcome back"}
          </h1>
          {hubName && (
            <p className="text-sm text-[hsl(var(--medium-grey))]">{hubName}</p>
          )}
        </header>

        {(welcomeHeadline || welcomeMessage) && (
          <section aria-label="Welcome message">
            <Card>
              <CardContent className="pt-5">
                {welcomeHeadline && (
                  <h2 className="text-lg font-semibold text-[hsl(var(--dark-grey))]">
                    {welcomeHeadline}
                  </h2>
                )}
                {welcomeMessage && (
                  <p className="mt-2 text-sm text-[hsl(var(--medium-grey))] whitespace-pre-line">
                    {welcomeMessage}
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Status Update — fortnightly update from agency */}
        <section aria-label="Status update">
          <StatusUpdateCard hubId={hubId} />
        </section>

        {/* Recent Documents */}
        <section aria-label="Recent documents">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[hsl(var(--dark-grey))]">
                Recent Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentDocs.length === 0 ? (
                <p className="text-sm text-[hsl(var(--medium-grey))] py-2">
                  No documents shared yet
                </p>
              ) : (
                <div className="space-y-3">
                  {recentDocs.map((doc) => {
                    const colours = CATEGORY_COLOURS[doc.category] ?? CATEGORY_COLOURS.other;
                    return (
                      <div
                        key={doc.id}
                        className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
                      >
                        <div className="p-2 rounded bg-[hsl(var(--gradient-blue))]/10 mt-0.5">
                          <FileText className="h-4 w-4 text-[hsl(var(--gradient-blue))]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[hsl(var(--dark-grey))] truncate">
                            {doc.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`${colours.bg} ${colours.text} border-0 text-xs px-2 py-0`}
                            >
                              {CATEGORY_LABELS[doc.category] ?? "Other"}
                            </Badge>
                            <span className="text-xs text-[hsl(var(--medium-grey))]">
                              {formatDate(doc.uploadedAt)}
                            </span>
                          </div>
                          {doc.description && (
                            <p className="text-xs text-[hsl(var(--medium-grey))] mt-1 line-clamp-1">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {recentDocs.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3 text-[hsl(var(--bold-royal-blue))]"
                  asChild
                >
                  <Link to={`/portal/${hubId}/documents`}>
                    View all documents
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Main Grid: Responsive 2-column on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: placeholder for future features */}
          <div className="space-y-6">
          </div>

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
