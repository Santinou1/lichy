import '../styles/Contenedor.css'
import { useNavigate } from 'react-router-dom';
function Contenedor({data, estado}){
    const navigate = useNavigate();
    const redirigir = () => { navigate(`/contenedor-detalle/${data.idContenedor}?volver=contenedores`)}
    return(
        <div className='contenedor-container'>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h2 className='titulo'> Interno {data.idContenedor}</h2>
                <label> Estado: <b>{data.estado ? data.estado : 'Sin estado'}</b></label>
                <label> Ubicacion: <b>{data.ubicacion ? data.ubicacion : 'Sin ubicacion'}</b></label>
                
                <button onClick={redirigir}>Ver mas detalles</button>
            </div> 
        </div>
    );
}

export default Contenedor;