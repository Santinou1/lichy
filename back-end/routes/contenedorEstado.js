const express = require('express');
const router = express.Router();
const pool = require('../db/dbconfig');

router.get('/:id',obtenerContenedorEstado);
router.post('/',agregarContenedorEstado);


async function obtenerContenedorEstado(req,res){
    try{
        const idContenedor = req.params.id;
        const [results] = await pool.promise().query(`SELECT * FROM ContenedorEstado WHERE contenedor = ?  ORDER BY idEstado Desc;`,[idContenedor]);
        res.json(results);
    }catch(error){
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}
async function agregarContenedorEstado(req,res){
    try{
        const {contenedor, estado, ubicacion, fechaManual} = req.body;
        const connection = pool;
        const query = 'INSERT INTO ContenedorEstado (contenedor, estado, ubicacion, fechaManual) VALUES (?,?,?,?)';
        connection.query(query,[contenedor, estado, ubicacion, fechaManual],(err,results)=>{
            if(err){
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error en el servidor.');
            }
            connection.query('UPDATE contenedor SET categoria = ? WHERE idContenedor = ?',[estado,contenedor],(err,results)=>{
                if(err){
                    console.error('Error ejecutando la consulta:', err);
                    return res.status(500).send('Error en el servidor.');
                }
            })
            connection.query('SELECT * FROM ContenedorEstado WHERE contenedor = ? ORDER BY idEstado Desc',[contenedor],(err,results)=>{
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


module.exports = router;