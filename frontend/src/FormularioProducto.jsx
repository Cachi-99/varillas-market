import { useState } from 'react'
import { api, money, placeholder, imageFallback } from './api'

const empty = { titulo: '', precio: '', url_imagen: '', descripcion: '', comercio_id: '', categoria_id: '' }
const categoriasComunes = [
  'Almacén', 'Alimentos y bebidas', 'Bazar y hogar', 'Calzado', 'Construcción y ferretería',
  'Deportes', 'Electrodomésticos', 'Farmacia y perfumería', 'Juguetería', 'Librería y papelería',
  'Mascotas', 'Muebles y decoración', 'Ropa y accesorios', 'Servicios', 'Tecnología', 'Otros',
]
const addCategoryOption = '＋ Agregar categoría…'

export default function FormularioProducto({ comercios, categorias, usuario, editando, onProductoAgregado, onCancelarEdicion }) {
  const [form, setForm] = useState(editando ? { titulo: editando.titulo, precio: String(editando.precio), url_imagen: editando.url_imagen || '', descripcion: editando.descripcion || '', comercio_id: String(editando.comercio_id), categoria_id: String(editando.categoria_id) } : { ...empty, comercio_id: String(usuario.comercio_id) })
  const [categoriaNombre, setCategoriaNombre] = useState(editando?.categoria_nombre || categorias.find(c => String(c.id) === String(editando?.categoria_id))?.nombre || '')
  const [agregandoCategoria, setAgregandoCategoria] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const field = name => ({ value: form[name], onChange: e => setForm({ ...form, [name]: e.target.value }) })
  async function submit(event) {
    event.preventDefault()
    if (pending) return
    setPending(true); setError('')
    try {
      let categoria = categorias.find(item => item.nombre.localeCompare(categoriaNombre.trim(), undefined, { sensitivity: 'base' }) === 0)
      if (!categoria) categoria = await api('/categorias', { method: 'POST', body: JSON.stringify({ nombre: categoriaNombre.trim() }) })
      const result = await api(editando ? `/productos/${editando.id}` : '/productos', { method: editando ? 'PUT' : 'POST', body: JSON.stringify({ ...form, precio: Number(form.precio), comercio_id: Number(form.comercio_id), categoria_id: Number(categoria.id) }) })
      setForm({ ...empty, comercio_id: String(usuario.comercio_id) })
      setCategoriaNombre('')
      setAgregandoCategoria(false)
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
        <label>Categoría<input required list={`categorias-comercio-${usuario.comercio_id}`} maxLength={50} placeholder={agregandoCategoria ? 'Escribí la nueva categoría' : 'Buscar o seleccionar categoría'} value={categoriaNombre} onChange={event => { const value = event.target.value; if (value === addCategoryOption) { setCategoriaNombre(''); setAgregandoCategoria(true); return } setCategoriaNombre(value); const known = [...categorias.map(c => c.nombre), ...categoriasComunes].some(nombre => nombre.localeCompare(value.trim(), undefined, { sensitivity: 'base' }) === 0); setAgregandoCategoria(Boolean(value.trim()) && !known) }} /><datalist id={`categorias-comercio-${usuario.comercio_id}`}>{[...new Set([...categorias.map(c => c.nombre), ...categoriasComunes])].sort((a, b) => a.localeCompare(b, 'es')).map(nombre => <option key={nombre} value={nombre} />)}<option value={addCategoryOption} /></datalist>{agregandoCategoria && <span className="muted">La nueva categoría quedará disponible para todos los comercios.</span>}</label>
      </div>
      <p className="muted">El producto se publicará en <strong>{usuario.nombre}</strong>.</p>
      <label>Descripción<textarea rows={5} maxLength={5000} placeholder="Contá sus características, materiales, medidas y lo que incluye." {...field('descripcion')} /></label>
      <label>Enlace de la imagen<input type="url" maxLength={255} pattern="https?://.*" placeholder="https://..." {...field('url_imagen')} /><span className="muted">Usá un enlace directo a una imagen JPG, PNG o WebP.</span></label>
      <button className="primary" disabled={pending || !categoriaNombre.trim()}>{pending ? 'Guardando…' : editando ? 'Guardar cambios →' : 'Publicar producto →'}</button>
      {editando && <button type="button" className="secondary" onClick={onCancelarEdicion}>Cancelar edición</button>}
      {!comercios.length && <p role="status">Necesitás comercios cargados en la base para publicar.</p>}
    </form>
    <aside className="panel preview"><span className="eyebrow">VISTA PREVIA</span><img key={form.url_imagen} src={form.url_imagen || placeholder} onError={imageFallback} alt="Vista previa del producto" /><h2>{form.titulo || 'Tu próximo producto'}</h2><strong className="price">{money(form.precio || 0)}</strong><p className="muted">Una buena foto y una descripción clara ayudan a elegir.</p></aside>
  </section>
}
