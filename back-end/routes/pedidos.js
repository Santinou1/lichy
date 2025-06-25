const express = require('express');
const router = express.Router();
const pool = require('../db/dbconfig');

// Obtener todos los pedidos
router.get('/', (req, res) => {
  const query = `
    SELECT p.*, 
      (SELECT COUNT(*) FROM contenedorproducto WHERE idPedido = p.idPedido) as cantidadProductos,
      u.nombre as nombreUsuario
    FROM pedido p
    JOIN Usuario u ON p.usuarioCreacion = u.idUsuario
    ORDER BY p.fechaCreacion DESC
  `;
  
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener pedidos:', err);
      return res.status(500).send('Error al obtener pedidos');
    }
    res.json(results);
  });
});

// Obtener pedidos con estado específico y límite
router.get('/filtrar', (req, res) => {
  const estado = req.query.estado;
  const limit = parseInt(req.query.limit) || 10;
  
  let query = `
    SELECT p.*, 
      (SELECT COUNT(*) FROM contenedorproducto WHERE idPedido = p.idPedido) as cantidadProductos,
      u.nombre as nombreUsuario
    FROM pedido p
    JOIN Usuario u ON p.usuarioCreacion = u.idUsuario
  `;
  
  let params = [];
  
  if (estado) {
    query += ` WHERE p.estado = ? `;
    params.push(estado);
  }
  
  query += ` ORDER BY p.fechaCreacion DESC LIMIT ?`;
  params.push(limit);
  
  pool.query(query, params, (err, results) => {
    if (err) {
      console.error('Error al obtener pedidos:', err);
      return res.status(500).send('Error al obtener pedidos');
    }
    res.json(results);
  });
});

// Obtener pedidos completados sin factura
router.get('/completados-sin-factura', (req, res) => {
  const query = `
    SELECT p.*
    FROM pedido p
    LEFT JOIN factura f ON p.idPedido = f.idPedido
    WHERE p.estado = 'Completado' AND f.idFactura IS NULL
    ORDER BY p.fechaCompletado DESC
  `;
  
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener pedidos completados sin factura:', err);
      return res.status(500).send('Error al obtener pedidos completados sin factura');
    }
    res.json(results);
  });
});

// Obtener un pedido por ID
router.get('/:id', (req, res) => {
  const query = `
    SELECT p.*, u.nombre as nombreUsuario,
      uc.nombre as nombreUsuarioCompletado
    FROM pedido p
    JOIN Usuario u ON p.usuarioCreacion = u.idUsuario
    LEFT JOIN Usuario uc ON p.usuarioCompletado = uc.idUsuario
    WHERE p.idPedido = ?
  `;
  
  pool.query(query, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error al obtener pedido:', err);
      return res.status(500).send('Error al obtener pedido');
    }
    
    if (results.length === 0) {
      return res.status(404).send('Pedido no encontrado');
    }
    
    res.json(results[0]);
  });
});

// Crear un nuevo pedido
router.post('/', (req, res) => {
  console.log('POST /api/pedidos llamado');
  console.log('Body:', req.body);
  const { usuarioCreacion, observaciones } = req.body;
  
  const query = `
    INSERT INTO pedido (usuarioCreacion, observaciones)
    VALUES (?, ?)
  `;
  
  pool.query(query, [usuarioCreacion, observaciones || null], (err, results) => {
    if (err) {
      console.error('Error al crear pedido:', err);
      return res.status(500).send('Error al crear pedido');
    }
    
    res.status(201).json({
      idPedido: results.insertId,
      mensaje: 'Pedido creado correctamente'
    });
  });
});

// Obtener productos de un pedido
router.get('/:id/productos', (req, res) => {
  console.log('GET /api/pedidos/:id/productos llamado');
  console.log('Params:', req.params);
  const query = `
    SELECT pp.*, p.nombre as nombreProducto, c.nombre as color,
      u.nombre as nombreUsuario
    FROM pedidoproducto pp
    JOIN contenedorproducto cp ON pp.idcontenedorproducto = cp.idContenedorProducto
    JOIN producto p ON cp.producto = p.idProducto
    LEFT JOIN color c ON cp.color = c.idColor
    JOIN usuario u ON pp.usuariocreacion = u.idUsuario
    WHERE pp.idpedido = ?
    ORDER BY pp.fechacreacion DESC
  `;
  
  pool.query(query, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error al obtener productos del pedido:', err);
      return res.status(500).send('Error al obtener productos del pedido');
    }
    
    res.json(results);
  });
});

// Función auxiliar para hacer rollback y liberar la conexión
function rollbackAndRelease(connection, err, message, res, statusCode = 500) {
  connection.rollback(() => {
    connection.release();
    if (err) {
      console.error(`${message}:`, err);
    }
    return res.status(statusCode).send(message);
  });
}

// Agregar producto a un pedido
router.post('/:id/productos', (req, res) => {
  console.log('POST /api/pedidos/:id/productos llamado');
  console.log('Params:', req.params);
  console.log('Body:', req.body);
  const {
    idContenedorProducto,
    cantidadTransferir,
    cantidadAlternativaTransferir,
    ubicacionDestino,
    usuariocreacion,
    usuarioCreacion,
    motivo,
    unidad,
    unidadAlternativa,
    codigoInterno,
    color,
    nombreProducto
  } = req.body;
  
  // Normalizar el usuario de creación
  const usuarioDeCreacion = usuariocreacion || usuarioCreacion || null;
  
  // Obtener una conexión del pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error al obtener conexión del pool:', err);
      return res.status(500).send('Error de conexión a la base de datos');
    }
    
    connection.beginTransaction(err => {
      if (err) {
        connection.release(); // Liberar la conexión en caso de error
        console.error('Error al iniciar transacción:', err);
        return res.status(500).send('Error al iniciar transacción');
      }
      
      // Verificar que el producto existe y tiene suficiente cantidad
      connection.query(
        'SELECT * FROM contenedorproducto WHERE idContenedorProducto = ?',
        [idContenedorProducto],
        (err, productos) => {
          if (err) {
            return rollbackAndRelease(connection, err, 'Error al verificar producto', res);
          }
          
          if (productos.length === 0) {
            return rollbackAndRelease(connection, null, 'Producto no encontrado', res, 404);
          }
          
          const producto = productos[0];
          
          if (producto.cantidad < cantidadTransferir) {
            return rollbackAndRelease(connection, null, 'Cantidad insuficiente', res, 400);
          }
          
          if (producto.cantidadAlternativa && producto.cantidadAlternativa < cantidadAlternativaTransferir) {
            return rollbackAndRelease(connection, null, 'Cantidad alternativa insuficiente', res, 400);
          }
          
          // Insertar producto en el pedido
          const query = `
            INSERT INTO pedidoproducto (
              idpedido, 
              idcontenedorproducto, 
              cantidad, 
              cantidadAlternativa, 
              unidad, 
              unidadAlternativa, 
              ubicacionDestino, 
              usuariocreacion,
              codigoInterno,
              color,
              nombreProducto
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          const params = [
            req.params.id,
            idContenedorProducto,
            cantidadTransferir,
            cantidadAlternativaTransferir || null,
            unidad || producto.unidad,
            unidadAlternativa || producto.unidadAlternativa,
            ubicacionDestino || 'Pedido',
            usuarioDeCreacion,
            codigoInterno || producto.codigoInterno,
            color,
            nombreProducto
          ];
          
          connection.query(query, params, (err, result) => {
            if (err) {
              return rollbackAndRelease(connection, err, 'Error al agregar producto al pedido', res);
            }
            
            // Restar la cantidad del producto original inmediatamente
            connection.query(
              `UPDATE contenedorproducto
               SET cantidad = cantidad - ?,
                   cantidadAlternativa = CASE 
                     WHEN cantidadAlternativa IS NOT NULL THEN cantidadAlternativa - ?
                     ELSE NULL
                   END
               WHERE idContenedorProducto = ?`,
              [
                cantidadTransferir, 
                cantidadAlternativaTransferir || 0, 
                idContenedorProducto
              ],
              (err) => {
                if (err) {
                  return rollbackAndRelease(connection, err, 'Error al reducir cantidad del producto original', res);
                }
                
                // Registrar el cambio en el historial
                const cambiosJSON = JSON.stringify({
                  cantidadAnterior: parseFloat(producto.cantidad),
                  cantidadNueva: parseFloat(producto.cantidad) - parseFloat(cantidadTransferir),
                  cantidadAlternativaAnterior: producto.cantidadAlternativa ? parseFloat(producto.cantidadAlternativa) : null,
                  cantidadAlternativaNueva: producto.cantidadAlternativa ? (parseFloat(producto.cantidadAlternativa) - parseFloat(cantidadAlternativaTransferir || 0)) : null,
                  unidad: producto.unidad,
                  unidadAlternativa: producto.unidadAlternativa
                });
                
                connection.query(
                  `INSERT INTO contenedorproductohistorial 
                   (idContenedorProducto, contenedor, tipoCambio, cambios, usuarioCambio, motivo) 
                   VALUES (?, ?, ?, ?, ?, ?)`,
                  [
                    idContenedorProducto,
                    producto.contenedor,
                    'Transferencia',
                    cambiosJSON,
                    usuarioDeCreacion,
                    `Transferido a Pedido #${req.params.id} para ubicación ${ubicacionDestino}`
                  ],
                  (err) => {
                    if (err) {
                      return rollbackAndRelease(connection, err, 'Error al registrar historial', res);
                    }
                    
                    // En lugar de eliminar, actualizamos el estado para productos con cantidad 0
                    connection.query(
                      "UPDATE contenedorproducto SET estado = 'En Pedido' WHERE idContenedorProducto = ? AND cantidad <= 0",
                      [idContenedorProducto],
                      (err) => {
                        if (err) {
                          return rollbackAndRelease(connection, err, 'Error al actualizar estado de productos con cantidad 0', res);
                        }
                        
                        connection.commit(err => {
                          if (err) {
                            return rollbackAndRelease(connection, err, 'Error al confirmar transacción', res);
                          }
                          
                          connection.release(); // Liberar la conexión después de completar la transacción
                          res.status(201).json({
                            idProductoPedido: result.insertId,
                            mensaje: 'Producto agregado al pedido correctamente y restado del inventario original'
                          });
                        });
                      }
                    );
                  }
                );
              }
            );
          });
        }
      );
    });
  });
});

// Eliminar producto de un pedido
router.delete('/:idPedido/productos/:idProductoPedido', (req, res) => {
  // Obtener una conexión del pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error al obtener conexión del pool:', err);
      return res.status(500).send('Error de conexión a la base de datos');
    }
    
    connection.beginTransaction(err => {
      if (err) {
        connection.release(); // Liberar la conexión en caso de error
        console.error('Error al iniciar transacción:', err);
        return res.status(500).send('Error al iniciar transacción');
      }
      
      // Verificar que el producto existe en el pedido y obtener sus cantidades
      connection.query(
        'SELECT * FROM pedidoproducto WHERE idpedidoproducto = ? AND idpedido = ?',
        [req.params.idProductoPedido, req.params.idPedido],
        (err, productos) => {
          if (err) {
            return rollbackAndRelease(connection, err, 'Error al verificar producto en pedido', res);
          }
          
          if (productos.length === 0) {
            return rollbackAndRelease(connection, null, 'Producto no encontrado en el pedido', res, 404);
          }

          const producto = productos[0];
          
          // Restaurar las cantidades al contenedor original
          connection.query(
            `UPDATE contenedorproducto
             SET cantidad = cantidad + ?,
                 cantidadAlternativa = CASE 
                   WHEN cantidadAlternativa IS NOT NULL THEN cantidadAlternativa + ?
                   ELSE NULL
                 END
             WHERE idContenedorProducto = ?`,
            [
              producto.cantidad,
              producto.cantidadAlternativa || 0,
              producto.idcontenedorproducto
            ],
            (err) => {
              if (err) {
                return rollbackAndRelease(connection, err, 'Error al restaurar cantidades al contenedor original', res);
              }

              // Eliminar producto del pedido
              connection.query(
                'DELETE FROM pedidoproducto WHERE idpedidoproducto = ?',
                [req.params.idProductoPedido],
                (err, result) => {
                  if (err) {
                    return rollbackAndRelease(connection, err, 'Error al eliminar producto del pedido', res);
                  }

                  // Registrar en el historial
                  const cambiosJSON = JSON.stringify({
                    cantidad: producto.cantidad,
                    cantidadAlternativa: producto.cantidadAlternativa,
                    motivo: 'Eliminado del pedido'
                  });

                  connection.query(
                    `INSERT INTO contenedorproductohistorial 
                     (idContenedorProducto, contenedor, tipoCambio, cambios, usuarioCambio, motivo) 
                     SELECT ?, c.idContenedor, ?, ?, ?, ?
                     FROM contenedorproducto cp
                     JOIN contenedorproducto c ON cp.contenedor = c.idContenedor
                     WHERE cp.idContenedorProducto = ?`,
                    [
                      producto.idcontenedorproducto,
                      'Restaurado',
                      cambiosJSON,
                      producto.usuariocreacion,
                      `Cantidades restauradas por eliminación del Pedido #${req.params.idpedido}`,
                      producto.idcontenedorproducto
                    ],
                    (err) => {
                      if (err) {
                        return rollbackAndRelease(connection, err, 'Error al registrar historial', res);
                      }
                      
                      connection.commit(err => {
                        if (err) {
                          return rollbackAndRelease(connection, err, 'Error al confirmar transacción', res);
                        }
                        
                        connection.release(); // Liberar la conexión al finalizar la transacción
                        res.json({
                          mensaje: 'Producto eliminado del pedido y cantidades restauradas correctamente'
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
});

// Completar un pedido
router.put('/:id/completar', (req, res) => {
  const { usuariocreacion, usuarioModificacion, contenedorDestino, comentario, productosEditados } = req.body;
  
  if (!contenedorDestino) {
    return res.status(400).send('Debe especificar un contenedor destino');
  }
  
  if (!comentario || comentario.trim() === '') {
    return res.status(400).send('Debe proporcionar un comentario');
  }
  
  // Normalizar el usuario de modificación
  const usuarioDeModificacion = usuariocreacion || usuarioModificacion || null;
  
  // Obtener una conexión del pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error al obtener conexión del pool:', err);
      return res.status(500).send('Error de conexión a la base de datos');
    }
    
    connection.beginTransaction(err => {
      if (err) {
        connection.release(); // Liberar la conexión en caso de error
        console.error('Error al iniciar transacción:', err);
        return res.status(500).send('Error al iniciar transacción');
      }
      
      // Verificar que el pedido existe
      connection.query(
        'SELECT * FROM pedido WHERE idPedido = ?',
        [req.params.id],
        (err, pedidos) => {
          if (err) {
            return rollbackAndRelease(connection, err, 'Error al verificar pedido', res);
          }
          
          if (pedidos.length === 0) {
            return rollbackAndRelease(connection, null, 'Pedido no encontrado', res, 404);
          }
          
          // Verificar que el pedido tiene productos
          connection.query(
            'SELECT * FROM pedidoproducto WHERE idpedido = ?',
            [req.params.id],
            (err, productos) => {
              if (err) {
                return rollbackAndRelease(connection, err, 'Error al verificar productos del pedido', res);
              }
              
              if (productos.length === 0) {
                return rollbackAndRelease(connection, null, 'El pedido no tiene productos', res, 400);
              }
              // LOG: Mostrar todos los productos antes de procesar
              console.log('[COMPLETAR PEDIDO] Productos a procesar:', productos.map(p => ({
                idpedidoproducto: p.idpedidoproducto,
                idcontenedorproducto: p.idcontenedorproducto,
                cantidad: p.cantidad,
                unidad: p.unidad,
                nombreProducto: p.nombreProducto
              })));
              
              // Actualizar el estado del pedido y agregar el comentario
              connection.query(
                `UPDATE pedido 
                 SET estado = 'Completado', 
                      fechaCompletado = NOW(), 
                      usuarioCompletado = ?,
                      observaciones = ?
                 WHERE idPedido = ?`,
                [usuarioDeModificacion, comentario, req.params.id],
                (err) => {
                  if (err) {
                    return rollbackAndRelease(connection, err, 'Error al actualizar estado del pedido', res);
                  }
                  
                  // Procesar cada producto usando una función recursiva
                  procesarProductos(0);
                  
                  function procesarProductos(index) {
                    if (index >= productos.length) {
                      // Hemos terminado de procesar todos los productos
                      connection.commit(err => {
                        if (err) {
                          return rollbackAndRelease(connection, err, 'Error al confirmar transacción', res);
                        }
                        
                        connection.release();
                        res.json({
                          mensaje: 'Pedido completado correctamente'
                        });
                      });
                      return;
                    }
                    
                    const producto = productos[index];
                    
                    // Buscar si hay cantidades editadas para este producto
                    let cantidadFinal = parseFloat(producto.cantidad);
                    let cantidadAlternativaFinal = producto.cantidadAlternativa ? parseFloat(producto.cantidadAlternativa) : null;
                    
                    if (productosEditados && productosEditados.length > 0) {
                      const productoEditado = productosEditados.find(p => p.idpedidoproducto === producto.idpedidoproducto);
                      if (productoEditado) {
                        cantidadFinal = parseFloat(productoEditado.cantidad);
                        cantidadAlternativaFinal = productoEditado.cantidadAlternativa !== null ? 
                          parseFloat(productoEditado.cantidadAlternativa) : null;
                      }
                    }
                    
                    // Actualizar el estado y las cantidades del producto en el pedido
                    connection.query(
                      "UPDATE pedidoproducto SET estado = 'Completado', cantidad = ?, cantidadAlternativa = ? WHERE idpedidoproducto = ?",
                      [cantidadFinal, cantidadAlternativaFinal, producto.idpedidoproducto],
                      
                      (err) => {
                        if (err) {
                          return rollbackAndRelease(connection, err, 'Error al actualizar estado del producto en pedido', res);
                        }
                        
                        // Registrar el cambio en el historial
                        const cambiosJSON = JSON.stringify({
                          producto: producto.nombreProducto,
                          cantidad: cantidadFinal,
                          cantidadAlternativa: cantidadAlternativaFinal,
                          unidad: producto.unidad,
                          unidadAlternativa: producto.unidadAlternativa,
                          ubicacionDestino: producto.ubicacionDestino,
                          contenedorDestino: contenedorDestino, // Usar el contenedor destino seleccionado
                          comentario: comentario
                        });
                        
                        // Si es Facturación (valor 3), no creamos productos en ningún contenedor físico
                        // Contenedor ID 1 es para Mitre, ID 2 es para Lichy, ID 3 es para Facturación
                        if (contenedorDestino === '3') {
                          // Registrar en el historial para Facturación
                          connection.query(
                            `INSERT INTO contenedorproductohistorial 
                             (idContenedorProducto, contenedor, tipoCambio, cambios, usuarioCambio, motivo) 
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [
                              producto.idcontenedorproducto,
                              null, // No asignamos a ningún contenedor físico
                              'Facturación',
                              cambiosJSON,
                              usuarioDeModificacion,
                              `Producto de Pedido #${req.params.id} completado y marcado para Facturación`
                            ],
                            (err) => {
                              if (err) {
                                return rollbackAndRelease(connection, err, 'Error al registrar historial', res);
                              }
                              // Si es el último producto, crear la factura automáticamente
                              if (index === productos.length - 1) {
                                // Generar número de factura automático (basado en fecha y ID del pedido)
                                const fechaActual = new Date();
                                const numeroFactura = `FAC-${fechaActual.getFullYear()}${(fechaActual.getMonth() + 1).toString().padStart(2, '0')}${fechaActual.getDate().toString().padStart(2, '0')}-${req.params.id}`;
                                
                                // Calcular importe total del pedido
                                connection.query(
                                  `SELECT SUM(pp.cantidad * cp.precioPorUnidad) as importeTotal
                                   FROM pedidoproducto pp
                                   JOIN contenedorproducto cp ON pp.idcontenedorproducto = cp.idContenedorProducto
                                   WHERE pp.idpedido = ?`,
                                  [req.params.id],
                                  (err, resultados) => {
                                    if (err) {
                                      return rollbackAndRelease(connection, err, 'Error al calcular importe total', res);
                                    }
                                    
                                    const importeTotal = resultados[0] ? (resultados[0].importeTotal || 0) : 0;
                                    
                                    // Crear la factura automáticamente
                                    connection.query(
                                      `INSERT INTO factura 
                                       (idPedido, 
                                        numeroFactura, 
                                        fechaFactura, 
                                        usuarioCreacion, 
                                        observaciones,
                                        importeTotal)
                                      VALUES (?, ?, ?, ?, ?, ?)`,
                                      [
                                        req.params.id,
                                        numeroFactura,
                                        fechaActual.toISOString().split('T')[0], // Formato YYYY-MM-DD
                                        usuarioDeModificacion,
                                        comentario || 'Factura generada automáticamente',
                                        importeTotal
                                      ],
                                      (err) => {
                                        if (err) {
                                          return rollbackAndRelease(connection, err, 'Error al crear factura automática', res);
                                        }
                                        
                                        // Continuar al siguiente producto (que sería el fin del proceso)
                                        procesarProductos(index + 1);
                                      }
                                    );
                                  }
                                );
                              } else {
                                // Si no es el último producto, continuar al siguiente
                                procesarProductos(index + 1);
                              }
                            }
                          );
                        } else {
                          // Crear el producto en el contenedor destino para Mitre (1) o Lichy (2)
                          console.log('[COMPLETAR PEDIDO] Intentando transferir producto al contenedor destino:', {
                            idContenedorProducto: producto.idcontenedorproducto,
                            cantidadFinal,
                            cantidadAlternativaFinal,
                            contenedorDestino
                          });
                          connection.query(
                            'SELECT * FROM contenedorproducto WHERE idContenedorProducto = ?',
                            [producto.idcontenedorproducto],
                            (err, productosOriginal) => {
                              if (err) {
                                console.error('[COMPLETAR PEDIDO] Error al buscar producto original:', err);
                                return rollbackAndRelease(connection, err, 'Error al obtener producto original', res);
                              }
                              if (!productosOriginal || productosOriginal.length === 0) {
                                console.error('[COMPLETAR PEDIDO] Producto original no encontrado en contenedorproducto:', producto.idcontenedorproducto);
                                // Mensaje claro para el usuario
                                connection.rollback(() => {
                                  connection.release();
                                  return res.status(400).json({
                                    error: `No se puede transferir el producto porque el stock original (ID: ${producto.idcontenedorproducto}) ya no existe en el sistema. Puede que haya sido eliminado o transferido previamente.`
                                  });
                                });
                                return;
                              }
                              const prodOrig = productosOriginal[0];
                              connection.query(
                                `INSERT INTO contenedorproducto 
                                  (contenedor, producto, cantidad, unidad, color, precioPorUnidad, cantidadAlternativa, unidadAlternativa, estado, itemProveedor, tipoBulto, cantidadBulto) 
                                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                  contenedorDestino, // El ID del contenedor destino (Mitre o Lichy)
                                  prodOrig.producto,
                                  cantidadFinal,
                                  prodOrig.unidad,
                                  prodOrig.color,
                                  prodOrig.precioPorUnidad,
                                  cantidadAlternativaFinal,
                                  prodOrig.unidadAlternativa,
                                  'En stock',
                                  prodOrig.itemProveedor,
                                  prodOrig.tipoBulto,
                                  prodOrig.cantidadBulto
                                ],
                                (err, insertResult) => {
                                  if (err) {
                                    console.error('[COMPLETAR PEDIDO] Error al crear producto en contenedor destino:', err);
                                    return rollbackAndRelease(connection, err, 'Error al crear producto en contenedor destino', res);
                                  }
                                  // Registrar en el historial
                                  connection.query(
                                    `INSERT INTO contenedorproductohistorial 
                                     (idContenedorProducto, contenedor, tipoCambio, cambios, usuarioCambio, motivo) 
                                     VALUES (?, ?, ?, ?, ?, ?)`,
                                    [
                                      insertResult.insertId,
                                      contenedorDestino, // Usar el contenedor destino seleccionado
                                      'Completado',
                                      cambiosJSON,
                                      usuarioDeModificacion,
                                      `Producto de Pedido #${req.params.id} completado y enviado a ${producto.ubicacionDestino}`
                                    ],
                                    (err) => {
                                      if (err) {
                                        console.error('[COMPLETAR PEDIDO] Error al registrar historial:', err);
                                        return rollbackAndRelease(connection, err, 'Error al registrar historial', res);
                                      }
                                      // Procesar el siguiente producto
                                      procesarProductos(index + 1);
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      }
                    );
                  }
                }
              );
            }
          );
        }
      );
    });
  });
});

module.exports = router;
