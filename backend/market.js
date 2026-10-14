const express = require('express')
const { authenticate, verifyPassword, createToken } = require('./auth')

function validarProducto(body) {
  const { titulo, precio, url_imagen = '', descripcion = '', comercio_id, categoria_id } = body
  if (typeof titulo !== 'string' || !titulo.trim() || titulo.trim().length > 150 || !Number.isFinite(precio) || precio < 0 || precio > 99999999.99 || Math.abs(precio * 100 - Math.round(precio * 100)) > 0.00001 || !Number.isInteger(comercio_id) || comercio_id <= 0 || !Number.isInteger(categoria_id) || categoria_id <= 0 || typeof url_imagen !== 'string' || url_imagen.length > 255 || (url_imagen && !/^https?:\/\//i.test(url_imagen)) || typeof descripcion !== 'string' || descripcion.length > 5000) {
    return 'Revisá el título (hasta 150 caracteres), precio (hasta dos decimales), imagen HTTP/HTTPS, comercio y categoría.'
  }
  return null
}

function validarPedido(body) {
  const { nombre, telefono, email = '', pago, entrega, direccion = '', notas = '', items, clave } = body
  if (typeof nombre !== 'string' || nombre.trim().length < 2 || nombre.length > 120 || typeof telefono !== 'string' || !/^[+\d\s()-]{6,30}$/.test(telefono) || typeof email !== 'string' || email.length > 150 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return 'Revisá tu nombre, teléfono y correo electrónico.'
  if (!['efectivo', 'transferencia'].includes(pago) || !['retiro', 'coordinar'].includes(entrega) || typeof direccion !== 'string' || direccion.length > 300 || typeof notas !== 'string' || notas.length > 1000) return 'Revisá la forma de pago, entrega y las notas.'
  if (typeof clave !== 'string' || !/^[a-f\d-]{36}$/i.test(clave)) return 'Identificador de pedido inválido.'
  if (!Array.isArray(items) || !items.length || items.length > 100 || items.some(i => !i || !Number.isInteger(i.id) || i.id <= 0 || !Number.isInteger(i.cantidad) || i.cantidad < 1 || i.cantidad > 99) || new Set(items.map(i => i.id)).size !== items.length) return 'El carrito contiene productos o cantidades inválidos.'
  return null
}

function marketRoutes(pool) {
  const router = express.Router()
  const db = pool.promise()
  const select = `SELECT p.*, c.nombre AS comercio_nombre, ca.nombre AS categoria_nombre,
    COALESCE(d.descripcion, '') AS descripcion FROM productos p
    JOIN comercios c ON c.id = p.comercio_id JOIN categorias ca ON ca.id = p.categoria_id
    LEFT JOIN producto_detalles d ON d.producto_id = p.id`
  router.post('/auth/login', async (req, res) => {
    const { usuario, clave } = req.body || {}
    if (typeof usuario !== 'string' || typeof clave !== 'string' || usuario.length > 80 || clave.length > 200) return res.status(400).json({ error: 'Ingresá usuario y clave.' })
    try {
      const [rows] = await db.query('SELECT u.id, u.comercio_id, u.usuario, u.clave_hash, c.nombre AS comercio_nombre FROM usuarios_comercio u JOIN comercios c ON c.id = u.comercio_id WHERE u.usuario = ?', [usuario.trim().toLowerCase()])
      if (!rows.length || !verifyPassword(clave, rows[0].clave_hash)) return res.status(401).json({ error: 'Usuario o clave incorrectos.' })
      const { clave_hash, ...user } = rows[0]
      res.json({ token: createToken(user), usuario: { id: user.id, comercio_id: user.comercio_id, nombre: user.comercio_nombre, usuario: user.usuario } })
    } catch (error) { console.error(error.code); res.status(500).json({ error: 'No se pudo iniciar sesión.' }) }
  })
  router.get('/auth/me', authenticate, async (req, res) => {
    try {
      const [rows] = await db.query('SELECT id, nombre FROM comercios WHERE id = ?', [req.user.comercio_id])
      if (!rows.length) return res.status(401).json({ error: 'El comercio de esta sesión ya no está disponible.' })
      res.json({ id: req.user.id, comercio_id: req.user.comercio_id, usuario: req.user.usuario, nombre: rows[0].nombre })
    } catch (error) { console.error(error.code); res.status(500).json({ error: 'No se pudo validar la sesión.' }) }
  })
  router.get('/productos', async (req, res) => {
    try { const [rows] = await db.query(`${select} ORDER BY p.id DESC`); res.json(rows) }
    catch (error) { console.error(error.code); res.status(500).json({ error: 'No se pudieron cargar los productos.' }) }
  })
  router.get('/mis-productos', authenticate, async (req, res) => {
    try { const [rows] = await db.query(`${select} WHERE p.comercio_id = ? ORDER BY p.id DESC`, [req.user.comercio_id]); res.json(rows) }
    catch (error) { console.error(error.code); res.status(500).json({ error: 'No se pudieron cargar tus productos.' }) }
  })
  router.get('/productos/:id', async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Producto inválido.' })
    try {
      const [rows] = await db.query(`${select} WHERE p.id = ?`, [req.params.id])
      if (!rows.length) return res.status(404).json({ error: 'Este producto ya no está disponible.' })
      res.json(rows[0])
    } catch (error) { console.error(error.code); res.status(500).json({ error: 'No se pudo cargar el producto.' }) }
  })
  router.post('/productos', authenticate, async (req, res) => {
    const body = { ...(req.body || {}), comercio_id: req.user.comercio_id }
    const error = validarProducto(body)
    if (error) return res.status(400).json({ error })
    let conn
    try {
      conn = await db.getConnection()
      await conn.beginTransaction()
      const { titulo, precio, url_imagen = '', comercio_id, categoria_id, descripcion = '' } = body
      const [result] = await conn.query('INSERT INTO productos (titulo, precio, url_imagen, comercio_id, categoria_id) VALUES (?, ?, ?, ?, ?)', [titulo.trim(), precio, url_imagen.trim(), comercio_id, categoria_id])
      await conn.query('INSERT INTO producto_detalles (producto_id, descripcion) VALUES (?, ?)', [result.insertId, descripcion.trim()])
      await conn.commit()
      res.status(201).json({ id: result.insertId, mensaje: 'Producto publicado.' })
    } catch (error) {
      if (conn) await conn.rollback()
      console.error(error.code)
      res.status(error.code === 'ER_NO_REFERENCED_ROW_2' ? 400 : 500).json({ error: error.code === 'ER_NO_REFERENCED_ROW_2' ? 'El comercio o la categoría no existen.' : 'No se pudo guardar el producto.' })
    } finally { conn?.release() }
  })
  router.put('/productos/:id', authenticate, async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Producto inválido.' })
    try {
      const [found] = await db.query('SELECT p.*, COALESCE(d.descripcion, \'\') AS descripcion FROM productos p LEFT JOIN producto_detalles d ON d.producto_id = p.id WHERE p.id = ? AND p.comercio_id = ?', [req.params.id, req.user.comercio_id])
      if (!found.length) return res.status(404).json({ error: 'No encontramos ese producto en tu comercio.' })
      const body = { ...found[0], ...(req.body || {}), comercio_id: req.user.comercio_id }
      const error = validarProducto(body)
      if (error) return res.status(400).json({ error })
      await db.query('UPDATE productos SET titulo = ?, precio = ?, url_imagen = ?, categoria_id = ? WHERE id = ? AND comercio_id = ?', [body.titulo.trim(), body.precio, body.url_imagen.trim(), body.categoria_id, req.params.id, req.user.comercio_id])
      await db.query('INSERT INTO producto_detalles (producto_id, descripcion) VALUES (?, ?) ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion)', [req.params.id, body.descripcion.trim()])
      res.json({ id: Number(req.params.id), mensaje: 'Producto actualizado.' })
    } catch (error) { console.error(error.code); res.status(500).json({ error: 'No se pudo actualizar el producto.' }) }
  })
  router.post('/pedidos', async (req, res) => {
    const error = validarPedido(req.body || {})
    if (error) return res.status(400).json({ error })
    let conn
    try {
      conn = await db.getConnection()
      await conn.beginTransaction()
      const { nombre, telefono, email = '', pago, entrega, direccion = '', notas = '', items, clave } = req.body
      // Una clave de reintento evita duplicados si se pierde la respuesta HTTP.
      const [existing] = await conn.query('SELECT id, total FROM pedidos WHERE clave = ?', [clave])
      if (existing.length) { await conn.rollback(); return res.json(existing[0]) }
      const [products] = await conn.query('SELECT id, titulo, precio, comercio_id FROM productos WHERE id IN (?) LOCK IN SHARE MODE', [items.map(i => i.id)])
      if (products.length !== items.length) { await conn.rollback(); return res.status(409).json({ error: 'Un producto ya no está disponible. Revisá el carrito.' }) }
      // El precio proviene siempre de MySQL; se calcula en centavos.
      const lines = items.map(i => ({ ...products.find(p => p.id === i.id), cantidad: i.cantidad }))
      const cents = lines.reduce((sum, p) => sum + Math.round(Number(p.precio) * 100) * p.cantidad, 0)
      if (cents > 999999999999) { await conn.rollback(); return res.status(400).json({ error: 'El importe del pedido supera el máximo permitido.' }) }
      // El usuario debe revisar explícitamente cualquier cambio de precio.
      if (!Number.isSafeInteger(req.body.total_centavos) || req.body.total_centavos !== cents) { await conn.rollback(); return res.status(409).json({ error: 'Los precios cambiaron. Volvé a abrir el carrito para actualizar y revisar el total.' }) }
      const [result] = await conn.query('INSERT INTO pedidos (clave, nombre, telefono, email, pago, entrega, direccion, notas, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [clave, nombre.trim(), telefono.trim(), email.trim(), pago, entrega, direccion.trim(), notas.trim(), cents / 100])
      for (const line of lines) await conn.query('INSERT INTO pedido_items (pedido_id, producto_id, comercio_id, titulo, precio, cantidad) VALUES (?, ?, ?, ?, ?, ?)', [result.insertId, line.id, line.comercio_id, line.titulo, line.precio, line.cantidad])
      await conn.commit()
      res.status(201).json({ id: result.insertId, total: cents / 100 })
    } catch (error) {
      if (conn) await conn.rollback()
      if (error.code === 'ER_DUP_ENTRY') {
        const [existing] = await db.query('SELECT id, total FROM pedidos WHERE clave = ?', [req.body.clave])
        if (existing.length) return res.json(existing[0])
      }
      console.error(error.code)
      res.status(500).json({ error: 'No se pudo guardar el pedido. Podés reintentar sin duplicarlo.' })
    } finally { conn?.release() }
  })
  return router
}

module.exports = { marketRoutes, validarProducto, validarPedido }
