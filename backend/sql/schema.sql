-- Estructura basada en el respaldo recibido. No contiene los datos originales.
CREATE TABLE IF NOT EXISTS categorias (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Las tablas de la tienda se crean al final, luego de las tablas originales.

CREATE TABLE IF NOT EXISTS planes_suscripcion (
  id INT NOT NULL PRIMARY KEY,
  nombre_plan VARCHAR(30) NOT NULL,
  costo_mensual DECIMAL(10, 2) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS comercios (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  is_verificado TINYINT(1) NOT NULL DEFAULT 0,
  plan_id INT NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES planes_suscripcion(id) ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS usuarios_comercio (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  comercio_id INT NOT NULL UNIQUE,
  usuario VARCHAR(80) NOT NULL UNIQUE,
  clave_hash VARCHAR(200) NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comercio_id) REFERENCES comercios(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS productos (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  url_imagen VARCHAR(255) NOT NULL,
  comercio_id INT NOT NULL,
  categoria_id INT NOT NULL,
  FOREIGN KEY (comercio_id) REFERENCES comercios(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Ampliación aditiva: conserva los productos originales sin alterar sus columnas.
CREATE TABLE IF NOT EXISTS producto_detalles (
  producto_id INT NOT NULL PRIMARY KEY,
  descripcion TEXT NOT NULL,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS pedidos (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  clave CHAR(36) NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  telefono VARCHAR(30) NOT NULL,
  email VARCHAR(150) NOT NULL DEFAULT '',
  pago VARCHAR(30) NOT NULL,
  entrega VARCHAR(30) NOT NULL,
  direccion VARCHAR(300) NOT NULL DEFAULT '',
  notas TEXT NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS pedido_items (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  producto_id INT NOT NULL,
  comercio_id INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  cantidad INT NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB;
