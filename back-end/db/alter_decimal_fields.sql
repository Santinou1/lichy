-- Modificar la tabla ContenedorProductos para permitir valores decimales
USE lichydb;

-- Modificar el campo cantidad de INT a DECIMAL(10,2)
ALTER TABLE ContenedorProductos MODIFY cantidad DECIMAL(10,2);

-- Modificar el campo cantidadAlternativa de INT a DECIMAL(10,2)
ALTER TABLE ContenedorProductos MODIFY cantidadAlternativa DECIMAL(10,2);

-- Verificar los cambios
DESCRIBE ContenedorProductos;
