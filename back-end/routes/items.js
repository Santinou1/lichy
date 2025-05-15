const express = require('express');
const router = express.Router();
const pool = require('../db/dbconfig');

router.get('/proveedor',obtenerProveedores);
router.post('/proveedor',agregarProveedor);
router.get('/color',obtenerColores);
router.put('/color/:id',actualizarColor);
router.post('/color',agregarColor);
router.get('/producto',obtenerProductos);
router.post('/producto',agregarProducto);
router.get('/producto/:id',buscarProducto);
router.put('/producto/:id',actualizarProducto);
router.get('/categorias',obtenerCategorias);
router.post('/ubicaciones', obtenerUbicacionesPorEstado);
router.get('/ubicaciones', obtenerUbicaciones);
router.get('/:item', obtenerItemsPorTipo);

async function obtenerProveedores(req,res){
    try {
        const [results] = await pool.promise().query('SELECT * FROM proveedor');
        res.json(results);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function actualizarProducto(req,res){
    try {
        const {nombre, unidadPredeterminada, codigoInterno, tipoBultoPredeterminado} = req.body;
        const id = req.params.id;
        const connection = pool;
        
        console.log('Datos recibidos para actualizar producto:', req.body);
        console.log('Tipo de unidadPredeterminada:', typeof unidadPredeterminada, 'Valor:', unidadPredeterminada);
        console.log('Tipo de tipoBultoPredeterminado:', typeof tipoBultoPredeterminado, 'Valor:', tipoBultoPredeterminado);
        console.log('Tipo de codigoInterno:', typeof codigoInterno, 'Valor:', codigoInterno);
        
        // Asegurar que la unidad predeterminada sea un string no vacío
        const unidadPredeterminadaValue = String(unidadPredeterminada || '');
        
        // Determinar el tipo de bulto según la unidad si no está definido
        let tipoBultoValue = String(tipoBultoPredeterminado || '');
        if (!tipoBultoValue && unidadPredeterminadaValue) {
            const unidadLower = unidadPredeterminadaValue.toLowerCase();
            if (unidadLower === 'm' || unidadLower === 'kg') {
                tipoBultoValue = 'rollo'; // Usar 'rollo' para coincidir con el enum
            } else if (unidadLower === 'uni') {
                tipoBultoValue = 'caja'; // Usar 'caja' para coincidir con el enum
            }
        }
        
        // Validar que el valor de tipoBulto sea uno de los permitidos en el enum
        if (tipoBultoValue && !['rollo', 'caja', 'rollos', 'cajas'].includes(tipoBultoValue)) {
            console.log(`Valor de tipoBulto '${tipoBultoValue}' no válido, usando valor por defecto`);
            tipoBultoValue = unidadPredeterminadaValue.toLowerCase() === 'uni' ? 'caja' : 'rollo';
        }
        
        // Permitir que codigoInterno sea null, undefined o cadena vacía
        const codigoInternoValue = codigoInterno === undefined || codigoInterno === null || codigoInterno === '' ? null : codigoInterno;
        
        console.log('Valores a actualizar (después de procesar):', {
            nombre,
            unidadPredeterminada: unidadPredeterminadaValue,
            codigoInterno: codigoInternoValue,
            tipoBultoPredeterminado: tipoBultoValue
        });
        
        const updateQuery = `UPDATE producto SET nombre = ?, unidadPredeterminada = ?, codigoInterno = ?, tipoBultoPredeterminado = ? WHERE idProducto = ?`;
        const updateValues = [nombre, unidadPredeterminadaValue, codigoInternoValue, tipoBultoValue, id];
        
        console.log('Query de actualización:', updateQuery);
        console.log('Valores para actualización:', updateValues);
        
        const [updateResults] = await connection.promise().query(updateQuery, updateValues);

        console.log('Resultado de actualización:', updateResults);
        
        if (updateResults.affectedRows === 0) {
            // Si no se actualizó ninguna fila, el producto no existe
            return res.status(404).send('Producto no encontrado.');
        }
        
        // Obtener el producto actualizado
        const [producto] = await connection.promise().query('SELECT * FROM producto WHERE idProducto = ?', [id]);
        
        if (!producto || producto.length === 0) {
            return res.status(404).send('No se pudo obtener el producto actualizado.');
        }
        
        res.json(producto[0]);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function actualizarColor(req,res){
    try {
        const {nombre, codigoInterno} = req.body;
        const id = req.params.id;
        const connection = pool;
        
        // Validar campos obligatorios
        if(!nombre){
            return res.status(400).send('El nombre es obligatorio.');
        }
        
        const [results] = await connection.promise().query(
            'UPDATE color SET nombre = ?, codigoInterno = ? WHERE idColor = ?',
            [nombre, codigoInterno, id]
        );
        
        if (results.affectedRows === 0) {
            return res.status(404).send('Color no encontrado.');
        }
        
        res.json({ message: 'Color actualizado exitosamente.' });
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function buscarProducto(req,res){
    try {
        const id = req.params.id;
        const [results] = await pool.promise().query('SELECT * FROM producto WHERE idProducto = ?', [id]);
        if (results.length === 0) {
            return res.status(404).send('Producto no encontrado.');
        }
        res.json(results[0]);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function agregarProveedor(req,res){
    try{
        const {nombre} = req.body;
        const connection = pool;
        
        // Validar campos obligatorios
        if(!nombre){
            return res.status(400).send('El nombre es obligatorio.');
        }
        
        // Verificar si ya existe un proveedor con el mismo nombre
        const [existingProveedores] = await connection.promise().query(
            'SELECT * FROM proveedor WHERE nombre = ?',
            [nombre]
        );
        
        if (existingProveedores.length > 0) {
            return res.status(400).send('Ya existe un proveedor con ese nombre.');
        }
        
        const [results] = await connection.promise().query(
            'INSERT INTO proveedor (nombre) VALUES (?)',
            [nombre]
        );
        
        const nuevoProveedor = { idProveedor: results.insertId, nombre };
        res.json([nuevoProveedor]);
    } catch(error){
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function obtenerColores(req,res){
    try {
        const [results] = await pool.promise().query('SELECT * FROM color');
        res.json(results);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function agregarColor(req,res){
    try{
        const {nombre, codigoInterno} = req.body;
        const connection = pool;
        
        // Validar campos obligatorios
        if(!nombre){
            return res.status(400).send('El nombre es obligatorio.');
        }
        
        // Verificar si ya existe un color con el mismo nombre
        const [existingColors] = await connection.promise().query(
            'SELECT * FROM color WHERE nombre = ?',
            [nombre]
        );
        
        if (existingColors.length > 0) {
            return res.status(400).send('Ya existe un color con ese nombre.');
        }
        
        const [results] = await connection.promise().query(
            'INSERT INTO color (nombre, codigoInterno) VALUES (?, ?)',
            [nombre, codigoInterno]
        );
        
        res.json({ id: results.insertId, nombre, codigoInterno });
    } catch(error){
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function obtenerProductos(req,res){
    try {
        const [results] = await pool.promise().query('SELECT * FROM producto');
        
        // Asegurarse de que los campos no sean null
        results.forEach(producto => {
            producto.unidadPredeterminada = producto.unidadPredeterminada || '';
            producto.tipoBultoPredeterminado = producto.tipoBultoPredeterminado || '';
        });
        
        res.json(results);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function agregarProducto(req,res){
    try{
        const {nombre, unidadPredeterminada, codigoInterno, tipoBultoPredeterminado} = req.body;
        console.log('Datos recibidos para crear producto:', req.body);
        console.log('Tipo de unidadPredeterminada:', typeof unidadPredeterminada, 'Valor:', unidadPredeterminada);
        console.log('Tipo de tipoBultoPredeterminado:', typeof tipoBultoPredeterminado, 'Valor:', tipoBultoPredeterminado);
        
        const connection = pool;
        
        // Validar campos obligatorios (código interno es ahora opcional)
        if(!nombre || !unidadPredeterminada){
            return res.status(400).send('Faltan campos obligatorios (nombre o unidad)');
        }
        
        // Asegurar que la unidad predeterminada sea un string no vacío
        const unidadPredeterminadaValue = String(unidadPredeterminada || '');
        
        // Determinar el tipo de bulto según la unidad si no está definido
        let tipoBultoValue = String(tipoBultoPredeterminado || '');
        if (!tipoBultoValue && unidadPredeterminadaValue) {
            const unidadLower = unidadPredeterminadaValue.toLowerCase();
            if (unidadLower === 'm' || unidadLower === 'kg') {
                tipoBultoValue = 'rollo'; // Usar 'rollo' para coincidir con el enum
            } else if (unidadLower === 'uni') {
                tipoBultoValue = 'caja'; // Usar 'caja' para coincidir con el enum
            }
        }
        
        // Validar que el valor de tipoBulto sea uno de los permitidos en el enum
        if (tipoBultoValue && !['rollo', 'caja', 'rollos', 'cajas'].includes(tipoBultoValue)) {
            console.log(`Valor de tipoBulto '${tipoBultoValue}' no válido, usando valor por defecto`);
            tipoBultoValue = unidadPredeterminadaValue.toLowerCase() === 'uni' ? 'caja' : 'rollo';
        }
        
        // Permitir que codigoInterno sea null, undefined o cadena vacía
        const codigoInternoValue = codigoInterno === undefined || codigoInterno === null || codigoInterno === '' ? null : codigoInterno;
        
        console.log('Valores a insertar (después de procesar):', {
            nombre,
            unidadPredeterminada: unidadPredeterminadaValue,
            codigoInterno: codigoInternoValue,
            tipoBultoPredeterminado: tipoBultoValue
        });
        
        // Primero intentamos actualizar la estructura de la tabla para asegurarnos de que 'uni' sea un valor válido
        const alterTableSQL = "ALTER TABLE Producto MODIFY COLUMN unidadPredeterminada ENUM('m', 'kg', 'uni')";
        connection.query(alterTableSQL, (alterErr, alterResult) => {
            if (alterErr) {
                console.log('No se pudo actualizar la estructura de la tabla, pero continuamos con la inserción:', alterErr);
                // Continuamos con la inserción aunque falle la alteración de la tabla
            } else {
                console.log('Estructura de la tabla Producto actualizada correctamente para incluir "uni"');
            }
            
            // Verificar la estructura de la tabla Producto después de intentar alterarla
            connection.query('DESCRIBE Producto', (err, tableDesc) => {
                if (err) {
                    console.error('Error obteniendo estructura de tabla:', err);
                    return res.status(500).send('Error en el servidor.');
                }
                
                console.log('Estructura de la tabla Producto:', tableDesc);
                
                // Verificar si ya existe un producto con el mismo nombre
                connection.query('SELECT * FROM Producto WHERE nombre = ?', [nombre], (err, existingProducts) => {
                    if (err) {
                        console.error('Error verificando producto existente:', err);
                        return res.status(500).send('Error en el servidor.');
                    }
                    
                    // Si ya existe un producto con el mismo nombre, retornar error
                    if (existingProducts && existingProducts.length > 0) {
                        console.log('Ya existe un producto con el nombre:', nombre);
                        return res.status(400).json({ 
                            error: `Ya existe un producto con el nombre: ${nombre}`,
                            producto: existingProducts[0]
                        });
                    }
                    
                    // Si no existe, continuar con la inserción
                    const insertQuery = 'INSERT INTO Producto (nombre, unidadPredeterminada, codigoInterno, tipoBultoPredeterminado) VALUES (?,?,?,?)';
                    const insertValues = [nombre, unidadPredeterminadaValue, codigoInternoValue, tipoBultoValue];
                
                    console.log('Query de inserción:', insertQuery);
                    console.log('Valores para inserción:', insertValues);
                    
                    connection.query(insertQuery, insertValues, (err, result) => {
                        if (err) {
                            console.error('Error ejecutando la inserción:', err);
                            return res.status(500).send('Error en el servidor.');
                        }
                        
                        const insertId = result.insertId;
                        
                        // Obtener el producto recién creado
                        connection.query('SELECT * FROM producto WHERE idProducto = ?', [insertId], (err, results) => {
                            if(err){
                                console.error('Error consultando el producto creado:', err);
                                return res.status(500).send('Error en el servidor.');
                            }
                            
                            console.log('Producto creado (datos crudos):', results);
                            
                            // Asegurarse de que los campos estén definidos antes de enviar la respuesta
                            if (results && results.length > 0) {
                                const producto = results[0];
                                producto.unidadPredeterminada = producto.unidadPredeterminada || '';
                                producto.tipoBultoPredeterminado = producto.tipoBultoPredeterminado || '';
                                console.log('Producto procesado para respuesta:', producto);
                                res.json([producto]);
                            } else {
                                console.log('No se encontró el producto recién creado');
                                res.json(results);
                            }
                        });
                    });
                }); // Cierre del SELECT * FROM Producto WHERE nombre = ?
            }); // Cierre del DESCRIBE Producto
        }); // Cierre del ALTER TABLE Producto
    } catch(error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function obtenerCategorias(req,res) {
    try {
        const query = `
        SELECT * FROM categorias;`;
        const [results] = await pool.promise().query(query);
        res.json(results);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function obtenerUbicacionesPorEstado(req,res){
    try {
        const { estado } = req.body;
        const [results] = await pool.promise().query('SELECT * FROM ubicacion WHERE estado = ?', [estado]);
        res.json(results);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function obtenerUbicaciones(req,res){
    try {
        const [results] = await pool.promise().query('SELECT * FROM ubicacion');
        res.json(results);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function obtenerItemsPorTipo(req, res) {
    try {
        const tipo = req.params.item;
        let query;
        
        switch (tipo) {
            case 'producto':
                query = 'SELECT * FROM producto';
                break;
            case 'color':
                query = 'SELECT * FROM color';
                break;
            case 'proveedor':
                query = 'SELECT * FROM proveedor';
                break;
            default:
                return res.status(400).json({ mensaje: 'Tipo de item no válido' });
        }
        
        const [results] = await pool.promise().query(query);
        
        // Procesar resultados si es necesario
        if (tipo === 'producto') {
            // Asegurarse de que los campos no sean null
            results.forEach(producto => {
                producto.unidadPredeterminada = producto.unidadPredeterminada || '';
                producto.tipoBultoPredeterminado = producto.tipoBultoPredeterminado || '';
            });
        }
        
        res.json(results);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

module.exports = router;