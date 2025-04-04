const express = require('express');
const router = express.Router();
const pool = require('../db/dbconfig');

router.get('/',obtenerContenedores);
router.post('/', agregarContenedor);
router.delete('/:id',eliminarContenedor);
router.get('/contenedor-detalle/:id',obtenerContenedorDetalle);
router.put('/categoria/:id',actualizarContenedorCategoria);
router.put('/detalle/:id',actualizarDetalleContenedor);

async function obtenerContenedores(req,res){
    try {
        const [results] = await pool.promise().query('SELECT * FROM contenedor');
        res.json(results);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function agregarContenedor(req,res){
    try{

        const { usuario,productos, proveedor,factura,comentario} = req.body;
        const connection = pool;
        
        if(  !usuario || !proveedor ||!factura || !Array.isArray(productos) ){    
            return res.status(400).send('Faltan campos obligatorios');
        }
        
        const [contenedorResult]= await connection.promise().query('INSERT INTO Contenedor ( usuario, proveedor,categoria,factura,comentario) VALUES (?,?,?,?,?)',[ usuario, proveedor,'COMPRADO',factura,comentario]);
        const idContenedor = contenedorResult.insertId;
        for(const producto of productos){
            const {idProducto, nombre, unidad, cantidad, cantidadBulto, tipoBulto, precioPorUnidad,item_proveedor} = producto;
            if(!unidad || !cantidad||!cantidadBulto||!tipoBulto || !precioPorUnidad || (!idProducto && ! nombre)){
                console.warn('Producto invalido:',producto)
                continue;
            }

            let productoId;

            if(idProducto){
                const [productoExistente] = await connection.promise().query('SELECT idProducto FROM Producto WHERE idProducto = ?',[idProducto]);
                if(productoExistente.length > 0){
                    productoId = productoExistente[0].idProducto;
                } else {
                    console.warn('Producto no encontrado:', producto);
                }
            }else{ 
                const [nuevoProducto] = await connection.promise().query('INSERT INTO Producto (nombre, unidadPredeterminada, tipoBultoPredeterminado) VALUES (?,?)',[nombre,unidad,tipoBulto]);
                productoId = nuevoProducto.insertId;
            }

            await connection.promise().query('INSERT INTO ContenedorProductos (contenedor,producto,unidad,cantidad,precioPorUnidad,tipoBulto, cantidadBulto,item_proveedor) VALUES (?,?,?,?,?,?)',[idContenedor, productoId, unidad,cantidad,precioPorUnidad,tipoBulto,cantidadBulto,item_proveedor]);
        }
        await connection.promise().query('INSERT INTO ContenedorEstado (contenedor,estado,ubicacion) VALUES (?,?,?)',[idContenedor,'COMPRADO','FALTA DISPONER']);
        res.json({success:true, idContenedor: idContenedor});
       
    }catch(error){
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}
async function obtenerContenedores(req,res) {
    try {
        const query = `
        SELECT 
            c.idContenedor,
            c.categoria,
            ce.idEstado,
            ce.estado,
            ce.ubicacion
        FROM Contenedor c LEFT JOIN 
        (SELECT ce1.* FROM ContenedorEstado ce1 INNER JOIN 
            (SELECT contenedor, MAX(idEstado) AS maxIdEstado FROM ContenedorEstado
            GROUP BY contenedor) ce2 ON ce1.contenedor = ce2.contenedor 
            AND ce1.idEstado = ce2.maxIdEstado) ce ON c.idContenedor = ce.contenedor
        GROUP BY c.idContenedor;`;
        const [results] = await pool.promise().query(query, [req.params.estado]);
        res.json(results);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function obtenerContenedorDetalle(req,res){
    try {
        const id = req.params.id;
        const query = `
        SELECT  *
        FROM Contenedor c 
        INNER JOIN Proveedor p ON p.idProveedor = c.proveedor
        WHERE idContenedor = ?;  `;
        const [results] = await pool.promise().query(query, [id]);
        res.json(results);
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}

async function actualizarContenedorCategoria(req,res){
    try{
        const id = req.params.id;
        const categoria = req.body.categoria;
        if(!categoria){
            return res.status(400).send('Faltan campos obligatorios');
        }
        const query = 'UPDATE Contenedor SET categoria = ? WHERE idContenedor = ?';
        const [results] = await pool.promise().query(query, [categoria, id]);
        const [results2] = await pool.promise().query('SELECT categoria FROM Contenedor WHERE idContenedor = ?',[id]);
        res.json(results2);
    }catch(error){
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}
async function actualizarDetalleContenedor(req,res){
    try{
        const id = req.params.id;
        const {proveedor,factura,forwarder,comentario,sira,vep,codigoContenedor} = req.body;
        const connection = pool;
        const query = `UPDATE Contenedor SET 
        proveedor = ?,
        factura = ?,
        forwarder = ?,
        comentario = ?,
        sira = ?,
        vep = ?,
        codigoContenedor = ?
        WHERE idContenedor = ?`
        connection.query(query,[proveedor,factura,forwarder,comentario,sira,vep,codigoContenedor,id],(err,results)=>{
            if(err){
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error en el servidor.');
            }
            connection.query('SELECT  * FROM Contenedor c INNER JOIN Proveedor p ON p.idProveedor = c.proveedor WHERE idContenedor = ?; ',[id],(err,results)=>{
                if(err){
                    console.error('Error ejecutando la consulta:', err);
                    return res.status(500).send('Error en el servidor.');
                }
                res.json(results)
            })
        })


    }catch(error){
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}
async function eliminarContenedor(req,res){
    try {
        const id = req.params.id;
        const connection = pool;
        connection.query('DELETE FROM Contenedor WHERE idContenedor = ?',[id],(err,results)=>{
            if(err){
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error en el servidor.');
            }
            res.json(results)
        })
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
        return res.status(500).send('Error en el servidor.');
    }
}
module.exports = router;