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
        const [results] = await pool.promise().query('SELECT * FROM contenedorProductos cp LEFT JOIN color c ON c.idColor = cp.color WHERE producto = ?;',[id]);
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
async function obtenerCantidadPorFiltro(req,res){
    try{
        const id = req.params.id;
        const filtro = req.headers['x-filtro'];
        const estadoOUicacion = req.headers['x-estado-o-ubicacion']
        let condicion = ''
        
        if (filtro === 'estado' || filtro === 'ubicacion') {
            const valorFiltro = req.headers['x-filtro']; // Asume que el valor del filtro se envía en otro header
            if (!valorFiltro) {
                return res.status(400).send('Falta el valor del filtro.');
            }
            condicion = `AND ce.${filtro} LIKE ?`;
        
        }

        const query = `
        SELECT 
            cp.producto,
            cp.color,
            cp.unidad,
            ce.estado,
            ce.ubicacion,
            SUM(COALESCE(cp.cantidad, 0)) AS total_cantidad
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
            cp.producto = ? ${condicion}
        GROUP BY 
            cp.producto, 
            cp.color, 
            cp.unidad, 
            ce.estado, 
            ce.ubicacion;`;
        
        const [results] = await pool.promise().query(query, [id,estadoOUicacion]);
        res.json(results);
    }catch(error){
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

module.exports = router;