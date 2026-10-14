import { placeholder, imageFallback } from './api'

// Se conserva el marcado y todas las clases visuales de las tarjetas originales.
export default function Productos({ productos, onVer }) {
  const imagenPorDefecto = placeholder
  return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {productos.map((producto) => {
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
                    hidden={!tieneImagen}
                    src={srcImagen}
                    alt={producto.titulo}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={imageFallback}
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

                  {/* Acceso a la ficha del producto */}
                  <button onClick={() => onVer(producto.id)} className="w-full mt-5 bg-gray-50 hover:bg-blue-600 text-gray-700 hover:text-white font-bold py-2.5 rounded-xl text-sm transition-all duration-200">
                    Ver Producto
                  </button>
                </div>
              </div>
            )
          })}
        </div>

  )
}
