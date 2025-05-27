const express = require('express');
const router = express.Router();
const pool = require('../db/dbconfig');

// Obtener todas las facturas
router.get('/', (req, res) => {
  const query = `
    SELECT f.*, u.nombre as nombreUsuario
    FROM Facturas f
    JOIN Usuario u ON f.usuarioCreacion = u.idUsuario
    ORDER BY f.fechaCreacion DESC
  `;
  
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener facturas:', err);
      return res.status(500).send('Error al obtener facturas');
    }
    res.json(results);
  });
});

// Obtener una factura por ID
router.get('/:id', (req, res) => {
  const query = `
    SELECT f.*, u.nombre as nombreUsuario
    FROM Facturas f
    JOIN Usuario u ON f.usuarioCreacion = u.idUsuario
    WHERE f.idFactura = ?
  `;
  
  pool.query(query, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error al obtener factura:', err);
      return res.status(500).send('Error al obtener factura');
    }
    
    if (results.length === 0) {
      return res.status(404).send('Factura no encontrada');
    }
    
    res.json(results[0]);
  });
});

// Crear una nueva factura
router.post('/', (req, res) => {
  const connection = pool;
  const { idPedido, numeroFactura, fechaFactura, observaciones, usuarioCreacion } = req.body;
  
  connection.beginTransaction(err => {
    if (err) {
      console.error('Error al iniciar transacción:', err);
      return res.status(500).send('Error al iniciar transacción');
    }
    
    // Verificar que el pedido existe y está completado
    connection.query(
      'SELECT * FROM Pedidos WHERE idPedido = ? AND estado = \'Completado\'',
      [idPedido],
      (err, pedidos) => {
        if (err) {
          connection.rollback(() => {
            console.error('Error al verificar pedido:', err);
            return res.status(500).send('Error al verificar pedido');
          });
          return;
        }
        
        if (pedidos.length === 0) {
          connection.rollback(() => {
            return res.status(400).send('El pedido no existe o no está completado');
          });
          return;
        }
        
        // Verificar que el número de factura no esté duplicado
        connection.query(
          'SELECT * FROM Facturas WHERE numeroFactura = ?',
          [numeroFactura],
          (err, facturas) => {
            if (err) {
              connection.rollback(() => {
                console.error('Error al verificar número de factura:', err);
                return res.status(500).send('Error al verificar número de factura');
              });
              return;
            }
            
            if (facturas.length > 0) {
              connection.rollback(() => {
                return res.status(400).send('El número de factura ya existe');
              });
              return;
            }
            
            // Calcular el importe total del pedido
            connection.query(
              `SELECT SUM(cantidad * precioPorUnidad) as importeTotal
               FROM ProductosPedido pp
               JOIN ContenedorProductos cp ON pp.idContenedorProducto = cp.idContenedorProductos
               WHERE pp.idPedido = ?`,
              [idPedido],
              (err, productos) => {
                if (err) {
                  connection.rollback(() => {
                    console.error('Error al calcular importe total:', err);
                    return res.status(500).send('Error al calcular importe total');
                  });
                  return;
                }
                
                const importeTotal = productos[0] ? (productos[0].importeTotal || 0) : 0;
                
                // Crear la factura
                const query = `
                  INSERT INTO Facturas (
                    idPedido, 
                    numeroFactura, 
                    fechaFactura, 
                    usuarioCreacion, 
                    observaciones,
                    importeTotal
                  )
                  VALUES (?, ?, ?, ?, ?, ?)
                `;
                
                connection.query(
                  query,
                  [
                    idPedido,
                    numeroFactura,
                    fechaFactura,
                    usuarioCreacion,
                    observaciones || null,
                    importeTotal
                  ],
                  (err, result) => {
                    if (err) {
                      connection.rollback(() => {
                        console.error('Error al crear factura:', err);
                        return res.status(500).send('Error al crear factura');
                      });
                      return;
                    }
                    
                    connection.commit(err => {
                      if (err) {
                        connection.rollback(() => {
                          console.error('Error al confirmar transacción:', err);
                          return res.status(500).send('Error al confirmar transacción');
                        });
                        return;
                      }
                      
                      res.status(201).json({
                        idFactura: result.insertId,
                        mensaje: 'Factura creada correctamente'
                      });
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

module.exports = router;
