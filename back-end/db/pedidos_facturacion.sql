-- Script para crear las tablas necesarias para la funcionalidad de pedidos y facturación
-- Este script debe ejecutarse en la base de datos lichydb

-- Tabla para almacenar los pedidos
CREATE TABLE IF NOT EXISTS Pedidos (
  idPedido INT AUTO_INCREMENT PRIMARY KEY,
  fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
  usuarioCreacion INT NOT NULL,
  fechaCompletado DATETIME NULL,
  usuarioCompletado INT NULL,
  observaciones TEXT NULL,
  FOREIGN KEY (usuarioCreacion) REFERENCES Usuario(idUsuario),
  FOREIGN KEY (usuarioCompletado) REFERENCES Usuario(idUsuario)
);

-- Tabla para almacenar los productos asignados a cada pedido
CREATE TABLE IF NOT EXISTS ProductosPedido (
  idProductoPedido INT AUTO_INCREMENT PRIMARY KEY,
  idPedido INT NOT NULL,
  idContenedorProducto INT NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  cantidadAlternativa DECIMAL(10,2) NULL,
  unidad VARCHAR(10) NOT NULL,
  unidadAlternativa VARCHAR(10) NULL,
  ubicacionDestino VARCHAR(50) NOT NULL,
  fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuarioCreacion INT NOT NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
  codigoInterno VARCHAR(50) NULL,
  color VARCHAR(50) NULL,
  nombreProducto VARCHAR(255) NULL,
  FOREIGN KEY (idPedido) REFERENCES Pedidos(idPedido),
  FOREIGN KEY (idContenedorProducto) REFERENCES ContenedorProductos(idContenedorProductos),
  FOREIGN KEY (usuarioCreacion) REFERENCES Usuario(idUsuario)
);

-- Tabla para almacenar las facturas
CREATE TABLE IF NOT EXISTS Facturas (
  idFactura INT AUTO_INCREMENT PRIMARY KEY,
  idPedido INT NOT NULL,
  numeroFactura VARCHAR(50) NOT NULL,
  fechaFactura DATE NOT NULL,
  fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuarioCreacion INT NOT NULL,
  observaciones TEXT NULL,
  importeTotal DECIMAL(10,2) NULL,
  FOREIGN KEY (idPedido) REFERENCES Pedidos(idPedido),
  FOREIGN KEY (usuarioCreacion) REFERENCES Usuario(idUsuario),
  UNIQUE KEY (numeroFactura)
);
