import { useEffect, useRef, useState } from 'react'
import { api, money, placeholder, imageFallback } from './api'

export default function Carrito({ cart, productos, onChange, onClose, onComplete, directCheckout, refreshing, refreshError }) {
  const dialog = useRef(null)
  const [checkout, setCheckout] = useState(directCheckout)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [clave] = useState(() => crypto.randomUUID())
  useEffect(() => {
    const previousFocus = document.activeElement
    const element = dialog.current
    element.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { element.close(); document.body.style.overflow = overflow; previousFocus?.focus() }
  }, [])
  const lines = cart.map(item => ({ ...item, producto: productos.find(p => p.id === item.id) }))
  const missing = lines.some(line => !line.producto)
  const totalCents = lines.reduce((sum, line) => sum + Math.round(Number(line.producto?.precio || 0) * 100) * line.cantidad, 0)
  const groups = [...new Set(lines.map(line => line.producto?.comercio_nombre || 'Producto no disponible'))]
  async function submit(event) {
    event.preventDefault()
    if (pending || missing || refreshing || refreshError || !cart.length) return
    setPending(true); setError('')
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    try {
      const data = await api('/pedidos', { method: 'POST', body: JSON.stringify({ ...fields, items: cart, clave, total_centavos: totalCents }) })
      setResult(data); onComplete()
    } catch (err) { setError(err.message) }
    finally { setPending(false) }
  }
  return <dialog ref={dialog} className={`cart-dialog ${checkout ? 'checkout-dialog' : ''}`} onCancel={event => { event.preventDefault(); if (!pending) onClose() }}>
    <div className="dialog-heading"><div><span className="eyebrow">VARILLAS MARKET</span><h2>{result ? '¡Pedido recibido!' : checkout ? 'Finalizar pedido' : 'Tu carrito'}</h2></div><button className="close-button" aria-label="Cerrar carrito" onClick={onClose} disabled={pending}>×</button></div>
    {result ? <div className="order-success"><span>✓</span><h3>Pedido #{result.id}</h3><p>Guardamos tu pedido por <strong>{money(result.total)}</strong>.</p><p>Quedó pendiente de confirmación. El pago, la disponibilidad y la entrega se coordinan con cada comercio. No se realizó ningún cobro.</p><button className="primary" onClick={onClose}>Seguir explorando</button></div> : !cart.length ? <div className="empty"><span>♧</span><h3>Tu carrito está esperando</h3><p>Descubrí productos y agregá tus favoritos.</p><button className="primary" onClick={onClose}>Explorar productos</button></div> : <>
      {refreshing && <p role="status">Actualizando precios…</p>}{refreshError && <p role="alert" className="error-box">{refreshError} Cerrá y volvé a abrir el carrito para reintentar.</p>}
      <div className={checkout ? 'checkout-layout' : ''}>
        {checkout && <form id="checkout-form" className="market-form checkout-form" onSubmit={submit}>
          <h3>1. Tus datos</h3><label>Nombre y apellido<input name="nombre" required minLength={2} maxLength={120} autoComplete="name" /></label>
          <div className="form-row"><label>Teléfono<input name="telefono" type="tel" required minLength={6} maxLength={30} autoComplete="tel" /></label><label>Email (opcional)<input name="email" type="email" maxLength={150} autoComplete="email" /></label></div>
          <fieldset><legend>2. ¿Cómo querés pagar?</legend><label className="choice"><input type="radio" name="pago" value="efectivo" required /> <span><strong>Efectivo</strong><small>Pago a coordinar con el comercio.</small></span></label><label className="choice"><input type="radio" name="pago" value="transferencia" required /><span><strong>Transferencia</strong><small>Los datos se acuerdan con cada comercio.</small></span></label></fieldset>
          <fieldset><legend>3. ¿Cómo querés recibirlo?</legend><label className="choice"><input type="radio" name="entrega" value="retiro" required /><span><strong>Retiro en el comercio</strong><small>Coordiná dónde y cuándo retirar.</small></span></label><label className="choice"><input type="radio" name="entrega" value="coordinar" required /><span><strong>Acordar entrega</strong><small>Costo y condiciones a confirmar.</small></span></label></fieldset>
          <label>Dirección de referencia (opcional)<input name="direccion" maxLength={300} autoComplete="street-address" /></label><label>Notas para los comercios (opcional)<textarea name="notas" rows={2} maxLength={1000} /></label>
          {error && <p className="error-box" role="alert">{error}</p>}
        </form>}
        <div className="cart-summary">{groups.map(group => <section className="cart-group" key={group}><h3>{group}</h3>{lines.filter(line => (line.producto?.comercio_nombre || 'Producto no disponible') === group).map(line => <div className="cart-line" key={line.id}>
          <img src={line.producto?.url_imagen || placeholder} onError={imageFallback} alt={line.producto?.titulo || 'Producto eliminado'} /><div><strong>{line.producto?.titulo || `Producto #${line.id} no disponible`}</strong><p>{line.producto ? money(line.producto.precio) : 'Quitalo para continuar'}</p><div className="cart-line-actions"><div className="quantity"><button aria-label={`Restar ${line.producto?.titulo || 'producto'}`} disabled={pending || line.cantidad <= 1} onClick={() => onChange(line.id, line.cantidad - 1)}>−</button><span>{line.cantidad}</span><button aria-label={`Sumar ${line.producto?.titulo || 'producto'}`} disabled={pending || line.cantidad >= 99} onClick={() => onChange(line.id, line.cantidad + 1)}>+</button></div><button className="text-button" disabled={pending} onClick={() => onChange(line.id, 0)}>Quitar</button></div></div>
        </div>)}</section>)}
          <div className="cart-total"><span>Total de productos</span><strong>{money(totalCents / 100)}</strong></div><p className="muted">Entrega y disponibilidad a confirmar. Tu pedido se guarda pendiente de coordinación; no se cobra online.</p>
          {checkout ? <><button className="primary" form="checkout-form" type="submit" disabled={pending || missing || refreshing || Boolean(refreshError)}>{pending ? 'Guardando pedido…' : 'Confirmar pedido →'}</button><button className="text-button" disabled={pending} onClick={() => setCheckout(false)}>← Volver al carrito</button></> : <button className="primary" disabled={missing || refreshing || Boolean(refreshError)} onClick={() => setCheckout(true)}>Continuar con el pedido →</button>}
        </div>
      </div>
    </>}
  </dialog>
}
