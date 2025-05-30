import '../styles/Contenedor.css'
import { useNavigate } from 'react-router-dom';
function Contenedor({data, estado}){
    const navigate = useNavigate();
    const redirigir = () => { navigate(`/contenedor-detalle/${data.idContenedor}?volver=contenedores`)}
    
    // Definir el título a mostrar
    let titulo;
    if (data.comentario) {
        titulo = data.comentario;
    } else {
        titulo = `Interno ${data.idContenedor}`;
    }
    
    return(
        <div className="contenedor-container">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap: 'wrap'}}>
                <h2 className='titulo'>{titulo}</h2>
                
                <div className="contenedor-info">
                    {data.comentario && (
                        <label className="contenedor-nombre"> 
                            <b>{data.comentario}</b>
                        </label>
                    )}
                    <label> Estado: <b>{data.estado ? data.estado : 'Sin estado'}</b></label>
                    <label> Ubicacion: <b>{data.ubicacion ? data.ubicacion : 'Sin ubicacion'}</b></label>
                </div>
                
                <button onClick={redirigir}>Ver mas detalles</button>
            </div> 
        </div>
    );
}

export default Contenedor;