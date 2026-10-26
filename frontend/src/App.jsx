import { useCallback, useEffect, useState } from 'react'
import Catalogo from './Catalogo'
import DetalleProducto from './DetalleProducto'
import FormularioProducto from './FormularioProducto'
import Carrito from './Carrito'
import Ingreso from './Ingreso'
import AdminPanel from './AdminPanel'
import { api, money } from './api'
import { Fragment } from 'react'
import './App.css'

function loadCart() {
  try {
    const value = JSON.parse(localStorage.getItem('varillas-cart') || '[]')
    return Array.isArray(value) ? value.filter(i => i && Number.isInteger(i.id) && i.id > 0 && Number.isInteger(i.cantidad) && i.cantidad > 0 && i.cantidad <= 99).slice(0, 100).filter((i, index, all) => all.findIndex(x => x.id === i.id) === index).map(({ id, cantidad }) => ({ id, cantidad })) : []
  } catch { return [] }
}
const currentRoute = () => window.location.hash.slice(1) || (window.location.pathname === '/admin' ? '/admin' : '/')
function renderAIReply(text) {
  const parts = []
  const links = /\[([^\]]+)\]\((\/#\/producto\/\d+)\)|(\/#\/producto\/\d+)/g
  let cursor = 0
  for (const match of text.matchAll(links)) {
    const index = match.index
    if (index > cursor) parts.push(text.slice(cursor, index))
    const href = match[2] || match[3]
    parts.push(<a key={`${index}-${href}`} href={href}>{match[1] || 'Ver producto'} ↗</a>)
    cursor = index + match[0].length
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts.map((part, index) => <Fragment key={typeof part === 'string' ? `text-${index}` : part.key}>{part}</Fragment>)
}
export default function App() {
  const [route, setRoute] = useState(currentRoute)
  const [productos, setProductos] = useState([])
  const [comercios, setComercios] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState(loadCart)
  const [cartMode, setCartMode] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState('')
  const [toast, setToast] = useState('')
  const [pregunta, setPregunta] = useState('')
  const [respuesta, setRespuesta] = useState('')
  const [aiMessages, setAiMessages] = useState([])
  const [asking, setAsking] = useState(false)
  const [usuario, setUsuario] = useState(() => { try { return JSON.parse(localStorage.getItem('varillas-user') || 'null') } catch { return null } })
  const [misProductos, setMisProductos] = useState([])
  const [misPedidos, setMisPedidos] = useState([])
  const [editando, setEditando] = useState(null)
  const [managementBusy, setManagementBusy] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState(null)
  const load = useCallback(() => {
    return Promise.all([api('/productos'), api('/comercios'), api('/categorias')]).then(([p, c, ca]) => {
      setProductos(p); setComercios(c); setCategorias(ca); setError('')
    }).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [])
  useEffect(() => { void load() }, [load])
  useEffect(() => {
    if (!localStorage.getItem('varillas-token')) return
    api('/auth/me').then(setUsuario).catch(() => { localStorage.removeItem('varillas-token'); localStorage.removeItem('varillas-user'); setUsuario(null) })
  }, [])
  useEffect(() => {
    if (!usuario) return
    let active = true
    Promise.resolve().then(() => { if (active) setManagementBusy(true); return Promise.all([api('/mis-productos'), api('/mis-pedidos')]) }).then(([products, orders]) => { if (active) { setMisProductos(products); setMisPedidos(orders) } }).catch(() => { if (active) { setMisProductos([]); setMisPedidos([]) } }).finally(() => { if (active) setManagementBusy(false) })
    return () => { active = false }
  }, [usuario, route])
  useEffect(() => {
    const update = () => { setRoute(currentRoute()); window.scrollTo({ top: 0 }) }
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  useEffect(() => { try { localStorage.setItem('varillas-cart', JSON.stringify(cart)) } catch { /* El carrito sigue funcionando en memoria. */ } }, [cart])
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer) }, [toast])
  const navigate = path => { window.location.hash = path }
  const detailId = route.match(/^\/producto\/(\d+)$/)?.[1]
  const publish = route === '/publicar'
  const login = route === '/ingresar'
  const home = route === '/'
  async function openCart(mode = 'cart') {
    setCartMode(mode); setRefreshing(true); setRefreshError('')
    try { setProductos(await api('/productos')) }
    catch (err) { setRefreshError(err.message) }
    finally { setRefreshing(false) }
  }
  function add(producto, cantidad, buy) {
    setCart(previous => {
      const existing = previous.find(p => p.id === producto.id)
      return existing ? previous.map(p => p.id === producto.id ? { ...p, cantidad: Math.min(99, p.cantidad + cantidad) } : p) : [...previous, { id: producto.id, cantidad }]
    })
    void openCart(buy ? 'checkout' : 'cart')
  }
  async function preguntarIA(event) {
    event.preventDefault()
    if (!pregunta.trim() || asking) return
    setAsking(true)
    const question = pregunta.trim()
    try { const data = await api('/ia', { method: 'POST', body: JSON.stringify({ pregunta: question, historial: aiMessages.slice(-8).map(({ role, text }) => ({ role, text })) }) }); setAiMessages(previous => [...previous, { role: 'user', text: question }, { role: 'assistant', text: data.respuesta, productos: data.productos || [] }]); setRespuesta(''); setPregunta('') }
    catch (err) { setRespuesta(err.message) }
    finally { setAsking(false) }
  }
  async function eliminarProducto(producto) {
    if (!window.confirm(`¿Eliminar “${producto.titulo}” de tu catálogo?`)) return
    setDeletingProduct(producto.id)
    try {
      await api(`/productos/${producto.id}`, { method: 'DELETE' })
      setMisProductos(current => current.filter(item => item.id !== producto.id))
      if (editando?.id === producto.id) setEditando(null)
      await load()
      setToast('Producto eliminado.')
    } catch (err) { setToast(err.message) }
    finally { setDeletingProduct(null) }
  }
  if (route === '/admin') return <AdminPanel />
  return <div className="market-app">
    <div className="announcement"><span>Un mercado. Toda tu ciudad.</span><span>Las Varillas, Córdoba ↗</span></div>
    <header className="site-header"><div className="header-inner">
      <a className="brand" href="#/" aria-label="Varillas Market, inicio"><span className="brand-mark">VM</span><span>varillas<span className="brand-sub">market</span></span></a>
      <form className="search-box" onSubmit={event => { event.preventDefault(); navigate('/'); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }) }}><span aria-hidden="true">⌕</span><input aria-label="Buscar productos" placeholder="¿Qué estás buscando hoy?" value={search} onChange={e => { setSearch(e.target.value); if (!home) navigate('/') }} /><button aria-label="Buscar" type="submit">→</button></form>
      <nav className="header-actions" aria-label="Navegación principal">{usuario ? <><a className={publish ? 'nav-active' : ''} href="#/publicar">Mi comercio · {usuario.nombre} ↗</a><button className="text-button" onClick={() => { localStorage.removeItem('varillas-token'); localStorage.removeItem('varillas-user'); setUsuario(null); navigate('/') }}>Salir</button></> : <a className={login ? 'nav-active' : ''} href="#/ingresar">Acceso comercios ↗</a>}<a className="admin-nav-link" href="/admin">Admin</a><button className="cart-button" onClick={() => openCart()} aria-label={`Carrito, ${cart.reduce((sum, p) => sum + p.cantidad, 0)} productos`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 3h2l3 12h11l2-8H6M9 20h.01M18 20h.01" strokeLinecap="round" strokeLinejoin="round" /></svg><span>Carrito</span><b>{cart.reduce((sum, p) => sum + p.cantidad, 0)}</b></button></nav>
    </div></header>
    <main className="site-main">
      {home && <><section className="market-hero"><div className="hero-copy"><span className="hero-kicker"><i /> EL MERCADO DE LAS VARILLAS</span><h1>Todo lo que buscás.<br /><em>Más cerca de vos.</em></h1><p>Descubrí productos de los comercios de tu ciudad.<br />Elegí local, comprá simple.</p><a className="hero-link" href="#catalogo" onClick={e => { e.preventDefault(); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }) }}>Explorar productos <span>↗</span></a></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="shop-illustration"><div className="shop-roof"/><div className="shop-awning"><i/><i/><i/><i/><i/></div><div className="shop-body"><div className="shop-window"><span>VM</span></div><div className="shop-door"/></div></div><span className="art-tag tag-one">↗ Comprá local</span><span className="art-tag tag-two">Hecho para encontrarnos.</span><span className="art-spark">✳</span></div></section>
      <div className="benefits"><div><span>⌂</span><p><strong>Comercios de tu ciudad</strong><small>Encontralos en un solo lugar</small></p></div><div><span>▤</span><p><strong>Elegí cómo pagar</strong><small>Coordiná con cada comercio</small></p></div><div><span>↗</span><p><strong>Conectamos lo local</strong><small>Más cerca de lo que necesitás</small></p></div></div></>}
      {loading ? <div className="loading" role="status">Cargando el mercado…</div> : error ? <div className="error-box" role="alert"><h2>No pudimos cargar el mercado</h2><p>{error}</p><button className="secondary" onClick={load}>Reintentar</button></div> : <>
        {home && <Catalogo productos={productos} comercios={comercios} categorias={categorias} search={search} setSearch={setSearch} onVer={id => navigate(`/producto/${id}`)} />}
        {detailId && <DetalleProducto key={detailId} id={detailId} onAdd={add} onBack={() => navigate('/')} />}
        {login && <Ingreso onLogin={user => { setUsuario(user); setToast(`Sesión iniciada: ${user.nombre}`); navigate('/publicar') }} />}
        {publish && !usuario && <section className="panel auth-panel"><h1>Ingresá para administrar productos</h1><p className="muted">Cada cuenta solo puede publicar y modificar productos de su comercio.</p><a className="primary" href="#/ingresar">Ingresar →</a></section>}
        {publish && usuario && <div className="merchant-dashboard"><section className="panel merchant-products"><div className="section-heading"><div><span className="eyebrow">PANEL DEL COMERCIO</span><h2>{usuario.nombre}</h2></div><button className="primary" onClick={() => setEditando(null)}>+ Nuevo producto</button></div>{managementBusy ? <p className="muted">Cargando tus productos…</p> : misProductos.length ? <div className="owned-products">{misProductos.map(p => <article key={p.id}><img src={p.url_imagen || '/producto-placeholder.svg'} alt=""/><div><strong>{p.titulo}</strong><span>{money(p.precio)} · {p.categoria_nombre}</span></div><button className="secondary" onClick={() => { setEditando(p); document.getElementById('product-form')?.scrollIntoView({ behavior: 'smooth' }) }}>Editar</button><button className="danger-button" disabled={deletingProduct === p.id} onClick={() => eliminarProducto(p)}>{deletingProduct === p.id ? 'Eliminando…' : 'Eliminar'}</button></article>)}</div> : <p className="muted">Todavía no publicaste productos.</p>}</section><section className="panel merchant-orders"><div className="section-heading"><div><span className="eyebrow">VENTAS</span><h2>Pedidos recibidos</h2></div><span className="order-count">{misPedidos.length} {misPedidos.length === 1 ? 'pedido' : 'pedidos'}</span></div>{managementBusy ? <p className="muted">Cargando tus pedidos…</p> : misPedidos.length ? <div className="merchant-order-list">{misPedidos.map(order => <article className="merchant-order" key={order.id}><div className="merchant-order-heading"><div><strong>Pedido #{order.id}</strong><span>{new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(order.creado_en))}</span></div><span className="order-status">{order.estado}</span></div><div className="order-buyer"><strong>{order.comprador}</strong><a href={`tel:${order.telefono}`}>{order.telefono}</a>{order.email && <a href={`mailto:${order.email}`}>{order.email}</a>}</div><div className="order-lines">{order.items.map((item, index) => <div key={`${item.titulo}-${index}`}><span>{item.cantidad} × {item.titulo}</span><strong>{money(item.precio * item.cantidad)}</strong></div>)}</div><div className="order-meta"><span>Pago: {order.pago === 'efectivo' ? 'Efectivo' : 'Transferencia'}</span><span>Entrega: {order.entrega === 'retiro' ? 'Retiro' : 'A coordinar'}{order.direccion ? ` · ${order.direccion}` : ''}</span></div>{order.notas && <p className="order-notes"><strong>Notas:</strong> {order.notas}</p>}<div className="order-total"><span>Total de este comercio</span><strong>{money(order.total)}</strong></div></article>)}</div> : <p className="muted">Todavía no recibiste pedidos.</p>}</section><div id="product-form"><FormularioProducto key={editando?.id || 'nuevo'} comercios={comercios} categorias={categorias} usuario={usuario} editando={editando} onCancelarEdicion={() => setEditando(null)} onProductoAgregado={() => { setToast(editando ? 'Producto actualizado.' : '¡Tu producto ya está publicado!'); setEditando(null); void load(); api('/mis-productos').then(setMisProductos); }} /></div></div>}
        {!home && !publish && !login && !detailId && <div className="empty panel"><h1>Esta página no existe</h1><a className="primary" href="#/">Volver al catálogo</a></div>}
      </>}
      {home && <section className="ai-banner"><div><span className="eyebrow">UNA MANO PARA ENCONTRAR</span><h2>Preguntale a Vara IA <span>✳</span></h2><p>Tu asistente para descubrir productos y comercios.</p></div><div>{aiMessages.length > 0 && <div className="ai-chat" aria-live="polite">{aiMessages.map((message, index) => <div className={`ai-message ${message.role}`} key={`${index}-${message.role}`}><p className="ai-message-copy">{message.role === 'assistant' ? renderAIReply(message.text) : message.text}</p>{message.role === 'assistant' && message.productos?.length > 0 && <div className="ai-product-grid">{message.productos.slice(0, 5).map((producto, productIndex) => <article className="ai-product-card" key={producto.id}><div className="ai-product-image"><img src={producto.url_imagen || '/producto-placeholder.svg'} alt={producto.titulo} onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/producto-placeholder.svg' }} /><span>{productIndex === 0 ? 'Mejor coincidencia' : `Opción ${productIndex + 1}`}</span></div><div className="ai-product-info"><span className="ai-product-market">{producto.comercio_nombre}</span><h3>{producto.titulo}</h3><span className="ai-product-category">{producto.categoria_nombre}</span><strong className="ai-product-price">{money(producto.precio)}</strong><button className="secondary" onClick={() => navigate(`/producto/${producto.id}`)}>Ver producto ↗</button></div></article>)}</div>}</div>)}</div>}<form onSubmit={preguntarIA}><label className="sr-only" htmlFor="pregunta">Consulta para Vara IA</label><div className="ai-input"><input id="pregunta" required maxLength={1000} placeholder="¿Qué estás buscando?" value={pregunta} onChange={e => setPregunta(e.target.value)} /><button className="primary" disabled={asking || !pregunta.trim()}>{asking ? 'Consultando…' : 'Preguntar ↗'}</button></div>{respuesta && <p className="ai-response" role="alert">{respuesta}</p>}</form></div></section>}
    </main>
    <footer className="site-footer"><div><a className="brand" href="#/">varillas<span className="footer-market">market.</span></a><p>El comercio de siempre. Una nueva forma de encontrarnos.</p></div><span>Las Varillas · Córdoba · Argentina</span></footer>
    {toast && <div className="toast" role="status">✓ {toast}</div>}
    {cartMode && <Carrito cart={cart} productos={productos} onChange={(id, cantidad) => setCart(previous => cantidad ? previous.map(p => p.id === id ? { ...p, cantidad } : p) : previous.filter(p => p.id !== id))} onClose={() => setCartMode(null)} onComplete={() => setCart([])} directCheckout={cartMode === 'checkout'} refreshing={refreshing} refreshError={refreshError} />}
  </div>
}
