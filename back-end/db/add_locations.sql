-- Script to add new locations to the database and assign them to specific containers

-- First, insert a new state for container 3 with location "MITRE"
INSERT INTO ContenedorEstado (contenedor, estado, ubicacion, fechaManual)
VALUES (3, 'Contenedor Creado', 'MITRE', CURRENT_DATE());

-- Then, insert a new state for container 4 with location "LICHY"
INSERT INTO ContenedorEstado (contenedor, estado, ubicacion, fechaManual)
VALUES (4, 'Contenedor Creado', 'LICHY', CURRENT_DATE());

-- Update the container's category to match the state
UPDATE Contenedor SET categoria = 'Contenedor Creado' WHERE idContenedor = 3;
UPDATE Contenedor SET categoria = 'Contenedor Creado' WHERE idContenedor = 4;

-- Verify the changes
SELECT * FROM ContenedorEstado WHERE contenedor IN (3, 4) ORDER BY idEstado DESC;
