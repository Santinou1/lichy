const {app} = require('./app.js');
const PORT = 5000;


app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});