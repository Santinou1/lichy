-- Script para agregar los campos de medición alternativa a la tabla ContenedorProductos
ALTER TABLE ContenedorProductos
ADD COLUMN cantidadAlternativa INT,
ADD COLUMN unidadAlternativa ENUM ('rollos', 'cajas');
    