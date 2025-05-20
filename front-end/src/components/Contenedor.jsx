import '../styles/Contenedor.css'
import { useNavigate } from 'react-router-dom';
function Contenedor({data, estado}){
    const navigate = useNavigate();
    const redirigir = () => { navigate(`/contenedor-detalle/${data.idContenedor}?volver=contenedores`)}
    
    // Comprobar si es un contenedor predeterminado
    const esPredeterminado = data.categoria === 'Predeterminado';
    const esLichy = esPredeterminado && data.comentario === 'Lichy';
    const esMitre = esPredeterminado && data.comentario === 'Mitre';
    
    // Definir la clase CSS según el tipo de contenedor
    const contenedorClass = `contenedor-container ${esPredeterminado ? 'contenedor-predeterminado' : ''} ${esLichy ? 'contenedor-lichy' : ''} ${esMitre ? 'contenedor-mitre' : ''}`;
    
    // Definir el título a mostrar
    let titulo;
    if (data.comentario) {
        // Si hay un comentario, usarlo como título principal
        titulo = data.comentario;
        // Añadir una estrella si es predeterminado
        if (esPredeterminado) {
            titulo = `${titulo} ⭐`;
        }
    } else {
        titulo = `Interno ${data.idContenedor}`;
    }
    
    return(
        <div className={contenedorClass}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap: 'wrap'}}>
                <h2 className='titulo'>{titulo}</h2>
                {esPredeterminado && (
                    <span className="contenedor-predeterminado-badge">Predeterminado</span>
                )}
                
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