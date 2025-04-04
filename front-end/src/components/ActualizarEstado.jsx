import axios from "axios";
import { useEffect, useState } from "react";

function ActualizarEstado({setHistorial, contenedor, actualizarEstado,estad,ubicacio}){
    const [estado, setEstado] = useState(estad);
    const [ubicacion, setUbicacion] = useState('');
    const [estados, setEstados] = useState(null);
    const [fechaManual, setFechaManual] = useState('');
    const [ubicaciones, setUbicaciones] = useState(null);
    useEffect(()=>{
        axios.get('http://localhost:3000/api/items/categorias').then((response)=>{
            console.log(response.data);
            setEstados(response.data);

        })
    },[]);
    useEffect(()=>{
        axios.post('http://localhost:3000/api/items/ubicaciones',{estado: estado}).then((response)=>{
            console.log(response.data);
            setUbicaciones(response.data);

        })
    },[estado]);
    const onSubmit = (e) =>{
        e.preventDefault();
        axios.post('http://localhost:3000/api/contenedorEstado/',{contenedor,ubicacion,estado,fechaManual}).then((response)=>{
            setHistorial(response.data);
            actualizarEstado(estado);
        }).catch((error)=>{
            console.error('Error actualizando la categoria:', error);
        });
    }
    return(
        <form onSubmit={onSubmit}>
            <label>Nuevo estado:</label>
            <select value={estado} onChange={(e)=>{setEstado(e.target.value)}}>
                {
                    estados && estados.map((estado,index)=>(
                        <option key={index} value={estado.nombreCategoria}>
                            {estado.nombreCategoria}
                        </option>
                    ))
                }
            </select>
            <label>Nueva ubicacion:</label>
            <select value={ubicacion} onChange={(e)=>{setUbicacion(e.target.value)}} required>
                <option value='' disabled>Seleccione una opcion</option>
            {
                    ubicaciones && ubicaciones.map((ubicacion,index)=>(
                        <option key={index} value={ubicacion.nombreUbicacion}>
                            {ubicacion.nombreUbicacion}
                        </option>
                    ))
                }
            </select>
            <lable>Fecha: </lable>
            <input type='date' value={fechaManual} onChange={(e)=>{setFechaManual(e.target.value)}} required/>
            <button >Cambiar estado</button>
        </form>
    );
}
export default ActualizarEstado;