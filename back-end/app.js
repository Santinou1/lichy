const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();


const usuario = require('./routes/usuario.js');
const items = require('./routes/items.js'); 
const contendor = require('./routes/contenedor.js');
const contendorEstado = require('./routes/contenedorEstado.js');
const contenedorProducto = require('./routes/contenedorProducto.js');
const producto = require('./routes/producto.js');
const historial = require('./routes/Historial.js');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(morgan('dev'));




app.use('/api/usuarios',usuario);
app.use('/api/items',items);
app.use('/api/contenedores',contendor); 
app.use('/api/contenedorEstado',contendorEstado);
app.use('/api/contenedorProducto',contenedorProducto);
app.use('/api/producto',producto);
app.use('/api/historial',historial)
module.exports = {
    app
};