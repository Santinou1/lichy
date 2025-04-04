import '../styles/Producto.css';
import {useNavigate} from 'react-router-dom';
function ProductoLista({data}){

    const navigate = useNavigate();
    const redirigir = ()=>{navigate(`/producto-detalle/${data.idProducto}`)}
    return(
        <div className='producto-pagina-container'>
            <div style={{display:'flex', justifyContent:'space-between'}}>
                <label><b>{data.nombre}</b></label>
                <button onClick={redirigir}>Ver mas detalles</button>
            </div>
            <hr></hr>
        </div>
    );
}

export default ProductoLista;