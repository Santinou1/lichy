const pool = require('./dbconfig');

/**
 * Función para crear los contenedores predeterminados (Mitre y Lichy)
 * si no existen en la base de datos
 */
async function crearContenedoresPredeterminados() {
    try {
        const connection = pool;
        const result = {
            message: '',
            contenedores: []
        };
        
        console.log('Verificando si existen contenedores predeterminados...');
        
        // Verificar si ya existen contenedores con la categoría especial "Predeterminado"
        const [contenedoresExistentes] = await connection.promise().query(
            'SELECT * FROM Contenedor WHERE categoria = ?', 
            ['Predeterminado']
        );
        
        console.log(`Se encontraron ${contenedoresExistentes.length} contenedores con categoría Predeterminado`);
        
        // Comprobar si Mitre y Lichy existen específicamente
        const mitre = contenedoresExistentes.find(c => c.comentario === 'Mitre');
        const lichy = contenedoresExistentes.find(c => c.comentario === 'Lichy');
        
        const mitreLichyExisten = mitre && lichy;
        
        if (mitreLichyExisten) {
            console.log('Los contenedores predeterminados Mitre y Lichy ya existen.');
            result.message = 'Los contenedores predeterminados ya existen';
            result.contenedores = [mitre, lichy];
            return result;
        }
        
        // Asegurarse de que la categoría "Predeterminado" existe
        const [categoriaExiste] = await connection.promise().query(
            'SELECT * FROM categorias WHERE nombreCategoria = ?', 
            ['Predeterminado']
        );
        
        if (categoriaExiste.length === 0) {
            console.log('Creando categoría "Predeterminado"');
            await connection.promise().query(
                'INSERT INTO categorias (nombreCategoria) VALUES (?)', 
                ['Predeterminado']
            );
            console.log('Categoría "Predeterminado" creada exitosamente');
        } else {
            console.log('La categoría "Predeterminado" ya existe');
        }
        
        // Obtener un usuario administrador para asignarlo a los contenedores
        const [admin] = await connection.promise().query(
            'SELECT idUsuario FROM Usuario WHERE tipoUsuario = ? LIMIT 1', 
            ['admin']
        );
        
        const userId = admin.length > 0 ? admin[0].idUsuario : 1; // Usar el ID 1 si no hay admin
        
        let mitreId, lichyId;
        
        // Crear o reutilizar contenedor Mitre
        if (!mitre) {
            console.log('Creando contenedor predeterminado "Mitre"');
            try {
                const [mitreResult] = await connection.promise().query(
                    'INSERT INTO Contenedor (usuario, proveedor, categoria, factura, comentario) VALUES (?, ?, ?, ?, ?)',
                    [userId, 1, 'Predeterminado', 'N/A', 'Mitre']
                );
                mitreId = mitreResult.insertId;
                console.log(`Contenedor Mitre creado con ID: ${mitreId}`);
            } catch (err) {
                console.error('Error creando contenedor Mitre:', err.message);
                // Intentar obtener el ID si ya existe
                const [existente] = await connection.promise().query(
                    'SELECT idContenedor FROM Contenedor WHERE comentario = ? LIMIT 1',
                    ['Mitre']
                );
                if (existente.length > 0) {
                    mitreId = existente[0].idContenedor;
                    console.log(`Usando contenedor Mitre existente con ID: ${mitreId}`);
                }
            }
        } else {
            mitreId = mitre.idContenedor;
            console.log(`Contenedor Mitre ya existe con ID: ${mitreId}`);
        }
        
        // Crear o reutilizar contenedor Lichy
        if (!lichy) {
            console.log('Creando contenedor predeterminado "Lichy"');
            try {
                const [lichyResult] = await connection.promise().query(
                    'INSERT INTO Contenedor (usuario, proveedor, categoria, factura, comentario) VALUES (?, ?, ?, ?, ?)',
                    [userId, 1, 'Predeterminado', 'N/A', 'Lichy']
                );
                lichyId = lichyResult.insertId;
                console.log(`Contenedor Lichy creado con ID: ${lichyId}`);
            } catch (err) {
                console.error('Error creando contenedor Lichy:', err.message);
                // Intentar obtener el ID si ya existe
                const [existente] = await connection.promise().query(
                    'SELECT idContenedor FROM Contenedor WHERE comentario = ? LIMIT 1',
                    ['Lichy']
                );
                if (existente.length > 0) {
                    lichyId = existente[0].idContenedor;
                    console.log(`Usando contenedor Lichy existente con ID: ${lichyId}`);
                }
            }
        } else {
            lichyId = lichy.idContenedor;
            console.log(`Contenedor Lichy ya existe con ID: ${lichyId}`);
        }
        
        // Configurar estados iniciales para los contenedores si tenemos IDs válidos
        if (mitreId) {
            try {
                // Verificar si ya existe un estado para este contenedor
                const [estadoExistente] = await connection.promise().query(
                    'SELECT idEstado FROM ContenedorEstado WHERE contenedor = ? LIMIT 1',
                    [mitreId]
                );
                
                if (estadoExistente.length === 0) {
                    await connection.promise().query(
                        'INSERT INTO ContenedorEstado (contenedor, estado, ubicacion) VALUES (?, ?, ?)',
                        [mitreId, 'Activo', 'Mitre']
                    );
                    console.log(`Estado inicial configurado para contenedor Mitre (ID: ${mitreId})`);
                } else {
                    console.log(`El contenedor Mitre (ID: ${mitreId}) ya tiene un estado configurado`);
                }
            } catch (err) {
                console.error('Error al configurar estado para Mitre:', err.message);
            }
        }
        
        if (lichyId) {
            try {
                // Verificar si ya existe un estado para este contenedor
                const [estadoExistente] = await connection.promise().query(
                    'SELECT idEstado FROM ContenedorEstado WHERE contenedor = ? LIMIT 1',
                    [lichyId]
                );
                
                if (estadoExistente.length === 0) {
                    await connection.promise().query(
                        'INSERT INTO ContenedorEstado (contenedor, estado, ubicacion) VALUES (?, ?, ?)',
                        [lichyId, 'Activo', 'Lichy']
                    );
                    console.log(`Estado inicial configurado para contenedor Lichy (ID: ${lichyId})`);
                } else {
                    console.log(`El contenedor Lichy (ID: ${lichyId}) ya tiene un estado configurado`);
                }
            } catch (err) {
                console.error('Error al configurar estado para Lichy:', err.message);
            }
        }
        
        // Obtener los contenedores creados o encontrados para devolverlos
        const [contenedoresActualizados] = await connection.promise().query(
            'SELECT * FROM Contenedor WHERE categoria = ?',
            ['Predeterminado']
        );
        
        console.log(`Contenedores predeterminados disponibles: ${contenedoresActualizados.length}`);
        console.log('IDs de contenedores:', contenedoresActualizados.map(c => c.idContenedor).join(', '));
        
        result.message = 'Contenedores predeterminados creados o verificados con éxito';
        result.contenedores = contenedoresActualizados;
        
        return result;
    } catch (error) {
        console.error('Error creando contenedores predeterminados:', error);
        return {
            message: `Error: ${error.message}`,
            contenedores: []
        };
    }
}

module.exports = { crearContenedoresPredeterminados };
