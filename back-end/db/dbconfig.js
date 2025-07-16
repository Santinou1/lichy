const mysql = require('mysql2');

/* const pool = mysql.createPool({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '',
    database: 'lichydb'
}); */

const pool = mysql.createPool({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'P1r1d3gm1@',
    database: 'lichydb1'
});

// Verificar la conexión
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err);
        return;
    }
    const config = pool.config.connectionConfig;
    console.log('✅ Conexión exitosa a la base de datos MySQL');
    console.log(`   📦 Base de datos: ${config.database}`);
    console.log(`   🖥️  Host: ${config.host}:${config.port}`);
    connection.release();
});

module.exports = pool; 
