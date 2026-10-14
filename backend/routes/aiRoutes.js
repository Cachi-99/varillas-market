const express = require('express')
const { GoogleGenAI, Type } = require('@google/genai')

function aiRoutes(pool) {
  const router = express.Router()
  const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

  router.post('/ia', async (req, res) => {
    const pregunta = req.body?.pregunta
    const historial = req.body?.historial ?? []
    if (typeof pregunta !== 'string' || pregunta.trim().length < 2 || pregunta.length > 1000 || !Array.isArray(historial) || historial.length > 8 || historial.some(item => !item || !['user', 'assistant'].includes(item.role) || typeof item.text !== 'string' || item.text.length > 1000)) {
      return res.status(400).json({ error: 'Escribí una consulta de hasta 1000 caracteres.' })
    }
    if (!ai) return res.status(503).json({ error: 'Vara IA todavía no está configurada. Falta GEMINI_API_KEY en backend/.env.' })

    try {
      const [rows] = await pool.promise().query(`SELECT p.id, p.titulo, p.precio, p.url_imagen, c.nombre AS comercio,
        ca.nombre AS categoria, COALESCE(d.descripcion, '') AS descripcion
        FROM productos p JOIN comercios c ON c.id = p.comercio_id
        JOIN categorias ca ON ca.id = p.categoria_id
        LEFT JOIN producto_detalles d ON d.producto_id = p.id
        ORDER BY p.id DESC LIMIT 40`)
      const catalogo = rows.map(p => ({
        id: p.id,
        producto: p.titulo,
        precio_ars: Number(p.precio),
        comercio: p.comercio,
        categoria: p.categoria,
        descripcion: String(p.descripcion).slice(0, 240),
        url_imagen: p.url_imagen,
      }))
      const contents = [
        ...historial.slice(-8).map(item => ({ role: item.role === 'assistant' ? 'model' : 'user', parts: [{ text: item.text }] })),
        { role: 'user', parts: [{ text: `Consulta: ${pregunta.trim()}\n\nCatálogo actual de Varillas Market (fuente de verdad; no inventes artículos, precios ni disponibilidad):\n${JSON.stringify(catalogo)}\n\nElegí hasta cinco productos que mejor respondan a la consulta. Ordenalos por relevancia, el primero debe ser la mejor coincidencia. Si no hay ninguno adecuado, devolvé un arreglo vacío. En "respuesta" explicá brevemente por qué sirven y qué diferencias hay entre los comercios o precios. Devolvé solo el objeto definido por el esquema.` }] },
      ]
      let timeout
      const result = await Promise.race([
        ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: 'Sos Vara IA, la asistente de compras de Varillas Market en Las Varillas, Córdoba. Contestás siempre en español rioplatense, con claridad, calidez y foco práctico. Ayudás a comparar artículos reales del catálogo, comercios y precios. Nunca inventes datos que no aparezcan en el catálogo. Ordená los productos por relevancia para la necesidad y presupuesto del cliente. La respuesta debe ser corta y útil. Para consultas que no sean de compras, contestá brevemente y devolvé product_ids vacío. Respondé siempre con el JSON del esquema.',
            temperature: 0.35,
            maxOutputTokens: 700,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                respuesta: { type: Type.STRING },
                product_ids: { type: Type.ARRAY, items: { type: Type.INTEGER } },
              },
              required: ['respuesta', 'product_ids'],
            },
          },
        }),
        new Promise((_, reject) => { timeout = setTimeout(() => reject(Object.assign(new Error('AI timeout'), { code: 'AI_TIMEOUT' })), 25000) }),
      ]).finally(() => clearTimeout(timeout))
      const generated = JSON.parse(result.text || '{}')
      const respuesta = typeof generated.respuesta === 'string' ? generated.respuesta.trim() : ''
      if (!respuesta || !Array.isArray(generated.product_ids)) return res.status(502).json({ error: 'Vara IA no pudo preparar una respuesta. Probá de nuevo en unos segundos.' })
      const productsById = new Map(catalogo.map(p => [Number(p.id), p]))
      const productos = [...new Set(generated.product_ids.filter(Number.isInteger))].map(id => productsById.get(id)).filter(Boolean).slice(0, 5).map(p => ({
        id: Number(p.id), titulo: p.producto, precio: p.precio_ars, comercio_nombre: p.comercio,
        categoria_nombre: p.categoria, url_imagen: p.url_imagen || '',
      }))
      res.json({ respuesta, productos })
    } catch (error) {
      const code = error.code || error.status || error.statusCode
      console.error('Vara IA request failed:', code || 'UNKNOWN')
      if (code === 'AI_TIMEOUT') return res.status(504).json({ error: 'Vara IA está tardando más de lo esperado. Probá de nuevo.' })
      if (code === 429 || code === '429') return res.status(503).json({ error: 'Vara IA está ocupada por el momento. Esperá un instante e intentá de nuevo.' })
      if (code === 401 || code === 403 || code === 'API_KEY_INVALID') return res.status(503).json({ error: 'La conexión de Vara IA necesita que revisen la clave de Gemini.' })
      if (code === 404 || code === 'NOT_FOUND') return res.status(503).json({ error: 'El modelo configurado para Vara IA no está disponible. Revisá GEMINI_MODEL.' })
      res.status(502).json({ error: 'No pudimos conectar con Vara IA. Intentá de nuevo en unos segundos.' })
    }
  })
  return router
}

module.exports = aiRoutes
