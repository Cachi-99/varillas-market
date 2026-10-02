-- Estructura basada en el respaldo recibido. No contiene los datos originales.
CREATE TABLE IF NOT EXISTS categorias (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

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
