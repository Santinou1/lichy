-- Script para implementar estados de productos y contenedores predeterminados
-- Fecha: Mayo 2025

-- 1. Alteración de la tabla ContenedorProductos para añadir campos de estado
ALTER TABLE ContenedorProductos 
ADD COLUMN estado VARCHAR(50) DEFAULT 'En stock' COMMENT 'Estado del producto: En stock, Entregado',
ADD COLUMN contenedorDestino INT NULL COMMENT 'ID del contenedor destino cuando el estado es En stock';

-- 2. Creación de contenedores predeterminados si no existen ya

-- Primero aseguramos que exista la categoría "Predeterminado"
INSERT IGNORE INTO categorias (nombreCategoria) 
VALUES ('Predeterminado');

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

-- 3. Añadir índice para mejorar rendimiento de búsqueda de contenedores por categoría
CREATE INDEX IF NOT EXISTS idx_contenedor_categoria ON Contenedor(categoria);

-- 4. Añadir índice para mejorar rendimiento de búsqueda por estado
CREATE INDEX IF NOT EXISTS idx_contenedor_productos_estado ON ContenedorProductos(estado);

-- 5. Añadir clave foránea para contenedorDestino (opcional, descomenta si es necesario)
-- ALTER TABLE ContenedorProductos 
-- ADD CONSTRAINT fk_contenedor_destino 
-- FOREIGN KEY (contenedorDestino) REFERENCES Contenedor(idContenedor)
-- ON DELETE SET NULL;

-- 6. Verificar contenedores predeterminados
SELECT idContenedor, comentario, categoria, codigoContenedor 
FROM Contenedor 
WHERE categoria = 'Predeterminado';
