-- Script completo de base de datos Lichy
-- Incluye la estructura original y las modificaciones para estados de productos
-- Mayo 2025

CREATE DATABASE IF NOT EXISTS lichydb;
USE lichydb;

-- ==========================================
-- Tablas base del sistema
-- ==========================================

CREATE TABLE IF NOT EXISTS usuario (
    idusuario INT AUTO_INCREMENT,
    nombre VARCHAR(200),
    email VARCHAR(200) UNIQUE,
    contrasena VARCHAR(200),
    tipousuario VARCHAR(100),
    permisos VARCHAR(500),
    PRIMARY KEY(idusuario)
);

CREATE TABLE IF NOT EXISTS proveedor (
    idproveedor INT AUTO_INCREMENT,
    nombre VARCHAR(100),
    PRIMARY KEY(idproveedor)
);

CREATE TABLE IF NOT EXISTS producto (
    idproducto INT AUTO_INCREMENT,
    nombre VARCHAR(200),
    unidadpredeterminada ENUM('m','kg'),
    codigointerno INT UNIQUE,
    tipobultopredeterminado ENUM('rollos','cajas'),
    PRIMARY KEY(idproducto)
);

CREATE TABLE IF NOT EXISTS color (
    idcolor INT AUTO_INCREMENT,
    nombre VARCHAR(100),
    codigointerno INT UNIQUE,
    PRIMARY KEY(idcolor)
);

CREATE TABLE IF NOT EXISTS categoria (
    nombrecategoria VARCHAR(100),
    PRIMARY KEY(nombrecategoria)
);

CREATE TABLE IF NOT EXISTS ubicacion (
    nombreubicacion VARCHAR(100),
    estado VARCHAR(100),
    FOREIGN KEY(estado) REFERENCES categoria(nombrecategoria) ON DELETE CASCADE,
    PRIMARY KEY(nombreubicacion)
);

CREATE TABLE IF NOT EXISTS contenedor (
    idcontenedor INT AUTO_INCREMENT,
    categoria VARCHAR(100),
    usuario INT,
    proveedor INT,
    comentario VARCHAR(300),
    ubicacion VARCHAR(100),
    codigocontenedor VARCHAR(100),
    forwarder VARCHAR(100),
    sira VARCHAR(100),
    factura VARCHAR(100),
    vep VARCHAR(100),
    PRIMARY KEY(idcontenedor),
    FOREIGN KEY(proveedor) REFERENCES proveedor(idproveedor) ON DELETE SET NULL,
    FOREIGN KEY(categoria) REFERENCES categoria(nombrecategoria) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS contenedorestado (
    idestado INT AUTO_INCREMENT,
    contenedor INT,
    estado VARCHAR(100),
    ubicacion VARCHAR(200),
    fechahora DATETIME DEFAULT CURRENT_TIMESTAMP,
    fechamanual DATE DEFAULT (CURRENT_DATE()),
    PRIMARY KEY(idestado),
    FOREIGN KEY(contenedor) REFERENCES contenedor(idcontenedor) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contenedorproducto (
    idcontenedorproducto INT AUTO_INCREMENT,
    contenedor INT, 
    producto INT,
    cantidad INT,
    unidad VARCHAR(100),
    precioporunidad FLOAT,
    itemproveedor VARCHAR(200),
    color INT,
    cantidadbulto INT,
    cantidadalternativa INT,
    unidadalternativa ENUM ('rollos', 'cajas'),
    tipobulto ENUM ('rollos','cajas'),
    estado VARCHAR(50) DEFAULT 'En stock' COMMENT 'Estado del producto: En stock, Entregado',
    contenedordestino INT NULL COMMENT 'ID del contenedor destino cuando el estado es En stock',
    PRIMARY KEY(idcontenedorproducto),
    FOREIGN KEY(contenedor) REFERENCES contenedor(idcontenedor) ON DELETE CASCADE,
    FOREIGN KEY(producto) REFERENCES producto(idproducto) ON DELETE CASCADE,
    FOREIGN KEY(color) REFERENCES color(idcolor) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS contenedorproductohistorial (
    idhistorial INT AUTO_INCREMENT,
    idcontenedorproducto INT,
    contenedor INT,
    tipocambio ENUM('UPDATE','DELETE','INSERT'),
    cambios TEXT,
    fechacambio DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuariocambio INT,
    motivo VARCHAR(500),
    PRIMARY KEY(idhistorial),
    FOREIGN KEY(contenedor) REFERENCES contenedor(idcontenedor) ON DELETE CASCADE
);

-- ==========================================
-- Datos iniciales - Categorías
-- ==========================================

INSERT INTO categoria (nombrecategoria) VALUES
('COMPRADO'),
('EMBARCADO'),
('ARRIBADO'),
('DEPOSITO_NACIONAL'),
('EN_STOCK'),
('ENTREGADO'),
('ANULADO');

-- ==========================================
-- Datos iniciales - Ubicaciones
-- ==========================================

INSERT INTO ubicacion (nombreubicacion, estado) VALUES
-- Estado COMPRADO
('FALTA_DISPONER', 'COMPRADO'),
('DESARROLLO_LD_SOFF', 'COMPRADO'),
('LD_SOFF_LLEGARON', 'COMPRADO'),
('PRODUCCION', 'COMPRADO'),

-- Estado EMBARCADO
('BOOKING', 'EMBARCADO'),
('EMBARCADO', 'EMBARCADO'),

-- Estado ARRIBADO
('TERMINAL', 'ARRIBADO'),
('DF_DASSA', 'ARRIBADO'),
('DF_LOGISTICA_CENTRAL', 'ARRIBADO'),
('PARA_OFICIALIZAR', 'ARRIBADO'),
('PARA_OFICIALIZAR_HOY', 'ARRIBADO'),
('POR_COORDINAR', 'ARRIBADO'),
('COORDINADO', 'ARRIBADO'),

-- Estado DEPOSITO_NACIONAL
('ALTITUD', 'DEPOSITO_NACIONAL'),
('MOREIRO', 'DEPOSITO_NACIONAL'),
('OPEN_CARGO', 'DEPOSITO_NACIONAL'),
('LOGISTICA_CENTRAL', 'DEPOSITO_NACIONAL'),
('ULOG', 'DEPOSITO_NACIONAL'),
('ALA', 'DEPOSITO_NACIONAL'),

-- Estado EN_STOCK
('MITRE', 'EN_STOCK'),
('LAVALLE', 'EN_STOCK'),
('LICHY', 'EN_STOCK'),

-- Estado ENTREGADO
('ENTREGADO', 'ENTREGADO'),

-- Estado ANULADO
('ANULADO', 'ANULADO');

-- ==========================================
-- Datos iniciales - Contenedores predeterminados
-- ==========================================

INSERT INTO contenedor (idcontenedor, categoria, comentario, codigocontenedor, ubicacion) 
VALUES 
(1, 'EN_STOCK', 'Mitre', 'MITRE-001', 'MITRE'),
(2, 'EN_STOCK', 'Lichy', 'LICHY-001', 'LICHY');

INSERT INTO contenedorestado (contenedor, estado, ubicacion)
VALUES 
(1, 'EN_STOCK', 'MITRE'),
(2, 'EN_STOCK', 'LICHY');

-- ==========================================
-- Tablas para Pedidos y Facturación
-- ==========================================

CREATE TABLE IF NOT EXISTS pedido (
    idpedido INT AUTO_INCREMENT PRIMARY KEY,
    fechacreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
    usuariocreacion INT NOT NULL,
    fechacompletado DATETIME NULL,
    usuariocompletado INT NULL,
    observaciones TEXT NULL,
    FOREIGN KEY (usuariocreacion) REFERENCES usuario(idusuario),
    FOREIGN KEY (usuariocompletado) REFERENCES usuario(idusuario)
);

CREATE TABLE IF NOT EXISTS pedidoproducto (
    idpedidoproducto INT AUTO_INCREMENT PRIMARY KEY,
    idpedido INT NOT NULL,
    idcontenedorproducto INT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    cantidadalternativa DECIMAL(10,2) NULL,
    unidad VARCHAR(10) NOT NULL,
    unidadalternativa VARCHAR(10) NULL,
    ubicaciondestino VARCHAR(50) NOT NULL,
    fechacreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuariocreacion INT NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
    codigointerno VARCHAR(50) NULL,
    color VARCHAR(50) NULL,
    nombreproducto VARCHAR(255) NULL,
    FOREIGN KEY (idpedido) REFERENCES pedido(idpedido),
    FOREIGN KEY (idcontenedorproducto) REFERENCES contenedorproducto(idcontenedorproducto),
    FOREIGN KEY (usuariocreacion) REFERENCES usuario(idusuario)
);

CREATE TABLE IF NOT EXISTS factura (
    idfactura INT AUTO_INCREMENT PRIMARY KEY,
    idpedido INT NOT NULL,
    numerofactura VARCHAR(50) NOT NULL,
    fechafactura DATE NOT NULL,
    fechacreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuariocreacion INT NOT NULL,
    observaciones TEXT NULL,
    importetotal DECIMAL(10,2) NULL,
    FOREIGN KEY (idpedido) REFERENCES pedido(idpedido),
    FOREIGN KEY (usuariocreacion) REFERENCES usuario(idusuario),
    UNIQUE KEY (numerofactura)
);

-- ==========================================
-- Índices para optimización
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_contenedor_categoria ON contenedor(categoria);
CREATE INDEX IF NOT EXISTS idx_contenedor_producto_estado ON contenedorproducto(estado);
