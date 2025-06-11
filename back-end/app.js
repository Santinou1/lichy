const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

// Configuración de la aplicación

const app = express();

// Importar rutas
const usuario = require('./routes/usuario.js');
const items = require('./routes/items.js'); 
const contendor = require('./routes/contenedor.js');
const contendorEstado = require('./routes/contenedorEstado.js');
const contenedorProducto = require('./routes/contenedorProducto.js');
const producto = require('./routes/producto.js');
const historial = require('./routes/Historial.js');
const pedidos = require('./routes/pedidos.js');
const facturas = require('./routes/facturas.js');

// Configuración de CORS
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://192.168.0.131:5173',
        'http://gestion.lichy.local:5173'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(morgan('dev'));

// Rutas
app.use('/api/usuarios',usuario);
app.use('/api/items',items);
app.use('/api/contenedores',contendor); 
app.use('/api/contenedorEstado',contendorEstado);
app.use('/api/contenedorProducto',contenedorProducto);
app.use('/api/pedidos',pedidos);
app.use('/api/facturas',facturas);
app.use('/api/producto',producto);
app.use('/api/historial',historial)

console.log('Servidor iniciado correctamente');

module.exports = {
    app
};