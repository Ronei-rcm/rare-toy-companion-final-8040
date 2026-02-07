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

// Resolve base da API via env com fallback seguro
import { API_BASE_URL as API, handleApiResponse } from '@/services/api-config';

// ===== CONTEÚDO DA PÁGINA SOBRE =====

export async function getSobreContent(): Promise<SobreContent[]> {
  const res = await fetch(`${API}/sobre/content`, { credentials: 'include' });
  return handleApiResponse<SobreContent[]>(res, 'Falha ao buscar conteúdo da página Sobre');
}

export async function updateSobreContent(section: string, data: CreateSobreContentData): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/sobre/content/${section}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleApiResponse<{ success: boolean; message: string }>(res, 'Falha ao atualizar conteúdo da página Sobre');
}

// ===== VALORES DA EMPRESA =====

export async function getCompanyValues(): Promise<CompanyValue[]> {
  const res = await fetch(`${API}/sobre/values`, { credentials: 'include' });
  return handleApiResponse<CompanyValue[]>(res, 'Falha ao buscar valores da empresa');
}

export async function createCompanyValue(data: CreateCompanyValueData): Promise<{ success: boolean; id: string; message: string }> {
  const res = await fetch(`${API}/sobre/values`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleApiResponse<{ success: boolean; id: string; message: string }>(res, 'Falha ao criar valor da empresa');
}

export async function updateCompanyValue(id: string, data: UpdateCompanyValueData): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/sobre/values/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleApiResponse<{ success: boolean; message: string }>(res, 'Falha ao atualizar valor da empresa');
}

export async function deleteCompanyValue(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/sobre/values/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleApiResponse<{ success: boolean; message: string }>(res, 'Falha ao deletar valor da empresa');
}

// ===== MEMBROS DA EQUIPE =====

export async function getTeamMembers(): Promise<TeamMember[]> {
  const res = await fetch(`${API}/sobre/team`, { credentials: 'include' });
  return handleApiResponse<TeamMember[]>(res, 'Falha ao buscar membros da equipe');
}

export async function createTeamMember(data: CreateTeamMemberData): Promise<{ success: boolean; id: string; message: string }> {
  const res = await fetch(`${API}/sobre/team`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleApiResponse<{ success: boolean; id: string; message: string }>(res, 'Falha ao criar membro da equipe');
}

export async function updateTeamMember(id: string, data: UpdateTeamMemberData): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/sobre/team/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleApiResponse<{ success: boolean; message: string }>(res, 'Falha ao atualizar membro da equipe');
}

export async function deleteTeamMember(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/sobre/team/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleApiResponse<{ success: boolean; message: string }>(res, 'Falha ao deletar membro da equipe');
}

// ===== ESTATÍSTICAS DA EMPRESA =====

export async function getCompanyStats(): Promise<CompanyStat[]> {
  const res = await fetch(`${API}/sobre/stats`, { credentials: 'include' });
  return handleApiResponse<CompanyStat[]>(res, 'Falha ao buscar estatísticas da empresa');
}

export async function createCompanyStat(data: CreateCompanyStatData): Promise<{ success: boolean; id: string; message: string }> {
  const res = await fetch(`${API}/sobre/stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleApiResponse<{ success: boolean; id: string; message: string }>(res, 'Falha ao criar estatística da empresa');
}

export async function updateCompanyStat(id: string, data: UpdateCompanyStatData): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/sobre/stats/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleApiResponse<{ success: boolean; message: string }>(res, 'Falha ao atualizar estatística da empresa');
}

export async function deleteCompanyStat(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/sobre/stats/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleApiResponse<{ success: boolean; message: string }>(res, 'Falha ao deletar estatística da empresa');
}

// ===== INFORMAÇÕES DE CONTATO =====

export async function getContactInfo(): Promise<ContactInfo[]> {
  const res = await fetch(`${API}/sobre/contact`, { credentials: 'include' });
  return handleApiResponse<ContactInfo[]>(res, 'Falha ao buscar informações de contato');
}

export async function createContactInfo(data: CreateContactInfoData): Promise<{ success: boolean; id: string; message: string }> {
  const res = await fetch(`${API}/sobre/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleApiResponse<{ success: boolean; id: string; message: string }>(res, 'Falha ao criar informação de contato');
}

export async function updateContactInfo(id: string, data: UpdateContactInfoData): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/sobre/contact/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleApiResponse<{ success: boolean; message: string }>(res, 'Falha ao atualizar informação de contato');
}

export async function deleteContactInfo(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/sobre/contact/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleApiResponse<{ success: boolean; message: string }>(res, 'Falha ao deletar informação de contato');
}

// ===== UPLOAD DE IMAGENS =====

export async function uploadSobreImage(file: File): Promise<{ success: boolean; imageUrl: string; fullUrl: string; filename: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API}/sobre/upload-image`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return handleApiResponse<{ success: boolean; imageUrl: string; fullUrl: string; filename: string }>(res, 'Falha ao fazer upload da imagem');
}

export async function uploadTeamMemberImage(id: string, file: File): Promise<{ success: boolean; imageUrl: string; fullUrl: string; filename: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API}/sobre/team/${id}/image`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return handleApiResponse<{ success: boolean; imageUrl: string; fullUrl: string; filename: string }>(res, 'Falha ao fazer upload da imagem do membro da equipe');
}
