const { database } = require('../config')
const mysql = require('mysql2/promise')
const { hashPassword } = require('../auth')

const demoPassword = process.env.DEMO_BUSINESS_PASSWORD || 'vm2026'
const usernameFor = (name, id) => {
  const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '').slice(0, 60) || 'comercio'
  return `${slug}.${id}`
}

async function main() {
  const db = await mysql.createConnection(database)
  try {
    const [businesses] = await db.query('SELECT id, nombre FROM comercios ORDER BY id')
    for (const business of businesses) {
      const usuario = usernameFor(business.nombre, business.id)
      const [existing] = await db.query('SELECT id FROM usuarios_comercio WHERE comercio_id = ?', [business.id])
      if (existing.length) {
        await db.query('UPDATE usuarios_comercio SET usuario = ?, clave_hash = ? WHERE id = ?', [usuario, hashPassword(demoPassword), existing[0].id])
      } else {
        await db.query('INSERT INTO usuarios_comercio (comercio_id, usuario, clave_hash) VALUES (?, ?, ?)', [business.id, usuario, hashPassword(demoPassword)])
      }
      console.log(`${business.nombre}\tusuario: ${usuario}\tclave: ${demoPassword}`)
    }
    if (!businesses.length) console.log('No hay comercios cargados; agregalos a la tabla comercios y ejecutá este script nuevamente.')
  } finally { await db.end() }
}

main().catch(error => { console.error(`No se pudieron crear las cuentas (${error.code || error.message}).`); process.exitCode = 1 })
