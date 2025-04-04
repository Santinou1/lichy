CREATE DATABASE LichyDB;
USE LichyDB;

CREATE TABLE Usuario(
	idUsuario INT AUTO_INCREMENT,
    nombre VARCHAR(200),
    email VARCHAR(200) UNIQUE,
    contrasena VARCHAR(200),
    tipoUsuario VARCHAR(100),
    permisos VARCHAR(500),
    PRIMARY KEY(idUsuario)
);

CREATE TABLE Proveedor(
	idProveedor INT AUTO_INCREMENT,
    nombre VARCHAR(100),
    PRIMARY KEY(idProveedor)
);

CREATE TABLE Producto(
	idProducto INT AUTO_INCREMENT,
    nombre VARCHAR(200),
    unidadPredeterminada ENUM('m','kg'),
    codigoInterno INT UNIQUE,
    tipoBultoPredeterminado ENUM('rollos','cajas'),
    PRIMARY KEY(idProducto)
);
CREATE TABLE Color(
	idColor INT AUTO_INCREMENT,
    nombre VARCHAR(100),
    codigoInterno INT UNIQUE,
    PRIMARY KEY(idColor)
);

CREATE TABLE categorias(
	nombreCategoria VARCHAR(100),
    PRIMARY KEY(nombreCategoria)
);

CREATE TABLE ubicacion(
	nombreUbicacion VARCHAR(100),
    estado VARCHAR(100),
    FOREIGN KEY(estado) REFERENCES categorias(nombreCategoria) ON DELETE CASCADE,
    PRIMARY KEY(nombreUbicacion)
);
CREATE TABLE Contenedor(
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
    FOREIGN KEY(categoria) REFERENCES categorias(nombreCategoria)ON DELETE SET NULL
);

CREATE TABLE ContenedorEstado(
	idEstado INT AUTO_INCREMENT,
    contenedor INT,
    estado VARCHAR(100),
    ubicacion VARCHAR(200),
    fechaHora DATETIME DEFAULT CURRENT_TIMESTAMP,
    fechaManual DATE DEFAULT (CURRENT_DATE()),
    PRIMARY KEY(idEstado),
    FOREIGN KEY(contenedor) REFERENCES Contenedor(idContenedor) ON DELETE CASCADE
);

CREATE TABLE ContenedorProductos(
	idContenedorProductos INT AUTO_INCREMENT,
    contenedor INT, 
    producto INT,
    cantidad INT,
    unidad VARCHAR(100),
    precioPorUnidad FLOAT,
    item_proveedor VARCHAR(200),
    color INT,
    cantidadBulto INT,
    PRIMARY KEY(idContenedorProductos),
    tipoBulto ENUM ('rollos','cajas'),
    FOREIGN KEY(contenedor) REFERENCES Contenedor(idContenedor) ON DELETE CASCADE,
    FOREIGN KEY(producto) REFERENCES Producto(idProducto) ON DELETE CASCADE,
    FOREIGN KEY(color) REFERENCES Color(idColor) ON DELETE SET NULL
);

CREATE TABLE ContenedorProductosHistorial (
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



INSERT INTO Categorias (nombreCategoria) VALUES
('COMPRADO'),
('EMBARCADO'),
('ARRIBADO'),
('DEPOSITO NACIONAL'),
('EN STOCK'),
('ENTREGADO'),
('ANULADO');
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

