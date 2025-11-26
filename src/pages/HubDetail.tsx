import { HubLayout } from "@/components/HubLayout";
import { OverviewSection } from "@/components/OverviewSection";
import { ProposalSection } from "@/components/ProposalSection";
import { ClientPortalSection } from "@/components/ClientPortalSection";
import { VideosSection } from "@/components/VideosSection";
import { DocumentsSection } from "@/components/DocumentsSection";
import { MessagesSection } from "@/components/MessagesSection";
import { MeetingsSection } from "@/components/MeetingsSection";
import { QuestionnaireSection } from "@/components/QuestionnaireSection";
import { useLocation } from "react-router-dom";

export default function HubDetail() {
  const location = useLocation();
  const path = location.pathname;

  const renderSection = () => {
    if (path.includes('/client-portal')) return <ClientPortalSection />;
    if (path.includes('/proposal')) return <ProposalSection />;
    if (path.includes('/videos')) return <VideosSection />;
    if (path.includes('/documents')) return <DocumentsSection />;
    if (path.includes('/messages')) return <MessagesSection />;
    if (path.includes('/meetings')) return <MeetingsSection />;
    if (path.includes('/questionnaire')) return <QuestionnaireSection />;
    return <OverviewSection />;
  };

  return (
    <HubLayout>
      {renderSection()}
    </HubLayout>
  );
}
