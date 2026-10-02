const config = require("./config")
const express = require("express")
const cors = require("cors")
const mysql = require("mysql2")
const aiRoutes = require("./routes/aiRoutes")

const app = express()

app.use(cors())
app.use(express.json())

// El pool reemplaza conexiones cerradas cuando MySQL vuelve a estar disponible.
const db = mysql.createPool({ ...config.database, connectionLimit: 5 })

// Ruta raíz de prueba
app.get("/", (req, res) => {
  res.send("Servidor Varillas Market funcionando")
})

// RUTA GET PARA OBTENER PRODUCTOS
app.get("/api/productos", (req, res) => {
  const query = "SELECT * FROM productos"
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener productos:", err)
      return res.status(500).json({ error: "Error en la base de datos" })
    }
    res.json(results)
  })
})

// RUTA GET PARA OBTENER COMERCIOS
app.get("/api/comercios", (req, res) => {
  const query = "SELECT * FROM comercios"
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener comercios:", err)
      return res.status(500).json({ error: "Error en la base de datos" })
    }
    res.json(results)
  })
})

// RUTA POST PARA AGREGAR UN PRODUCTO DESDE LA WEB (PASO 2)
app.get('/api/categorias', (req, res) => {
  db.query('SELECT id, nombre FROM categorias ORDER BY nombre', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener categorías' })
    res.json(results)
  })
})

app.post('/api/productos', (req, res) => {
  const { titulo, precio, url_imagen = '', comercio_id, categoria_id } = req.body

  if (typeof titulo !== 'string' || !titulo.trim() || !Number.isFinite(precio) || precio < 0 || !Number.isInteger(comercio_id) || comercio_id <= 0 || !Number.isInteger(categoria_id) || categoria_id <= 0 || typeof url_imagen !== 'string') {
    return res.status(400).json({ error: 'Título, precio válido, comercio y categoría son obligatorios.' })
  }

  const sql = 'INSERT INTO productos (titulo, precio, url_imagen, comercio_id, categoria_id) VALUES (?, ?, ?, ?, ?)'
  db.query(sql, [titulo.trim(), precio, url_imagen, comercio_id, categoria_id], (err, result) => {
    if (err) {
      if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'El comercio o la categoría no existen.' })
      console.error('Error al insertar producto:', err)
      return res.status(500).json({ error: 'Error al insertar en la base de datos' })
    }
    res.json({ mensaje: 'Producto creado con éxito', id: result.insertId })
  })
})

// Rutas para la Inteligencia Artificial (Vara IA)
app.use("/api", aiRoutes)

async function start() {
  try {
    // Verificar también las tablas antes de anunciar un arranque exitoso.
    await db.promise().query("SELECT id, nombre FROM comercios LIMIT 0")
    await db.promise().query("SELECT id, nombre FROM categorias LIMIT 0")
    await db.promise().query("SELECT id, titulo, precio, url_imagen, comercio_id, categoria_id FROM productos LIMIT 0")
  } catch (error) {
    console.error(`No se pudo iniciar el backend: MySQL ${config.database.host}:${config.database.port}/${config.database.database} (${error.code || "ERROR"}).`)
    console.error("Verificá que MySQL esté encendido y revisá DB_HOST, DB_PORT, DB_USER y DB_PASSWORD en backend/.env.")
    console.error("Si falta la base o las tablas, importá el SQL original o ejecutá npm run db:init para crear una base vacía.")
    await db.promise().end()
    process.exitCode = 1
    return
  }
  const server = app.listen(config.port, () => {
    console.log(`MySQL conectado. Servidor activo en http://localhost:${config.port}`)
  })
  server.on("error", async (error) => {
    console.error(`No se pudo abrir el puerto ${config.port}: ${error.code}`)
    await db.promise().end()
    process.exitCode = 1
  })
}

start()
