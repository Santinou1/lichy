import axios from "axios";
import { useEffect, useState } from "react";

function ActualizarEstado({setHistorial, contenedor, actualizarEstado,estad,ubicacio}){
    const [estado, setEstado] = useState(estad);
    const [ubicacion, setUbicacion] = useState('');
    const [estados, setEstados] = useState(null);
    
    // Formatear la fecha actual en formato YYYY-MM-DD para usarla como valor por defecto
    const hoy = new Date();
    const fechaActual = hoy.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    const [fechaManual, setFechaManual] = useState(fechaActual);
    const [ubicaciones, setUbicaciones] = useState(null);
    const [autoSeleccionarUbicacion, setAutoSeleccionarUbicacion] = useState(false);
    useEffect(()=>{
        axios.get('http://localhost:5000/api/items/categorias').then((response)=>{
            console.log(response.data);
            setEstados(response.data);

        })
    },[]);
    useEffect(()=>{
        axios.post('http://localhost:5000/api/items/ubicaciones',{estado: estado}).then((response)=>{
            console.log(response.data);
            setUbicaciones(response.data);
            
            // Si el estado es "Completo Pedido", activar la auto-selección de ubicación
            if (estado === "Completo Pedido") {
                setAutoSeleccionarUbicacion(true);
                // Buscar la ubicación "Mitre" en los datos recibidos
                const ubicacionMitre = response.data.find((ubicacion) => ubicacion.nombreUbicacion === "Mitre");
                if (ubicacionMitre) {
                    setUbicacion(ubicacionMitre.nombreUbicacion);
                }
            } else {
                setAutoSeleccionarUbicacion(false);
                setUbicacion(''); // Resetear la ubicación cuando cambia el estado
            }
        })
    },[estado]);
    const onSubmit = (e) =>{
        e.preventDefault();
        
        // Si no se ha especificado una fecha, usar la fecha actual
        const fechaAEnviar = fechaManual || fechaActual;
        
        axios.post('http://localhost:5000/api/contenedorEstado/',{contenedor,ubicacion,estado,fechaManual: fechaAEnviar}).then((response)=>{
            setHistorial(response.data);
            actualizarEstado(estado);
        }).catch((error)=>{
            console.error('Error actualizando la categoria:', error);
        });
    }
    
    // Manejador para cuando se selecciona una ubicación
    const handleUbicacionChange = (e) => {
        const selectedUbicacion = e.target.value;
        setUbicacion(selectedUbicacion);
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
            <select 
                value={ubicacion} 
                onChange={handleUbicacionChange} 
                required
                className={autoSeleccionarUbicacion ? 'auto-select-ubicacion' : ''}
            >
                <option value='' disabled>Seleccione una opcion</option>
            {
                    ubicaciones && ubicaciones.map((ubicacion,index)=>(
                        <option key={index} value={ubicacion.nombreUbicacion}>
                            {ubicacion.nombreUbicacion}
                        </option>
                    ))
                }
            </select>
            {autoSeleccionarUbicacion && (
                <p className="auto-select-hint">Al seleccionar una ubicación, se establecerá automáticamente para el estado "Completo Pedido"</p>
            )}
            <label>Fecha: </label>
            <input 
                type='date' 
                value={fechaManual} 
                onChange={(e)=>{setFechaManual(e.target.value)}} 
                placeholder={fechaActual}
                title="Si no selecciona una fecha, se usará la fecha actual"
            />
            <button >Cambiar estado</button>
        </form>
    );
}
export default ActualizarEstado;