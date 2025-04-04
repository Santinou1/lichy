const express = require('express');
const router = express.Router();
const pool = require('../db/dbconfig');
const {encriptarContrasena, verificarContrasena} = require('../utils/encriptacion.js');

router.get('/primer-admin',primerAdmin)
router.get('/test',obtenerUsuarios);
router.post('/agregar',agregarUsuario);
router.post('/login',login);
router.put('/actualizar-contrasena/:id',actualizarContrasena);
router.put('/actualizar/:id',actualizarUsuario);
router.delete('/eliminar/:id',eliminarUsuario);

async function obtenerUsuarios(req,res){
    try {
        const [results] = await pool.promise().query('SELECT * FROM usuario');
        res.json(results);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function primerAdmin(req,res){
    try{
        const connection = pool;
        const {nombre, email, contrasena, tipoUsuario, permisos} = {
            nombre: 'admin',
            email: 'admin@admin.com',
            contrasena: 'admin',
            tipoUsuario: 'admin',
            permisos:{
                "Ver-Contenedores": true,
                "Editar-Contenedores": true,
                "Crear-Contenedores": true,
                "Ver-Items": true,
                "Editar-Items": true,
                "Crear-Items": true,
                "Ver-Productos": true,
                "Editar-Productos": true,
                "Crear-Productos": true,
                "Ver-Usuarios": true,
                "Editar-Usuarios": true,
                "Crear-Usuarios": true,
            }
        };
        const permisosJSON = JSON.stringify(permisos);

        const contraEncriptada = await encriptarContrasena(contrasena);
        const query = 'INSERT INTO Usuario (nombre, email, contrasena, tipoUsuario,permisos) VALUES (?,?,?,?,?)';
        connection.query(query,[nombre,email,contraEncriptada,tipoUsuario,permisosJSON],(err,results)=>{
            if(err){
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error en el servidor.');
            }
            res.json(results);
        });
    }catch(error){
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}
async function actualizarUsuario(req,res){
    try {
        const connection = pool;
        const {nombre, email, tipoUsuario, permisos} = req.body
        const {id} = req.params;
        if(!nombre || !email || !tipoUsuario || !permisos){
            return res.status(400).send('Faltan campos obligatorios');
        }
        const query = 'UPDATE Usuario SET nombre = ?, email = ?, tipoUsuario = ?, permisos = ? WHERE idUsuario = ?';
        connection.query(query,[nombre,email,tipoUsuario,permisos,id],(err,results)=>{
            if(err){
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error en el servidor.');
            }
            res.json(results);
        });

    } catch (error) {
        res.send(error);
    }
}
async function agregarUsuario(req,res){
    try {
        console.log('Entre a post usuario')
        const connection = pool;
        
        const {nombre, email, contrasena, tipoUsuario, permisos} = req.body;
        const permisosJSON = JSON.stringify(permisos);

        const contraEncriptada = await encriptarContrasena(contrasena);
        const query = 'INSERT INTO Usuario (nombre, email, contrasena, tipoUsuario,permisos) VALUES (?,?,?,?,?)';
        connection.query(query,[nombre,email,contraEncriptada,tipoUsuario,permisosJSON],(err,results)=>{
            if(err){
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error en el servidor.');
            }
            res.json(results);
        });

    } catch (error) {
        res.send(error);
    }
}
async function actualizarContrasena(req,res){
    try {
        const connection = pool;
        const {contrasenaNueva, contrasena} = req.body;
        const {id} = req.params;
       
        if(!contrasenaNueva || !contrasena){
            return res.status(400).send('Faltan campos obligatorios');
        }
        const query = 'SELECT contrasena FROM Usuario WHERE idUsuario = ?';
        connection.query(query,[id], async (err,results)=>{
            if(err){
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error en el servidor.');
            }
            if(results.length === 0){
                return res.status(404).send('Usuario no encontrado');
            }
            const contrasenaActual = results[0].contrasena;
            const contrasenaCorrecta = await verificarContrasena(contrasena,contrasenaActual);
            if(contrasenaCorrecta){
                const contraEncriptada = await encriptarContrasena(contrasenaNueva);
                const query = 'UPDATE Usuario SET contrasena = ? WHERE idUsuario = ?';
                connection.query(query,[contraEncriptada,id],(err,results)=>{
                    if(err){
                        console.error('Error ejecutando la consulta:', err);
                        return res.status(500).send('Error en el servidor.');
                    }
                    res.json(results);
                });
            }else{
                res.status(401).send('Contraseña incorrecta');
            }
        });
       

    } catch (error) {
        res.send(error);
    }
}
async function login(req,res) {
    try{
        const connection = pool;
        const {email, contrasena} = req.body;
        const query = 'SELECT * FROM Usuario WHERE email = ?';
        connection.query(query,[email], async (err,results)=>{
            if(err){
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error en el servidor.');
            }
            if(results.length === 0){
                return res.status(404).send('Usuario no encontrado');
            }
            const usuario = results[0];
            const contrasenaCorrecta = await verificarContrasena(contrasena,usuario.contrasena);
            if(contrasenaCorrecta){

                res.json(usuario);
            }else{
                res.status(401).send('Contraseña incorrecta');
            }
        });
    }catch(error){
        res.status(500).send(error);
    }

}

async function eliminarUsuario(req,res){
    try {
        const connection = pool;
        const {id} = req.params;
        const query = 'DELETE FROM Usuario WHERE idUsuario = ?';
        connection.query(query,[id],(err,results)=>{
            if(err){
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error en el servidor.');
            }
            res.json(results);
        });

    } catch (error) {
        res.send(error);
    }
}
module.exports = router;