/**
 * Standard API types
 * Flat error shape matching frontend src/types/common.ts
 */

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  correlationId?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedList<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * User context extracted from JWT token or dev headers
 */
export interface UserContext {
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  isStaff: boolean;
  portalHubId?: string;
}

/**
 * Hub access permissions
 */
export interface HubAccess {
  hubId: string;
  canView: boolean;
  canEdit: boolean;
  canInvite: boolean;
  canViewInternal: boolean;
  accessLevel: 'full_access' | 'proposal_only' | 'documents_only' | 'view_only';
}

/**
 * Hub status
 */
export type HubStatus = 'draft' | 'active' | 'won' | 'lost';

/**
 * Hub type
 */
export type HubType = 'pitch' | 'client';

/**
 * Document visibility
 */
export type DocumentVisibility = 'client' | 'internal';

/**
 * Document category
 */
export type DocumentCategory = 'proposal' | 'contract' | 'reference' | 'brief' | 'deliverable' | 'other';
