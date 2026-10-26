import { useCallback, useEffect, useState } from 'react'
import { adminApi, money } from './api'

export default function AdminPanel() {
  const [admin, setAdmin] = useState(null)
  const [usuario, setUsuario] = useState('admin')
  const [clave, setClave] = useState('')
  const [nombre, setNombre] = useState('')
  const [planId, setPlanId] = useState('')
  const [planes, setPlanes] = useState([])
  const [comercios, setComercios] = useState([])
  const [nuevoAcceso, setNuevoAcceso] = useState(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const cargarDatos = useCallback(async () => {
    const [businessRows, planRows] = await Promise.all([adminApi('/admin/businesses'), adminApi('/admin/plans')])
    setComercios(businessRows)
    setPlanes(planRows)
    setPlanId(current => current || String(planRows[0]?.id || ''))
  }, [])

  useEffect(() => {
    if (!localStorage.getItem('varillas-admin-token')) return
    adminApi('/admin/me').then(setAdmin).then(cargarDatos).catch(() => {
      localStorage.removeItem('varillas-admin-token')
      setAdmin(null)
    })
  }, [cargarDatos])

  async function ingresar(event) {
    event.preventDefault(); setPending(true); setError('')
    try {
      const data = await adminApi('/admin/login', { method: 'POST', body: JSON.stringify({ usuario, clave }) })
      localStorage.setItem('varillas-admin-token', data.token)
      setAdmin({ usuario: data.usuario })
      setClave('')
      await cargarDatos()
    } catch (err) { setError(err.message) }
    finally { setPending(false) }
  }

  async function agregar(event) {
    event.preventDefault(); setPending(true); setError(''); setNuevoAcceso(null)
    try {
      const result = await adminApi('/admin/businesses', { method: 'POST', body: JSON.stringify({ nombre, plan_id: Number(planId) }) })
      setNuevoAcceso(result)
      setNombre('')
      await cargarDatos()
    } catch (err) { setError(err.message) }
    finally { setPending(false) }
  }

  async function eliminar(comercio) {
    if (!window.confirm(`¿Eliminar ${comercio.nombre} y todos sus productos?`)) return
    setPending(true); setError('')
    try {
      await adminApi(`/admin/businesses/${comercio.id}`, { method: 'DELETE' })
      setComercios(current => current.filter(item => item.id !== comercio.id))
      setNuevoAcceso(null)
    } catch (err) { setError(err.message) }
    finally { setPending(false) }
  }

  function salir() {
    localStorage.removeItem('varillas-admin-token')
    setAdmin(null); setComercios([]); setPlanes([])
  }

  return <div className="admin-page">
    <header className="admin-header"><a className="brand" href="/" aria-label="Volver al mercado"><span className="brand-mark">VM</span><span>varillas<span className="brand-sub">market</span></span></a><a href="/">Volver al mercado ↗</a></header>
    {!admin ? <main className="admin-main"><form className="panel market-form auth-panel" onSubmit={ingresar}>
      <span className="eyebrow">ADMINISTRACIÓN GENERAL</span><h1>Ingresá al administrador</h1>
      <p className="muted">Gestioná los comercios adheridos al mercado.</p>
      {error && <p className="error-box" role="alert">{error}</p>}
      <label>Usuario<input required autoComplete="username" value={usuario} onChange={event => setUsuario(event.target.value)} /></label>
      <label>Clave<input required type="password" autoComplete="current-password" value={clave} onChange={event => setClave(event.target.value)} /></label>
      <button className="primary" disabled={pending}>{pending ? 'Ingresando…' : 'Ingresar →'}</button>
    </form></main> : <main className="admin-main">
      <div className="admin-title"><div><span className="eyebrow">ADMINISTRACIÓN GENERAL</span><h1>Comercios adheridos</h1></div><button className="text-button" onClick={salir}>Salir</button></div>
      {error && <p className="error-box" role="alert">{error}</p>}
      <section className="panel market-form admin-add">
        <div><span className="eyebrow">NUEVO COMERCIO</span><h2>Agregar un negocio</h2><p className="muted">Se creará también su acceso al panel de comercio.</p></div>
        <form onSubmit={agregar}>
          <label>Nombre del comercio<input required maxLength={100} value={nombre} onChange={event => setNombre(event.target.value)} placeholder="Ej. Librería del Centro" /></label>
          <label>Plan<select required value={planId} onChange={event => setPlanId(event.target.value)}><option value="">Seleccionar plan</option>{planes.map(plan => <option key={plan.id} value={plan.id}>{plan.nombre_plan} · {money(plan.costo_mensual)}</option>)}</select></label>
          <button className="primary" disabled={pending || !planes.length}>{pending ? 'Guardando…' : 'Agregar comercio →'}</button>
        </form>
        {nuevoAcceso && <p className="admin-credentials" role="status"><strong>Acceso creado para {nuevoAcceso.nombre}:</strong> usuario <code>{nuevoAcceso.usuario}</code> · clave <code>{nuevoAcceso.clave}</code></p>}
      </section>
      <section className="panel admin-businesses">
        <div className="admin-business-heading"><div><span className="eyebrow">DIRECTORIO</span><h2>Negocios actuales</h2></div><span>{comercios.length} comercios</span></div>
        {!comercios.length ? <p className="muted">No hay comercios cargados.</p> : <div className="admin-business-list">{comercios.map(comercio => <article key={comercio.id}>
          <div className="admin-business-icon">🏪</div><div className="admin-business-info"><strong>{comercio.nombre}</strong><span>{comercio.nombre_plan} · {comercio.productos} productos</span></div>
          <button className="danger-button" disabled={pending} onClick={() => eliminar(comercio)}>Eliminar</button>
        </article>)}</div>}
      </section>
    </main>}
    <footer className="admin-footer">Varillas Market · Las Varillas, Córdoba</footer>
  </div>
}
