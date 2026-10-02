# Varillas Market — ejecución local

Se preparó MariaDB 11.4.13 dentro de `.local`, con la base `varillas_market_db`
del respaldo `../127_0_0_1.sql`: 5 comercios y 4 productos. El original se conserva.
No se importaron las otras bases del respaldo.

## Iniciar después de reiniciar la PC

Abrir estas terminales y dejarlas abiertas:

1. Base de datos (omitir si ya está iniciada):

```powershell
cd C:\Programacion\varillas-market\varillas-market\backend
npm run db:start
```

2. Backend:

```powershell
cd C:\Programacion\varillas-market\varillas-market\backend
npm run dev
```

3. Frontend:

```powershell
cd C:\Programacion\varillas-market\varillas-market\frontend
npm run dev
```

Abrir la dirección indicada por Vite. El backend escucha en http://localhost:3000.
`npm start` ejecuta el backend sin recarga automática. Si faltan dependencias,
ejecutar `npm install` en cada carpeta.

## Instalación y datos

MariaDB escucha solo en `127.0.0.1:3307`. Es una instalación local de desarrollo,
con usuario root sin contraseña y sin servicio automático de Windows.
La configuración de conexión está en `backend/.env`; hay un ejemplo sin secretos
en `backend/.env.example`. Conservar la clave Gemini existente.

Los datos persistentes están en `.local/data`: NO borrar esa carpeta porque también
contiene los cambios posteriores a la importación. `.local` está excluida de Git.
La copia SQL usada para importar está en `.local/varillas_market_db.sql`.

Para detener la base usar Ctrl+C en su terminal. Si se inició en segundo plano,
ejecutar desde la raíz del proyecto:

```powershell
& .\.local\mariadb-11.4.13-winx64\bin\mariadb-admin.exe --host=127.0.0.1 --port=3307 --user=root shutdown
```

En otra PC se necesita instalar MariaDB/MySQL, configurar `.env` e importar la
sección `varillas_market_db` del respaldo original. Documentación del método ZIP:
https://mariadb.com/docs/server/server-management/install-and-upgrade-mariadb/installing-mariadb/binary-packages/installing-mariadb-windows-zip-packages

`npm run db:init` solo crea tablas VACÍAS basadas en el esquema recibido. No
restaura registros ni cambia tablas existentes. Una base vacía requiere cargar
planes, comercios y categorías antes de crear productos.

## Correcciones y diagnóstico

- Se agregó `npm run dev` al backend.
- La conexión ahora se configura con DB_HOST, DB_PORT, DB_USER, DB_PASSWORD y DB_NAME.
- El backend verifica la base y las tablas antes de anunciar que está activo.
- Un pool reemplaza conexiones cerradas cuando la base vuelve a estar disponible.
- Se corrigieron la ruta `/api/ia` y el campo `url_imagen` del formulario.
- El formulario envía `categoria_id`, obligatorio en el respaldo recibido.
- `ECONNREFUSED`: iniciar MariaDB y revisar host/puerto.
- `ER_ACCESS_DENIED_ERROR`: revisar usuario/contraseña.
- `ER_BAD_DB_ERROR` / `ER_NO_SUCH_TABLE`: revisar base y tablas importadas.
- `EADDRINUSE`: otro backend ya usa el puerto; usar el existente o detenerlo.

GEMINI_API_KEY es opcional para el catálogo y necesaria para Vara IA. No publicar
`.env`. La IA actual no consulta el catálogo de la base. Las pruebas locales no
consumen el servicio de Google.
