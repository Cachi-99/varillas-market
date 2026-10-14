import { useEffect, useState } from 'react'
import { api, money, placeholder, imageFallback } from './api'

export default function DetalleProducto({ id, onAdd, onBack }) {
  const [producto, setProducto] = useState(null)
  const [error, setError] = useState('')
  const [cantidad, setCantidad] = useState(1)
  useEffect(() => {
    const controller = new AbortController()
    api(`/productos/${id}`, { signal: controller.signal }).then(setProducto).catch(err => { if (err.name !== 'AbortError') setError(err.message) })
    return () => controller.abort()
  }, [id])
  return <section><nav className="breadcrumbs" aria-label="Ruta de navegación"><button onClick={onBack}>Catálogo</button><span>/</span><span>{producto?.titulo || 'Detalle del producto'}</span></nav>
    {error ? <p className="error-box" role="alert">{error}</p> : !producto ? <p role="status" className="loading">Cargando producto…</p> : <>
      <div className="detail-layout"><div className="detail-image panel"><img src={producto.url_imagen || placeholder} onError={imageFallback} alt={producto.titulo} /></div>
        <div className="detail-info"><span className="eyebrow">{producto.categoria_nombre}</span><h1>{producto.titulo}</h1><p className="seller">Vendido por <strong>{producto.comercio_nombre}</strong></p><p className="detail-price">{money(producto.precio)}</p><p className="muted">Precio por unidad · Pesos argentinos</p>
          <div className="detail-description"><h2>Sobre este producto</h2><p>{producto.descripcion || 'El comercio todavía no agregó una descripción para este producto.'}</p></div>
          <p className="availability">Disponibilidad y entrega a confirmar con el comercio.</p>
          <div className="quantity-label"><span>Cantidad</span><div className="quantity"><button type="button" aria-label="Disminuir cantidad" disabled={cantidad <= 1} onClick={() => setCantidad(cantidad - 1)}>−</button><input aria-label="Cantidad" type="number" min="1" max="99" value={cantidad} onChange={e => setCantidad(Math.max(1, Math.min(99, Math.trunc(Number(e.target.value) || 1))))} /><button type="button" aria-label="Aumentar cantidad" disabled={cantidad >= 99} onClick={() => setCantidad(cantidad + 1)}>+</button></div></div>
          <div className="purchase-actions"><button className="primary" onClick={() => onAdd(producto, cantidad, true)}>Comprar ahora →</button><button className="secondary" onClick={() => onAdd(producto, cantidad, false)}>Agregar al carrito</button></div>
          <div className="trust-grid"><div><span>↗</span><strong>Compra local</strong><p>Directo a los comercios de tu ciudad.</p></div><div><span>▤</span><strong>Pago a coordinar</strong><p>Efectivo o transferencia.</p></div><div><span>⌂</span><strong>A tu manera</strong><p>Retiro o entrega a coordinar.</p></div></div>
        </div></div>
      <div className="detail-specs panel"><h2>Información del producto</h2><dl><div><dt>Categoría</dt><dd>{producto.categoria_nombre}</dd></div><div><dt>Comercio</dt><dd>{producto.comercio_nombre}</dd></div><div><dt>Código de producto</dt><dd>VM-{producto.id}</dd></div></dl></div>
    </>}
  </section>
}
