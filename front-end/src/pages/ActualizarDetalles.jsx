import axios from "axios";
import { useState, useEffect } from "react";
import '../styles/ActualizarDetalles.css';
function ActualizarDetalles({data, setData, actualizarDetalles}){

    const [proveedores, setProveedores] = useState([]);
    const [nuevaData, setNuevaData] = useState(data); 
    const onSubmit= (e) =>{
        e.preventDefault();
        axios.put(`http://localhost:3000/api/contenedores/detalle/${data.idContenedor}`,nuevaData).then((response)=>{
            console.log(response.data[0])
            setData(response.data[0]);
            actualizarDetalles();
        }).catch((error) => {
            console.error("Error al actualizar los datos:", error);
          });
    }
    const handleChange = (e) => {
        const { name, value } = e.target;
        setNuevaData((prevState) => ({
            ...prevState,
            [name]: value,
          }));
    }
    useEffect(()=>{
        console.log(nuevaData)
        axios.get('http://localhost:3000/api/items/proveedor/').then((response)=>{

            setProveedores(response.data);
        });
    },[]);
    return(
        <>
        <form className="form-actualizar-detalles">
            <select 
                name="proveedor" 
                value={nuevaData.proveedor || ""}
                onChange={handleChange}
            >
                {proveedores.map((proveedor)=>(
                    <option key={proveedor.idProveedor} value={proveedor.idProveedor}>
                        {proveedor.nombre}
                    </option>
                ))}
            </select>
            <input name="factura" value={nuevaData.factura || ""} onChange={handleChange}></input>
            <input name="forwarder" value={nuevaData.forwarder || ""} onChange={handleChange}></input>
            <input name="comentario" value={nuevaData.comentario || ""} onChange={handleChange}></input>
            <input name="sira" value={nuevaData.sira || ""} onChange={handleChange}></input>
            <input name="vep" value={nuevaData.vep || ""} onChange={handleChange}></input>
            <input name="codigoContenedor" value={nuevaData.codigoContenedor || ""} onChange={handleChange}></input>

           

        </form>
        <br></br>
         <button onClick={onSubmit} style={{width:"10%"}}>Actualizar</button>
        </>
    );
}

export default ActualizarDetalles;