import { useState } from 'react'
import Productos from './Productos'

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
export default function Catalogo({ productos, comercios, categorias, search, setSearch, onVer }) {
  const [comercio, setComercio] = useState('')
  const [categoria, setCategoria] = useState('')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [order, setOrder] = useState('recent')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const change = setter => e => { setter(e.target.value); setPage(1) }
  const reset = () => { setComercio(''); setCategoria(''); setMin(''); setMax(''); setSearch(''); setPage(1) }
  const invalidRange = min !== '' && max !== '' && Number(min) > Number(max)
  const filtered = productos.filter(p => (!comercio || String(p.comercio_id) === comercio) && (!categoria || String(p.categoria_id) === categoria) && (min === '' || Number(p.precio) >= Number(min)) && (max === '' || Number(p.precio) <= Number(max)) && normalize(`${p.titulo} ${p.comercio_nombre} ${p.categoria_nombre}`).includes(normalize(search)))
    .sort((a, b) => order === 'low' ? Number(a.precio) - Number(b.precio) : order === 'high' ? Number(b.precio) - Number(a.precio) : order === 'name' ? a.titulo.localeCompare(b.titulo, 'es') : b.id - a.id)
  const pages = Math.max(1, Math.ceil(filtered.length / 12))
  const current = Math.min(page, pages)
  const active = Boolean(comercio || categoria || min || max || search)
  return <section id="catalogo" className="catalog-section">
    <div className="section-heading"><div><span className="eyebrow">EXPLORÁ EL MERCADO</span><h2>Encontrá eso que buscás.</h2></div><span className="muted">De acá, para vos.</span></div>
    <div className="category-strip"><button className={!categoria ? 'selected' : ''} onClick={() => { setCategoria(''); setPage(1) }}>Todas las categorías</button>{categorias.map(c => <button key={c.id} className={categoria === String(c.id) ? 'selected' : ''} onClick={() => { setCategoria(String(c.id)); setPage(1) }}>{c.nombre}</button>)}</div>
    <button className="secondary mobile-filters" aria-expanded={open} onClick={() => setOpen(!open)}>☷ {open ? 'Ocultar filtros' : 'Mostrar filtros'}</button>
    <div className="catalog-layout">
      <aside className={`filters panel ${open ? 'filters-open' : ''}`}><div className="filter-heading"><h3>Filtros</h3><button className="text-button" onClick={reset} disabled={!active}>Limpiar</button></div>
        <label>Comercio<select value={comercio} onChange={change(setComercio)}><option value="">Todos los comercios</option>{comercios.map(c => <option value={c.id} key={c.id}>{c.nombre}</option>)}</select></label>
        <label>Categoría<select value={categoria} onChange={change(setCategoria)}><option value="">Todas las categorías</option>{categorias.map(c => <option value={c.id} key={c.id}>{c.nombre}</option>)}</select></label>
        <fieldset><legend>Precio</legend><div className="price-range"><label>Desde<input type="number" min="0" placeholder="$ 0" value={min} onChange={change(setMin)} /></label><label>Hasta<input type="number" min="0" placeholder="Sin límite" value={max} onChange={change(setMax)} /></label></div></fieldset>
        {invalidRange && <p role="alert" className="error-box">El precio mínimo debe ser menor o igual al máximo.</p>}
        <div className="local-note"><span>↗</span><strong>Elegí comercio local</strong><p>Cada compra hace crecer a Las Varillas.</p></div>
      </aside>
      <div className="catalog-results"><div className="results-toolbar"><p aria-live="polite"><strong>{filtered.length}</strong> productos{search && <> para “{search}”</>}</p><label>Ordenar por<select value={order} onChange={change(setOrder)}><option value="recent">Más recientes</option><option value="low">Menor precio</option><option value="high">Mayor precio</option><option value="name">Nombre A–Z</option></select></label></div>
        {!filtered.length ? <div className="empty panel"><span>⌕</span><h3>{productos.length ? 'No encontramos coincidencias' : 'El mercado está por comenzar'}</h3><p>{productos.length ? 'Probá otra búsqueda o cambiá los filtros.' : 'Los productos publicados por los comercios aparecerán acá.'}</p>{active && <button className="secondary" onClick={reset}>Limpiar filtros</button>}</div> : <Productos productos={filtered.slice((current - 1) * 12, current * 12)} onVer={onVer} />}
        {pages > 1 && <nav className="pagination" aria-label="Páginas de productos"><button className="secondary" disabled={current === 1} onClick={() => setPage(current - 1)}>← Anterior</button><span>{current} de {pages}</span><button className="secondary" disabled={current === pages} onClick={() => setPage(current + 1)}>Siguiente →</button></nav>}
      </div>
    </div>
  </section>
}
