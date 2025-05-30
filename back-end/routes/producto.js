const express = require('express');
const router = express.Router();
const pool = require('../db/dbconfig');

router.delete('/:id',eliminarProducto);
router.get('/sin-contenedor',obtenerProductosSinContenedor);
router.get('/con-contenedor',obtenerProductosConContenedor);
router.get('/cantidad-por-color/:id',obtenerCantidadPorColor);
router.get('/cantidad-por-contenedor/:id', obtenerCantidadPorContenedor);
router.get('/cantidad-total/:id',obtenerCantidadTotal);
router.get('/cantidad-filtro/:id',obtenerCantidadPorFiltro);

async function obtenerProductosSinContenedor(req,res){
    try {
        const [results] = await pool.promise().query('SELECT * FROM producto p LEFT JOIN contenedorproductos ON p.idProducto = producto WHERE producto IS NULL;');
        res.json(results);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}
async function obtenerProductosConContenedor(req,res){
    try {
        const [results] = await pool.promise().query('SELECT * FROM producto p JOIN contenedorproductos ON p.idProducto = producto GROUP BY idProducto;');
        res.json(results);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function obtenerCantidadPorContenedor(req,res){
    try {
        const {id} = req.params;        
        const [results] = await pool.promise().query(`
            SELECT cp.*, cp.precioPorUnidad, c.nombre, ce.ubicacion, con.idContenedor
            FROM contenedorProductos cp 
            LEFT JOIN color c ON c.idColor = cp.color 
            LEFT JOIN contenedor con ON cp.contenedor = con.idContenedor
            LEFT JOIN (
                SELECT ce1.*
                FROM contenedorestado ce1
                INNER JOIN (
                    SELECT contenedor, MAX(idEstado) as maxId
                    FROM contenedorestado
                    GROUP BY contenedor
                ) ce2 ON ce1.contenedor = ce2.contenedor AND ce1.idEstado = ce2.maxId
            ) ce ON cp.contenedor = ce.contenedor
            WHERE cp.producto = ?;
        `,[id]);
        res.json(results);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}
async function obtenerCantidadPorColor(req,res){
    try{
        const {id} = req.params;
        const query = 
        `SELECT 
            p.idProducto, 
            p.nombre, 
            cp.color, 
            SUM(COALESCE(cp.cantidad, 0)) AS total_cantidad,
            cp.unidad,
            c.nombre AS nombreColor
        FROM producto p
        JOIN contenedorproductos cp ON p.idProducto = cp.producto
        JOIN color c ON  cp.color = idColor
        WHERE p.idProducto = ?
        GROUP BY p.idProducto, p.nombre, cp.color, cp.unidad;`;
        const [results] = await pool.promise().query(query,[id]);
        res.json(results);
    }catch(error){
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}
async function eliminarProducto(req,res){
    try{
        const {id} = req.params;
        const connection = pool;
        connection.query('DELETE FROM Producto WHERE idProducto = ?',[id],(err,results)=>{
            if(err){
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error en el servidor.');
            }
            res.json(results);
        })
    }catch(error){
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}
async function obtenerCantidadTotal(req,res){
    try{
        const id = req.params.id;
        const query = `
        SELECT sum(cantidad) as cantidad_total FROM contenedorproductos WHERE producto =?; `;
        const [results] = await pool.promise().query(query, [id]);
        console.log(results);
        res.json(results);
    }catch(error){
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}
async function obtenerCantidadPorFiltro(req, res) {
    try {
        const id = req.params.id;
        const filtroTipo = req.headers['x-filtro']; // 'estado' o 'ubicacion'
        const filtroValor = req.headers['x-estado-o-ubicacion']; // Valor del filtro
        
        let query;
        let params = [id];
        
        if (filtroTipo === 'ambos' && filtroValor) {
            // Si se están filtrando por ambos (estado y ubicacion específicos)
            // Formato del valor: "estado:ubicacion" (ej: "DEPOSITO NACIONAL:Altitud")
            const [estado, ubicacion] = filtroValor.split(':');
            
            query = `
            SELECT 
                cp.producto,
                cp.color,
                cp.unidad,
                ce.estado,
                ce.ubicacion,
                SUM(COALESCE(cp.cantidad, 0)) AS total_cantidad,
                cp.precioPorUnidad
            FROM 
                contenedorproductos cp
            JOIN 
                contenedorestado ce ON cp.contenedor = ce.contenedor
            JOIN (
                SELECT 
                    contenedor, 
                    MAX(fechaHora) AS max_fechaHora
                FROM 
                    contenedorestado
                GROUP BY 
                    contenedor
            ) ultimo_estado ON ce.contenedor = ultimo_estado.contenedor AND ce.fechaHora = ultimo_estado.max_fechaHora
            WHERE 
                cp.producto = ? AND ce.estado = ? AND ce.ubicacion = ?
            GROUP BY 
                cp.producto, 
                cp.color, 
                cp.unidad, 
                ce.estado, 
                ce.ubicacion,
                cp.precioPorUnidad;
            `;
            params.push(estado, ubicacion);
        } else if (filtroTipo === 'estado' && filtroValor) {
            // Si se está filtrando solo por estado
            query = `
            SELECT 
                cp.producto,
                cp.color,
                cp.unidad,
                ce.estado,
                NULL as ubicacion, -- No agrupamos por ubicación
                SUM(COALESCE(cp.cantidad, 0)) AS total_cantidad,
                cp.precioPorUnidad
            FROM 
                contenedorproductos cp
            JOIN 
                contenedorestado ce ON cp.contenedor = ce.contenedor
            JOIN (
                SELECT 
                    contenedor, 
                    MAX(fechaHora) AS max_fechaHora
                FROM 
                    contenedorestado
                GROUP BY 
                    contenedor
            ) ultimo_estado ON ce.contenedor = ultimo_estado.contenedor AND ce.fechaHora = ultimo_estado.max_fechaHora
            WHERE 
                cp.producto = ? AND ce.estado = ?
            GROUP BY 
                cp.producto, 
                cp.color, 
                cp.unidad, 
                ce.estado,
                cp.precioPorUnidad;
            `;
            params.push(filtroValor);
        } else if (filtroTipo === 'ubicacion' && filtroValor) {
            // Si se está filtrando solo por ubicación
            query = `
            SELECT 
                cp.producto,
                cp.color,
                cp.unidad,
                ce.estado,
                ce.ubicacion,
                SUM(COALESCE(cp.cantidad, 0)) AS total_cantidad,
                cp.precioPorUnidad
            FROM 
                contenedorproductos cp
            JOIN 
                contenedorestado ce ON cp.contenedor = ce.contenedor
            JOIN (
                SELECT 
                    contenedor, 
                    MAX(fechaHora) AS max_fechaHora
                FROM 
                    contenedorestado
                GROUP BY 
                    contenedor
            ) ultimo_estado ON ce.contenedor = ultimo_estado.contenedor AND ce.fechaHora = ultimo_estado.max_fechaHora
            WHERE 
                cp.producto = ? AND ce.ubicacion = ?
            GROUP BY 
                cp.producto, 
                cp.color, 
                cp.unidad, 
                ce.estado, 
                ce.ubicacion,
                cp.precioPorUnidad;
            `;
            params.push(filtroValor);
        } else {
            // Sin filtro, mostrar todo agrupado por color, estado y ubicación
            query = `
            SELECT 
                cp.producto,
                cp.color,
                cp.unidad,
                ce.estado,
                ce.ubicacion,
                SUM(COALESCE(cp.cantidad, 0)) AS total_cantidad,
                cp.precioPorUnidad
            FROM 
                contenedorproductos cp
            JOIN 
                contenedorestado ce ON cp.contenedor = ce.contenedor
            JOIN (
                SELECT 
                    contenedor, 
                    MAX(fechaHora) AS max_fechaHora
                FROM 
                    contenedorestado
                GROUP BY 
                    contenedor
            ) ultimo_estado ON ce.contenedor = ultimo_estado.contenedor AND ce.fechaHora = ultimo_estado.max_fechaHora
            WHERE 
                cp.producto = ?
            GROUP BY 
                cp.producto, 
                cp.color, 
                cp.unidad, 
                ce.estado, 
                ce.ubicacion,
                cp.precioPorUnidad;
            `;
        }
        
        console.log('Ejecutando consulta con parámetros:', params);
        const [results] = await pool.promise().query(query, params);
        res.json(results);
    } catch(error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

module.exports = router;