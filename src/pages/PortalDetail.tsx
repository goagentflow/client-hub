import { Routes, Route, Navigate } from "react-router-dom";
import { ClientHubLayout } from "@/components/ClientHubLayout";
import { ClientOverviewSection } from "@/components/ClientOverviewSection";
import { ClientProposalSection } from "@/components/ClientProposalSection";
import { ClientVideosSection } from "@/components/ClientVideosSection";
import { ClientDocumentsSection } from "@/components/ClientDocumentsSection";
import { ClientMessagesSection } from "@/components/ClientMessagesSection";
import { ClientMeetingsSection } from "@/components/ClientMeetingsSection";
import { ClientQuestionnaireSection } from "@/components/ClientQuestionnaireSection";

const PortalDetail = () => {
  return (
    <ClientHubLayout hubName="Your AgentFlow Hub" viewMode="client">
      <Routes>
        <Route path="overview" element={<ClientOverviewSection />} />
        <Route path="proposal" element={<ClientProposalSection />} />
        <Route path="videos" element={<ClientVideosSection />} />
        <Route path="documents" element={<ClientDocumentsSection />} />
        <Route path="messages" element={<ClientMessagesSection />} />
        <Route path="meetings" element={<ClientMeetingsSection />} />
        <Route path="questionnaire" element={<ClientQuestionnaireSection />} />
        <Route path="/" element={<Navigate to="overview" replace />} />
      </Routes>
    </ClientHubLayout>
  );
};

export default PortalDetail;
