const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

// Importar función para crear contenedores predeterminados
const { crearContenedoresPredeterminados } = require('./db/default_containers');

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

app.use(cors());
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

// Crear contenedores predeterminados al iniciar la aplicación
console.log('Iniciando creación de contenedores predeterminados Mitre y Lichy...');
crearContenedoresPredeterminados()
  .then((result) => {
    console.log('Resultado de verificación de contenedores predeterminados:', result);
    console.log('Verificación de contenedores predeterminados completada');
  })
  .catch(err => console.error('Error al verificar contenedores predeterminados:', err));

module.exports = {
    app
};