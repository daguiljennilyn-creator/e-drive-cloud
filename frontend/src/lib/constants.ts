export const DOCUMENT_CATEGORIES = [
  { value: 'government_id', label: 'Government ID' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'personal', label: 'Personal' },
  { value: 'school', label: 'School documents' },
  { value: 'employment', label: 'Employment' },
  { value: 'financial', label: 'Financial' },
  { value: 'health', label: 'Health' },
  { value: 'credential', label: 'Credential' },
  { value: 'other', label: 'Other' },
]

export const DOCUMENT_SUBCATEGORIES = [
  { value: 'identity', label: 'Identity' },
  { value: 'medical', label: 'Medical' },
  { value: 'finance', label: 'Finance' },
  { value: 'home_legal', label: 'Home & legal' },
]

export const DOCUMENT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'verified', label: 'Verified' },
  { value: 'draft', label: 'Draft' },
]

export const CREDENTIAL_TYPES = [
  { value: 'password', label: 'Password' },
  { value: 'passkey', label: 'Passkey' },
  { value: 'ssh_key', label: 'SSH key' },
  { value: 'api_key', label: 'API key' },
  { value: 'other', label: 'Other' },
]

export const CREDENTIAL_HEALTH = [
  { value: 'strong', label: 'Strong' },
  { value: 'fair', label: 'Needs rotation' },
  { value: 'weak', label: 'Weak' },
]

export const ALLOWED_UPLOAD_EXTENSIONS = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'doc',
  'docx',
  'txt',
  'csv',
  'xls',
  'xlsx',
]

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024
