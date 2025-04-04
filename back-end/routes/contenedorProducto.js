const express = require('express');
const router = express.Router();
const pool = require('../db/dbconfig');

router.get('/producto/:id',obtenerProductoContenedor);
router.get('/:id',obtenerProductosDeContenedor);
router.put('/:id',editarProductoDeContenedor);
router.delete('/:id',eliminarProductoDeContenedor);
router.post('/', agregarProductoDeContenedor);

async function obtenerProductoContenedor(req,res){
    try{
        const id = req.params.id;
        const query = `
        SELECT  idContenedorProductos,p.nombre,p.idProducto, cp.cantidad, cp.unidad,cp.precioPorUnidad, c.nombre AS color,cp.contenedor, c.idColor, cp.item_proveedor FROM ContenedorProductos  cp JOIN Producto p ON cp.producto = p.idProducto 
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
        SELECT  idContenedorProductos,p.nombre,p.idProducto, cp.cantidad, cp.unidad,cp.precioPorUnidad, c.nombre AS color,cp.contenedor, c.idColor FROM ContenedorProductos  cp JOIN Producto p ON cp.producto = p.idProducto 
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
        const {contenedor, producto,cantidad,unidad,color,precioPorUnidad} = req.body;
        const connection = pool;
        connection.query('INSERT INTO ContenedorProductos(contenedor,producto,cantidad,unidad,color,precioPorUnidad) VALUES(?,?,?,?,?,?);',[contenedor,producto,cantidad,unidad,color,precioPorUnidad],(err,results)=>{
            if(err){
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error en el servidor.');
            }
            const query = `
                SELECT  idContenedorProductos,p.nombre,p.idProducto, cp.cantidad, cp.unidad,cp.precioPorUnidad, c.nombre AS color, c.idColor FROM ContenedorProductos  cp JOIN Producto p ON cp.producto = p.idProducto 
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
        const {producto,cantidad,unidad,color,contenedor,precioPorUnidad,coloresAsignados,item_proveedor,motivo, dataAnterior,usuarioCambio} = req.body;
        console.log(req.body);
        console.log(coloresAsignados);
        if (coloresAsignados && coloresAsignados.length > 0) {
            let cambiosTexto = `Cambios: desglose de colores al producto: (${dataAnterior.nombre})\n`;
            for (const colorAsignado of coloresAsignados) {
                const insertQuery = ` 
                    INSERT INTO ContenedorProductos (contenedor, producto, cantidad, unidad, color, precioPorUnidad)
                    VALUES (?, ?, ?, ?, ?, ?);
                `;
                await connection.promise().query(insertQuery, [
                    contenedor, // contenedor (usamos el mismo contenedor)
                    producto, // producto (el mismo producto)
                    colorAsignado.cantidad, // cantidad asignada al color
                    unidad, // unidad (la misma unidad)
                    parseInt(colorAsignado.color), // color asignado
                    precioPorUnidad, // precio por unidad (el mismo)
                ]);
                cambiosTexto += `(${colorAsignado.color}) -> cantidad: ${colorAsignado.cantidad}\n`;
            }
            
            const sqlInsert = `
            INSERT INTO ContenedorProductosHistorial (idContenedorProductos, contenedor, tipoCambio, cambios, usuarioCambio, motivo)
            VALUES (?, ?, ?, ?, ?, ?);
        `;
       
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
            const query = `UPDATE ContenedorProductos SET
            producto = ?,
            cantidad = ?,
            unidad = ?,
            color=?,
            precioPorUnidad=?,
            item_proveedor = ?
            WHERE idContenedorProductos = ?;
        `
            await connection.promise().query(query,[producto,cantidad,unidad,color,precioPorUnidad,item_proveedor,id],(err,results)=>{
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
                contenedor:contenedor}
            let cambios = generarTextoCambios(dataAnterior, actualizado);
            const sqlInsert = `INSERT INTO ContenedorProductosHistorial (idContenedorProductos, contenedor, tipoCambio, cambios, usuarioCambio, motivo) VALUES (?, ?, ?, ?, ?, ?);`; 
            await connection.promise().query(sqlInsert, [id, contenedor, 'UPDATE', cambios, usuarioCambio, motivo]);
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
module.exports = router;