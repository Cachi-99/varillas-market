# Varillas Market

Marketplace de comercios de Las Varillas, con React/Vite, Express y MySQL/MariaDB.

Incluye catálogo con búsqueda, filtros combinables por comercio, categoría y precio, ordenamiento y paginación; publicación de productos con descripción y vista previa; ficha con enlace propio; carrito persistente y registro de pedidos. Las tarjetas del catálogo conservan el diseño original.

## Ejecutar localmente

1. Configurar `backend/.env` según `backend/.env.example` y encender MySQL. Si se utiliza la instalación local existente, ejecutar `npm run db:start --prefix backend`.
2. Ejecutar `npm run db:init --prefix backend`. Es repetible: crea las tablas faltantes sin borrar registros, incluida la tabla de usuarios de comercio.
3. Cargar una cuenta por comercio existente con `npm run db:users --prefix backend`. Imprime usuarios y claves de prueba; la clave predeterminada es `vm2026` y puede cambiarse con `DEMO_BUSINESS_PASSWORD`.
4. Iniciar la API: `npm start --prefix backend` (puerto 3000 por defecto).
5. Iniciar la web: `npm run dev --prefix frontend` y abrir la URL que muestra Vite.

Si la API utiliza otro puerto, configurar `API_PROXY_TARGET` en `frontend/.env.local`, usando `frontend/.env.example` como referencia. En la sesión de desarrollo actual se utiliza el puerto 3001 porque el 3000 estaba ocupado por una versión anterior del backend. Para reiniciar esa configuración en PowerShell: `$env:PORT='3001'; npm start --prefix backend`.

El frontend usa `/api` mediante el proxy de Vite. En producción se debe servir `/api` desde el mismo dominio o establecer `VITE_API_URL` antes del build. `vite preview` no sustituye al backend.

## Publicación y pedidos

- Los comercios y categorías provienen de MySQL; deben existir antes de publicar.
- La imagen se carga mediante una URL HTTP/HTTPS; no hay subida de archivos. Las imágenes faltantes utilizan un recurso local.
- Las fichas tienen enlaces `/#/producto/ID` y consultan el producto en el servidor.
- El carrito guarda únicamente identificadores y cantidades en el navegador. Actualiza los precios al abrirse.
- Al confirmar, el backend calcula el total con precios de MySQL en centavos y guarda el pedido y sus líneas en una transacción. Rechaza importes desactualizados y productos inexistentes; una clave única evita duplicar el mismo reintento.
- Los pedidos quedan en estado `pendiente` en `pedidos` y `pedido_items`, conservando el precio, título y comercio de cada línea. No hay cobro online, reserva de stock, notificación automática al vendedor ni panel de gestión de pedidos. Efectivo/transferencia y retiro/entrega expresan preferencias a coordinar.
- El acceso al panel requiere una cuenta asociada a un comercio. La API protege creación y edición, y determina el comercio desde la sesión; las cuentas se crean localmente con `db:users`. No se exponen datos de compradores mediante una ruta pública de consulta.
- Vara IA requiere `GEMINI_API_KEY`; busca en el catálogo vigente, ofrece enlaces a fichas reales y mantiene el contexto reciente de la conversación. El modelo se puede configurar con `GEMINI_MODEL` (predeterminado: `gemini-2.5-flash`).

## Verificación

```text
npm run lint --prefix frontend
npm run build --prefix frontend
npm test --prefix backend
```

Las pruebas del backend crean y eliminan una base temporal con nombre `vm_test_*`; requieren un usuario de MySQL con permisos para crear bases. No cargan datos de prueba en la base configurada del marketplace. Cubren publicación/detalle, validación, precios del servidor, transacciones, pedidos de varios comercios e idempotencia concurrente.
