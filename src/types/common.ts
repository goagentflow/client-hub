/**
 * Common types used across the application
 *
 * Response pattern: Raw payloads for success, ApiError for errors.
 * No nested envelopes - services return T or T[] directly.
 */

// Pagination parameters for list requests
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  filter?: string;
  search?: string;
}

// Pagination metadata in responses
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Paginated list response (returned directly, not wrapped)
export interface PaginatedList<T> {
  items: T[];
  pagination: PaginationMeta;
}

// API Error response (thrown/returned on failure)
export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
  correlationId?: string; // For tracing issues in client demos
}

// Standard error codes
export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "VALIDATION_ERROR"
  | "NOT_IMPLEMENTED";

// Date string in ISO 8601 format
export type ISODateString = string;

// File upload status
export type UploadStatus = "pending" | "uploading" | "complete" | "error";

// Generic ID type (string for flexibility with different backends)
export type EntityId = string;

// Resource reference for share metadata and cross-entity links
export interface ResourceRef {
  type: ResourceType;
  id: EntityId;
}

export type ResourceType = "hub" | "proposal" | "document" | "video" | "meeting" | "questionnaire";
