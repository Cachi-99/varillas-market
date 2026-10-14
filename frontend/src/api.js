const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export async function api(path, options = {}) {
  const token = localStorage.getItem('varillas-token')
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'No se pudo completar la solicitud.')
  return data
}

export const money = value => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
export const placeholder = '/producto-placeholder.svg'
export function imageFallback(event) {
  event.currentTarget.onerror = null
  event.currentTarget.src = placeholder
}
