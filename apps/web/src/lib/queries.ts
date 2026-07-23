import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './api';
import { useAuthStore } from './auth-store';
import type {
  AssessmentItem,
  AssessmentType,
  AuditRow,
  ChainStatus,
  ComparisonResponse,
  DocumentRow,
  Encounter,
  Episode,
  LoginResult,
  MuscleGroup,
  Patient,
  RomNorm,
  ScalePoint,
  TreatmentGoal,
} from './types';

// ---- Auth ----
export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (creds: { email: string; password: string }) =>
      apiFetch<LoginResult>('/auth/login', { method: 'POST', body: creds, auth: false }),
    onSuccess: (data) => setSession(data),
  });
}

// ---- Patients ----
export function usePatients(search?: string) {
  return useQuery({
    queryKey: ['patients', search ?? ''],
    queryFn: () =>
      apiFetch<Patient[]>(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => apiFetch<Patient>(`/patients/${id}`),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<Patient>('/patients', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiFetch<Patient>(`/patients/${id}`, { method: 'PATCH', body }),
    onSuccess: (p) => {
      void qc.invalidateQueries({ queryKey: ['patients'] });
      void qc.invalidateQueries({ queryKey: ['patient', p.id] });
    },
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<unknown>(`/patients/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

// ---- Episodes ----
export function useEpisodes(patientId: string | undefined) {
  return useQuery({
    queryKey: ['episodes', patientId],
    queryFn: () => apiFetch<Episode[]>(`/episodes?patientId=${patientId}`),
    enabled: !!patientId,
  });
}

export function useEpisode(id: string | undefined) {
  return useQuery({
    queryKey: ['episode', id],
    queryFn: () => apiFetch<Episode>(`/episodes/${id}`),
    enabled: !!id,
  });
}

export function useCreateEpisode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<Episode>('/episodes', { method: 'POST', body }),
    onSuccess: (ep) => qc.invalidateQueries({ queryKey: ['episodes', ep.patientId] }),
  });
}

export function useUpdateEpisode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiFetch<Episode>(`/episodes/${id}`, { method: 'PATCH', body }),
    onSuccess: (ep) => {
      void qc.invalidateQueries({ queryKey: ['episodes', ep.patientId] });
      void qc.invalidateQueries({ queryKey: ['episode', ep.id] });
    },
  });
}

// ---- Treatment goals ----
export function useGoals(episodeId: string | undefined) {
  return useQuery({
    queryKey: ['goals', episodeId],
    queryFn: () => apiFetch<TreatmentGoal[]>(`/goals?episodeId=${episodeId}`),
    enabled: !!episodeId,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<TreatmentGoal>('/goals', { method: 'POST', body }),
    onSuccess: (g) => qc.invalidateQueries({ queryKey: ['goals', g.episodeId] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiFetch<TreatmentGoal>(`/goals/${id}`, { method: 'PATCH', body }),
    onSuccess: (g) => qc.invalidateQueries({ queryKey: ['goals', g.episodeId] }),
  });
}

// ---- Encounters ----
export function useEncounters(episodeId: string | undefined) {
  return useQuery({
    queryKey: ['encounters', episodeId],
    queryFn: () => apiFetch<Encounter[]>(`/encounters?episodeId=${episodeId}`),
    enabled: !!episodeId,
  });
}

export function useCreateEncounter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<Encounter>('/encounters', { method: 'POST', body }),
    onSuccess: (enc) => qc.invalidateQueries({ queryKey: ['encounters', enc.episodeId] }),
  });
}

// ---- Catalog ----
export function useAssessmentTypes() {
  return useQuery({
    queryKey: ['catalog', 'assessment-types'],
    queryFn: () => apiFetch<AssessmentType[]>('/catalog/assessment-types'),
    staleTime: Infinity,
  });
}

export function useRomNorms() {
  return useQuery({
    queryKey: ['catalog', 'rom-norms'],
    queryFn: () => apiFetch<RomNorm[]>('/catalog/rom-norms'),
    staleTime: Infinity,
  });
}

export function useMuscleGroups() {
  return useQuery({
    queryKey: ['catalog', 'muscle-groups'],
    queryFn: () => apiFetch<MuscleGroup[]>('/catalog/muscle-groups'),
    staleTime: Infinity,
  });
}

export function useScale(code: string) {
  return useQuery({
    queryKey: ['catalog', 'scale', code],
    queryFn: () => apiFetch<ScalePoint[]>(`/catalog/scales?code=${code}`),
    staleTime: Infinity,
  });
}

// ---- Assessments ----
export function useSaveAssessments(episodeId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { encounterId: string; items: AssessmentItem[] }) =>
      apiFetch<unknown>('/assessments/bulk', { method: 'POST', body: payload }),
    onSuccess: () => {
      if (episodeId) qc.invalidateQueries({ queryKey: ['comparison', episodeId] });
    },
  });
}

// ---- Documents (anamnesis) ----
export function useDocument(episodeId: string | undefined, type: string) {
  return useQuery({
    queryKey: ['documents', episodeId, type],
    queryFn: async () => {
      const rows = await apiFetch<DocumentRow[]>(
        `/documents?episodeId=${episodeId}&type=${type}`,
      );
      return rows[0] ?? null;
    },
    enabled: !!episodeId,
  });
}

export function useUpsertDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      episodeId: string;
      type: string;
      content: Record<string, unknown>;
      title?: string;
    }) => apiFetch<DocumentRow>('/documents', { method: 'PUT', body }),
    onSuccess: (doc) =>
      qc.invalidateQueries({ queryKey: ['documents', doc.episodeId, doc.type] }),
  });
}

// ---- Epicrisis ----
export function useEpicrisis(episodeId: string | undefined) {
  return useQuery({
    queryKey: ['epicrisis', episodeId],
    queryFn: () => apiFetch<DocumentRow | null>(`/episodes/${episodeId}/epicrisis`),
    enabled: !!episodeId,
  });
}

export function useGenerateEpicrisis(episodeId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<DocumentRow>(`/episodes/${episodeId}/epicrisis`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['epicrisis', episodeId] }),
  });
}

// ---- Audit (admin only) ----
export function useAudit(filters: { entity?: string; action?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.entity) params.set('entity', filters.entity);
  if (filters.action) params.set('action', filters.action);
  params.set('limit', '200');
  return useQuery({
    queryKey: ['audit', filters.entity ?? '', filters.action ?? ''],
    queryFn: () => apiFetch<AuditRow[]>(`/audit?${params.toString()}`),
  });
}

export function useVerifyAudit() {
  return useMutation({
    mutationFn: () => apiFetch<ChainStatus>('/audit/verify'),
  });
}

// ---- Comparison ----
export function useComparison(episodeId: string | undefined, type: string, region?: string) {
  return useQuery({
    queryKey: ['comparison', episodeId, type, region ?? ''],
    queryFn: () =>
      apiFetch<ComparisonResponse>(
        `/episodes/${episodeId}/comparison?type=${type}${region ? `&region=${region}` : ''}`,
      ),
    enabled: !!episodeId,
  });
}
