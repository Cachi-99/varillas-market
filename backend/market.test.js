const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const fs = require('node:fs/promises')
const path = require('node:path')
const express = require('express')
const mysql = require('mysql2')
const { marketRoutes, validarProducto, validarPedido } = require('./market')
const config = require('./config')

const product = { titulo: 'Producto de prueba', precio: 1234.56, comercio_id: 1, categoria_id: 1, descripcion: 'Descripción de prueba', url_imagen: '' }
const order = () => ({ nombre: 'Prueba Local', telefono: '3533000000', pago: 'efectivo', entrega: 'retiro', clave: randomUUID(), items: [{ id: 1, cantidad: 2 }], total_centavos: 246912 })

test('validación de producto: importes, longitudes, relaciones y URL', () => {
  assert.equal(validarProducto(product), null)
  for (const override of [{ precio: -1 }, { precio: 1.234 }, { precio: Infinity }, { titulo: ' ' }, { titulo: 'x'.repeat(151) }, { comercio_id: 0 }, { categoria_id: 1.5 }, { descripcion: 'x'.repeat(5001) }, { url_imagen: 'javascript:alert(1)' }]) assert.ok(validarProducto({ ...product, ...override }))
})
test('validación de pedido rechaza cantidades, duplicados y datos inválidos', () => {
  assert.equal(validarPedido(order()), null)
  for (const override of [{ nombre: '' }, { telefono: 'no válido' }, { pago: 'tarjeta' }, { entrega: 'otra' }, { email: 'incorrecto' }, { items: [] }, { items: [{ id: 1, cantidad: 0 }] }, { items: [{ id: 1, cantidad: 100 }] }, { items: [{ id: 1, cantidad: 1.5 }] }, { items: [null] }, { items: [{ id: 1, cantidad: 1 }, { id: 1, cantidad: 1 }] }]) assert.ok(validarPedido({ ...order(), ...override }))
})

// Base efímera independiente: nunca escribe fixtures en la base del usuario.
const database = `vm_test_${randomUUID().replaceAll('-', '')}`
let admin, pool, server, base, created = false
before(async () => {
  admin = await mysql.createConnection({ ...config.database, database: undefined }).promise()
  await admin.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4`)
  created = true
  pool = mysql.createPool({ ...config.database, database, connectionLimit: 5 })
  const db = pool.promise()
  const schema = await fs.readFile(path.join(__dirname, 'sql/schema.sql'), 'utf8')
  for (const statement of schema.split(';').filter(s => s.trim())) await db.query(statement)
  await db.query("INSERT INTO planes_suscripcion VALUES (1, 'Prueba', 0)")
  await db.query("INSERT INTO categorias (nombre) VALUES ('Prueba')")
  await db.query("INSERT INTO comercios (nombre, plan_id) VALUES ('Comercio de prueba', 1), ('Otro comercio', 1)")
  const app = express()
  app.use(express.json())
  app.use('/api', marketRoutes(pool))
  server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}/api`
})
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve))
  if (pool) await pool.promise().end()
  if (created) await admin.query(`DROP DATABASE \`${database}\``)
  if (admin) await admin.end()
})
const post = (route, body) => fetch(`${base}${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

test('publicación, detalle y descripción persistidos; relación inválida revierte la operación', async () => {
  const response = await post('/productos', product)
  assert.equal(response.status, 201)
  const { id } = await response.json()
  const detail = await (await fetch(`${base}/productos/${id}`)).json()
  assert.equal(detail.descripcion, product.descripcion)
  assert.equal(detail.comercio_nombre, 'Comercio de prueba')
  assert.equal(Number(detail.precio), product.precio)
  assert.equal((await fetch(`${base}/productos/999999`)).status, 404)
  assert.equal((await post('/productos', { ...product, comercio_id: 999999 })).status, 400)
  const [rows] = await pool.promise().query('SELECT COUNT(*) AS n FROM productos')
  assert.equal(rows[0].n, 1)
})
test('pedido: precios del servidor, total exacto, idempotencia y persistencia', async () => {
  const body = order()
  const response = await post('/pedidos', { ...body, precio: 0.01 })
  assert.equal(response.status, 201)
  const result = await response.json()
  assert.equal(Number(result.total), 2469.12)
  const retry = await (await post('/pedidos', body)).json()
  assert.equal(retry.id, result.id)
  const [rows] = await pool.promise().query('SELECT * FROM pedido_items WHERE pedido_id = ?', [result.id])
  assert.equal(rows.length, 1)
  assert.equal(Number(rows[0].precio), 1234.56)
  assert.equal(rows[0].cantidad, 2)
  const [orders] = await pool.promise().query('SELECT COUNT(*) AS n FROM pedidos WHERE clave = ?', [body.clave])
  assert.equal(orders[0].n, 1)
})
test('pedido: precios desactualizados y productos eliminados no generan órdenes', async () => {
  assert.equal((await post('/pedidos', { ...order(), total_centavos: 10 })).status, 409)
  assert.equal((await post('/pedidos', { ...order(), items: [{ id: 999999, cantidad: 1 }] })).status, 409)
  const [rows] = await pool.promise().query('SELECT COUNT(*) AS n FROM pedidos')
  assert.equal(rows[0].n, 1)
})
test('pedido con productos de distintos comercios y reintentos concurrentes', async () => {
  const second = await (await post('/productos', { ...product, comercio_id: 2, precio: 0.1 })).json()
  const body = { ...order(), items: [{ id: 1, cantidad: 1 }, { id: second.id, cantidad: 3 }], total_centavos: 123486 }
  const responses = await Promise.all([post('/pedidos', body), post('/pedidos', body)])
  assert.ok(responses.every(r => r.ok))
  const results = await Promise.all(responses.map(r => r.json()))
  assert.equal(results[0].id, results[1].id)
  assert.equal(Number(results[0].total), 1234.86)
  const [rows] = await pool.promise().query('SELECT DISTINCT comercio_id FROM pedido_items WHERE pedido_id = ?', [results[0].id])
  assert.equal(rows.length, 2)
})
