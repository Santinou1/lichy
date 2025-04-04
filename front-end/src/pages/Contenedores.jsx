import Contenedor from "../components/Contenedor";
import '../styles/Contenedores.css';
import NoItems from "../components/NoItems";
import { useState, useEffect } from "react";
import axios from "axios";
import { use } from "react";
function Contenedores(){
    const [data,setData]=useState([]);
    const [dataFiltrado, setDataFiltrado] = useState([]);
    const [categorias, setCategorias]  = useState([]);
    const [categoria, setCategoria]  = useState('Todos');
    const [ubicacion, setUbicacion] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const [ubicaciones, setUbicaciones] = useState([]);

    const handleCategoriaChange = (e) => {
        setCategoria(e.target.value); 
    };
    const handleUbicacionChange = (e) => {
        setUbicacion(e.target.value); 
    }
    useEffect(()=>{
        let filtrado = data;
        console.log('DATA:',data);
        if(categoria !== 'Todos'){
            filtrado = data.filter((item)=> item.categoria === categoria);
        }
        if(busqueda.trim() !== ""){
            filtrado = filtrado.filter((item)=>
                item.idContenedor.toString().startsWith(busqueda)
            );
        }
        if (ubicacion !== 'Todos') {
            // Filtra los elementos que coinciden con la ubicación
            filtrado = filtrado.filter((item) => {
                console.log(item.ubicacion + ' ' + ubicacion); // Depuración
                return item.ubicacion === ubicacion;
            });
        }
        setDataFiltrado(filtrado);
    },[categoria,busqueda,data,ubicacion]);
    
    useEffect(()=>{
        axios.get('http://localhost:3000/api/contenedores/').then((response)=>{
            console.log(response.data);
            setData(response.data);
            setDataFiltrado(response.data);
            setCargando(false);
        }).catch((error)=>{
            console.error('Error trayendo los contenedores:', error);
        });
        axios.get('http://localhost:3000/api/items/categorias').then((response)=>{
            console.log(response.data);
            setCategorias(response.data);

        }).catch((error)=>{ console.error('Error trayendo las categorias:', error);
        });
        axios.get('http://localhost:3000/api/items/ubicaciones').then((response)=>{
            console.log(response.data);
            setUbicaciones(response.data);
        }).catch((error)=>{ console.error('Error trayendo las ubicaciones:', error);
        });
    },[]);
    
    
    return(
        <div className='contenedores-container'>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h1 className='titulo'>Lista de contenedores</h1>
                <label>Categorias :  
                <select  value={categoria} onChange={handleCategoriaChange}>
                    <option value="Todos">Todos</option>
                    {categorias && categorias.map((cat, index) => (
                        <option key={index} value={cat.nombreCategoria}>
                        {cat.nombreCategoria}
                        </option>
                    ))}
                </select>
                </label>
                <label>Ubicaciones :  
                <select  value={ubicacion} onChange={handleUbicacionChange}>
                    <option value="Todos">Todos</option>
                    {ubicaciones.map((cat, index) => (
                        <option key={index} value={cat.nombreUbicacion}>
                        {cat.nombreUbicacion}
                        </option>
                    ))}
                </select>
                </label>
            </div>
            <hr></hr>
            <div style={{display:'flex', justifyContent:'space-between'}}>
                <h2 className='titulo'>{categoria}</h2>
                <input 
                    type='text'
                    value={busqueda}
                    onChange={(e)=> setBusqueda(e.target.value)}
                    className='input-buscar'
                    placeholder="Buscar por id"
                />
            </div>
            {cargando ? (
                <p>Cargando datos...</p>
            ) : dataFiltrado.length === 0 ? (
                <NoItems nombre='contenedores' />
            ) : (
                dataFiltrado.map((item) => (<Contenedor key={item.idContenedor} data={item} estado={categoria} />)
            ))}
            
            
        </div>
    );
}

export default Contenedores;