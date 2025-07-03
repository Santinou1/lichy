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
        
        // Primero verificar si la categoría 'Contenedor Creado' ya existe en la tabla categoria
        const [categoriaExiste] = await connection.promise().query('SELECT * FROM categoria WHERE nombrecategoria = ?', ['Contenedor Creado']);
        
        // Si no existe, agregar la categoría 'Contenedor Creado' a la tabla categoria
        if (categoriaExiste.length === 0) {
            console.log('Agregando nueva categoría "Contenedor Creado" a la tabla categoria');
            await connection.promise().query('INSERT INTO categoria (nombrecategoria) VALUES (?)', ['Contenedor Creado']);
        }
        
        // La categoría del contenedor ahora es 'Contenedor Creado'
        const [contenedorResult]= await connection.promise().query('INSERT INTO contenedor ( usuario, proveedor,categoria,factura,comentario) VALUES (?,?,?,?,?)',[ usuario, proveedor,'Contenedor Creado',factura,comentario]);
        const idContenedor = contenedorResult.insertId;
        for(const producto of productos){
            // Usar solo minúsculas en destructuring
            const {idproducto, nombre, unidad, unidadalternativa, cantidad, cantidadalternativa, cantidadbulto, tipobulto, precioporunidad, item_proveedor} = producto;
            // Normalizar los valores alternativos
            const cantidadalternativaFinal = (cantidadalternativa === "" || cantidadalternativa === undefined) ? null : Number(cantidadalternativa);
            const unidadalternativaFinal = (unidadalternativa === "" || unidadalternativa === undefined) ? null : unidadalternativa;
            console.log('Producto recibido:', producto);
            console.log('Valores normalizados:', { cantidadalternativaFinal, unidadalternativaFinal });
            if(!unidad || !cantidad||!cantidadbulto||!tipobulto || !precioporunidad || (!idproducto && ! nombre)){
                console.warn('Producto invalido:',producto)
                continue;
            }

            let productoId;

            if(idproducto){
                const [productoExistente] = await connection.promise().query('SELECT idProducto FROM producto WHERE idProducto = ?',[idproducto]);
                if(productoExistente.length > 0){
                    productoId = productoExistente[0].idProducto;
                } else {
                    console.warn('Producto no encontrado:', producto);
                }
            }else{ 
                const [nuevoProducto] = await connection.promise().query('INSERT INTO producto (nombre, unidadPredeterminada, tipoBultoPredeterminado) VALUES (?,?,?)',[nombre,unidad,tipobulto]);
                productoId = nuevoProducto.insertId;
            }

            // Normalizar tipoBulto a los valores válidos del ENUM
            let tipoBultoNormalizado = (tipobulto || '').toLowerCase();
            if (tipoBultoNormalizado === 'caja') tipoBultoNormalizado = 'cajas';
            if (tipoBultoNormalizado === 'rollo') tipoBultoNormalizado = 'rollos';
            if (!['cajas', 'rollos'].includes(tipoBultoNormalizado)) {
                tipoBultoNormalizado = unidad === 'uni' ? 'cajas' : 'rollos';
            }
            console.log('Datos enviados al INSERT contenedorproducto:', [idContenedor, productoId, unidad, cantidad, unidadalternativaFinal, cantidadalternativaFinal, precioporunidad, tipoBultoNormalizado, cantidadbulto, item_proveedor]);
            await connection.promise().query('INSERT INTO contenedorproducto (contenedor,producto,unidad,cantidad,unidadAlternativa,cantidadAlternativa,precioPorUnidad,tipoBulto,cantidadBulto,itemProveedor) VALUES (?,?,?,?,?,?,?,?,?,?)',[idContenedor, productoId, unidad, cantidad, unidadalternativaFinal, cantidadalternativaFinal, precioporunidad, tipoBultoNormalizado, cantidadbulto, item_proveedor]);
        }
        // Insertar solo el estado 'Contenedor Creado' sin ubicación específica
        await connection.promise().query('INSERT INTO contenedorestado (contenedor,estado,ubicacion) VALUES (?,?,?)',[idContenedor,'Contenedor Creado','-']);
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
            c.comentario,
            c.codigoContenedor,
            ce.idEstado,
            ce.estado,
            ce.ubicacion
        FROM contenedor c LEFT JOIN 
        (SELECT ce1.* FROM contenedorestado ce1 INNER JOIN 
            (SELECT contenedor, MAX(idEstado) AS maxIdEstado FROM contenedorestado
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
        FROM contenedor c 
        INNER JOIN proveedor p ON p.idProveedor = c.proveedor
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
        const query = 'UPDATE contenedor SET categoria = ? WHERE idContenedor = ?';
        const [results] = await pool.promise().query(query, [categoria, id]);
        const [results2] = await pool.promise().query('SELECT categoria FROM contenedor WHERE idContenedor = ?',[id]);
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
        const query = `UPDATE contenedor SET 
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
            connection.query('SELECT  * FROM contenedor c INNER JOIN proveedor p ON p.idProveedor = c.proveedor WHERE idContenedor = ?; ',[id],(err,results)=>{
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
        connection.query('DELETE FROM contenedor WHERE idContenedor = ?',[id],(err,results)=>{
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