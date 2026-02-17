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
import { api, isMockApiEnabled, isFeatureLive, simulateDelay } from "./api";
import { mockDocuments } from "./mock-data";
import { fetchDocuments as supabaseFetchDocuments, fetchPortalDocuments as supabaseFetchPortalDocuments } from "./supabase-data";

/**
 * Get documents for a hub
 */
export async function getDocuments(
  hubId: string,
  params?: PaginationParams & DocumentFilterParams
): Promise<PaginatedList<Document>> {
  if (isFeatureLive("documents")) {
    return supabaseFetchDocuments(hubId);
  }

  if (isMockApiEnabled()) {
    await simulateDelay(300);

    let filtered = mockDocuments.filter((d) => d.hubId === hubId);

    // Apply projectId filter
    if (params?.projectId) {
      if (params.projectId === "unassigned") {
        filtered = filtered.filter((d) => !d.projectId);
      } else {
        filtered = filtered.filter((d) => d.projectId === params.projectId);
      }
    }

    // Apply visibility filter
    if (params?.visibility) {
      filtered = filtered.filter((d) => d.visibility === params.visibility);
    }

    // Apply category filter
    if (params?.category) {
      filtered = filtered.filter((d) => d.category === params.category);
    }

    // Apply search
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(search) ||
          d.description?.toLowerCase().includes(search)
      );
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;

    return {
      items: filtered,
      pagination: {
        page,
        pageSize,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize),
      },
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
 * Get client-visible documents (portal view)
 */
export async function getPortalDocuments(
  hubId: string,
  params?: PaginationParams
): Promise<PaginatedList<Document>> {
  if (isFeatureLive("documents")) {
    return supabaseFetchPortalDocuments(hubId);
  }

  if (isMockApiEnabled()) {
    await simulateDelay(300);
    const filtered = mockDocuments.filter(
      (d) => d.hubId === hubId && d.visibility === "client"
    );

    return {
      items: filtered,
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: filtered.length,
        totalPages: 1,
      },
    };
  }

  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);

  return api.get<PaginatedList<Document>>(`/hubs/${hubId}/portal/documents`, queryParams);
}
