export function formatHandle(handle: string): string {
  return handle.startsWith('@') ? handle : `@${handle}`
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return 'Unavailable'
  }

  return new Date(value).toLocaleString()
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value >= 100 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${count} ${count === 1 ? singular : plural}`
}
