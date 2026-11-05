import { api } from './api'
import type {
  ActivitiesResponse,
  ApiMessage,
  AppNotification,
  AuthResponse,
  Credential,
  CredentialsResponse,
  DashboardResponse,
  Device,
  Document,
  DocumentsResponse,
  MeResponse,
  NotificationsResponse,
  PlansResponse,
  ProfileResponse,
  SettingsResponse,
  ShareDocument,
  User,
} from '../types'

type LoginPayload = { email: string; password: string; remember?: boolean }
type RegisterPayload = { name: string; email: string; password: string; password_confirmation: string }
type ResetPayload = {
  token: string
  email: string
  password: string
  password_confirmation: string
}

export const authApi = {
  login: (payload: LoginPayload) => api.post<AuthResponse>('/auth/login', payload),
  register: (payload: RegisterPayload) => api.post<AuthResponse>('/auth/register', payload),
  demoLogin: () => api.post<AuthResponse>('/auth/demo-login'),
  me: () => api.get<MeResponse>('/auth/me'),
  logout: () => api.post<ApiMessage>('/auth/logout'),
  forgotPassword: (email: string) =>
    api.post<{ message: string; reset_url?: string }>('/auth/forgot-password', { email }),
  resetPassword: (payload: ResetPayload) => api.post<ApiMessage>('/auth/reset-password', payload),
}

export const dashboardApi = {
  get: () => api.get<DashboardResponse>('/dashboard'),
}

export type DocumentQuery = {
  q?: string
  category?: string
  subcategory?: string
  status?: string
  favorites?: boolean
  expiring?: boolean
  shared?: boolean
  tag?: string
  sort?: string
  direction?: 'asc' | 'desc'
  per_page?: number
  page?: number
  trashed?: 'only'
}

export type DocumentFormPayload = {
  file?: File | null
  name: string
  category: string
  subcategory?: string
  description?: string
  tags?: string[]
  status?: string
  issued_at?: string
  expires_at?: string
  issuer?: string
  document_number?: string
}

function documentFormData(payload: DocumentFormPayload): FormData {
  const form = new FormData()
  if (payload.file) form.append('file', payload.file)
  form.append('name', payload.name)
  form.append('category', payload.category)
  if (payload.subcategory) form.append('subcategory', payload.subcategory)
  form.append('description', payload.description ?? '')
  form.append('status', payload.status ?? 'active')
  form.append('issued_at', payload.issued_at ?? '')
  form.append('expires_at', payload.expires_at ?? '')
  form.append('issuer', payload.issuer ?? '')
  form.append('document_number', payload.document_number ?? '')
  for (const tag of payload.tags ?? []) form.append('tags[]', tag)
  return form
}

export const documentsApi = {
  list: (params: DocumentQuery = {}) => api.get<DocumentsResponse>('/documents', { params }),
  get: (id: number | string) => api.get<{ data: Document }>(`/documents/${id}`),
  create: (payload: DocumentFormPayload) =>
    api.post<{ message: string; document: Document }>('/documents', documentFormData(payload)),
  update: (id: number | string, payload: DocumentFormPayload) =>
    api.post<{ message: string; document: Document }>(`/documents/${id}`, documentFormData(payload)),
  favorite: (id: number | string) =>
    api.patch<{ message: string; document: Document }>(`/documents/${id}/favorite`),
  remove: (id: number | string) => api.delete<ApiMessage>(`/documents/${id}`),
  restore: (id: number | string) =>
    api.post<{ message: string; document: Document }>(`/documents/${id}/restore`),
  forceDelete: (id: number | string) => api.delete<ApiMessage>(`/documents/${id}/force`),
  emptyTrash: () => api.delete<ApiMessage & { count: number }>('/trash/empty'),
  bulk: (action: 'trash' | 'restore' | 'delete', ids: number[]) =>
    api.post<ApiMessage & { count: number }>('/documents/bulk', { action, ids }),
  share: (id: number | string, expiresInDays = 7) =>
    api.post<{ message: string; document: Document }>(`/documents/${id}/share`, {
      expires_in_days: expiresInDays,
    }),
  unshare: (id: number | string) =>
    api.delete<{ message: string; document: Document }>(`/documents/${id}/share`),
  verify: (id: number | string) =>
    api.post<{ message: string; document: Document }>(`/documents/${id}/verify`),
  verifyAll: () => api.post<ApiMessage & { count: number }>('/documents/verify-all'),
}

export type CredentialPayload = {
  name: string
  type: string
  identifier?: string
  secret?: string
  url?: string
  notes?: string
  health?: string
  two_factor_enabled?: boolean
  is_favorite?: boolean
  expires_at?: string
}

export const credentialsApi = {
  list: (params: Record<string, unknown> = {}) =>
    api.get<CredentialsResponse>('/credentials', { params }),
  get: (id: number | string) => api.get<{ data: Credential }>(`/credentials/${id}`),
  create: (payload: CredentialPayload) =>
    api.post<{ message: string; credential: Credential }>('/credentials', payload),
  update: (id: number | string, payload: Partial<CredentialPayload>) =>
    api.put<{ message: string; credential: Credential }>(`/credentials/${id}`, payload),
  remove: (id: number | string) => api.delete<ApiMessage>(`/credentials/${id}`),
  reveal: (id: number | string) =>
    api.get<{ secret: string | null; identifier: string | null }>(`/credentials/${id}/reveal`),
  rotate: (id: number | string, secret?: string) =>
    api.post<{ message: string; credential: Credential }>(`/credentials/${id}/rotate`, {
      secret: secret || undefined,
    }),
  import: (credentials: CredentialPayload[]) =>
    api.post<ApiMessage & { count: number }>('/credentials/import', { credentials }),
}

export const notificationsApi = {
  list: (params: { filter?: string; category?: string; page?: number; per_page?: number } = {}) =>
    api.get<NotificationsResponse>('/notifications', { params }),
  markRead: (id: string) =>
    api.post<{ message: string; notification: AppNotification; unread_count: number }>(
      `/notifications/${id}/read`,
    ),
  markAllRead: () => api.post<{ message: string; unread_count: number }>('/notifications/read-all'),
  clearRead: () => api.delete<ApiMessage & { count: number }>('/notifications/read'),
  remove: (id: string) => api.delete<ApiMessage & { unread_count: number }>(`/notifications/${id}`),
}

export const activityApi = {
  list: (params: { action?: string; group?: string; q?: string; page?: number; per_page?: number } = {}) =>
    api.get<ActivitiesResponse>('/activity', { params }),
}

export const profileApi = {
  get: () => api.get<ProfileResponse>('/profile'),
  update: (payload: FormData) => api.post<{ message: string; user: User }>('/profile', payload),
  changePassword: (payload: {
    current_password: string
    password: string
    password_confirmation: string
  }) => api.post<ApiMessage>('/profile/password', payload),
  exportData: () => api.get('/profile/export', { responseType: 'blob' }),
  remove: (password: string, confirmation: string) =>
    api.delete<ApiMessage>('/profile', { data: { password, confirmation } }),
}

export const settingsApi = {
  get: () => api.get<SettingsResponse>('/settings'),
  updateSecurity: (payload: {
    two_factor_enabled?: boolean
    biometric_enabled?: boolean
    auto_lock_enabled?: boolean
    auto_lock_minutes?: number
    login_alerts_enabled?: boolean
  }) => api.put<{ message: string; user: User }>('/settings/security', payload),
  updateNotifications: (payload: Record<string, boolean>) =>
    api.put<{ message: string; notification_preferences: User['notification_preferences'] }>(
      '/settings/notifications',
      payload,
    ),
  updatePrivacy: (payload: Record<string, boolean>) =>
    api.put<{ message: string; privacy_preferences: User['privacy_preferences'] }>(
      '/settings/privacy',
      payload,
    ),
  devices: () => api.get<{ devices: Device[] }>('/devices'),
  revokeDevice: (id: number) => api.delete<ApiMessage>(`/devices/${id}`),
  revokeOtherDevices: () => api.delete<ApiMessage & { count: number }>('/devices'),
}

export const plansApi = {
  list: () => api.get<PlansResponse>('/plans'),
  upgrade: (planId: number) =>
    api.post<{ message: string; user: User; plan: PlansResponse['current_plan'] }>(
      '/plans/upgrade',
      { plan_id: planId },
    ),
}

export const shareApi = {
  get: (token: string) => api.get<{ document: ShareDocument }>(`/share/${token}`),
}
