# Sistema de Gestión Lichy

## Descripción General

El Sistema de Gestión Lichy es una aplicación web completa para la gestión de inventario, seguimiento de contenedores, productos y usuarios. Está diseñado para facilitar el control logístico de mercancías, desde su compra hasta su entrega final, pasando por diferentes estados y ubicaciones.

## Estructura del Proyecto

El proyecto está dividido en dos partes principales:

```
Lichy/
├── back-end/         # Servidor API REST con Express
└── front-end/        # Interfaz de usuario con React
```

## Tecnologías Utilizadas

### Back-end
- **Node.js** con **Express** para el servidor
- **MySQL** como base de datos relacional
- **bcrypt** para encriptación de contraseñas
- **cors** para manejo de solicitudes cross-origin

### Front-end
- **React** para la interfaz de usuario
- **React Router** para la navegación
- **Axios** para las peticiones HTTP
- **React Hook Form** para manejo de formularios
- **SweetAlert2** para notificaciones
- **Vite** como herramienta de construcción

## Configuración e Instalación

### Requisitos Previos
- Node.js (versión recomendada: 14.x o superior)
- MySQL (versión 5.7 o superior)

### Configuración de la Base de Datos
1. Crear una base de datos MySQL llamada `LichyDB`
2. Ejecutar el script SQL ubicado en `back-end/db/dbscript.sql` para crear las tablas y datos iniciales

```bash
mysql -u root -p < back-end/db/dbscript.sql
```

### Instalación del Back-end
1. Navegar al directorio del back-end:
```bash
cd back-end
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar la conexión a la base de datos en `db/dbconfig.js` si es necesario:
```javascript
const pool = mysql.createPool({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '', // Modificar según configuración
    database: 'lichydb'
});
```

4. Iniciar el servidor:
```bash
npm run dev
```
El servidor se iniciará en http://gestion.lichy.local:5000

### Instalación del Front-end
1. Navegar al directorio del front-end:
```bash
cd front-end
```

2. Instalar dependencias:
```bash
npm install
```

3. Iniciar la aplicación:
```bash
npm run dev
```
La aplicación se iniciará en http://localhost:5173 (o el puerto que Vite asigne)

## Estructura de la Base de Datos

La base de datos está compuesta por las siguientes tablas principales:

1. **Usuario**: Almacena información de usuarios del sistema
2. **Proveedor**: Registro de proveedores
3. **Producto**: Catálogo de productos
4. **Color**: Registro de colores disponibles
5. **Categorias**: Estados posibles de los contenedores
6. **Ubicacion**: Ubicaciones físicas relacionadas con cada estado
7. **Contenedor**: Información de los contenedores
8. **ContenedorEstado**: Historial de estados de cada contenedor
9. **ContenedorProductos**: Relación entre contenedores y productos
10. **ContenedorProductosHistorial**: Registro de cambios en los productos de un contenedor

### Diagrama Simplificado de Relaciones

```
Usuario <-- Contenedor --> Proveedor
                |
                v
        ContenedorEstado
                |
                v
        ContenedorProductos <--> Producto
                |                   |
                v                   v
        ContenedorProductosHistorial  Color
```

## Funcionalidades Principales

### Gestión de Usuarios
- Registro y autenticación de usuarios
- Asignación de permisos según rol
- Actualización de datos y contraseñas

### Gestión de Contenedores
- Creación y seguimiento de contenedores
- Actualización de estados y ubicaciones
- Registro histórico de cambios

### Gestión de Productos
- Catálogo de productos con características
- Asignación de productos a contenedores
- Control de inventario

### Flujo de Trabajo

El sistema sigue un flujo de trabajo basado en estados:

1. **COMPRADO**: Productos adquiridos pero aún no embarcados
2. **EMBARCADO**: Productos en tránsito
3. **ARRIBADO**: Productos que han llegado al país
4. **DEPOSITO NACIONAL**: Productos en almacén nacional
5. **EN STOCK**: Productos disponibles para entrega
6. **ENTREGADO**: Productos entregados al cliente
7. **ANULADO**: Contenedores cancelados

Cada estado tiene ubicaciones específicas asociadas que permiten un seguimiento detallado.

## Guía de Uso

### Inicio de Sesión
- Acceder a la aplicación mediante la URL del front-end
- Ingresar credenciales (usuario/contraseña)
- Por defecto, existe un usuario administrador:
  - Email: admin@admin.com
  - Contraseña: admin

### Navegación Principal
- **Ver Contenedores**: Lista de todos los contenedores con filtros por estado y ubicación
- **Ver Productos**: Catálogo completo de productos
- **Ver Usuarios**: Gestión de usuarios (solo para administradores)

### Gestión de Contenedores
1. **Crear Contenedor**: 
   - Acceder a "Nuevo Contenedor"
   - Completar información básica (proveedor, factura, etc.)
   - Asignar estado inicial y ubicación

2. **Actualizar Estado**:
   - Acceder al detalle del contenedor
   - Seleccionar "Agregar nuevo estado"
   - Elegir nuevo estado y ubicación

3. **Agregar Productos**:
   - En el detalle del contenedor, seleccionar "Agregar producto"
   - Seleccionar producto del catálogo
   - Especificar cantidad, precio y características

### Gestión de Productos
1. **Crear Producto**:
   - Acceder a "Ver Productos"
   - Seleccionar "Agregar Producto"
   - Completar información (nombre, unidad, código interno)

2. **Editar Producto**:
   - Acceder al detalle del producto
   - Modificar información según necesidad

## Cómo Agregar Nuevos Campos a la Base de Datos

Para agregar nuevos campos a las tablas existentes:

1. **Modificar el Esquema de la Base de Datos**:
   - Crear un script SQL con la sentencia ALTER TABLE
   - Ejemplo para agregar un campo a la tabla Contenedor:
   ```sql
   ALTER TABLE Contenedor ADD COLUMN nuevoCampo VARCHAR(100);
   ```

2. **Actualizar el Back-end**:
   - Modificar las rutas correspondientes en `back-end/routes/`
   - Actualizar las consultas SQL para incluir el nuevo campo

3. **Actualizar el Front-end**:
   - Modificar los componentes relevantes para mostrar/editar el nuevo campo
   - Actualizar los formularios para incluir el nuevo campo

## Gestión de Permisos

El sistema utiliza un modelo de permisos basado en roles:

- **Ver-Contenedores**: Permite visualizar los contenedores
- **Editar-Contenedores**: Permite modificar contenedores
- **Crear-Contenedores**: Permite crear nuevos contenedores
- **Ver-Items**: Permite visualizar los items
- **Editar-Items**: Permite modificar items
- **Crear-Items**: Permite crear nuevos items
- **Ver-Productos**: Permite visualizar los productos
- **Editar-Productos**: Permite modificar productos
- **Crear-Productos**: Permite crear nuevos productos
- **Ver-Usuarios**: Permite visualizar usuarios
- **Editar-Usuarios**: Permite modificar usuarios
- **Crear-Usuarios**: Permite crear nuevos usuarios

Los permisos se asignan a cada usuario y se almacenan en formato JSON en la base de datos.

## Solución de Problemas Comunes

### Problemas de Conexión a la Base de Datos
- Verificar que el servidor MySQL esté en ejecución
- Comprobar las credenciales en `back-end/db/dbconfig.js`
- Asegurarse de que la base de datos `LichyDB` exista

### Errores en el Front-end
- Verificar que el back-end esté en ejecución
- Comprobar la URL de conexión en las peticiones Axios (por defecto: http://gestion.lichy.local:5000)
- Limpiar la caché del navegador si persisten problemas

### Problemas de Autenticación
- Utilizar el endpoint `/api/usuarios/primer-admin` para crear un usuario administrador inicial
- Verificar que las contraseñas cumplan con los requisitos de seguridad

## Desarrollo y Extensión

### Cómo Agregar Nuevas Funcionalidades

1. **Back-end**:
   - Crear nuevas rutas en `back-end/routes/`
   - Registrar las rutas en `app.js`
   - Implementar la lógica de negocio y consultas a la base de datos

2. **Front-end**:
   - Crear nuevos componentes en `front-end/src/components/`
   - Crear nuevas páginas en `front-end/src/pages/`
   - Actualizar las rutas en `App.jsx`

### Buenas Prácticas
- Mantener la separación de responsabilidades (back-end/front-end)
- Documentar los cambios realizados
- Seguir las convenciones de nomenclatura existentes
- Implementar validaciones tanto en el cliente como en el servidor

## Contribuciones y Soporte

Para contribuir al proyecto o reportar problemas, contactar al equipo de desarrollo.

---

Documentación generada el 31 de marzo de 2025.
