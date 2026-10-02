const { database } = require("../config")
const mysql = require("mysql2/promise")
const fs = require("node:fs/promises")
const path = require("node:path")

async function init() {
  const { database: name, ...connectionOptions } = database
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error("DB_NAME solo puede contener letras, números y guiones bajos")
  }
  const connection = await mysql.createConnection(connectionOptions)
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await connection.changeUser({ database: name })
    const sql = await fs.readFile(path.join(__dirname, "../sql/schema.sql"), "utf8")
    for (const statement of sql.split(";").filter(part => part.trim())) {
      await connection.query(statement)
    }
    console.log(`Base ${name} preparada. No se borraron datos ni se agregaron registros de ejemplo.`)
  } finally {
    await connection.end()
  }
}

init().catch(error => {
  console.error(`No se pudo preparar MySQL (${error.code || error.message}). Revisá backend/.env y que el servidor MySQL esté encendido.`)
  process.exitCode = 1
})
