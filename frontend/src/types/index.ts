export type Plan = {
  id: number
  name: string
  slug: string
  price_cents: number
  price: string
  billing_period: string
  storage_bytes: number
  storage_label: string
  features: string[]
  is_active: boolean
  sort_order: number
}

export type NotificationPreferences = {
  expiry_reminders: boolean
  security_alerts: boolean
  sharing_activity: boolean
  storage_alerts: boolean
  weekly_digest: boolean
  product_updates: boolean
}

export type PrivacyPreferences = {
  profile_visible: boolean
  activity_logging: boolean
  analytics: boolean
  personalized_tips: boolean
}

export type User = {
  id: number
  name: string
  email: string
  role: string | null
  phone: string | null
  job_title: string | null
  company: string | null
  bio: string | null
  initials: string
  avatar_url: string | null
  plan: Plan | null
  storage_limit_bytes: number
  storage_used_bytes: number
  storage_percentage: number
  two_factor_enabled: boolean
  biometric_enabled: boolean
  auto_lock_enabled: boolean
  auto_lock_minutes: number
  login_alerts_enabled: boolean
  notification_preferences: NotificationPreferences
  privacy_preferences: PrivacyPreferences
  last_active_at: string | null
  created_at: string | null
}

export type AuthResponse = {
  user: User
}

export type MeResponse = {
  user: User
  unread_notifications: number
}

export type DocumentCategory =
  | 'government_id'
  | 'certificate'
  | 'personal'
  | 'school'
  | 'employment'
  | 'financial'
  | 'health'
  | 'credential'
  | 'other'

export type DocumentStatus = 'active' | 'verified' | 'shared' | 'expired' | 'draft'

export type Document = {
  id: number
  name: string
  original_name: string
  extension: string
  mime_type: string
  size: number
  human_size: string
  category: DocumentCategory
  category_label: string
  subcategory: 'identity' | 'medical' | 'finance' | 'home_legal' | null
  description: string | null
  tags: string[]
  status: DocumentStatus
  issued_at: string | null
  verified_at: string | null
  expires_at: string | null
  is_expired: boolean
  last_modified_at: string | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  checksum: string | null
  issuer: string | null
  document_number: string | null
  is_favorite: boolean
  is_shared: boolean
  share_url: string | null
  shared_at: string | null
  share_expires_at: string | null
  view_count: number
  last_accessed_at: string | null
  preview_url: string
  download_url: string
  file_exists: boolean
}

export type PaginationMeta = {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
}

export type Paginated<T> = {
  data: T[]
  meta: PaginationMeta
  links?: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}

export type DocumentStats = {
  total: number
  category_counts: Record<string, number>
  subcategory_counts: Record<string, number>
  status_counts: Record<string, number>
  total_size: number
  shared_count: number
  expiring_count: number
  favorite_count: number
}

export type DocumentsResponse = Paginated<Document> & {
  stats: DocumentStats
}

export type DashboardResponse = {
  stats: {
    total_documents: number
    certificates: number
    personal_files: number
    credentials: number
    credentials_strong: number
    credentials_need_rotation: number
    favorites: number
    expiring: number
    shared: number
  }
  storage: {
    used_bytes: number
    limit_bytes: number
    percentage: number
    breakdown: {
      category: string
      label: string
      count: number
      bytes: number
    }[]
  }
  recent_documents: Document[]
  recent_activity: Activity[]
  expiring_documents: Document[]
  security: {
    score: number
    label: string
    two_factor_enabled: boolean
    biometric_enabled: boolean
    login_alerts_enabled: boolean
    auto_lock_enabled: boolean
    recommendations: string[]
  }
  unread_notifications: number
}

export type CredentialType = 'password' | 'passkey' | 'ssh_key' | 'api_key' | 'other'
export type CredentialHealth = 'strong' | 'fair' | 'weak'

export type Credential = {
  id: number
  name: string
  type: CredentialType
  type_label: string
  identifier: string | null
  masked_identifier: string | null
  has_secret: boolean
  url: string | null
  notes: string | null
  health: CredentialHealth
  two_factor_enabled: boolean
  is_favorite: boolean
  last_rotated_at: string | null
  last_rotated_human: string | null
  expires_at: string | null
  is_expired: boolean
  created_at: string | null
}

export type CredentialStats = {
  total: number
  passkeys: number
  strong: number
  needs_rotation: number
  two_factor_enabled: number
  reused: number
  types: Record<string, number>
}

export type CredentialsResponse = Paginated<Credential> & {
  stats: CredentialStats
}

export type Activity = {
  id: number
  action: string
  description: string
  metadata: Record<string, unknown> | null
  ip_address: string | null
  document: { id: number; name: string } | null
  created_at: string | null
  time_ago: string | null
}

export type ActivitiesResponse = Paginated<Activity>

export type AppNotification = {
  id: string
  type: string
  title: string
  message: string
  action_url: string | null
  read_at: string | null
  is_read: boolean
  created_at: string | null
  time_ago: string | null
}

export type NotificationsResponse = {
  data: AppNotification[]
  meta: PaginationMeta & { unread_count: number }
}

export type Device = {
  id: number
  name: string
  type: string
  os: string | null
  browser: string | null
  location: string | null
  ip_address: string | null
  is_current: boolean
  last_active_at: string | null
  last_active_human: string | null
}

export type ProfileResponse = {
  user: User
  stats: {
    documents: number
    shared: number
    favorites: number
    storage_used_bytes: number
    activities: number
    member_since: string | null
  }
}

export type SettingsResponse = {
  user: User
  devices_count: number
  plans: Plan[]
}

export type PlansResponse = {
  plans: Plan[]
  current_plan: Plan | null
  storage_used_bytes: number
  storage_limit_bytes: number
}

export type ShareDocument = {
  id: number
  name: string
  original_name: string
  extension: string
  mime_type: string
  size: number
  human_size: string
  category: DocumentCategory
  description: string | null
  issuer: string | null
  expires_at: string | null
  shared_at: string | null
  share_expires_at: string | null
  owner: string | null
  download_url: string
  file_url: string
}

export type ApiMessage = {
  message: string
}
