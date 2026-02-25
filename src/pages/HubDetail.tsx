import { HubLayout } from "@/components/HubLayout";
import { OverviewSection } from "@/components/OverviewSection";
import { ProposalSection } from "@/components/ProposalSection";
import { ClientPortalSection } from "@/components/ClientPortalSection";
import { VideosSection } from "@/components/VideosSection";
import { DocumentsSection } from "@/components/DocumentsSection";
import { StaffMessageFeed } from "@/components/messages/StaffMessageFeed";
import { MeetingsSection } from "@/components/MeetingsSection";
import { QuestionnaireSection } from "@/components/QuestionnaireSection";
// Client hub components
import { ProjectList } from "@/components/projects/ProjectList";
import { StaffDecisionsSection } from "@/components/StaffDecisionsSection";
import { IntelligenceSection } from "@/components/IntelligenceSection";
import { useLocation, useParams, Navigate } from "react-router-dom";
import { HubProvider } from "@/contexts/hub-context";

export default function HubDetail() {
  const { hubId } = useParams<{ hubId: string }>();
  const location = useLocation();
  const path = location.pathname;

  // Guard: hubId is required
  if (!hubId) {
    return <Navigate to="/hubs" replace />;
  }

  const renderSection = () => {
    // Pitch hub sections
    if (path.includes('/client-portal')) return <ClientPortalSection />;
    if (path.includes('/proposal')) return <ProposalSection />;
    if (path.includes('/videos')) return <VideosSection />;
    if (path.includes('/questionnaire')) return <QuestionnaireSection />;
    // Client hub sections
    if (path.includes('/projects')) return <ProjectList hubId={hubId} />;
    if (path.includes('/decisions')) return <StaffDecisionsSection />;
    if (path.includes('/intelligence')) return <IntelligenceSection />;
    // Shared sections (both hub types)
    if (path.includes('/documents')) return <DocumentsSection />;
    if (path.includes('/messages')) return <StaffMessageFeed />;
    if (path.includes('/meetings')) return <MeetingsSection />;
    return <OverviewSection />;
  };

  return (
    <HubProvider hubId={hubId}>
      <HubLayout>
        {renderSection()}
      </HubLayout>
    </HubProvider>
  );
}
