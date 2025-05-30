-- Script to add "Lichy En stock" location to the ubicacion table

-- First, make sure the "Contenedor Creado" category exists (it should already exist based on the memories)
INSERT IGNORE INTO categorias (nombreCategoria) VALUES ('Contenedor Creado');

-- Add the new location
INSERT INTO ubicacion (nombreUbicacion, estado) 
VALUES ('LICHY', 'EN STOCK');

-- Verify the changes
SELECT * FROM ubicacion;
