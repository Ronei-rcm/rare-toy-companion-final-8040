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
function getApiBase(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (envUrl && envUrl.trim().length > 0) return envUrl.replace(/\/$/, '');
  // Sempre usar a variável de ambiente ou fallback para localhost
  return 'http://127.0.0.1:3001/api';
}

const API = getApiBase();

// ===== CONTEÚDO DA PÁGINA SOBRE =====

export async function getSobreContent(): Promise<SobreContent[]> {
  const res = await fetch(`${API}/sobre/content`, { credentials: 'include' });
  if (!res.ok) throw new Error('Falha ao buscar conteúdo da página Sobre');
  return res.json();
}

export async function updateSobreContent(section: string, data: CreateSobreContentData): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/sobre/content/${section}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar conteúdo da página Sobre');
  return res.json();
}

// ===== VALORES DA EMPRESA =====

export async function getCompanyValues(): Promise<CompanyValue[]> {
  const res = await fetch(`${API}/sobre/values`, { credentials: 'include' });
  if (!res.ok) throw new Error('Falha ao buscar valores da empresa');
  return res.json();
}

export async function createCompanyValue(data: CreateCompanyValueData): Promise<{ success: boolean; id: string; message: string }> {
  const res = await fetch(`${API}/sobre/values`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar valor da empresa');
  return res.json();
}

export async function updateCompanyValue(id: string, data: UpdateCompanyValueData): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/sobre/values/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar valor da empresa');
  return res.json();
}

export async function deleteCompanyValue(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/sobre/values/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Falha ao deletar valor da empresa');
  return res.json();
}

// ===== MEMBROS DA EQUIPE =====

export async function getTeamMembers(): Promise<TeamMember[]> {
  const res = await fetch(`${API}/sobre/team`, { credentials: 'include' });
  if (!res.ok) throw new Error('Falha ao buscar membros da equipe');
  return res.json();
}

export async function createTeamMember(data: CreateTeamMemberData): Promise<{ success: boolean; id: string; message: string }> {
  const res = await fetch(`${API}/sobre/team`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar membro da equipe');
  return res.json();
}

export async function updateTeamMember(id: string, data: UpdateTeamMemberData): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/sobre/team/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar membro da equipe');
  return res.json();
}

export async function deleteTeamMember(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/sobre/team/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Falha ao deletar membro da equipe');
  return res.json();
}

// ===== ESTATÍSTICAS DA EMPRESA =====

export async function getCompanyStats(): Promise<CompanyStat[]> {
  const res = await fetch(`${API}/sobre/stats`, { credentials: 'include' });
  if (!res.ok) throw new Error('Falha ao buscar estatísticas da empresa');
  return res.json();
}

export async function createCompanyStat(data: CreateCompanyStatData): Promise<{ success: boolean; id: string; message: string }> {
  const res = await fetch(`${API}/sobre/stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar estatística da empresa');
  return res.json();
}

export async function updateCompanyStat(id: string, data: UpdateCompanyStatData): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/sobre/stats/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar estatística da empresa');
  return res.json();
}

export async function deleteCompanyStat(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/sobre/stats/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Falha ao deletar estatística da empresa');
  return res.json();
}

// ===== INFORMAÇÕES DE CONTATO =====

export async function getContactInfo(): Promise<ContactInfo[]> {
  const res = await fetch(`${API}/sobre/contact`, { credentials: 'include' });
  if (!res.ok) throw new Error('Falha ao buscar informações de contato');
  return res.json();
}

export async function createContactInfo(data: CreateContactInfoData): Promise<{ success: boolean; id: string; message: string }> {
  const res = await fetch(`${API}/sobre/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar informação de contato');
  return res.json();
}

export async function updateContactInfo(id: string, data: UpdateContactInfoData): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/sobre/contact/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar informação de contato');
  return res.json();
}

export async function deleteContactInfo(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API}/sobre/contact/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Falha ao deletar informação de contato');
  return res.json();
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
  if (!res.ok) throw new Error('Falha ao fazer upload da imagem');
  return res.json();
}

export async function uploadTeamMemberImage(id: string, file: File): Promise<{ success: boolean; imageUrl: string; fullUrl: string; filename: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API}/sobre/team/${id}/image`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) throw new Error('Falha ao fazer upload da imagem do membro da equipe');
  return res.json();
}
