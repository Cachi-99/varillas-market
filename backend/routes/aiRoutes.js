const express = require("express")
const router = express.Router()

const { GoogleGenAI } = require("@google/genai")

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
}) : null

router.post("/ia", async (req, res) => {
    if (!ai) {
        return res.status(503).json({ error: "Falta configurar GEMINI_API_KEY en backend/.env" })
    }

    try {

        const pregunta = req.body.pregunta

        const prompt = `
        Sos Vara IA.
        Sos un asistente de Las Varillas, Córdoba.
        Recomendás comercios locales.
        Respondé amable y breve.

        Pregunta del usuario:
        ${pregunta}
        `

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        })

        res.json({
            respuesta: response.text
        })

    } catch (error) {

        console.log(error)

        res.status(500).json({
            error: "Error IA"
        })
    }

})

module.exports = router
