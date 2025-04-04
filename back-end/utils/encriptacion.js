const bcrypt = require('bcrypt');

async function encriptarContrasena(contrasena) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contrasena, saltRounds);
    return hashedPassword;
}
async function verificarContrasena(contrasena, contrasenaEncriptada){
    const coincide = await bcrypt.compare(contrasena, contrasenaEncriptada);
    return coincide;
}

module.exports = {
    encriptarContrasena,
    verificarContrasena
}