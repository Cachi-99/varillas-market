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
- Los pedidos quedan en estado `pendiente` en `pedidos` y `pedido_items`, conservando el precio, título y comercio de cada línea. Cada panel de comercio muestra sus pedidos con los datos de contacto del comprador y solo las líneas correspondientes a ese comercio. No hay cobro online, reserva de stock ni notificación automática al vendedor. Efectivo/transferencia y retiro/entrega expresan preferencias a coordinar.
- El acceso al panel requiere una cuenta asociada a un comercio. La API protege creación y edición, y determina el comercio desde la sesión; las cuentas se crean localmente con `db:users`. No se exponen datos de compradores mediante una ruta pública de consulta.
- El administrador general está disponible en `/admin` (también `/#/admin`): por defecto usa `admin` / `vm2026`. Puede agregar comercios, que reciben un usuario generado y la clave de `DEMO_BUSINESS_PASSWORD` (por defecto `vm2026`), o eliminar comercios y sus productos. Cada vendedor puede borrar sus propios productos desde su panel.
- Vara IA requiere `GEMINI_API_KEY`; busca en el catálogo vigente, ofrece enlaces a fichas reales y mantiene el contexto reciente de la conversación. El modelo se puede configurar con `GEMINI_MODEL` (predeterminado: `gemini-2.5-flash`).

## Demo temporal desde una PC

La demo puede usar MySQL local y compartir la web y la API desde el mismo servidor. La PC debe permanecer encendida, conectada a internet, y con MySQL, la API y el túnel activos. El enlace temporal de Cloudflare cambia cada vez que se inicia el túnel.

1. Configurar `backend/.env` para apuntar al MySQL local. En XAMPP el puerto suele ser `3306`; verificar el puerto real en el panel de XAMPP.
2. Encender MySQL y compilar la web: `npm run build --prefix frontend`.
3. En una terminal, iniciar la API: `npm start --prefix backend`. Debe indicar que MySQL se conectó.
4. Instalar `cloudflared` desde la [guía oficial de instalación](https://developers.cloudflare.com/tunnel/downloads/). En otra terminal, ejecutar `cloudflared tunnel --url http://localhost:3000`.
5. Compartir la URL `https://…trycloudflare.com` que aparece en esa terminal. Para cerrar el acceso, detener `cloudflared` con Ctrl+C.

El Quick Tunnel es para demos: cualquiera que tenga el enlace puede abrir la aplicación y el enlace deja de funcionar al detener el túnel. No publicar información privada ni compartir credenciales. No abrir el puerto de MySQL al router; solo se expone la API web.

## Verificación

```text
npm run lint --prefix frontend
npm run build --prefix frontend
npm test --prefix backend
```

Las pruebas del backend crean y eliminan una base temporal con nombre `vm_test_*`; requieren un usuario de MySQL con permisos para crear bases. No cargan datos de prueba en la base configurada del marketplace. Cubren publicación/detalle, validación, precios del servidor, transacciones, pedidos de varios comercios e idempotencia concurrente.
