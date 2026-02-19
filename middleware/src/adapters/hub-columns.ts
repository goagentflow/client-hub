/**
 * Shared hub column selection — excludes password_hash
 * Used by hubs.route.ts, conversion.route.ts, leadership.route.ts
 */

export const HUB_SELECT = `id, company_name, contact_name, contact_email, status, hub_type, created_at, updated_at, last_activity, clients_invited, last_visit, client_domain, internal_notes, converted_at, converted_by, is_published, welcome_headline, welcome_message, hero_content_type, hero_content_id, show_proposal, show_videos, show_documents, show_messages, show_meetings, show_questionnaire`;
