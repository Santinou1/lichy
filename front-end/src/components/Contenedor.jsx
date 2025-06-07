import '../styles/Contenedor.css'
import { useNavigate } from 'react-router-dom';
function Contenedor({data, estado}){
    const navigate = useNavigate();
    const redirigir = () => { navigate(`/contenedor-detalle/${data.idContenedor}?volver=contenedores`)}
    
    // Determinar si es un contenedor predeterminado
    const esPredeterminado = data.codigoContenedor === 'MITRE-001' || data.codigoContenedor === 'LICHY-001';
    const tipoContenedor = data.codigoContenedor === 'MITRE-001' ? 'mitre' : 
                          data.codigoContenedor === 'LICHY-001' ? 'lichy' : '';
    
    // Definir el título a mostrar
    let titulo;
    if (data.comentario) {
        titulo = data.comentario;
    } else {
        titulo = `Interno ${data.idContenedor}`;
    }

    // Construir las clases del contenedor
    const containerClasses = `contenedor-container ${esPredeterminado ? 'contenedor-predeterminado contenedor-' + tipoContenedor : ''}`;
    
    return(
        <div className={containerClasses}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap: 'wrap'}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    {esPredeterminado && (
                        <span className="contenedor-predeterminado-badge">
                            ★ Predeterminado
                        </span>
                    )}
                    <h2 className='titulo'>{titulo}</h2>
                </div>
                
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