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
('ANULADO'),
('Predeterminado'); -- Nueva categoría para contenedores predeterminados

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

-- Estado ENTREGADO
('ENTREGADO', 'ENTREGADO'),

-- Estado ANULADO
('ANULADO', 'ANULADO');

-- Creación de contenedores predeterminados
-- Contenedor Mitre (si no existe un contenedor con este comentario)
INSERT INTO Contenedor (categoria, comentario, codigoContenedor) 
SELECT 'Predeterminado', 'Mitre', 'MITRE-PREDET'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM Contenedor WHERE comentario = 'Mitre' AND categoria = 'Predeterminado'
);

-- Contenedor Lichy (si no existe un contenedor con este comentario)
INSERT INTO Contenedor (categoria, comentario, codigoContenedor) 
SELECT 'Predeterminado', 'Lichy', 'LICHY-PREDET'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM Contenedor WHERE comentario = 'Lichy' AND categoria = 'Predeterminado'
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_contenedor_categoria ON Contenedor(categoria);
CREATE INDEX IF NOT EXISTS idx_contenedor_productos_estado ON ContenedorProductos(estado);

-- Verificar contenedores predeterminados
SELECT idContenedor, comentario, categoria, codigoContenedor 
FROM Contenedor 
WHERE categoria = 'Predeterminado';
