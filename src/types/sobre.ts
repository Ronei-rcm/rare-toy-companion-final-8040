export interface SobreContent {
  id: string;
  section: string;
  title?: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  order_index: number;
  is_active: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface CompanyValue {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  position?: string;
  description?: string;
  image_url?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyStat {
  id: string;
  title: string;
  value: string;
  icon?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactInfo {
  id: string;
  type: string;
  title: string;
  value: string;
  icon?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSobreContentData {
  section: string;
  title?: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  metadata?: any;
}

export interface UpdateSobreContentData {
  title?: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  metadata?: any;
}

export interface CreateCompanyValueData {
  title: string;
  description?: string;
  icon?: string;
  order_index?: number;
}

export interface UpdateCompanyValueData {
  title?: string;
  description?: string;
  icon?: string;
  order_index?: number;
  is_active?: boolean;
}

export interface CreateTeamMemberData {
  name: string;
  position?: string;
  description?: string;
  image_url?: string;
  order_index?: number;
}

export interface UpdateTeamMemberData {
  name?: string;
  position?: string;
  description?: string;
  image_url?: string;
  order_index?: number;
  is_active?: boolean;
}

export interface CreateCompanyStatData {
  title: string;
  value: string;
  icon?: string;
  order_index?: number;
}

export interface UpdateCompanyStatData {
  title?: string;
  value?: string;
  icon?: string;
  order_index?: number;
  is_active?: boolean;
}

export interface CreateContactInfoData {
  type: string;
  title: string;
  value: string;
  icon?: string;
  order_index?: number;
}

export interface UpdateContactInfoData {
  type?: string;
  title?: string;
  value?: string;
  icon?: string;
  order_index?: number;
  is_active?: boolean;
}
