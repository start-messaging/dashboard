import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTemplate,
  deleteTemplate,
  getChannels,
  listMyTemplates,
  submitTemplate,
  updateTemplate,
} from "@/apis/templates.api";
import type { CreateTemplatePayload } from "@/types";

const TEMPLATES_KEY = ["templates"] as const;

export function useMyTemplates(page: number) {
  return useQuery({
    queryKey: [...TEMPLATES_KEY, "mine", page],
    queryFn: () => listMyTemplates(page),
  });
}

export function useChannels() {
  return useQuery({
    queryKey: ["channels"],
    queryFn: getChannels,
    staleTime: 5 * 60 * 1000,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: TEMPLATES_KEY });
}

export function useCreateTemplate() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: CreateTemplatePayload) => createTemplate(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateTemplate() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: {
      id: string;
      payload: Partial<CreateTemplatePayload>;
    }) => updateTemplate(input.id, input.payload),
    onSuccess: invalidate,
  });
}

export function useSubmitTemplate() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => submitTemplate(id),
    onSuccess: invalidate,
  });
}

export function useDeleteTemplate() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: invalidate,
  });
}
