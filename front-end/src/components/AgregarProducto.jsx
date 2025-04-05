import axios from "axios";
import { useEffect, useState } from "react";
function agregarProducto({setAgregarProducto,contenedor,actualizarLista}){
    const [productos, setProductos] = useState([]);
    const [producto, setProducto] = useState(null);
    const [cantidad, setCantidad] = useState(null);
    const [precioPorUnidad, setPrecioPorUnidad] = useState(null);
    const [unidad, setUnidad] = useState(null);
    const [cantidadAlternativa, setCantidadAlternativa] = useState(null);
    const [unidadAlternativa, setUnidadAlternativa] = useState(null);

    
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
            
            // Establecer la unidad alternativa predeterminada según la unidad principal
            if (selectedProduct.unidadPredeterminada === 'm' || selectedProduct.unidadPredeterminada === 'kg') {
                setUnidadAlternativa('rollos');
            } else if (selectedProduct.unidadPredeterminada === 'uni') {
                setUnidadAlternativa('cajas');
            } else {
                setUnidadAlternativa(null);
            }
        } else {
            setUnidad(null); // Si no se encuentra el producto, resetear la unidad
            setUnidadAlternativa(null);
        }
    };
    
    // Actualiza automáticamente la unidad alternativa cuando cambia la unidad principal
    const handleUnidadChange = (e) => {
        const nuevaUnidad = e.target.value;
        setUnidad(nuevaUnidad);
        
        // Aplicar la regla de validación: m/kg -> rollos, uni -> cajas
        if (nuevaUnidad === 'm' || nuevaUnidad === 'kg') {
            setUnidadAlternativa('rollos');
        } else if (nuevaUnidad === 'uni') {
            setUnidadAlternativa('cajas');
        } else {
            setUnidadAlternativa(null);
        }
    };

    const onSubmit = async()=>{
        const datos = {
            contenedor:contenedor,
            producto: producto,
            cantidad: cantidad,
            precioPorUnidad: precioPorUnidad,
            unidad: unidad,
            cantidadAlternativa: cantidadAlternativa,
            unidadAlternativa: unidadAlternativa
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
            <select type="text" name='unidad' value={unidad || ''} onChange={handleUnidadChange}>
                <option value='' disabled>Seleccionar unidad</option>
                <option value='m'>m</option>
                <option value='kg'>kg</option>
                <option value='uni'>uni</option>
            </select>
            
            <div style={{ marginTop: '15px', borderTop: '1px solid #ccc', paddingTop: '15px' }}>
                <h4>Medición Alternativa</h4>
                <label>Cantidad Alternativa:</label>
                <input 
                    type="number" 
                    name='cantidadAlternativa' 
                    value={cantidadAlternativa || ''} 
                    onChange={(e)=>setCantidadAlternativa(e.target.value)}
                    placeholder="Cantidad en rollos/cajas"
                />
                
                <label>Unidad Alternativa:</label>
                <select 
                    name='unidadAlternativa' 
                    value={unidadAlternativa || ''} 
                    disabled={true} // Siempre deshabilitado, se selecciona automáticamente
                >
                    <option value='' disabled>Seleccionar unidad alternativa</option>
                    <option value='rollos'>Rollos</option>
                    <option value='cajas'>Cajas</option>
                </select>
                <p style={{ fontSize: '0.8em', color: '#666' }}>
                    {unidad === 'm' || unidad === 'kg' ? 'Para productos medidos en m o kg, se usa automáticamente rollos' : 
                     unidad === 'uni' ? 'Para productos medidos en unidades, se usa automáticamente cajas' : 
                     'Seleccione una unidad principal primero'}
                </p>
            </div>
            
            <button onClick={()=>setAgregarProducto(false)}>Cancelar</button>
            <button onClick={onSubmit}>Agregar Producto</button>
            
        </div>
    );
}

export default agregarProducto;