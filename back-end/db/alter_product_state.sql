-- Script para agregar el campo de estado a la tabla ContenedorProductos
ALTER TABLE ContenedorProductos
ADD COLUMN estado ENUM ('En stock', 'Entregado') DEFAULT 'En stock',
ADD COLUMN contenedorDestino INT NULL,
ADD CONSTRAINT fk_contenedor_destino
FOREIGN KEY (contenedorDestino) 
REFERENCES Contenedor(idContenedor)
ON DELETE SET NULL;
