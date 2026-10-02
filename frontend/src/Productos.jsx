import { useEffect, useState } from 'react'

export default function Productos({ comercioSeleccionado, setComercioSeleccionado }) {
  const [productos, setProductos] = useState([])

  useEffect(() => {
    fetch('http://localhost:3000/api/productos')
      .then(res => { if (!res.ok) throw new Error('Error cargando productos'); return res.json() })
      .then(data => setProductos(data))
      .catch(err => console.error(err))
  }, [])

  // Filtrar los productos según el comercio que se eligió arriba
  const productosFiltrados = comercioSeleccionado
    ? productos.filter(p => p.comercio_id === comercioSeleccionado)
    : productos

  // Imagen de repuesto bonita y neutral por si el producto no tiene foto cargada
  const imagenPorDefecto = "https://unsplash.com"

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
          <span>🛍️</span> Catálogo de Productos {comercioSeleccionado ? '(Filtrado)' : ''}
        </h2>

        {comercioSeleccionado && (
          <button
            onClick={() => setComercioSeleccionado(null)}
            className="text-sm text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-3 py-1.5 rounded-xl transition-all"
          >
            ← Mostrar todos
          </button>
        )}
      </div>

      {productosFiltrados.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-md border border-gray-100 text-center text-gray-400 font-medium">
          <span className="text-3xl block mb-2">📦</span>
          Este comercio aún no tiene productos registrados.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {productosFiltrados.map((producto) => {
            // Validamos minuciosamente si el campo de imagen tiene texto real o viene vacío
            const tieneImagen = producto.url_imagen && producto.url_imagen.trim() !== "" && producto.url_imagen !== "null";
            const srcImagen = tieneImagen ? producto.url_imagen : imagenPorDefecto;

            return (
              <div
                key={producto.id}
                className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group hover:-translate-y-1"
              >
                {/* Contenedor de la Imagen */}
                <div className="w-full h-56 bg-gray-100 overflow-hidden relative flex items-center justify-center">
                  <img
                    src={srcImagen}
                    alt={producto.titulo}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.target.src = imagenPorDefecto }}
                  />
                  {!tieneImagen && (
                    <div className="absolute inset-0 bg-gray-900/5 flex flex-col items-center justify-center p-4 text-center">
                      <span className="text-2xl mb-1">🏪</span>
                      <span className="text-xs text-gray-400 font-bold tracking-wider uppercase">Sin foto cargada</span>
                    </div>
                  )}
                </div>

                {/* Información del Producto */}
                <div className="p-5 flex flex-col flex-grow justify-between bg-white">
                  <div>
                    <h3 className="font-extrabold text-lg text-gray-800 tracking-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {producto.titulo}
                    </h3>
                    <p className="text-blue-600 font-black text-2xl mt-2">
                      ${Number(producto.precio).toLocaleString('es-AR')}
                    </p>
                  </div>

                  {/* Botón Simulado Comercial */}
                  <button className="w-full mt-5 bg-gray-50 hover:bg-blue-600 text-gray-700 hover:text-white font-bold py-2.5 rounded-xl text-sm transition-all duration-200">
                    Ver Producto
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
