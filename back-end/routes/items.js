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
        const {nombre, unidadPredeterminada, codigoInterno} = req.body;
        const id = req.params.id;
        const connection = pool;
        
        const [updateResults] = await connection.promise().query(
            `UPDATE producto SET nombre = ?, unidadPredeterminada = ?, codigoInterno = ? WHERE idProducto = ?`,
            [nombre, unidadPredeterminada, codigoInterno, id]
        );

        if (updateResults.affectedRows === 0) {
            // Si no se actualizó ninguna fila, el producto no existe
            return res.status(404).json({ mensaje: 'Producto no encontrado.' });
        }

        // Obtenemos el producto actualizado
        const [productoActualizado] = await connection.promise().query(
            `SELECT * FROM producto WHERE idProducto = ?`,
            [id]
        );

        res.json(productoActualizado[0]); // Devolvemos el 
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}
async function actualizarColor(req,res){
    try{
        const {nombre, codigoInterno} = req.body;
        const id = req.params.id;
        const connection = pool;
        const [updateResults] = await connection.promise().query(
            `UPDATE color SET nombre = ?, codigoInterno = ? WHERE idColor = ?`,
            [nombre, codigoInterno, id]
        );
        res.json(updateResults);
    }catch(error){
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function buscarProducto(req,res){
    try{
        const id = req.params.id;
        const [results] = await pool.promise().query('SELECT * FROM producto WHERE idProducto = ?',[id]);
        res.json(results[0]);
    }catch(error){
        console.log('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}
async function agregarProveedor(req,res){
    try{

        const {nombre} = req.body;
        const connection = pool;
        if(!nombre){
            return res.status(400).send('Faltan campos obligatorios');
        }
        connection.query('INSERT INTO proveedor (nombre) VALUES (?)',[nombre],(err,results)=>{
            if(err){
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error en el servidor.');
            }
            const insertId = results.insertId;
            connection.query('SELECT * FROM proveedor WHERE idProveedor = ?',[insertId],(err,results)=>{
                if(err){
                    console.error('Error ejecutando la consulta:', err);
                    return res.status(500).send('Error en el servidor.');
                }
                res.json(results);
            });
        });
    }catch(error){
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

        const {nombre} = req.body;
        const connection = pool;
        if(!nombre){
            return res.status(400).send('Faltan campos obligatorios');
        }
        connection.query('INSERT INTO color (nombre) VALUES (?)',[nombre],(err,results)=>{
            if(err){
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error en el servidor.');
            }
            const insertId = results.insertId;
            connection.query('SELECT * FROM color WHERE idColor = ?',[insertId],(err,results)=>{
                if(err){
                    console.error('Error ejecutando la consulta:', err);
                    return res.status(500).send('Error en el servidor.');
                }
                res.json(results);
            });
        });
    }catch(error){
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}
async function obtenerProductos(req,res){
    try {
        const [results] = await pool.promise().query('SELECT * FROM producto');
        res.json(results);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function agregarProducto(req,res){    
    try{
        const {nombre, unidadPredeterminada} = req.body;
        console.log(req.body);
        const connection = pool;
        if(!nombre || !unidadPredeterminada){
            return res.status(400).send('Faltan campos obligatorios');
        }
        connection.query('INSERT INTO Producto (nombre, unidadPredeterminada) VALUES (?,?)',[nombre,unidadPredeterminada],(err,results)=>{
            if(err){
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error en el servidor.');
            }
            const insertId = results.insertId;
            connection.query('SELECT * FROM producto WHERE idProducto = ?',[insertId],(err,results)=>{
                if(err){
                    console.error('Error ejecutando la consulta:', err);
                    return res.status(500).send('Error en el servidor.');
                }
                res.json(results);
            });
        });
    }catch(error){
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
    try{
        const { estado } = req.body;
        const query = `SELECT * FROM ubicacion WHERE estado = ?`
        const [results] = await pool.promise().query(query ,[estado]);
        res.json(results);
    } catch (error){
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
module.exports = router;
