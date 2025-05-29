const express = require('express');
const router = express.Router();
const pool = require('../db/dbconfig');

router.get('/producto/:id',obtenerProductoContenedor);
router.get('/:id',obtenerProductosDeContenedor);
router.put('/:id',editarProductoDeContenedor);
router.delete('/:id',eliminarProductoDeContenedor);
router.post('/', agregarProductoDeContenedor);
router.put('/estado/:id', cambiarEstadoProducto);
router.get('/predeterminados', obtenerContenedoresPredeterminados);

async function obtenerProductoContenedor(req,res){
    try{
        const id = req.params.id;
        const query = `
        SELECT  idContenedorProductos, p.nombre, p.idProducto, p.codigoInterno, cp.cantidad, cp.unidad, cp.precioPorUnidad, c.nombre AS color, cp.contenedor, c.idColor, cp.item_proveedor, cp.cantidadAlternativa, cp.unidadAlternativa, cp.estado, cp.contenedorDestino,
        (SELECT con.comentario FROM Contenedor con WHERE con.idContenedor = cp.contenedorDestino) AS nombreContenedorDestino
        FROM ContenedorProductos cp 
        JOIN Producto p ON cp.producto = p.idProducto 
        LEFT JOIN color c ON cp.color = c.idColor
        WHERE idContenedorProductos = ?; 
        `
        const [results] = await pool.promise().query(query, [id]);
        res.json(results);
    }catch(error){
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}
async function obtenerProductosDeContenedor(req,res){
    try {
        const id = req.params.id;
        const query = `
        SELECT  idContenedorProductos, p.nombre, p.idProducto, p.codigoInterno, cp.cantidad, cp.unidad, cp.precioPorUnidad, c.nombre AS color, cp.contenedor, c.idColor, cp.cantidadAlternativa, cp.unidadAlternativa, cp.estado, cp.contenedorDestino,
        (SELECT con.comentario FROM Contenedor con WHERE con.idContenedor = cp.contenedorDestino) AS nombreContenedorDestino
        FROM ContenedorProductos cp 
        JOIN Producto p ON cp.producto = p.idProducto 
        LEFT JOIN color c ON cp.color = c.idColor
        WHERE cp.contenedor = ?; `;
        const [results] = await pool.promise().query(query, [id]);
        res.json(results);
    }catch(error){
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function agregarProductoDeContenedor(req,res){
    try {
        const {contenedor, producto, cantidad, unidad, color, precioPorUnidad, cantidadAlternativa, unidadAlternativa, estado, contenedorDestino} = req.body;
        
        // Validar que la unidad alternativa sea correcta según la unidad principal
        let unidadAltValidada = unidadAlternativa;
        if (unidad === 'm' || unidad === 'kg') {
            unidadAltValidada = 'rollos';
        } else if (unidad === 'uni') {
            unidadAltValidada = 'cajas';
        }
        
        const connection = pool;
        connection.query('INSERT INTO ContenedorProductos(contenedor,producto,cantidad,unidad,color,precioPorUnidad,cantidadAlternativa,unidadAlternativa,estado,contenedorDestino) VALUES(?,?,?,?,?,?,?,?,?,?);',
        [contenedor, producto, cantidad, unidad, color, precioPorUnidad, cantidadAlternativa, unidadAltValidada, estado || 'En stock', contenedorDestino || null],(err,results)=>{
            if(err){
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error en el servidor.');
            }
            const query = `
                SELECT  idContenedorProductos, p.nombre, p.idProducto, p.codigoInterno, cp.cantidad, cp.unidad, cp.precioPorUnidad, c.nombre AS color, c.idColor, cp.cantidadAlternativa, cp.unidadAlternativa, cp.estado, cp.contenedorDestino,
                (SELECT con.comentario FROM Contenedor con WHERE con.idContenedor = cp.contenedorDestino) AS nombreContenedorDestino
                FROM ContenedorProductos cp 
                JOIN Producto p ON cp.producto = p.idProducto 
                LEFT JOIN color c ON cp.color = c.idColor
                WHERE cp.contenedor = ?; `;
            connection.query(query,[contenedor],(err,results)=>{
                if(err){
                    console.error('Error ejecutando la consulta:', err);
                    return res.status(500).send('Error en el servidor.');
                }
                res.json(results);
            });
        })
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}
async function editarProductoDeContenedor(req,res){
   const connection = pool;
  
    try{
     
        const id =req.params.id;
        const {producto,cantidad,unidad,color,contenedor,precioPorUnidad,coloresAsignados,item_proveedor,motivo,dataAnterior,usuarioCambio,cantidadAlternativa,unidadAlternativa,actualizarUnidadEnTodosLosProductos,codigoInterno} = req.body;
        
        // Validar que la unidad alternativa sea correcta según la unidad principal
        let unidadAltValidada = unidadAlternativa;
        if (unidad === 'm' || unidad === 'kg') {
            unidadAltValidada = 'rollos';
        } else if (unidad === 'uni') {
            unidadAltValidada = 'cajas';
        }
        console.log(req.body);
        console.log(coloresAsignados);
        console.log('Datos recibidos del frontend:', req.body);
        console.log('Código interno recibido:', codigoInterno);
        
        // Si estamos actualizando un producto existente sin desglose de colores
        if (cantidad !== 0 && (!coloresAsignados || coloresAsignados.length === 0)) {
            // Verificar si el color es una cadena vacía o un valor no válido
            // Si es así, establecerlo como NULL para cumplir con la restricción de clave foránea
            const colorValue = color === '' || color === 0 || color === '0' ? null : color;
            
            console.log('Valor de color a guardar:', colorValue);
            
            // 1. Actualizar la tabla ContenedorProductos
            const query = `UPDATE ContenedorProductos cp
            SET 
            cp.producto = ?,
            cp.cantidad = ?,
            cp.unidad = ?,
            cp.color = ?,
            cp.precioPorUnidad = ?,
            cp.item_proveedor = ?,
            cp.cantidadAlternativa = ?,
            cp.unidadAlternativa = ?
            WHERE cp.idContenedorProductos = ?;
            `
            await connection.promise().query(query,[producto,cantidad,unidad,colorValue,precioPorUnidad,item_proveedor,cantidadAlternativa,unidadAltValidada,id]);
            
            // 2. Si se proporcionó un código interno, actualizar la tabla Producto
            if (codigoInterno !== undefined) {
                console.log('Actualizando código interno del producto:', codigoInterno);
                const updateProductoQuery = `UPDATE Producto SET codigoInterno = ? WHERE idProducto = ?`;
                await connection.promise().query(updateProductoQuery, [codigoInterno, producto]);
            }
            
            let actualizado = {idContenedorProductos:parseInt(id),
                idProducto:producto, 
                cantidad:cantidad,
                unidad:unidad,
                color:color,
                precioPorUnidad:precioPorUnidad,
                item_proveedor:item_proveedor,
                cantidadAlternativa:cantidadAlternativa,
                unidadAlternativa:unidadAltValidada
            };
            
            // Registrar el cambio en el historial
            const cambiosTexto = generarTextoCambios(dataAnterior, actualizado);
            
            const sqlInsert = `
                INSERT INTO ContenedorProductosHistorial (idContenedorProductos, contenedor, tipoCambio, cambios, usuarioCambio, motivo)
                VALUES (?, ?, ?, ?, ?, ?);
            `;
            
            await connection.promise().query(sqlInsert, [
                id,
                contenedor,
                'UPDATE',
                cambiosTexto,
                usuarioCambio,
                motivo
            ]);
            
            // Obtener los productos actualizados para devolver
            const [results] = await connection.promise().query('SELECT * FROM ContenedorProductos cp JOIN Producto p ON cp.producto = p.idProducto WHERE cp.contenedor = ?', [contenedor]);
            return res.json(results);
        }
        // Si hay desglose de colores, crear nuevos productos y reducir el stock del producto principal
        else if (coloresAsignados && coloresAsignados.length > 0) {
            let cambiosTexto = `Cambios: desglose de colores al producto: (${dataAnterior.nombre})\n`;
            let cantidadTotalAsignada = 0;
            let cantidadAlternativaTotalAsignada = 0;
            
            // Primero crear los nuevos productos con colores asignados
            for (const colorAsignado of coloresAsignados) {
                const insertQuery = ` 
                    INSERT INTO ContenedorProductos (contenedor, producto, cantidad, unidad, color, precioPorUnidad, cantidadAlternativa, unidadAlternativa)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                `;
                // Validar que la unidad alternativa sea correcta según la unidad principal para cada color
                let unidadAltColorValidada = unidadAltValidada;
                
                // Usar la cantidad alternativa directamente proporcionada para este color
                let cantidadAltProporcional = colorAsignado.cantidadAlternativa || null;
                
                await connection.promise().query(insertQuery, [
                    contenedor, // contenedor (usamos el mismo contenedor)
                    producto, // producto (el mismo producto)
                    colorAsignado.cantidad, // cantidad asignada al color
                    unidad, // unidad (la misma unidad)
                    parseInt(colorAsignado.color), // color asignado
                    precioPorUnidad, // precio por unidad (el mismo)
                    cantidadAltProporcional, // cantidad alternativa proporcional para este color
                    unidadAltColorValidada // unidad alternativa validada
                ]);
                cambiosTexto += `(${colorAsignado.color}) -> cantidad: ${colorAsignado.cantidad}, cantidad alternativa: ${cantidadAltProporcional || 'N/A'}\n`;
                
                // Sumar la cantidad asignada al total
                cantidadTotalAsignada += parseFloat(colorAsignado.cantidad);
                
                // Sumar la cantidad alternativa asignada al total si existe
                if (cantidadAltProporcional) {
                    cantidadAlternativaTotalAsignada += parseFloat(cantidadAltProporcional);
                }
            }
            
            // Si se proporcionó un código interno, actualizar la tabla Producto
            if (codigoInterno !== undefined) {
                console.log('Actualizando código interno del producto en caso de desglose de colores:', codigoInterno);
                const updateProductoQuery = `UPDATE Producto SET codigoInterno = ? WHERE idProducto = ?`;
                await connection.promise().query(updateProductoQuery, [codigoInterno, producto]);
            }
            
            // Luego actualizar el producto principal reduciendo su stock
            const nuevaCantidadProductoPrincipal = Math.max(0, parseFloat(dataAnterior.cantidad) - cantidadTotalAsignada);
            
// Calcular la nueva cantidad alternativa restando lo asignado a los colores
let nuevaCantidadAlternativaPrincipal = null;
if (cantidadAlternativa) {
    nuevaCantidadAlternativaPrincipal = Math.max(0, parseFloat(cantidadAlternativa) - cantidadAlternativaTotalAsignada);
}

// Si queda stock, actualizar el producto principal con la nueva cantidad y cantidad alternativa
if (nuevaCantidadProductoPrincipal > 0) {
    const updateQuery = `
        UPDATE ContenedorProductos 
        SET cantidad = ?, cantidadAlternativa = ? 
        WHERE idContenedorProductos = ?;
    `;
    await connection.promise().query(updateQuery, [nuevaCantidadProductoPrincipal, nuevaCantidadAlternativaPrincipal, id]);
    cambiosTexto += `Producto principal: cantidad reducida de ${dataAnterior.cantidad} a ${nuevaCantidadProductoPrincipal}, cantidad alternativa de ${cantidadAlternativa} a ${nuevaCantidadAlternativaPrincipal}\n`;
} else {
    // Si no queda stock, eliminar el producto principal
    await connection.promise().query('DELETE FROM ContenedorProductos WHERE idContenedorProductos = ?', [id]);
    cambiosTexto += `Producto principal: eliminado (todo el stock fue asignado a colores)\n`;
}

const sqlInsert = `INSERT INTO ContenedorProductosHistorial (idContenedorProductos, contenedor, tipoCambio, cambios, usuarioCambio, motivo) VALUES (?, ?, ?, ?, ?, ?);`;
       
        await connection.promise().query(sqlInsert, [
            id, // idContenedorProductos (usamos el ID original)
            contenedor, // contenedor
            'INSERT', // tipoCambio
            cambiosTexto, // cambios (texto con el desglose de colores)
            usuarioCambio, // usuarioCambio
            motivo // motivo
        ]);
        if (cantidad === 0 && !color) {
            await connection.promise().query('DELETE FROM ContenedorProductos WHERE idContenedorProductos = ?', [id]);
        }
                
        }else if(cantidad !== 0){
            const query = `UPDATE ContenedorProductos cp
            JOIN Producto p ON cp.producto = p.idProducto
            SET 
            cp.producto = ?,
            cp.cantidad = ?,
            cp.unidad = ?,
            cp.color = ?,
            cp.precioPorUnidad = ?,
            cp.item_proveedor = ?,
            cp.cantidadAlternativa = ?,
            cp.unidadAlternativa = ?,
            p.codigoInterno = ?
            WHERE cp.idContenedorProductos = ?;
        `
            await connection.promise().query(query,[producto,cantidad,unidad,color,precioPorUnidad,item_proveedor,cantidadAlternativa,unidadAltValidada,codigoInterno,id],(err,results)=>{
                if(err){
                    console.error('Error ejecutando la consulta:', err);
                    return res.status(500).send('Error en el servidor.');
                }        
            })
            let actualizado = {idContenedorProductos:parseInt(id),
                idProducto:producto, 
                cantidad:cantidad,
                unidad:unidad,
                precioPorUnidad:precioPorUnidad,
                idColor:color,
                item_proveedor:item_proveedor,
                contenedor:contenedor,
                cantidadAlternativa:cantidadAlternativa,
                unidadAlternativa:unidadAltValidada,
                codigoInterno:codigoInterno}
            let cambios = generarTextoCambios(dataAnterior, actualizado);
            const sqlInsert = `INSERT INTO ContenedorProductosHistorial (idContenedorProductos, contenedor, tipoCambio, cambios, usuarioCambio, motivo) VALUES (?, ?, ?, ?, ?, ?);`; 
            await connection.promise().query(sqlInsert, [id, contenedor, 'UPDATE', cambios, usuarioCambio, motivo]);
        } 
        
        // Si se solicitó actualizar la unidad en todos los productos relacionados
        if (actualizarUnidadEnTodosLosProductos && dataAnterior && dataAnterior.unidad !== unidad) {
            try {
                // Obtener el ID del producto actual
                const productoId = producto;
                
                // Determinar la nueva unidad alternativa basada en la unidad principal
                let nuevaUnidadAlternativa = 'rollos';
                if (unidad === 'uni') {
                    nuevaUnidadAlternativa = 'cajas';
                }
                
                // Actualizar todos los productos relacionados en todos los contenedores
                const updateQuery = `
                    UPDATE ContenedorProductos 
                    SET unidad = ?, unidadAlternativa = ? 
                    WHERE producto = ? AND idContenedorProductos != ?
                `;
                
                const [updateResult] = await connection.promise().query(
                    updateQuery, 
                    [unidad, nuevaUnidadAlternativa, productoId, id]
                );
                
                console.log(`Se actualizaron ${updateResult.affectedRows} productos relacionados`);
                
                // Registrar este cambio masivo en el historial
                if (updateResult.affectedRows > 0) {
                    const cambioMasivo = `Cambio masivo de unidad: Se cambió la unidad de '${dataAnterior.unidad}' a '${unidad}' y la unidad alternativa de '${dataAnterior.unidadAlternativa || 'ninguna'}' a '${nuevaUnidadAlternativa}' en ${updateResult.affectedRows} productos relacionados.`;
                    
                    const sqlInsertHistorial = `
                        INSERT INTO ContenedorProductosHistorial 
                        (idContenedorProductos, contenedor, tipoCambio, cambios, usuarioCambio, motivo) 
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;
                    
                    await connection.promise().query(
                        sqlInsertHistorial, 
                        [id, contenedor, 'UPDATE', cambioMasivo, usuarioCambio, motivo + ' (Cambio masivo de unidad)']
                    );
                }
            } catch (error) {
                console.error('Error al actualizar productos relacionados:', error);
                // No fallamos la operación principal si esto falla
            }
        }
        
        res.status(200).send('Producto actualizado y registrado en el historial.');
            
    }catch(error){
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}
async function eliminarProductoDeContenedor(req,res){
    try{
        const id =req.params.id;
        const motivo = req.headers['x-motivo'];
        const usuarioCambio= req.headers['x-usuario'];
        const contenedor = req.headers['x-contenedor'];
        const connection = pool;
        if(!motivo){
            return res.status(400).send('Falta el encabezado X-Motivo.');
        }
        const [results] = await connection.promise().query('SELECT * FROM contenedorProductos WHERE idContenedorProductos = ?',[id]);

        await connection.promise().query('DELETE FROM contenedorProductos WHERE idContenedorProductos = ? ',[id],(err,results)=>{
            if(err){
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error en el servidor.');
            }
        })
        const cambios = JSON.stringify(results[0]);

        const sqlInsert = `INSERT INTO ContenedorProductosHistorial (idContenedorProductos, contenedor, tipoCambio, cambios, usuarioCambio, motivo) VALUES (?, ?, ?, ?, ?, ?);`;
        
        await connection.promise().query(sqlInsert, [id, contenedor, 'DELETE', cambios, usuarioCambio, motivo]);
        console.log('MOTIVO :', motivo)
        res.status(200).send('Producto eliminado y registrado en el historial.');
    }catch(error){
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}


function generarTextoCambios(original, actualizado) {
    const cambios = {};

    // Recorremos las claves del objeto actualizado
    for (const clave in actualizado) {
        if (actualizado.hasOwnProperty(clave)) {
            // Si el valor es diferente, lo agregamos al objeto de cambios
            if (actualizado[clave] !== original[clave]) {
                cambios[clave] = `${original[clave]} -> ${actualizado[clave]}`;
            }
        }
    }

    // Si no hay cambios, retornamos un mensaje indicando que no hay cambios
    if (Object.keys(cambios).length === 0) {
        return "No hay cambios";
    }

    // Convertimos el objeto de cambios a un texto en el formato deseado
    let textoCambios = "cambios:\n";
    for (const clave in cambios) {
        textoCambios += `    ${clave}: ${cambios[clave]},\n`;
    }

    // Eliminamos la última coma y el salto de línea
    textoCambios = textoCambios.slice(0, -2);
    console.log(textoCambios);
    return textoCambios;
}
/**
 * Cambia el estado de un producto y maneja la lógica de transferencia entre contenedores
 */
async function cambiarEstadoProducto(req, res) {
    try {
        const id = req.params.id;
        const { estado, contenedorDestino, cantidadEntregada, cantidadTransferir, motivo, usuarioCambio } = req.body;
        
        if (!estado || !motivo || !usuarioCambio) {
            return res.status(400).send('Faltan campos obligatorios: estado, motivo o usuario.');
        }
        
        const connection = pool;
        
        // Primero obtenemos los datos actuales del producto
        const [productoActual] = await connection.promise().query(
            'SELECT cp.*, p.nombre, p.idProducto FROM ContenedorProductos cp JOIN Producto p ON cp.producto = p.idProducto WHERE idContenedorProductos = ?', 
            [id]
        );
        
        if (productoActual.length === 0) {
            return res.status(404).send('Producto no encontrado.');
        }
        
        const productoOriginal = productoActual[0];
        const contenedorOriginal = productoOriginal.contenedor;
        let cambios = {};
        
        // Lógica según el estado seleccionado
        if (estado === 'En stock') {
            // Validamos que se seleccionó un contenedor destino (Mitre o Lichy)
            if (!contenedorDestino) {
                return res.status(400).send('Para marcar como "En stock" debe seleccionar un contenedor destino (Mitre o Lichy)');
            }
            
            // Validamos la cantidad a transferir
            if (!cantidadTransferir || cantidadTransferir <= 0) {
                return res.status(400).send('Debe especificar una cantidad válida para transferir');
            }
            
            if (cantidadTransferir > productoOriginal.cantidad) {
                return res.status(400).send('La cantidad a transferir no puede ser mayor que la cantidad disponible');
            }
            
            // Calculamos la cantidad que queda en el contenedor original
            const nuevaCantidadOriginal = productoOriginal.cantidad - cantidadTransferir;
            
            // Calculamos la cantidad alternativa proporcional (si corresponde)
            let cantidadAlternativaProporcional = null;
            if (productoOriginal.cantidadAlternativa) {
                const proporcion = cantidadTransferir / productoOriginal.cantidad;
                cantidadAlternativaProporcional = Math.round((productoOriginal.cantidadAlternativa * proporcion) * 100) / 100;
            }
            
            // Paso 1: Verificar si ya existe el mismo producto en el contenedor destino
            const [productoExistenteEnDestino] = await connection.promise().query(
                `SELECT * FROM ContenedorProductos 
                WHERE contenedor = ? AND producto = ? AND color = ? AND unidad = ?`, 
                [contenedorDestino, productoOriginal.producto, productoOriginal.color, productoOriginal.unidad]
            );
            
            // Paso 2a: Si el producto ya existe en el destino, aumentamos su cantidad
            if (productoExistenteEnDestino.length > 0) {
                const productoDestino = productoExistenteEnDestino[0];
                const nuevaCantidadDestino = productoDestino.cantidad + cantidadTransferir;
                let nuevaCantidadAlternativaDestino = productoDestino.cantidadAlternativa || 0;
                
                if (cantidadAlternativaProporcional) {
                    nuevaCantidadAlternativaDestino += cantidadAlternativaProporcional;
                }
                
                await connection.promise().query(
                    'UPDATE ContenedorProductos SET cantidad = ?, cantidadAlternativa = ? WHERE idContenedorProductos = ?',
                    [nuevaCantidadDestino, nuevaCantidadAlternativaDestino, productoDestino.idContenedorProductos]
                );
                
                cambios.contenedorDestinoAccion = `Actualizado producto existente en ${contenedorDestino} (ID: ${productoDestino.idContenedorProductos})`;
            } 
            // Paso 2b: Si no existe, creamos un nuevo registro en el contenedor destino
            else {
                const [nuevoProductoDestino] = await connection.promise().query(
                    `INSERT INTO ContenedorProductos 
                    (contenedor, producto, cantidad, unidad, color, precioPorUnidad, estado, 
                    cantidadAlternativa, unidadAlternativa) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [contenedorDestino, productoOriginal.producto, cantidadTransferir, 
                    productoOriginal.unidad, productoOriginal.color, productoOriginal.precioPorUnidad, 
                    'En stock', cantidadAlternativaProporcional, productoOriginal.unidadAlternativa]
                );
                
                cambios.contenedorDestinoAccion = `Creado nuevo producto en ${contenedorDestino} (ID: ${nuevoProductoDestino.insertId})`;
            }
            
            // Paso 3: Actualizar la cantidad en el contenedor original
            if (nuevaCantidadOriginal > 0) {
                // Actualizamos la cantidad en el contenedor original
                await connection.promise().query(
                    'UPDATE ContenedorProductos SET cantidad = ?, cantidadAlternativa = ? WHERE idContenedorProductos = ?',
                    [nuevaCantidadOriginal, 
                    productoOriginal.cantidadAlternativa ? (productoOriginal.cantidadAlternativa - cantidadAlternativaProporcional) : null, 
                    id]
                );
                
                cambios.cantidadRestante = `${productoOriginal.cantidad} -> ${nuevaCantidadOriginal}`;
            } else {
                // Si se transfiere todo, eliminamos el registro del contenedor original
                await connection.promise().query(
                    'DELETE FROM ContenedorProductos WHERE idContenedorProductos = ?',
                    [id]
                );
                
                cambios.cantidadRestante = `${productoOriginal.cantidad} -> 0 (registro eliminado)`;
            }
            
            cambios.cantidadTransferida = cantidadTransferir;
            cambios.contenedorDestino = contenedorDestino;
            
        } else if (estado === 'Entregado') {
            // Validamos que se especificó la cantidad entregada
            if (!cantidadEntregada || cantidadEntregada <= 0) {
                return res.status(400).send('Para marcar como "Entregado" debe especificar la cantidad entregada');
            }
            
            // Verificamos que la cantidad entregada no exceda la cantidad disponible
            if (cantidadEntregada > productoOriginal.cantidad) {
                return res.status(400).send('La cantidad entregada no puede exceder la cantidad disponible');
            }
            
            // Calculamos la nueva cantidad
            const nuevaCantidad = productoOriginal.cantidad - cantidadEntregada;
            
            // Si se entregó todo, cambiamos el estado a "Entregado"
            if (nuevaCantidad === 0) {
                await connection.promise().query(
                    'UPDATE ContenedorProductos SET cantidad = ?, estado = ? WHERE idContenedorProductos = ?',
                    [0, 'Entregado', id]
                );
                
                cambios = {
                    cantidad: `${productoOriginal.cantidad} -> 0`,
                    estado: `${productoOriginal.estado || 'Sin estado'} -> Entregado`
                };
            } else {
                // Si queda cantidad, actualizamos solo la cantidad
                await connection.promise().query(
                    'UPDATE ContenedorProductos SET cantidad = ? WHERE idContenedorProductos = ?',
                    [nuevaCantidad, id]
                );
                
                cambios = {
                    cantidad: `${productoOriginal.cantidad} -> ${nuevaCantidad}`
                };
            }
        } else {
            return res.status(400).send('Estado no válido. Use "En stock" o "Entregado"');
        }
        
        // Registrar el cambio en el historial
        const cambiosTexto = JSON.stringify(cambios);
        await connection.promise().query(
            'INSERT INTO ContenedorProductosHistorial (idContenedorProductos, contenedor, tipoCambio, cambios, usuarioCambio, motivo) VALUES (?, ?, ?, ?, ?, ?)',
            [id, contenedorOriginal, 'UPDATE_ESTADO', cambiosTexto, usuarioCambio, motivo]
        );
        
        // Obtener los datos actualizados del producto
        const [productoActualizado] = await connection.promise().query(
            `SELECT cp.*, p.nombre, c.nombre AS color, 
            (SELECT con.comentario FROM Contenedor con WHERE con.idContenedor = cp.contenedorDestino) AS nombreContenedorDestino
            FROM ContenedorProductos cp 
            JOIN Producto p ON cp.producto = p.idProducto 
            LEFT JOIN color c ON cp.color = c.idColor
            WHERE cp.idContenedorProductos = ?`,
            [id]
        );
        
        res.json(productoActualizado[0]);
        
    } catch (error) {
        console.error('Error cambiando estado del producto:', error);
        res.status(500).send('Error en el servidor.');
    }
}

/**
 * Obtiene los contenedores predeterminados (Mitre y Lichy)
 */
async function obtenerContenedoresPredeterminados(req, res) {
    try {
        const connection = pool;
        
        const [contenedores] = await connection.promise().query(
            'SELECT * FROM Contenedor WHERE categoria = ?',
            ['Predeterminado']
        );
        
        res.json(contenedores);
        
    } catch (error) {
        console.error('Error obteniendo contenedores predeterminados:', error);
        res.status(500).send('Error en el servidor.');
    }
}

module.exports = router;