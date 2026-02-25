/**
 * Document service
 *
 * Operations for document upload, management, and engagement tracking.
 */

import type {
  Document,
  UpdateDocumentRequest,
  DocumentEngagement,
  PaginatedList,
  PaginationParams,
  DocumentFilterParams,
  DocumentCategory,
  DocumentVisibility,
  BulkDocumentActionRequest,
} from "@/types";
import { api, isMockApiEnabled, simulateDelay } from "./api";
import { mockDocuments } from "./mock-data";

/**
 * Get documents for a hub
 */
export async function getDocuments(
  hubId: string,
  params?: PaginationParams & DocumentFilterParams
): Promise<PaginatedList<Document>> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);
    const search = params?.search?.toLowerCase();
    const filtered = mockDocuments.filter((d) => {
      if (d.hubId !== hubId) return false;
      if (params?.projectId === "unassigned" && d.projectId) return false;
      if (params?.projectId && params.projectId !== "unassigned" && d.projectId !== params.projectId) return false;
      if (params?.visibility && d.visibility !== params.visibility) return false;
      if (params?.category && d.category !== params.category) return false;
      if (search && !d.name.toLowerCase().includes(search) && !d.description?.toLowerCase().includes(search)) return false;
      return true;
    });
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    return {
      items: filtered,
      pagination: { page, pageSize, totalItems: filtered.length, totalPages: Math.ceil(filtered.length / pageSize) },
    };
  }

  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);
  if (params?.projectId) queryParams.projectId = params.projectId;
  if (params?.visibility) queryParams.visibility = params.visibility;
  if (params?.category) queryParams.category = params.category;
  if (params?.search) queryParams.search = params.search;

  return api.get<PaginatedList<Document>>(`/hubs/${hubId}/documents`, queryParams);
}

/**
 * Get single document by ID
 */
export async function getDocument(hubId: string, documentId: string): Promise<Document> {
  if (isMockApiEnabled()) {
    await simulateDelay(200);
    const doc = mockDocuments.find((d) => d.id === documentId);
    if (!doc) throw new Error("Document not found");
    return doc;
  }

  return api.get<Document>(`/hubs/${hubId}/documents/${documentId}`);
}

/**
 * Upload a new document
 */
export async function uploadDocument(
  hubId: string,
  file: File,
  name: string,
  category: DocumentCategory,
  visibility: DocumentVisibility,
  description?: string
): Promise<Document> {
  if (isMockApiEnabled()) {
    await simulateDelay(1000);

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      hubId,
      name,
      description: description || null,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      category,
      visibility,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "user-staff-1",
      uploadedByName: "Hamish Nicklin",
      downloadUrl: URL.createObjectURL(file),
      embedUrl: null,
      views: 0,
      downloads: 0,
      versions: [],
    };

    mockDocuments.push(newDoc);
    return newDoc;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name);
  formData.append("category", category);
  formData.append("visibility", visibility);
  if (description) formData.append("description", description);

  return api.upload<Document>(`/hubs/${hubId}/documents`, formData);
}

/**
 * Update document metadata
 */
export async function updateDocument(
  hubId: string,
  documentId: string,
  data: UpdateDocumentRequest
): Promise<Document> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);

    const index = mockDocuments.findIndex((d) => d.id === documentId);
    if (index === -1) throw new Error("Document not found");

    mockDocuments[index] = { ...mockDocuments[index], ...data };
    return mockDocuments[index];
  }

  return api.patch<Document>(`/hubs/${hubId}/documents/${documentId}`, data);
}

/**
 * Delete document
 */
export async function deleteDocument(hubId: string, documentId: string): Promise<void> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);
    const index = mockDocuments.findIndex((d) => d.id === documentId);
    if (index !== -1) mockDocuments.splice(index, 1);
    return;
  }

  return api.delete(`/hubs/${hubId}/documents/${documentId}`);
}

/**
 * Get document engagement analytics
 */
export async function getDocumentEngagement(
  hubId: string,
  documentId: string
): Promise<DocumentEngagement> {
  if (isMockApiEnabled()) {
    await simulateDelay(200);
    const doc = mockDocuments.find((d) => d.id === documentId);
    return {
      documentId,
      totalViews: doc?.views || 0,
      totalDownloads: doc?.downloads || 0,
      uniqueViewers: 2,
      viewHistory: [],
    };
  }

  return api.get<DocumentEngagement>(`/hubs/${hubId}/documents/${documentId}/engagement`);
}

/**
 * Bulk actions on documents
 */
export async function bulkDocumentAction(
  hubId: string,
  data: BulkDocumentActionRequest
): Promise<void> {
  if (isMockApiEnabled()) {
    await simulateDelay(500);

    if (data.action === "delete") {
      data.documentIds.forEach((id) => {
        const index = mockDocuments.findIndex((d) => d.id === id);
        if (index !== -1) mockDocuments.splice(index, 1);
      });
    } else if (data.action === "set_visibility" && data.visibility) {
      data.documentIds.forEach((id) => {
        const doc = mockDocuments.find((d) => d.id === id);
        if (doc) doc.visibility = data.visibility!;
      });
    } else if (data.action === "set_category" && data.category) {
      data.documentIds.forEach((id) => {
        const doc = mockDocuments.find((d) => d.id === id);
        if (doc) doc.category = data.category!;
      });
    }
    return;
  }

  return api.post(`/hubs/${hubId}/documents/bulk`, data);
}

/**
 * Download a document — fetches a signed URL from the middleware and opens it.
 *
 * Staff endpoints require Azure AD token; portal endpoints require portal JWT.
 * Both are handled automatically by the api client's token injection.
 */
export async function downloadDocument(
  hubId: string,
  documentId: string,
  opts?: { portal?: boolean }
): Promise<void> {
  if (isMockApiEnabled()) {
    // In mock mode, fall back to the document's downloadUrl directly
    const doc = mockDocuments.find((d) => d.id === documentId);
    if (doc?.downloadUrl) window.open(doc.downloadUrl, "_blank");
    return;
  }

  const endpoint = opts?.portal
    ? `/hubs/${hubId}/portal/documents/${documentId}/download`
    : `/hubs/${hubId}/documents/${documentId}/download`;

  const result = await api.get<{ url: string }>(endpoint);

  if (result.url) {
    // Create a temporary link for download (opens in new tab)
    const a = document.createElement("a");
    a.href = result.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Get a preview URL for a document (does NOT increment download counter).
 * Returns { url, expiresAt } where expiresAt is an ISO timestamp.
 */
export async function getDocumentPreviewUrl(
  hubId: string,
  documentId: string,
  opts?: { portal?: boolean }
): Promise<{ url: string; expiresAt: string }> {
  if (isMockApiEnabled()) {
    await simulateDelay(200);
    const doc = mockDocuments.find((d) => d.id === documentId);
    return {
      url: doc?.downloadUrl || "",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  const endpoint = opts?.portal
    ? `/hubs/${hubId}/portal/documents/${documentId}/preview`
    : `/hubs/${hubId}/documents/${documentId}/preview`;

  return api.get<{ url: string; expiresAt: string }>(endpoint);
}

/**
 * Get client-visible documents (portal view)
 */
export async function getPortalDocuments(
  hubId: string,
  params?: PaginationParams
): Promise<PaginatedList<Document>> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);
    const filtered = mockDocuments.filter(
      (d) => d.hubId === hubId && d.visibility === "client"
    );
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
    return {
      items: paged,
      pagination: { page, pageSize, totalItems: filtered.length, totalPages: Math.ceil(filtered.length / pageSize) },
    };
  }

  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);

  return api.get<PaginatedList<Document>>(`/hubs/${hubId}/portal/documents`, queryParams);
}
