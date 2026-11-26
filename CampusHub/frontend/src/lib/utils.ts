import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export const formatCurrency = (value: number | string | null | undefined) =>
  value === null || value === undefined || value === '' ? '—' : inr.format(Number(value))

export const formatDate = (value: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  value ? new Date(value.endsWith('Z') || value.includes('+') ? value : `${value}Z`).toLocaleDateString('en-IN', opts) : '—'

export const formatRelative = (value: string) => {
  const date = new Date(value.endsWith('Z') || value.includes('+') ? value : `${value}Z`)
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`
  return formatDate(value)
}

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const initials = (name: string) =>
  name.replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, '').split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
