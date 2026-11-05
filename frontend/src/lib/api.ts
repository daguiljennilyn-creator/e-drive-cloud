import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

const defaultHost =
  typeof window !== 'undefined' && window.location.hostname
    ? window.location.hostname
    : '127.0.0.1'

const envApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim()

export const API_URL = envApiUrl
  ? envApiUrl.replace(/\/$/, '')
  : `http://${defaultHost}:8000/api`
export const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? window.location.origin

export const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json' },
  timeout: 30_000,
  // The API is a separate origin in development, so cookies and the XSRF
  // header are required for Laravel's session guard to authenticate requests.
  withCredentials: true,
  withXSRFToken: true,
})

let csrfRequest: Promise<void> | null = null

/**
 * Fetch Laravel's XSRF-TOKEN cookie before a state-changing request.
 * The cookie is read by Axios and sent back in the X-XSRF-TOKEN header.
 */
export function ensureCsrfToken(force = false): Promise<void> {
  if (force) csrfRequest = null

  if (!csrfRequest) {
    csrfRequest = api
      .get('/auth/csrf-cookie')
      .then(() => undefined)
      .catch((error: unknown) => {
        csrfRequest = null
        throw error
      })
  }

  return csrfRequest
}

api.interceptors.request.use(async (config) => {
  const method = (config.method ?? 'get').toLowerCase()
  if (!['get', 'head', 'options'].includes(method)) {
    await ensureCsrfToken()
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as
      | (InternalAxiosRequestConfig & { _csrfRetry?: boolean })
      | undefined

    if (error.response?.status === 419 && config && !config._csrfRetry) {
      config._csrfRetry = true
      await ensureCsrfToken(true)
      return api.request(config)
    }

    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('edrive:unauthorized'))
    }

    return Promise.reject(error)
  },
)

export type ValidationErrors = Record<string, string[]>

export function apiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: ValidationErrors }
      | undefined
    if (data?.errors) {
      const first = Object.values(data.errors)[0]?.[0]
      if (first) return first
    }
    if (data?.message) return data.message
    if (error.code === 'ECONNABORTED') return 'The request took too long. Please try again.'
    if (!error.response) return 'Cannot reach the E-Drive API. Check that the backend server is running.'
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function apiFieldErrors(error: unknown): ValidationErrors {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { errors?: ValidationErrors } | undefined
    return data?.errors ?? {}
  }
  return {}
}

export async function downloadFile(url: string, filename: string): Promise<void> {
  const response = await api.get(url, { responseType: 'blob' })
  const blob = response.data as Blob
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

export async function fetchBlobUrl(url: string): Promise<string> {
  const response = await api.get(url, { responseType: 'blob' })
  return URL.createObjectURL(response.data as Blob)
}

export function publicFileUrl(url: string): string {
  return url.startsWith('http') ? url : `${API_URL.replace(/\/api$/, '')}${url}`
}
