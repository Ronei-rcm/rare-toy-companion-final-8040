import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getSobreContent, 
  updateSobreContent,
  getCompanyValues,
  createCompanyValue,
  updateCompanyValue,
  deleteCompanyValue,
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getCompanyStats,
  createCompanyStat,
  updateCompanyStat,
  deleteCompanyStat,
  getContactInfo,
  createContactInfo,
  updateContactInfo,
  deleteContactInfo
} from '@/api/sobre-api';
import { 
  CreateSobreContentData,
  CreateCompanyValueData,
  UpdateCompanyValueData,
  CreateTeamMemberData,
  UpdateTeamMemberData,
  CreateCompanyStatData,
  UpdateCompanyStatData,
  CreateContactInfoData,
  UpdateContactInfoData
} from '@/types/sobre';

// ===== CONTEÚDO DA PÁGINA SOBRE =====

export function useSobreContent() {
  return useQuery({
    queryKey: ['sobre-content'],
    queryFn: getSobreContent,
  });
}

export function useUpdateSobreContent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ section, data }: { section: string; data: CreateSobreContentData }) => 
      updateSobreContent(section, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sobre-content'] });
    },
  });
}

// ===== VALORES DA EMPRESA =====

export function useCompanyValues() {
  return useQuery({
    queryKey: ['company-values'],
    queryFn: getCompanyValues,
  });
}

export function useCreateCompanyValue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createCompanyValue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-values'] });
    },
  });
}

export function useUpdateCompanyValue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompanyValueData }) => 
      updateCompanyValue(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-values'] });
    },
  });
}

export function useDeleteCompanyValue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteCompanyValue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-values'] });
    },
  });
}

// ===== MEMBROS DA EQUIPE =====

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: getTeamMembers,
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamMemberData }) => 
      updateTeamMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

// ===== ESTATÍSTICAS DA EMPRESA =====

export function useCompanyStats() {
  return useQuery({
    queryKey: ['company-stats'],
    queryFn: getCompanyStats,
  });
}

export function useCreateCompanyStat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createCompanyStat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-stats'] });
    },
  });
}

export function useUpdateCompanyStat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompanyStatData }) => 
      updateCompanyStat(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-stats'] });
    },
  });
}

export function useDeleteCompanyStat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteCompanyStat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-stats'] });
    },
  });
}

// ===== INFORMAÇÕES DE CONTATO =====

export function useContactInfo() {
  return useQuery({
    queryKey: ['contact-info'],
    queryFn: getContactInfo,
  });
}

export function useCreateContactInfo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createContactInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-info'] });
    },
  });
}

export function useUpdateContactInfo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactInfoData }) => 
      updateContactInfo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-info'] });
    },
  });
}

export function useDeleteContactInfo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteContactInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-info'] });
    },
  });
}
