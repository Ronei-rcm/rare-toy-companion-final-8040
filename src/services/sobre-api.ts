import {
  SobreContent,
  CompanyValue,
  TeamMember,
  CompanyStat,
  ContactInfo,
  CreateSobreContentData,
  UpdateSobreContentData,
  CreateCompanyValueData,
  UpdateCompanyValueData,
  CreateTeamMemberData,
  UpdateTeamMemberData,
  CreateCompanyStatData,
  UpdateCompanyStatData,
  CreateContactInfoData,
  UpdateContactInfoData
} from '@/types/sobre';

import { request } from '@/services/api-config';

// ===== CONTEÚDO DA PÁGINA SOBRE =====

export async function getSobreContent(): Promise<SobreContent[]> {
  return request<SobreContent[]>('/sobre/content');
}

export async function updateSobreContent(section: string, data: CreateSobreContentData): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/sobre/content/${section}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ===== VALORES DA EMPRESA =====

export async function getCompanyValues(): Promise<CompanyValue[]> {
  return request<CompanyValue[]>('/sobre/values');
}

export async function createCompanyValue(data: CreateCompanyValueData): Promise<{ success: boolean; id: string; message: string }> {
  return request<{ success: boolean; id: string; message: string }>('/sobre/values', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCompanyValue(id: string, data: UpdateCompanyValueData): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/sobre/values/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCompanyValue(id: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/sobre/values/${id}`, {
    method: 'DELETE',
  });
}

// ===== MEMBROS DA EQUIPE =====

export async function getTeamMembers(): Promise<TeamMember[]> {
  return request<TeamMember[]>('/sobre/team');
}

export async function createTeamMember(data: CreateTeamMemberData): Promise<{ success: boolean; id: string; message: string }> {
  return request<{ success: boolean; id: string; message: string }>('/sobre/team', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTeamMember(id: string, data: UpdateTeamMemberData): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/sobre/team/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTeamMember(id: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/sobre/team/${id}`, {
    method: 'DELETE',
  });
}

// ===== ESTATÍSTICAS DA EMPRESA =====

export async function getCompanyStats(): Promise<CompanyStat[]> {
  return request<CompanyStat[]>('/sobre/stats');
}

export async function createCompanyStat(data: CreateCompanyStatData): Promise<{ success: boolean; id: string; message: string }> {
  return request<{ success: boolean; id: string; message: string }>('/sobre/stats', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCompanyStat(id: string, data: UpdateCompanyStatData): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/sobre/stats/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCompanyStat(id: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/sobre/stats/${id}`, {
    method: 'DELETE',
  });
}

// ===== INFORMAÇÕES DE CONTATO =====

export async function getContactInfo(): Promise<ContactInfo[]> {
  return request<ContactInfo[]>('/sobre/contact');
}

export async function createContactInfo(data: CreateContactInfoData): Promise<{ success: boolean; id: string; message: string }> {
  return request<{ success: boolean; id: string; message: string }>('/sobre/contact', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateContactInfo(id: string, data: UpdateContactInfoData): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/sobre/contact/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteContactInfo(id: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/sobre/contact/${id}`, {
    method: 'DELETE',
  });
}

// ===== UPLOAD DE IMAGENS =====

export async function uploadSobreImage(file: File): Promise<{ success: boolean; imageUrl: string; fullUrl: string; filename: string }> {
  const formData = new FormData();
  formData.append('image', file);

  return request<{ success: boolean; imageUrl: string; fullUrl: string; filename: string }>('/sobre/upload-image', {
    method: 'POST',
    body: formData,
  });
}

export async function uploadTeamMemberImage(id: string, file: File): Promise<{ success: boolean; imageUrl: string; fullUrl: string; filename: string }> {
  const formData = new FormData();
  formData.append('image', file);

  return request<{ success: boolean; imageUrl: string; fullUrl: string; filename: string }>(`/sobre/team/${id}/image`, {
    method: 'POST',
    body: formData,
  });
}
