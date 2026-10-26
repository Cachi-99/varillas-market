const { database } = require('../config')
const mysql = require('mysql2/promise')

const usernameFor = (name, id) => {
  const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '').slice(0, 60) || 'comercio'
  return `${slug}.${id}`
}

async function main() {
  const db = await mysql.createConnection(database)
  try {
    await db.beginTransaction()
    const [businesses] = await db.query('SELECT c.id, c.nombre, u.id AS usuario_id FROM comercios c LEFT JOIN usuarios_comercio u ON u.comercio_id = c.id ORDER BY c.id')
    const usernames = businesses.filter(row => row.usuario_id).map(row => ({ id: row.usuario_id, nombre: row.nombre, usuario: usernameFor(row.nombre, row.id) }))
    const duplicate = usernames.find((row, index) => usernames.findIndex(other => other.usuario === row.usuario) !== index)
    if (duplicate) throw new Error(`Nombre de usuario duplicado: ${duplicate.usuario}`)

    for (const row of usernames) {
      await db.query('UPDATE usuarios_comercio SET usuario = ? WHERE id = ?', [row.usuario, row.id])
      console.log(`${row.nombre}\tusuario: ${row.usuario}`)
    }
    if (!usernames.length) console.log('No hay cuentas de comercio para actualizar.')
    await db.commit()
  } catch (error) {
    await db.rollback()
    throw error
  } finally {
    await db.end()
  }
}

main().catch(error => {
  console.error(`No se pudieron restablecer los usuarios (${error.code || error.message}).`)
  process.exitCode = 1
})
