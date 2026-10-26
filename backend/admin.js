const crypto = require('node:crypto')
const express = require('express')
const { hashPassword, createToken, authenticateAdmin } = require('./auth')

const usernameFor = (name, id) => {
  const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '').slice(0, 60) || 'comercio'
  return `${slug}.${id}`
}

function adminRoutes(pool) {
  const router = express.Router()
  const db = pool.promise()
  const adminUsername = process.env.ADMIN_USER || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD || 'vm2026'
  const demoBusinessPassword = process.env.DEMO_BUSINESS_PASSWORD || 'vm2026'

  router.post('/admin/login', (req, res) => {
    const { usuario, clave } = req.body || {}
    const expected = Buffer.from(adminPassword)
    const received = Buffer.from(typeof clave === 'string' ? clave : '')
    const validPassword = expected.length === received.length && crypto.timingSafeEqual(expected, received)
    if (typeof usuario !== 'string' || usuario.trim().toLowerCase() !== adminUsername.toLowerCase() || !validPassword) {
      return res.status(401).json({ error: 'Usuario o clave de administrador incorrectos.' })
    }
    res.json({ token: createToken({ id: 0, comercio_id: 0, usuario: adminUsername, role: 'admin' }), usuario: adminUsername })
  })

  router.get('/admin/me', authenticateAdmin, (req, res) => res.json({ usuario: req.user.usuario }))

  router.get('/admin/plans', authenticateAdmin, async (_req, res) => {
    try {
      const [rows] = await db.query('SELECT id, nombre_plan, costo_mensual FROM planes_suscripcion ORDER BY id')
      res.json(rows)
    } catch (error) { console.error(error.code); res.status(500).json({ error: 'No se pudieron cargar los planes.' }) }
  })

  router.get('/admin/businesses', authenticateAdmin, async (_req, res) => {
    try {
      const [rows] = await db.query(`SELECT c.id, c.nombre, c.is_verificado, c.plan_id, p.nombre_plan,
        COUNT(pr.id) AS productos FROM comercios c
        JOIN planes_suscripcion p ON p.id = c.plan_id
        LEFT JOIN productos pr ON pr.comercio_id = c.id
        GROUP BY c.id, c.nombre, c.is_verificado, c.plan_id, p.nombre_plan ORDER BY c.id`)
      res.json(rows)
    } catch (error) { console.error(error.code); res.status(500).json({ error: 'No se pudieron cargar los comercios.' }) }
  })

  router.post('/admin/businesses', authenticateAdmin, async (req, res) => {
    const { nombre, plan_id } = req.body || {}
    if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 100 || !Number.isInteger(plan_id) || plan_id <= 0) {
      return res.status(400).json({ error: 'Ingresá un nombre de hasta 100 caracteres y un plan válido.' })
    }
    let conn
    try {
      conn = await db.getConnection()
      await conn.beginTransaction()
      const [plans] = await conn.query('SELECT id FROM planes_suscripcion WHERE id = ?', [plan_id])
      if (!plans.length) { await conn.rollback(); return res.status(400).json({ error: 'El plan seleccionado no existe.' }) }
      const [created] = await conn.query('INSERT INTO comercios (nombre, plan_id) VALUES (?, ?)', [nombre.trim(), plan_id])
      const usuario = usernameFor(nombre.trim(), created.insertId)
      await conn.query('INSERT INTO usuarios_comercio (comercio_id, usuario, clave_hash) VALUES (?, ?, ?)', [created.insertId, usuario, hashPassword(demoBusinessPassword)])
      await conn.commit()
      res.status(201).json({ id: created.insertId, nombre: nombre.trim(), usuario, clave: demoBusinessPassword })
    } catch (error) {
      if (conn) await conn.rollback()
      console.error(error.code)
      res.status(500).json({ error: 'No se pudo agregar el comercio.' })
    } finally { conn?.release() }
  })

  router.delete('/admin/businesses/:id', authenticateAdmin, async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Comercio inválido.' })
    try {
      const [result] = await db.query('DELETE FROM comercios WHERE id = ?', [req.params.id])
      if (!result.affectedRows) return res.status(404).json({ error: 'No encontramos ese comercio.' })
      res.json({ mensaje: 'Comercio eliminado.' })
    } catch (error) { console.error(error.code); res.status(500).json({ error: 'No se pudo eliminar el comercio.' }) }
  })

  return router
}

module.exports = { adminRoutes }
