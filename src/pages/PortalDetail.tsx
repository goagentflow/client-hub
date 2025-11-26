import { Routes, Route, Navigate } from "react-router-dom";
import { ClientHubLayout } from "@/components/ClientHubLayout";
import { ClientOverviewSection } from "@/components/ClientOverviewSection";
import { ClientProposalSection } from "@/components/ClientProposalSection";
import { ClientVideosSection } from "@/components/ClientVideosSection";

const PortalDetail = () => {
  return (
    <ClientHubLayout hubName="Your AgentFlow Hub" viewMode="client">
      <Routes>
        <Route path="overview" element={<ClientOverviewSection />} />
        <Route path="proposal" element={<ClientProposalSection />} />
        <Route path="videos" element={<ClientVideosSection />} />
        <Route path="documents" element={<div className="text-[hsl(var(--dark-grey))]">Documents Section (Coming Soon)</div>} />
        <Route path="messages" element={<div className="text-[hsl(var(--dark-grey))]">Messages Section (Coming Soon)</div>} />
        <Route path="meetings" element={<div className="text-[hsl(var(--dark-grey))]">Meetings Section (Coming Soon)</div>} />
        <Route path="/" element={<Navigate to="overview" replace />} />
      </Routes>
    </ClientHubLayout>
  );
};

export default PortalDetail;
