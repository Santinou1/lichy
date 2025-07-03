const express = require('express');
const router = express.Router();
const pool = require('../db/dbconfig');

router.get('/producto/:id',obtenerProductoContenedor);
router.get('/contenedor/:id',obtenerProductosDeContenedor);
router.get('/:id',obtenerProductosDeContenedor);
router.put('/:id',editarProductoDeContenedor);
router.delete('/:id',eliminarProductoDeContenedor);
router.post('/', agregarProductoDeContenedor);
router.put('/estado/:id', cambiarEstadoProducto);
router.post('/cambio-estado-masivo', cambioEstadoMasivo);
router.get('/predeterminados', obtenerContenedoresPredeterminados);
router.put('/codigo-interno/:id', async (req, res) => {
    const connection = pool;
    try {
        const idContenedorProducto = req.params.id;
        const { codigoInterno } = req.body;
        if (!codigoInterno) {
            return res.status(400).json({ error: 'Falta el código interno' });
        }
        // Obtener el idProducto asociado a este contenedorProducto
        const [rows] = await connection.promise().query('SELECT producto FROM contenedorproducto WHERE idcontenedorproducto = ?', [idContenedorProducto]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'No se encontró el producto asociado' });
        }
        const idProducto = rows[0].producto;
        // Actualizar el código interno en la tabla Producto
        await connection.promise().query('UPDATE producto SET codigointerno = ? WHERE idproducto = ?', [codigoInterno, idProducto]);
        return res.json({ success: true, idProducto, codigoInterno });
    } catch (error) {
        console.error('Error actualizando código interno:', error);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
});

async function obtenerProductoContenedor(req,res){
    try{
        const id = req.params.id;
        const query = `
        SELECT  idcontenedorproducto, p.nombre, p.idproducto, p.codigointerno, cp.cantidad, cp.unidad, cp.precioporunidad, c.nombre AS color, cp.contenedor, c.idcolor, cp.itemproveedor, cp.cantidadalternativa, cp.unidadalternativa, cp.tipobulto, cp.estado, cp.contenedordestino,
        (SELECT con.comentario FROM contenedor con WHERE con.idcontenedor = cp.contenedordestino) AS nombreContenedorDestino
        FROM contenedorproducto cp 
        JOIN producto p ON cp.producto = p.idproducto 
        LEFT JOIN color c ON cp.color = c.idcolor
        WHERE idcontenedorproducto = ?; 
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
        SELECT  idcontenedorproducto, p.nombre, p.idproducto, p.codigointerno, cp.cantidad, cp.unidad, cp.precioporunidad, c.nombre AS color, cp.contenedor, c.idcolor, cp.cantidadalternativa, cp.unidadalternativa, cp.estado, cp.contenedordestino,
        (SELECT con.comentario FROM contenedor con WHERE con.idcontenedor = cp.contenedordestino) AS nombreContenedorDestino
        FROM contenedorproducto cp 
        JOIN producto p ON cp.producto = p.idproducto 
        LEFT JOIN color c ON cp.color = c.idcolor
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
        const {contenedor, producto, cantidad, unidad, color, precioporunidad, cantidadalternativa, unidadalternativa, estado, contenedorDestino} = req.body;
        
        // Validar que la unidad alternativa sea correcta según la unidad principal
        let unidadAltValidada = unidadalternativa;
        if (unidad === 'm' || unidad === 'kg') {
            unidadAltValidada = 'rollos';
        } else if (unidad === 'uni') {
            unidadAltValidada = 'cajas';
        }
        
        const connection = pool;
        connection.query('INSERT INTO contenedorproducto(contenedor,producto,cantidad,unidad,color,precioporunidad,cantidadalternativa,unidadalternativa,estado,contenedordestino) VALUES(?,?,?,?,?,?,?,?,?,?);',
        [contenedor, producto, cantidad, unidad, color, precioporunidad, cantidadalternativa, unidadAltValidada, estado || 'En stock', contenedorDestino || null],(err,results)=>{
            if(err){
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error en el servidor.');
            }
            const query = `
                SELECT  idcontenedorproducto, p.nombre, p.idproducto, p.codigointerno, cp.cantidad, cp.unidad, cp.precioporunidad, c.nombre AS color, c.idcolor, cp.cantidadalternativa, cp.unidadalternativa, cp.estado, cp.contenedordestino,
                (SELECT con.comentario FROM contenedor con WHERE con.idcontenedor = cp.contenedordestino) AS nombreContenedorDestino
                FROM contenedorproducto cp 
                JOIN producto p ON cp.producto = p.idproducto 
                LEFT JOIN color c ON cp.color = c.idcolor
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
        const {producto,cantidad,unidad,color,contenedor,precioporunidad,coloresAsignados,item_proveedor,motivo,dataAnterior,usuarioCambio,cantidadalternativa,unidadalternativa,actualizarUnidadEnTodosLosProductos,codigoInterno} = req.body;
        // Validación: no permitir desglose si el producto ya tiene color
        const [productoPrincipalRows] = await connection.promise().query('SELECT color FROM contenedorproducto WHERE idcontenedorproducto = ?', [id]);
        if (productoPrincipalRows.length > 0 && productoPrincipalRows[0].color !== null && coloresAsignados && coloresAsignados.length > 0) {
            return res.status(400).json({ error: 'No se puede disponer color sobre un producto que ya tiene color asignado.' });
        }
        
        // Validar que la unidad alternativa sea correcta según la unidad principal
        let unidadAltValidada = unidadalternativa;
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
            
            // 1. Actualizar la tabla contenedorproducto
            const query = `UPDATE contenedorproducto cp
            SET 
            cp.producto = ?,
            cp.cantidad = ?,
            cp.unidad = ?,
            cp.color = ?,
            cp.precioporunidad = ?,
            cp.itemproveedor = ?,
            cp.cantidadalternativa = ?,
            cp.unidadalternativa = ?
            WHERE cp.idcontenedorproducto = ?;
            `
            await connection.promise().query(query,[producto,cantidad,unidad,colorValue,precioporunidad,item_proveedor,cantidadalternativa,unidadAltValidada,id]);
            
            // 2. Si se proporcionó un código interno, actualizar la tabla Producto
            if (codigoInterno !== undefined) {
                console.log('Actualizando código interno del producto:', codigoInterno);
                const updateProductoQuery = `UPDATE producto SET codigointerno = ? WHERE idproducto = ?`;
                await connection.promise().query(updateProductoQuery, [codigoInterno, producto]);
            }
            
            let actualizado = {idcontenedorproducto:parseInt(id),
                idproducto:producto, 
                cantidad:cantidad,
                unidad:unidad,
                color:color,
                precioporunidad:precioporunidad,
                itemproveedor:item_proveedor,
                cantidadalternativa:cantidadalternativa,
                unidadalternativa:unidadAltValidada
            };
            
            // Registrar el cambio en el historial
            const cambiosTexto = generarTextoCambios(dataAnterior, actualizado);
            
            const sqlInsert = `
                INSERT INTO contenedorproductohistorial (idcontenedorproducto, contenedor, tipocambio, cambios, usuariocambio, motivo)
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
            const [results] = await connection.promise().query('SELECT * FROM contenedorproducto cp JOIN producto p ON cp.producto = p.idproducto WHERE cp.contenedor = ?', [contenedor]);
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
                    INSERT INTO contenedorproducto (contenedor, producto, cantidad, unidad, color, precioporunidad, cantidadalternativa, unidadalternativa)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                `;
                // Validar que la unidad alternativa sea correcta según la unidad principal para cada color
                let unidadAltColorValidada = unidadAltValidada;
                
                // Usar la cantidad alternativa directamente proporcionada para este color
                let cantidadAltProporcional = colorAsignado.cantidadalternativa || null;
                
                await connection.promise().query(insertQuery, [
                    contenedor, // contenedor (usamos el mismo contenedor)
                    producto, // producto (el mismo producto)
                    colorAsignado.cantidad, // cantidad asignada al color
                    unidad, // unidad (la misma unidad)
                    parseInt(colorAsignado.color), // color asignado
                    precioporunidad, // precio por unidad (el mismo)
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
                const updateProductoQuery = `UPDATE producto SET codigointerno = ? WHERE idproducto = ?`;
                await connection.promise().query(updateProductoQuery, [codigoInterno, producto]);
            }
            
            // Luego actualizar el producto principal reduciendo su stock
            const nuevaCantidadProductoPrincipal = Math.max(0, parseFloat(dataAnterior.cantidad) - cantidadTotalAsignada);
            
// Calcular la nueva cantidad alternativa restando lo asignado a los colores
let nuevaCantidadAlternativaPrincipal = null;
if (cantidadalternativa) {
    nuevaCantidadAlternativaPrincipal = Math.max(0, parseFloat(cantidadalternativa) - cantidadAlternativaTotalAsignada);
}

// Si queda stock, actualizar el producto principal con la nueva cantidad y cantidad alternativa
if (nuevaCantidadProductoPrincipal > 0) {
    const updateQuery = `
        UPDATE contenedorproducto 
        SET cantidad = ?, cantidadalternativa = ? 
        WHERE idcontenedorproducto = ?;
    `;
    await connection.promise().query(updateQuery, [nuevaCantidadProductoPrincipal, nuevaCantidadAlternativaPrincipal, id]);
    cambiosTexto += `Producto principal: cantidad reducida de ${dataAnterior.cantidad} a ${nuevaCantidadProductoPrincipal}, cantidad alternativa de ${cantidadalternativa} a ${nuevaCantidadAlternativaPrincipal}\n`;
} else {
    // Si no queda stock, eliminar el producto principal
    await connection.promise().query('DELETE FROM contenedorproducto WHERE idcontenedorproducto = ?', [id]);
    cambiosTexto += `Producto principal: eliminado (todo el stock fue asignado a colores)\n`;
}

const sqlInsert = `INSERT INTO contenedorproductohistorial (idcontenedorproducto, contenedor, tipocambio, cambios, usuariocambio, motivo) VALUES (?, ?, ?, ?, ?, ?);`;
       
        await connection.promise().query(sqlInsert, [
            id, // idcontenedorproducto (usamos el ID original)
            contenedor, // contenedor
            'INSERT', // tipocambio
            cambiosTexto, // cambios (texto con el desglose de colores)
            usuarioCambio, // usuariocambio
            motivo // motivo
        ]);
        if (cantidad === 0 && !color) {
            await connection.promise().query('DELETE FROM contenedorproducto WHERE idcontenedorproducto = ?', [id]);
        }
                
        }else if(cantidad !== 0){
            const query = `UPDATE contenedorproducto cp
            JOIN producto p ON cp.producto = p.idproducto
            SET 
            cp.producto = ?,
            cp.cantidad = ?,
            cp.unidad = ?,
            cp.color = ?,
            cp.precioporunidad = ?,
            cp.itemproveedor = ?,
            cp.cantidadalternativa = ?,
            cp.unidadalternativa = ?,
            p.codigointerno = ?
            WHERE cp.idcontenedorproducto = ?;
        `
            await connection.promise().query(query,[producto,cantidad,unidad,color,precioporunidad,item_proveedor,cantidadalternativa,unidadAltValidada,codigoInterno,id],(err,results)=>{
                if(err){
                    console.error('Error ejecutando la consulta:', err);
                    return res.status(500).send('Error en el servidor.');
                }        
            })
            let actualizado = {idcontenedorproducto:parseInt(id),
                idproducto:producto, 
                cantidad:cantidad,
                unidad:unidad,
                precioporunidad:precioporunidad,
                idcolor:color,
                itemproveedor:item_proveedor,
                contenedor:contenedor,
                cantidadalternativa:cantidadalternativa,
                unidadalternativa:unidadAltValidada,
                codigointerno:codigoInterno}
            let cambios = generarTextoCambios(dataAnterior, actualizado);
            const sqlInsert = `INSERT INTO contenedorproductohistorial (idcontenedorproducto, contenedor, tipocambio, cambios, usuariocambio, motivo) VALUES (?, ?, ?, ?, ?, ?);`; 
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
                    UPDATE contenedorproducto 
                    SET unidad = ?, unidadalternativa = ? 
                    WHERE producto = ? AND idcontenedorproducto != ?
                `;
                
                const [updateResult] = await connection.promise().query(
                    updateQuery, 
                    [unidad, nuevaUnidadAlternativa, productoId, id]
                );
                
                console.log(`Se actualizaron ${updateResult.affectedRows} productos relacionados`);
                
                // Registrar este cambio masivo en el historial
                if (updateResult.affectedRows > 0) {
                    const cambioMasivo = `Cambio masivo de unidad: Se cambió la unidad de '${dataAnterior.unidad}' a '${unidad}' y la unidad alternativa de '${dataAnterior.unidadalternativa || 'ninguna'}' a '${nuevaUnidadAlternativa}' en ${updateResult.affectedRows} productos relacionados.`;
                    
                    const sqlInsertHistorial = `
                        INSERT INTO contenedorproductohistorial 
                        (idcontenedorproducto, contenedor, tipocambio, cambios, usuariocambio, motivo) 
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
        
        console.log('Eliminando producto:', { id, motivo, usuarioCambio, contenedor });
        
        if(!motivo){
            return res.status(400).send('Falta el encabezado X-Motivo.');
        }
        
        if(!id){
            return res.status(400).send('Falta el ID del producto a eliminar.');
        }
        
        // Asegurarnos de usar el nombre de tabla consistente: contenedorproducto (C mayúscula)
        const [results] = await connection.promise().query('SELECT * FROM contenedorproducto WHERE idcontenedorproducto = ?',[id]);
        
        if (results.length === 0) {
            return res.status(404).send(`No se encontró el producto con ID ${id}`);
        }
        
        console.log('Producto encontrado:', results[0]);
        
        // Eliminar el producto usando el nombre de tabla correcto
        await connection.promise().query('DELETE FROM contenedorproducto WHERE idcontenedorproducto = ?',[id])
        
        const cambios = JSON.stringify(results[0]);
        
        const sqlInsert = `INSERT INTO contenedorproductohistorial (idcontenedorproducto, contenedor, tipocambio, cambios, usuariocambio, motivo) VALUES (?, ?, ?, ?, ?, ?);`;
        
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
            'SELECT cp.*, p.nombre, p.idproducto FROM contenedorproducto cp JOIN producto p ON cp.producto = p.idproducto WHERE idcontenedorproducto = ?', 
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
            if (productoOriginal.cantidadalternativa) {
                const proporcion = cantidadTransferir / productoOriginal.cantidad;
                cantidadAlternativaProporcional = Math.round((productoOriginal.cantidadalternativa * proporcion) * 100) / 100;
            }
            
            // Paso 1: Verificar si ya existe el mismo producto en el contenedor destino
            const [productoExistenteEnDestino] = await connection.promise().query(
                `SELECT * FROM contenedorproducto 
                WHERE contenedor = ? AND producto = ? AND color = ? AND unidad = ?`, 
                [contenedorDestino, productoOriginal.producto, productoOriginal.color, productoOriginal.unidad]
            );
            
            // Paso 2a: Si el producto ya existe en el destino, aumentamos su cantidad
            if (productoExistenteEnDestino.length > 0) {
                const productoDestino = productoExistenteEnDestino[0];
                const nuevaCantidadDestino = productoDestino.cantidad + cantidadTransferir;
                let nuevaCantidadAlternativaDestino = productoDestino.cantidadalternativa || 0;
                
                if (cantidadAlternativaProporcional) {
                    nuevaCantidadAlternativaDestino += cantidadAlternativaProporcional;
                }
                
                await connection.promise().query(
                    'UPDATE contenedorproducto SET cantidad = ?, cantidadalternativa = ? WHERE idcontenedorproducto = ?',
                    [nuevaCantidadDestino, nuevaCantidadAlternativaDestino, productoDestino.idcontenedorproducto]
                );
                
                cambios.contenedordestinoAccion = `Actualizado producto existente en ${contenedorDestino} (ID: ${productoDestino.idcontenedorproducto})`;
            } 
            // Paso 2b: Si no existe, creamos un nuevo registro en el contenedor destino
            else {
                const [nuevoProductoDestino] = await connection.promise().query(
                    `INSERT INTO contenedorproducto 
                    (contenedor, producto, cantidad, unidad, color, precioporunidad, estado, 
                    cantidadalternativa, unidadalternativa) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [contenedorDestino, productoOriginal.producto, cantidadTransferir, 
                    productoOriginal.unidad, productoOriginal.color, productoOriginal.precioporunidad, 
                    'En stock', cantidadAlternativaProporcional, productoOriginal.unidadalternativa]
                );
                
                cambios.contenedordestinoAccion = `Creado nuevo producto en ${contenedorDestino} (ID: ${nuevoProductoDestino.insertId})`;
            }
            
            // Paso 3: Actualizar la cantidad en el contenedor original
            if (nuevaCantidadOriginal > 0) {
                // Actualizamos la cantidad en el contenedor original
                await connection.promise().query(
                    'UPDATE contenedorproducto SET cantidad = ?, cantidadalternativa = ? WHERE idcontenedorproducto = ?',
                    [nuevaCantidadOriginal, 
                    productoOriginal.cantidadalternativa ? (productoOriginal.cantidadalternativa - cantidadAlternativaProporcional) : null, 
                    id]
                );
                
                cambios.cantidadRestante = `${productoOriginal.cantidad} -> ${nuevaCantidadOriginal}`;
            } else {
                // Si se transfiere todo, eliminamos el registro del contenedor original
                await connection.promise().query(
                    'DELETE FROM contenedorproducto WHERE idcontenedorproducto = ?',
                    [id]
                );
                
                cambios.cantidadRestante = `${productoOriginal.cantidad} -> 0 (registro eliminado)`;
            }
            
            cambios.cantidadTransferida = cantidadTransferir;
            cambios.contenedordestino = contenedorDestino;
            
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
                    'UPDATE contenedorproducto SET cantidad = ?, estado = ? WHERE idcontenedorproducto = ?',
                    [0, 'Entregado', id]
                );
                
                cambios = {
                    cantidad: `${productoOriginal.cantidad} -> 0`,
                    estado: `${productoOriginal.estado || 'Sin estado'} -> Entregado`
                };
            } else {
                // Si queda cantidad, actualizamos solo la cantidad
                await connection.promise().query(
                    'UPDATE contenedorproducto SET cantidad = ? WHERE idcontenedorproducto = ?',
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
            'INSERT INTO contenedorproductohistorial (idcontenedorproducto, contenedor, tipocambio, cambios, usuariocambio, motivo) VALUES (?, ?, ?, ?, ?, ?)',
            [id, contenedorOriginal, 'UPDATE_ESTADO', cambiosTexto, usuarioCambio, motivo]
        );
        
        // Obtener los datos actualizados del producto
        const [productoActualizado] = await connection.promise().query(
            `SELECT cp.*, p.nombre, c.nombre AS color, 
            (SELECT con.comentario FROM contenedor con WHERE con.idcontenedor = cp.contenedordestino) AS nombreContenedorDestino
            FROM contenedorproducto cp 
            JOIN producto p ON cp.producto = p.idproducto 
            LEFT JOIN color c ON cp.color = c.idcolor
            WHERE cp.idcontenedorproducto = ?`,
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
            'SELECT * FROM contenedor WHERE categoria = ?',
            ['Predeterminado']
        );
        
        res.json(contenedores);
        
    } catch (error) {
        console.error('Error obteniendo contenedores predeterminados:', error);
        res.status(500).send('Error en el servidor.');
    }
}

/**
 * Cambia el estado de múltiples productos en un contenedor a la vez
 */
async function cambioEstadoMasivo(req, res) {
    const connection = await pool.promise().getConnection();
    
    try {
        // Obtener los datos del request
        const { contenedor, destino, comentario, productos } = req.body;
        
        // Validar que hay productos para procesar
        if (!productos || !Array.isArray(productos) || productos.length === 0) {
            return res.status(400).send('Debe proporcionar productos para cambiar de estado');
        }
        
        // Validar que se ha proporcionado un comentario
        if (!comentario || comentario.trim() === '') {
            return res.status(400).send('Debe proporcionar un comentario para el cambio de estado');
        }
        
        // Iniciar la transacción
        await connection.beginTransaction();
        
        // Resultados para devolver
        const resultados = [];
        
        // Procesar cada producto
        for (const producto of productos) {
            const { idcontenedorproducto, cantidadAMover, cantidadOriginal, unidad, cantidadalternativa, unidadalternativa, precioporunidad, producto: productoId, color, nombreProducto } = producto;
            
            // Validar que la cantidad a mover no exceda la cantidad disponible
            if (cantidadAMover > cantidadOriginal) {
                await connection.rollback();
                return res.status(400).send(`La cantidad a mover (${cantidadAMover}) no puede exceder la cantidad disponible (${cantidadOriginal}) para el producto ${nombreProducto}`);
            }
            
            // 1. Actualizar la cantidad del producto original
            const cantidadRestante = cantidadOriginal - cantidadAMover;
            
            // Si se moverá todo el producto, cambiamos su estado
            if (cantidadRestante === 0) {
                await connection.query(
                    'UPDATE contenedorproducto SET cantidad = 0, estado = ? WHERE idcontenedorproducto = ?',
                    [destino, idcontenedorproducto]
                );
            } else {
                // Si queda cantidad, solo actualizamos la cantidad
                await connection.query(
                    'UPDATE contenedorproducto SET cantidad = ? WHERE idcontenedorproducto = ?',
                    [cantidadRestante, idcontenedorproducto]
                );
                
                // 2. Crear un nuevo registro para la cantidad que cambió de estado
                await connection.query(
                    `INSERT INTO contenedorproducto 
                     (contenedor, producto, cantidad, unidad, color, precioporunidad, cantidadalternativa, unidadalternativa, estado) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [contenedor, productoId, cantidadAMover, unidad, color, precioporunidad, cantidadalternativa, unidadalternativa, destino]
                );
            }
            
            // 3. Registrar el cambio en el historial
            const cambios = {
                cantidadOriginal,
                cantidadMovida: cantidadAMover,
                cantidadRestante,
                estadoDestino: destino
            };
            
            await connection.query(
                'INSERT INTO contenedorproductohistorial (idcontenedorproducto, contenedor, tipocambio, cambios, usuariocambio, motivo) VALUES (?, ?, ?, ?, ?, ?)',
                [idcontenedorproducto, contenedor, 'CAMBIO_ESTADO_MASIVO', JSON.stringify(cambios), 'sistema', comentario]
            );
            
            resultados.push({
                idcontenedorproducto,
                nombreProducto,
                cantidadMovida: cantidadAMover,
                cantidadRestante,
                estadoDestino: destino
            });
        }
        
        // Confirmar la transacción
        await connection.commit();
        
        // Devolver los resultados
        res.json({
            mensaje: 'Cambio de estado masivo realizado con éxito',
            resultados
        });
        
    } catch (error) {
        // Revertir la transacción en caso de error
        await connection.rollback();
        console.error('Error en cambio de estado masivo:', error);
        res.status(500).send('Error en el servidor.');
    } finally {
        // Liberar la conexión
        connection.release();
    }
}

module.exports = router;