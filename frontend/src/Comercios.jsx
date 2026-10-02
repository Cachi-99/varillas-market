import { useEffect, useState } from 'react'

export default function Comercios({ comercioSeleccionado, setComercioSeleccionado }) {
  const [comercios, setComercios] = useState([])

  useEffect(() => {
    fetch('http://localhost:3000/api/comercios')
      .then(res => { if (!res.ok) throw new Error('Error cargando comercios'); return res.json() })
      .then(data => setComercios(data))
      .catch(err => console.error(err))
  }, [])

  // Función inteligente para asignar un ícono temático según el nombre del comercio
  const obtenerIconoComercio = (nombre) => {
    const nombreMinuscula = nombre.toLowerCase();
    if (nombreMinuscula.includes('calzado') || nombreMinuscula.includes('lily')) return '🥿';
    if (nombreMinuscula.includes('ferreteria') || nombreMinuscula.includes('bauty')) return '🛠️';
    if (nombreMinuscula.includes('hogar') || nombreMinuscula.includes('claudia')) return '🏠';
    if (nombreMinuscula.includes('ropa') || nombreMinuscula.includes('vale')) return '👕';
    if (nombreMinuscula.includes('mueble') || nombreMinuscula.includes('stefano')) return '🛋️';
    return '🏪';
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-md border border-gray-200 w-full">
      <div className="flex flex-col items-center mb-8">
        <h2 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
          <span>🏪</span> Comercios Adheridos
        </h2>
        <p className="text-sm text-gray-400 font-medium mt-1">
          Selecciona un comercio para explorar sus productos exclusivos
        </p>
      </div>

      {/* CUADRÍCULA DE BOTONES CON CONTENIDO FOCALIZADO Y GRANDE */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">

        {/* BOTÓN: VER TODOS */}
        <div
          onClick={() => setComercioSeleccionado(null)}
          className={`cursor-pointer p-6 rounded-2xl border-2 text-center flex flex-col items-center justify-center min-h-[160px] transition-all duration-200 select-none ${
            comercioSeleccionado === null
              ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105'
              : 'border-gray-400 bg-gray-50 text-gray-900 hover:bg-gray-100 hover:border-gray-600 hover:-translate-y-1 hover:shadow-md'
          }`}
        >
          {/* Círculo más grande y emoji gigante */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 border transition-all ${
            comercioSeleccionado === null
              ? 'bg-white/20 text-white border-transparent'
              : 'bg-white shadow-sm text-gray-700 border-gray-300'
          }`}>
            ✨
          </div>
          <span className="text-lg font-black tracking-tight">
            Ver Todos
          </span>
        </div>

        {/* BOTONES DE CADA COMERCIO */}
        {comercios.map((comercio) => {
          const estaSeleccionado = comercioSeleccionado === comercio.id
          const icono = obtenerIconoComercio(comercio.nombre)

          return (
            <div
              key={comercio.id}
              onClick={() => setComercioSeleccionado(comercio.id)}
              className={`cursor-pointer p-6 rounded-2xl border-2 text-center flex flex-col items-center justify-center min-h-[160px] transition-all duration-200 select-none ${
                estaSeleccionado
                  ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105'
                  : 'border-gray-400 bg-gray-50 text-gray-900 hover:bg-gray-100 hover:border-gray-600 hover:-translate-y-1 hover:shadow-md'
              }`}
            >
              {/* Círculo más grande y emoji gigante */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 border transition-all ${
                estaSeleccionado
                  ? 'bg-white/20 text-white border-transparent'
                  : 'bg-white shadow-sm text-gray-700 border-gray-300'
              }`}>
                {icono}
              </div>

              {/* Texto más grande e imponente */}
              <span className="text-lg font-black tracking-tight leading-snug break-words w-full">
                {comercio.nombre}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
