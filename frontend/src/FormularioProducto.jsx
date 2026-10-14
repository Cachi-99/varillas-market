import { useState } from 'react'
import { api, money, placeholder, imageFallback } from './api'

const empty = { titulo: '', precio: '', url_imagen: '', descripcion: '', comercio_id: '', categoria_id: '' }
export default function FormularioProducto({ comercios, categorias, usuario, editando, onProductoAgregado, onCancelarEdicion }) {
  const [form, setForm] = useState(editando ? { titulo: editando.titulo, precio: String(editando.precio), url_imagen: editando.url_imagen || '', descripcion: editando.descripcion || '', comercio_id: String(editando.comercio_id), categoria_id: String(editando.categoria_id) } : { ...empty, comercio_id: String(usuario.comercio_id) })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const field = name => ({ value: form[name], onChange: e => setForm({ ...form, [name]: e.target.value }) })
  async function submit(event) {
    event.preventDefault()
    if (pending) return
    setPending(true); setError('')
    try {
      const result = await api(editando ? `/productos/${editando.id}` : '/productos', { method: editando ? 'PUT' : 'POST', body: JSON.stringify({ ...form, precio: Number(form.precio), comercio_id: Number(form.comercio_id), categoria_id: Number(form.categoria_id) }) })
      setForm({ ...empty, comercio_id: String(usuario.comercio_id) })
      onProductoAgregado(result.id)
    } catch (err) { setError(err.message) }
    finally { setPending(false) }
  }
  return <section className="publish-layout">
    <form className="panel market-form" onSubmit={submit}>
      <span className="eyebrow">TU COMERCIO · {usuario.nombre}</span><h1>{editando ? 'Editar producto' : 'Publicar un producto'}</h1>
      <p className="muted">Completá la información para que puedan encontrarlo en el mercado.</p>
      {error && <p role="alert" className="error-box">{error}</p>}
      <label>Título del producto<input required maxLength={150} placeholder="Ej. Zapatillas urbanas" {...field('titulo')} /></label>
      <div className="form-row">
        <label>Precio en pesos<input type="number" required min="0" max="99999999.99" step="0.01" placeholder="0,00" {...field('precio')} /></label>
        <label>Categoría<select required {...field('categoria_id')}><option value="">Seleccionar categoría</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
      </div>
      <p className="muted">El producto se publicará en <strong>{usuario.nombre}</strong>.</p>
      <label>Descripción<textarea rows={5} maxLength={5000} placeholder="Contá sus características, materiales, medidas y lo que incluye." {...field('descripcion')} /></label>
      <label>Enlace de la imagen<input type="url" maxLength={255} pattern="https?://.*" placeholder="https://..." {...field('url_imagen')} /><span className="muted">Usá un enlace directo a una imagen JPG, PNG o WebP.</span></label>
      <button className="primary" disabled={pending || !categorias.length}>{pending ? 'Guardando…' : editando ? 'Guardar cambios →' : 'Publicar producto →'}</button>
      {editando && <button type="button" className="secondary" onClick={onCancelarEdicion}>Cancelar edición</button>}
      {(!comercios.length || !categorias.length) && <p role="status">Necesitás comercios y categorías cargados en la base para publicar.</p>}
    </form>
    <aside className="panel preview"><span className="eyebrow">VISTA PREVIA</span><img key={form.url_imagen} src={form.url_imagen || placeholder} onError={imageFallback} alt="Vista previa del producto" /><h2>{form.titulo || 'Tu próximo producto'}</h2><strong className="price">{money(form.precio || 0)}</strong><p className="muted">Una buena foto y una descripción clara ayudan a elegir.</p></aside>
  </section>
}
