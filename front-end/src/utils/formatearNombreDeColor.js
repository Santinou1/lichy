import axios from "axios";

export const obtenerColoresConNombres = async(productos) =>{
    try {
        // Obtener la lista de colores desde la API
        const response = await axios.get('http://localhost:3000/api/items/color');
        const colores = response.data;
    
        console.log(productos)
        console.log(colores)
        // Crear un mapa de ID a nombre para búsqueda rápida
        const mapaColores = colores.reduce((map, color) => {
          map[color.idColor] = color.nombre;
          return map;
        }, {});
    
        // Reemplazar los idColor por nombres en los productos
        const productosConNombres = productos.map(producto => {
          return {
            ...producto,
            color: mapaColores[producto.color] || producto.color // Si no encuentra el color, deja el ID
          };
        });
    
        return productosConNombres;
    } catch (error) {
        console.error('Error al obtener los colores:', error);
        return productos; // Devuelve los productos sin modificar si hay error
    }
}