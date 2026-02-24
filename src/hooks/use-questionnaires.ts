/**
 * Questionnaire hooks
 *
 * React Query hooks for questionnaire operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Questionnaire,
  LinkQuestionnaireRequest,
  UpdateQuestionnaireRequest,
  QuestionnaireAnalytics,
  PaginatedList,
  PaginationParams,
} from "@/types";
import {
  getQuestionnaires,
  getQuestionnaire,
  linkQuestionnaire,
  updateQuestionnaire,
  unlinkQuestionnaire,
  getQuestionnaireAnalytics,
  getPortalQuestionnaires,
} from "@/services";
import { serializeParams } from "@/lib/query-keys";

// Query keys - use serialized params for stable cache keys
export const questionnaireKeys = {
  all: ["questionnaires"] as const,
  lists: () => [...questionnaireKeys.all, "list"] as const,
  list: (hubId: string, params?: PaginationParams) => [...questionnaireKeys.lists(), hubId, serializeParams(params)] as const,
  detail: (hubId: string, qId: string) => [...questionnaireKeys.all, hubId, qId] as const,
  analytics: (hubId: string, qId: string) => [...questionnaireKeys.detail(hubId, qId), "analytics"] as const,
  portal: (hubId: string, params?: PaginationParams) => [...questionnaireKeys.all, "portal", hubId, serializeParams(params)] as const,
};

/**
 * Hook to get questionnaires for a hub
 */
export function useQuestionnaires(hubId: string, params?: PaginationParams) {
  return useQuery<PaginatedList<Questionnaire>>({
    queryKey: questionnaireKeys.list(hubId, params),
    queryFn: () => getQuestionnaires(hubId, params),
    enabled: !!hubId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to get single questionnaire
 */
export function useQuestionnaire(hubId: string, questionnaireId: string) {
  return useQuery<Questionnaire>({
    queryKey: questionnaireKeys.detail(hubId, questionnaireId),
    queryFn: () => getQuestionnaire(hubId, questionnaireId),
    enabled: !!hubId && !!questionnaireId,
  });
}

/**
 * Hook to get questionnaire analytics
 */
export function useQuestionnaireAnalytics(hubId: string, questionnaireId: string) {
  return useQuery<QuestionnaireAnalytics>({
    queryKey: questionnaireKeys.analytics(hubId, questionnaireId),
    queryFn: () => getQuestionnaireAnalytics(hubId, questionnaireId),
    enabled: !!hubId && !!questionnaireId,
  });
}

/**
 * Hook to get portal questionnaires (client view)
 */
export function usePortalQuestionnaires(hubId: string, params?: PaginationParams) {
  return useQuery<PaginatedList<Questionnaire>>({
    queryKey: questionnaireKeys.portal(hubId, params),
    queryFn: () => getPortalQuestionnaires(hubId, params),
    enabled: !!hubId,
  });
}

/**
 * Hook to link a questionnaire
 */
export function useLinkQuestionnaire(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<Questionnaire, Error, LinkQuestionnaireRequest>({
    mutationFn: (data) => linkQuestionnaire(hubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.lists() });
    },
  });
}

/**
 * Hook to update questionnaire
 */
export function useUpdateQuestionnaire(hubId: string, questionnaireId: string) {
  const queryClient = useQueryClient();

  return useMutation<Questionnaire, Error, UpdateQuestionnaireRequest>({
    mutationFn: (data) => updateQuestionnaire(hubId, questionnaireId, data),
    onSuccess: (q) => {
      queryClient.setQueryData(questionnaireKeys.detail(hubId, questionnaireId), q);
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.lists() });
    },
  });
}

/**
 * Hook to unlink questionnaire
 */
export function useUnlinkQuestionnaire(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (questionnaireId) => unlinkQuestionnaire(hubId, questionnaireId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.lists() });
    },
  });
}
