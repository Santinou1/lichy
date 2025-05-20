const pool = require('./dbconfig');
const fs = require('fs');
const path = require('path');

/**
 * Función para aplicar la alteración de la tabla ContenedorProductos
 * para añadir campos de estado y contenedor destino
 */
async function aplicarAlteracionProducto() {
    try {
        const connection = pool;
        
        // Leer el script SQL
        const sqlFile = path.join(__dirname, 'alter_product_state.sql');
        const sqlScript = fs.readFileSync(sqlFile, 'utf8');
        
        // Verificar si los campos ya existen para evitar errores
        const [columns] = await connection.promise().query('SHOW COLUMNS FROM ContenedorProductos');
        const estadoExists = columns.some(col => col.Field === 'estado');
        const destinoExists = columns.some(col => col.Field === 'contenedorDestino');
        
        if (estadoExists && destinoExists) {
            console.log('Los campos de estado y contenedorDestino ya existen en la tabla.');
            return;
        }
        
        // Ejecutar el script SQL
        console.log('Aplicando alteraciones a la tabla ContenedorProductos...');
        await connection.promise().query(sqlScript);
        console.log('Tabla ContenedorProductos actualizada exitosamente.');
        
    } catch (error) {
        console.error('Error aplicando alteraciones a la tabla:', error);
    }
}

// Ejecutar la función
aplicarAlteracionProducto()
    .then(() => console.log('Proceso de alteración de tabla completado'))
    .catch(err => console.error('Error en el proceso de alteración:', err));

module.exports = { aplicarAlteracionProducto };
