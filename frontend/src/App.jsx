import { useState } from 'react'
import Productos from './Productos'
import Comercios from './Comercios'
import FormularioProducto from './FormularioProducto'

function App() {
  const [pregunta, setPregunta] = useState('')
  const [respuesta, setRespuesta] = useState('')
  const [recargar, setRecargar] = useState(false)
  const [modo, setModo] = useState('cliente')

  // Estado para guardar el comercio que el usuario selecciona
  const [comercioSeleccionado, setComercioSeleccionado] = useState(null)

  const actualizarLista = () => {
    setRecargar(!recargar)
  }

  const preguntarIA = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta })
      })
      const data = await res.json()
      setRespuesta(res.ok ? data.respuesta : data.error || 'Error consultando Vara IA')
    } catch (error) {
      console.error(error)
      setRespuesta("Error conectando con Vara IA")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center antialiased">

      {/* BARRA SUPERIOR DE NAVEGACIÓN */}
      <header className="w-full bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200/80 p-4 flex justify-between items-center mb-8 sticky top-0 z-50 px-6 md:px-12">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-blue-700 drop-shadow-sm">
          Mercado Las Varillas
        </h1>

        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200/50">
          <button
            onClick={() => setModo('cliente')}
            className={`px-5 py-2 rounded-xl font-bold text-sm transition-all duration-200 ${
              modo === 'cliente'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            🛒 Vista Cliente
          </button>

          <button
            onClick={() => setModo('comercio')}
            className={`px-5 py-2 rounded-xl font-bold text-sm transition-all duration-200 ${
              modo === 'comercio'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            🏪 Vista Comercio
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="w-full max-w-5xl p-4 md:p-6 flex flex-col items-center space-y-12">

        {/* VISTA CLIENTE */}
        {modo === 'cliente' && (
          <>
            {/* CAJA DE VARA IA - MÁS COMPACTA Y ESTILIZADA */}
            <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100 w-full max-w-xl transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">Vara IA</h2>
              </div>

              <textarea
                className="w-full border border-gray-200 rounded-2xl p-4 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none shadow-inner"
                rows="2"
                placeholder="Preguntale algo a Vara IA sobre los comercios o productos..."
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
              />

              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-400 font-medium">Asistente Virtual Activo</span>
                <button
                  onClick={preguntarIA}
                  className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 transition-all duration-150"
                >
                  Preguntar
                </button>
              </div>

              {respuesta && (
                <div className="mt-4 p-4 bg-blue-50/60 border border-blue-100 rounded-2xl animate-fadeIn">
                  <h3 className="font-bold text-xs text-blue-800 tracking-wider uppercase mb-1">Respuesta:</h3>
                  <p className="text-sm text-gray-700 leading-relaxed font-medium">{respuesta}</p>
                </div>
              )}
            </div>

            {/* LISTA DE COMERCIOS ADHERIDOS */}
            <div className="w-full">
              <Comercios
                comercioSeleccionado={comercioSeleccionado}
                setComercioSeleccionado={setComercioSeleccionado}
              />
            </div>

            {/* CATÁLOGO DE PRODUCTOS FILTRADO */}
            <div className="w-full">
              <Productos
                key={recargar}
                comercioSeleccionado={comercioSeleccionado}
                setComercioSeleccionado={setComercioSeleccionado}
              />
            </div>
          </>
        )}

        {/* VISTA COMERCIO */}
        {modo === 'comercio' && (
          <div className="w-full max-w-3xl">
            <div className="bg-blue-50/80 border-l-4 border-blue-600 p-4 mb-6 rounded-r-2xl shadow-sm">
              <p className="font-semibold text-sm text-blue-800">
                Panel de Administración: Carga tus productos para que aparezcan dentro de tu comercio y en las consultas de Vara IA.
              </p>
            </div>

            <FormularioProducto onProductoAgregado={actualizarLista} />
          </div>
        )}

      </main>
    </div>
  )
}

export default App
