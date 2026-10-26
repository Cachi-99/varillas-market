const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

async function request(path, options, token) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'No se pudo completar la solicitud.')
  return data
}

export function api(path, options = {}) {
  return request(path, options, localStorage.getItem('varillas-token'))
}

export function adminApi(path, options = {}) {
  return request(path, options, localStorage.getItem('varillas-admin-token'))
}

export const money = value => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
export const placeholder = '/producto-placeholder.svg'
export function imageFallback(event) {
  event.currentTarget.onerror = null
  event.currentTarget.src = placeholder
}
