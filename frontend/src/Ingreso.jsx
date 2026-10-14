import { useState } from 'react'
import { api } from './api'

export default function Ingreso({ onLogin }) {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  async function submit(event) {
    event.preventDefault(); setPending(true); setError('')
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ usuario, clave }) })
      localStorage.setItem('varillas-token', data.token)
      localStorage.setItem('varillas-user', JSON.stringify(data.usuario))
      onLogin(data.usuario)
    } catch (err) { setError(err.message) } finally { setPending(false) }
  }
  return <section className="panel market-form auth-panel"><span className="eyebrow">PANEL DE COMERCIOS</span><h1>Ingresá a tu comercio</h1><p className="muted">Usá la cuenta que te asignaron para administrar tus productos.</p>{error && <p className="error-box" role="alert">{error}</p>}<form onSubmit={submit}><label>Usuario<input required autoComplete="username" value={usuario} onChange={e => setUsuario(e.target.value)} /></label><label>Clave<input required type="password" autoComplete="current-password" value={clave} onChange={e => setClave(e.target.value)} /></label><button className="primary" disabled={pending}>{pending ? 'Ingresando…' : 'Ingresar →'}</button></form></section>
}
