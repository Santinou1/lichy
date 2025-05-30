-- Script completo de base de datos Lichy
-- Incluye la estructura original y las modificaciones para estados de productos
-- Mayo 2025

CREATE DATABASE IF NOT EXISTS LichyDB;
USE LichyDB;

-- Tablas base del sistema
CREATE TABLE IF NOT EXISTS Usuario(
	idUsuario INT AUTO_INCREMENT,
    nombre VARCHAR(200),
    email VARCHAR(200) UNIQUE,
    contrasena VARCHAR(200),
    tipoUsuario VARCHAR(100),
    permisos VARCHAR(500),
    PRIMARY KEY(idUsuario)
);

CREATE TABLE IF NOT EXISTS Proveedor(
	idProveedor INT AUTO_INCREMENT,
    nombre VARCHAR(100),
    PRIMARY KEY(idProveedor)
);

CREATE TABLE IF NOT EXISTS Producto(
	idProducto INT AUTO_INCREMENT,
    nombre VARCHAR(200),
    unidadPredeterminada ENUM('m','kg'),
    codigoInterno INT UNIQUE,
    tipoBultoPredeterminado ENUM('rollos','cajas'),
    PRIMARY KEY(idProducto)
);

CREATE TABLE IF NOT EXISTS Color(
	idColor INT AUTO_INCREMENT,
    nombre VARCHAR(100),
    codigoInterno INT UNIQUE,
    PRIMARY KEY(idColor)
);

CREATE TABLE IF NOT EXISTS categorias(
	nombreCategoria VARCHAR(100),
    PRIMARY KEY(nombreCategoria)
);

CREATE TABLE IF NOT EXISTS ubicacion(
	nombreUbicacion VARCHAR(100),
    estado VARCHAR(100),
    FOREIGN KEY(estado) REFERENCES categorias(nombreCategoria) ON DELETE CASCADE,
    PRIMARY KEY(nombreUbicacion)
);

CREATE TABLE IF NOT EXISTS Contenedor(
	idContenedor INT AUTO_INCREMENT,
    categoria VARCHAR(100),
    usuario INT,
    proveedor INT,
    comentario VARCHAR(300),
    ubicacion VARCHAR(100),
    codigoContenedor VARCHAR(100),
    forwarder VARCHAR(100),
    sira VARCHAR(100),
    factura varchar(100),
    vep VARCHAR(100),
    PRIMARY KEY(idContenedor),
    FOREIGN KEY(proveedor) REFERENCES Proveedor(idProveedor) ON DELETE SET NULL,
    FOREIGN KEY(categoria) REFERENCES categorias(nombreCategoria) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ContenedorEstado(
	idEstado INT AUTO_INCREMENT,
    contenedor INT,
    estado VARCHAR(100),
    ubicacion VARCHAR(200),
    fechaHora DATETIME DEFAULT CURRENT_TIMESTAMP,
    fechaManual DATE DEFAULT (CURRENT_DATE()),
    PRIMARY KEY(idEstado),
    FOREIGN KEY(contenedor) REFERENCES Contenedor(idContenedor) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ContenedorProductos(
	idContenedorProductos INT AUTO_INCREMENT,
    contenedor INT, 
    producto INT,
    cantidad INT,
    unidad VARCHAR(100),
    precioPorUnidad FLOAT,
    item_proveedor VARCHAR(200),
    color INT,
    cantidadBulto INT,
    cantidadAlternativa INT,
    unidadAlternativa ENUM ('rollos', 'cajas'),
    tipoBulto ENUM ('rollos','cajas'),
    -- Nuevos campos para manejo de estados
    estado VARCHAR(50) DEFAULT 'En stock' COMMENT 'Estado del producto: En stock, Entregado',
    contenedorDestino INT NULL COMMENT 'ID del contenedor destino cuando el estado es En stock',
    PRIMARY KEY(idContenedorProductos),
    FOREIGN KEY(contenedor) REFERENCES Contenedor(idContenedor) ON DELETE CASCADE,
    FOREIGN KEY(producto) REFERENCES Producto(idProducto) ON DELETE CASCADE,
    FOREIGN KEY(color) REFERENCES Color(idColor) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ContenedorProductosHistorial (
	idHistorial INT AUTO_INCREMENT,
    idContenedorProductos INT,
    contenedor INT,
    tipoCambio ENUM('UPDATE','DELETE','INSERT'),
    cambios TEXT,
    fechaCambio DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuarioCambio INT,
    motivo VARCHAR(500),
    PRIMARY KEY(idHistorial),
    FOREIGN KEY(contenedor) REFERENCES Contenedor(idContenedor) ON DELETE CASCADE
);

-- Inserción de categorías base
INSERT INTO Categorias (nombreCategoria) VALUES
('COMPRADO'),
('EMBARCADO'),
('ARRIBADO'),
('DEPOSITO NACIONAL'),
('EN STOCK'),
('ENTREGADO'),
('ANULADO');

-- Inserción de ubicaciones base
INSERT INTO Ubicacion (nombreUbicacion, estado) VALUES
-- Estado COMPRADO
('FALTA DISPONER', 'COMPRADO'),
('DESARROLLO LD-SOFF', 'COMPRADO'),
('LD-SOFF LLEGARON', 'COMPRADO'),
('PRODUCCION', 'COMPRADO'),

-- Estado EMBARCADO
('BOOKING', 'EMBARCADO'),
('EMBARCADO', 'EMBARCADO'),

-- Estado ARRIBADO
('TERMINAL', 'ARRIBADO'),
('DF DASSA', 'ARRIBADO'),
('DF LOGISTICA CENTRAL', 'ARRIBADO'),
('PARA OFICIALIZAR', 'ARRIBADO'),
('PARA OFICIALIZAR HOY', 'ARRIBADO'),
('POR COORDINAR', 'ARRIBADO'),
('COORDINADO', 'ARRIBADO'),

-- Estado DEPOSITO NACIONAL
('ALTITUD', 'DEPOSITO NACIONAL'),
('MOREIRO', 'DEPOSITO NACIONAL'),
('OPEN CARGO', 'DEPOSITO NACIONAL'),
('LOGISTICA CENTRAL', 'DEPOSITO NACIONAL'),
('ULOG', 'DEPOSITO NACIONAL'),
('ALA', 'DEPOSITO NACIONAL'),

-- Estado EN STOCK
('MITRE', 'EN STOCK'),
('LAVALLE', 'EN STOCK'),
('LICHY', 'EN STOCK'),

-- Estado ENTREGADO
('ENTREGADO', 'ENTREGADO'),

-- Estado ANULADO
('ANULADO', 'ANULADO');

-- Creación de contenedores fijos para Mitre y Lichy
INSERT INTO Contenedor (idContenedor, categoria, comentario, codigoContenedor, ubicacion) 
VALUES 
(1, 'EN STOCK', 'Mitre', 'MITRE-001', 'MITRE'),
(2, 'EN STOCK', 'Lichy', 'LICHY-001', 'LICHY');

-- Crear los estados iniciales para los contenedores
INSERT INTO ContenedorEstado (contenedor, estado, ubicacion)
VALUES 
(1, 'EN STOCK', 'MITRE'),
(2, 'EN STOCK', 'LICHY');

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_contenedor_categoria ON Contenedor(categoria);
CREATE INDEX IF NOT EXISTS idx_contenedor_productos_estado ON ContenedorProductos(estado);

-- Verificar contenedores predeterminados
SELECT idContenedor, comentario, categoria, codigoContenedor 
FROM Contenedor 
WHERE categoria = 'Predeterminado';

-- Tablas para la funcionalidad de pedidos y facturación

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
