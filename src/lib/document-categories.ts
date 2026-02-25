/**
 * Shared category colour map and labels for document UI.
 * Single source of truth — used by DocumentCard, ClientHubOverview, and any future consumers.
 */

import type { DocumentCategory } from "@/types";

export const CATEGORY_COLOURS: Record<DocumentCategory, { bg: string; text: string }> = {
  proposal: { bg: "bg-[hsl(var(--bold-royal-blue))]/10", text: "text-[hsl(var(--bold-royal-blue))]" },
  contract: { bg: "bg-[hsl(var(--rich-violet))]/10", text: "text-[hsl(var(--rich-violet))]" },
  deliverable: { bg: "bg-[hsl(var(--sage-green))]/10", text: "text-[hsl(var(--sage-green))]" },
  brief: { bg: "bg-[hsl(var(--soft-coral))]/10", text: "text-[hsl(var(--soft-coral))]" },
  reference: { bg: "bg-[hsl(var(--gradient-blue))]/10", text: "text-[hsl(var(--gradient-blue))]" },
  other: { bg: "bg-[hsl(var(--medium-grey))]/10", text: "text-[hsl(var(--medium-grey))]" },
};

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  proposal: "Proposal",
  contract: "Contract",
  deliverable: "Deliverable",
  brief: "Brief",
  reference: "Reference",
  other: "Other",
};
