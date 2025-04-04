const express = require('express');
const router = express.Router();
const pool = require('../db/dbconfig');

router.get('/:id',obtenerHistorialContenedor);

async function obtenerHistorialContenedor(req,res){
    try {
        const connection = pool;
        const id = req.params.id
        const [results] = await connection.promise().query('SELECT * FROM contenedorproductoshistorial WHERE contenedor = ? ORDER BY idHistorial DESC',id);
        res.json(results);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}
module.exports = router;