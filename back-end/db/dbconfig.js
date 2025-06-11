const mysql = require('mysql2');

const pool = mysql.createPool({
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '',
    database: 'lichydb'
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
