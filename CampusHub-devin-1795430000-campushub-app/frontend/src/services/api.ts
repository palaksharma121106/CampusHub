import axios, { AxiosError } from 'axios'

const TOKEN_KEY = 'campushub.token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api`,
  timeout: 60_000,
})

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && tokenStore.get()) {
      tokenStore.clear()
      window.dispatchEvent(new Event('campushub:unauthorized'))
    }
    return Promise.reject(error)
  },
)

/** Turn any API/network error into a human-readable message. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Cannot reach the CampusHub server. Check your internet connection.'
    const detail = (error.response.data as { detail?: unknown })?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail.length) {
      const first = detail[0] as { loc?: string[]; msg?: string }
      const field = first.loc?.slice(-1)[0]
      return field ? `${field.replace(/_/g, ' ')}: ${first.msg}` : (first.msg ?? fallback)
    }
  }
  return fallback
}
