import axios from "axios";
import React, { useEffect, useState } from "react";
import { use } from "react";
function ActualizarCategoria({setMostrarActualizarCategoria,setData,id,categoriaDetalle}){
    const [categorias, setCategorias]  = useState([]);
    const [categoria, setCategoria]  = useState(categoriaDetalle);
    useEffect(()=>{
        axios.get('http://localhost:3000/api/items/categorias').then((response)=>{
            console.log(response.data);
            setCategorias(response.data);

        }).catch((error)=>{ console.error('Error trayendo las categorias:', error);
        });
    },[]);

    const actualizarCategoria = (e)=>{
        e.preventDefault();
        axios.put(`http://localhost:3000/api/contenedores/categoria/${id}`,{categoria}).then((response)=>{
            console.log(response.data);
            const categoriaNueva = response.data[0].categoria;
            setData({...setData, categoria: categoriaNueva});
            setMostrarActualizarCategoria(false);
        }).catch((error)=>{
            console.error('Error actualizando la categoria:', error);
        });
    }
    const handleCategoriaChange = (e) => {
        setCategoria(e.target.value);
    }
    return(
        <>
        <form onSubmit={actualizarCategoria}>
            <select  value={categoria} onChange={handleCategoriaChange}>
            
            {categorias.map((cat, index) => (
                <option key={index} value={cat.nombreCategoria}>
                {cat.nombreCategoria}
                </option>
            ))}
            </select>
            <button>Cambiar</button>
        </form>
            <button onClick={()=>setMostrarActualizarCategoria(false)}>Cancelar</button>
        </>
    );
}

export default ActualizarCategoria;