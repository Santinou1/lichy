import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmarEliminar from "../components/ConfirmarEliminar";
import DesglozarPorcolor from "../components/DesglozarPorColor";
import { useUserContext } from "../UserProvider";
function ActualizarProductos(){

    const { user } = useUserContext();
    const {id} = useParams();
    const [contenedorProducto, setContendorProducto] = useState(null);
    const [colores, setColores] = useState([]);
    const [color, setColor] = useState(false);
    const [producto, setProducto] = useState(null);
    const [productos, setProductos] = useState([]);
    const [motivo, setMotivo] = useState('');
    const [cantidadRestante, setCantidadRestante] = useState(0);
    const [coloresAsignados, setColoresAsignados] = useState([]);
    const [dataAnterior, setDataAnterior] = useState(null);
    const nav = useNavigate();

    const volver = ()=>{
        nav(`/contenedor-detalle/${contenedorProducto.contenedor}`);
    }
    const handleColoresAsignadosChange = (nuevosColoresAsignados) => {
        setColoresAsignados(nuevosColoresAsignados);

        // Si no hay cantidad restante, actualiza la cantidad original a 0
        if (cantidadRestante === 0) {
            setContendorProducto((prev) => ({
                ...prev,
                cantidad: 0, // Actualiza la cantidad original a 0
            }));
        }
    };
    const handleCantidadRestanteChange = (nuevaCantidadRestante) => {
        setCantidadRestante(nuevaCantidadRestante);
    };
    useEffect(()=>{
        axios.get(`http://localhost:3000/api/contenedorProducto/producto/${id}`).then((response)=>{
            console.log(response.data[0]);
            setContendorProducto(response.data[0]);
            setDataAnterior(response.data[0]);
            setCantidadRestante(response.data[0].cantidad);
            setColor(response.data[0].idColor);
            setProducto(response.data[0].idProducto);
           
        }).catch((error)=>{
            console.error("Error trayendo producto de contenedor:", error);
        });
        axios.get('http://localhost:3000/api/items/color').then((response)=>{
            setColores(response.data);
        }).catch((error)=>{
            console.error("Error trayendo colores:", error);
        });
        axios.get('http://localhost:3000/api/items/color').then((response)=>{
            setColores(response.data);
        });
        axios.get('http://localhost:3000/api/items/producto').then((response)=>{
            setProductos(response.data);
        });
    },[]);
    useEffect(()=>{
        setProducto(productos.find((prod)=>prod.idProducto === contenedorProducto.idProducto));
    },[productos]);
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setContendorProducto({
            ...contenedorProducto,
            [name]: value,
        });
    };
    const onSubmit = async(e)=>{
        e.preventDefault();
        
        const datosActualizados = {
        
            producto: contenedorProducto.idProducto, // ID del producto
            cantidad: cantidadRestante === 0 ? cantidadRestante : contenedorProducto.cantidad,
            unidad: contenedorProducto.unidad,
            color: contenedorProducto.idColor,
            precioPorUnidad: contenedorProducto.precioPorUnidad,
            coloresAsignados: coloresAsignados,
            contenedor: contenedorProducto.contenedor,
            item_proveedor: contenedorProducto.item_proveedor,
            motivo:motivo,
            dataAnterior: dataAnterior,
            usuarioCambio: user.idUsuario,
        };
        console.log(coloresAsignados)
        try {
            const response = await axios.put(`http://localhost:3000/api/contenedorProducto/${contenedorProducto.idContenedorProductos}`, datosActualizados);
            if (response.status === 200) {
                
                
                console.log(response.data);
                volver();
           
            }
        } catch (error) {
            console.error('Error al actualizar el producto:', error);
            alert('Hubo un error al actualizar el producto.');
        }
    }
    return (
        <div className='nuevo-contenedor-container'>
            <button onClick={volver}>Volver</button>
            {
                !contenedorProducto ? <p>Cargando...</p> :<>
                <h1  className='titulo'> Actualizar {producto.nombre} de contendor {id}</h1>
                <div className='input-container'>
                    <label>Producto:</label>
                    <select name='idProducto' value={contenedorProducto.idProducto || ''} onChange={handleInputChange}>
                        <option value=''>Seleccionar producto</option>
                        {productos.map((prod) => (
                                    <option key={prod.idProducto} value={prod.idProducto}>
                                        {prod.nombre}
                                    </option>
                                ))}
                    </select>
                </div>
                <div className='input-container'>
                <label>Color:</label>
                {
                    color ? 
                    <select value={contenedorProducto.idColor || ''} onChange={handleInputChange}>
                        <option value=''>Seleccionar color</option>
                        {colores.map((color) => (
                            <option key={color.idColor} value={color.idColor}>
                                {color.nombre}
                            </option>))}
                    </select> : <DesglozarPorcolor 
                                    producto={contenedorProducto} 
                                    colores={colores}
                                    onColoresAsignadosChange={handleColoresAsignadosChange}
                                    onCantidadRestanteChange={handleCantidadRestanteChange}
                                />
                }
                </div>
                <div className='input-container'>
                    <label>Cantidad:</label>
                    <input 
                        type='number'
                        name='cantidad' 
                        value={contenedorProducto.cantidad || ''}
                        onChange={handleInputChange} />
                </div>
                <div className='input-container'>
                    <label>Unidad:</label>
                    <select
                        type='text'
                        name='unidad'
                        value={contenedorProducto.unidad || ''}
                        onChange={handleInputChange}
                    >
                        <option value='' disabled>Seleccionar unidad</option>
                        <option value='m'>m</option>
                        <option value='kg'>kg</option>
                        <option value='uni'>uni</option>
                    </select>
                </div>
                <div className='input-container'>
                    <label>FOB:</label>
                    <input 
                        type='number' 
                        name='precioPorUnidad' 
                        placeholder='Precio por unidad' 
                        value={contenedorProducto.precioPorUnidad || ''} 
                        onChange={handleInputChange} 
                    />
                </div>
                <div className='input-container'>
                    <label htmlFor='fob'>Item Proveedor:</label>
                    <input type='text' name='item_proveedor'  value={contenedorProducto.item_proveedor || ''}  onChange={handleInputChange}/> 
                </div>
                <div className='input-container'>
                    <label>Motivo de actualizacion:</label>
                    <input type='text' name='motivo' value={motivo} onChange={(e)=>{setMotivo(e.target.value)}}></input>
                </div>
                <ConfirmarEliminar id={id} tipo={'ContenedorProducto'} motivo={motivo} usuario={user.idUsuario} contenedor={contenedorProducto.contenedor}/>
            </>

            }
           
            
            <button onClick={onSubmit}>Actualizar</button>
            
          

        </div>
    );
}

export default ActualizarProductos;