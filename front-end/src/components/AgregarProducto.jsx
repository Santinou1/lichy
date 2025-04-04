import axios from "axios";
import { useEffect, useState } from "react";
function agregarProducto({setAgregarProducto,contenedor,actualizarLista}){
    const [productos, setProductos] = useState([]);
    const [producto, setProducto] = useState(null);
    const [cantidad, setCantidad] = useState(null);
    const [precioPorUnidad, setPrecioPorUnidad] = useState(null);
    const [unidad, setUnidad] = useState(null);

    
    useEffect(()=>{
        axios.get('http://localhost:3000/api/items/producto').then((response)=>{
            setProductos(response.data);
        });
    },[])

    const handleProductoChange = (e) => {
        const selectedProductId = e.target.value;
        setProducto(selectedProductId);

        // Buscar el producto seleccionado en la lista de productos
        const selectedProduct = productos.find(prod => prod.idProducto === parseInt(selectedProductId));
        
        // Si se encuentra el producto, actualizar la unidad predeterminada
        if (selectedProduct) {
 
            setUnidad(selectedProduct.unidadPredeterminada);
        } else {
          
            setUnidad(null); // Si no se encuentra el producto, resetear la unidad
        }
    };

    const onSubmit = async()=>{
        const datos = {
            contenedor:contenedor,
            producto: producto,
            cantidad: cantidad,
            precioPorUnidad: precioPorUnidad,
            unidad: unidad
        }
        try{
            const response = await axios.post('http://localhost:3000/api/contenedorProducto', datos);
            if(response.status === 200){
                alert('Producto agregado correctamente');
                setAgregarProducto(false);
                actualizarLista(response.data);
            }
        }catch(error){
            console.error('Error al agregar el producto:', error);
            alert('Hubo un error al agregar el producto.');
        }
    }
    return(

        <div>
            <label>Seleccionar Producto:</label>
            <select name='idProducto' value={producto || ''} onChange={handleProductoChange}>
                <option value=''>Seleccionar producto</option>
                {productos.map((prod) => (
                    <option key={prod.idProducto} value={prod.idProducto}>
                        {prod.nombre}
                    </option>
                ))}
            </select>
            <label>Cantidad:</label>
            <input type="number" name='cantidad' value={cantidad} onChange={(e)=>setCantidad(e.target.value)}></input>
            <label>Precio por unidad:</label>
            <input type="number" name='precioPorUnidad' value={precioPorUnidad} onChange={(e)=>setPrecioPorUnidad(e.target.value)}></input>
            <label>Unidad:</label>
            <select type="text" name='unidad' value={unidad || ''} onChange={(e)=>setUnidad(e.target.value)}>
                <option value='' disabled>Seleccionar unidad</option>
                <option value='m'>m</option>
                <option value='kg'>kg</option>
                <option value='uni'>uni</option>
            </select>
            <button onClick={()=>setAgregarProducto(false)}>Cancelar</button>
            <button onClick={onSubmit}>Agregar Producto</button>
            
        </div>
    );
}

export default agregarProducto;