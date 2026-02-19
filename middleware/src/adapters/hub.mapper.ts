/**
 * Hub row → DTO mappers
 */

export interface HubRow {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  status: string;
  hub_type: string;
  created_at: string;
  updated_at: string;
  last_activity: string;
  clients_invited: number;
  last_visit: string | null;
  client_domain: string;
  internal_notes?: string | null;
  converted_at?: string | null;
  converted_by?: string | null;
  is_published?: boolean;
  welcome_headline?: string | null;
  welcome_message?: string | null;
  hero_content_type?: string | null;
  hero_content_id?: string | null;
  show_proposal?: boolean;
  show_videos?: boolean;
  show_documents?: boolean;
  show_messages?: boolean;
  show_meetings?: boolean;
  show_questionnaire?: boolean;
}

export interface HubDTO {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  status: string;
  hubType: string;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  clientsInvited: number;
  lastVisit: string | null;
  clientDomain: string;
  convertedAt?: string;
  convertedBy?: string;
}

export function mapHubRow(row: HubRow): HubDTO {
  return {
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    status: row.status,
    hubType: row.hub_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastActivity: row.last_activity,
    clientsInvited: row.clients_invited,
    lastVisit: row.last_visit,
    clientDomain: row.client_domain,
    ...(row.converted_at ? { convertedAt: row.converted_at } : {}),
    ...(row.converted_by ? { convertedBy: row.converted_by } : {}),
  };
}

export interface PortalConfigDTO {
  hubId: string;
  isPublished: boolean;
  welcomeHeadline: string;
  welcomeMessage: string;
  heroContentType: string;
  heroContentId: string | null;
  sections: {
    showProposal: boolean;
    showVideos: boolean;
    showDocuments: boolean;
    showMessages: boolean;
    showMeetings: boolean;
    showQuestionnaire: boolean;
  };
}

export function mapPortalConfig(row: HubRow): PortalConfigDTO {
  return {
    hubId: row.id,
    isPublished: row.is_published ?? false,
    welcomeHeadline: row.welcome_headline || '',
    welcomeMessage: row.welcome_message || '',
    heroContentType: row.hero_content_type || 'none',
    heroContentId: row.hero_content_id ?? null,
    sections: {
      showProposal: row.show_proposal ?? true,
      showVideos: row.show_videos ?? true,
      showDocuments: row.show_documents ?? true,
      showMessages: row.show_messages ?? true,
      showMeetings: row.show_meetings ?? true,
      showQuestionnaire: row.show_questionnaire ?? true,
    },
  };
}
