/**
 * ClientHubOverviewPage — Orchestrates the client hub overview with dialogs.
 *
 * Extracted from OverviewSection to keep files under 300 lines.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCreateInvite,
  useCreateStatusUpdate,
} from "@/hooks";
import { HubHeader } from "./overview";
import { ClientHubOverviewSection } from "./ClientHubOverviewSection";
import { InviteClientDialog } from "./client-portal/InviteClientDialog";
import { CreateStatusUpdateDialog } from "./status-updates/CreateStatusUpdateDialog";
import type { Hub } from "@/types";

interface ClientHubOverviewPageProps {
  hub: Hub;
  hubId: string;
  onSettings: () => void;
}

export function ClientHubOverviewPage({ hub, hubId, onSettings }: ClientHubOverviewPageProps) {
  const navigate = useNavigate();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);

  const { mutate: createInvite, isPending: isInviting } = useCreateInvite(hubId);
  const { mutate: createStatusUpdate, isPending: isCreatingUpdate } = useCreateStatusUpdate(hubId);

  return (
    <div className="min-h-screen bg-[hsl(var(--warm-cream))]">
      <HubHeader hub={hub} onSettings={onSettings} />
      <ClientHubOverviewSection
        hub={hub}
        onNavigateToProjects={() => navigate(`/hub/${hubId}/projects`)}
        onNavigateToDecisions={() => navigate(`/hub/${hubId}/decisions`)}
        onNavigateToHealth={() => navigate(`/hub/${hubId}/intelligence`)}
        onNavigateToActivity={() => navigate(`/hub/${hubId}/activity`)}
        onInviteClient={() => setInviteOpen(true)}
        onAddStatusUpdate={() => setStatusUpdateOpen(true)}
      />
      <InviteClientDialog
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={(data) => {
          createInvite(data, { onSuccess: () => setInviteOpen(false) });
        }}
        isInviting={isInviting}
        clientDomain={hub.clientDomain}
      />
      <CreateStatusUpdateDialog
        isOpen={statusUpdateOpen}
        onClose={() => setStatusUpdateOpen(false)}
        onSubmit={(data) => {
          createStatusUpdate(data, { onSuccess: () => setStatusUpdateOpen(false) });
        }}
        isSubmitting={isCreatingUpdate}
      />
    </div>
  );
}
