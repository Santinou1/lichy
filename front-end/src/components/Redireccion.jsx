import { useNavigate } from "react-router-dom";
function Redireccion(){

    const navigate = useNavigate();
    return(
        <>
            <h1>Peticion exitosa</h1>
            <p>Se ha creado el contenedor exitosamente</p>
            <button onClick={()=>navigate('/nuevo-contenedor')}>Agregar otro contenedor</button>
            <button onClick={()=>navigate('/ver-contenedores')}>Ver contenedores</button>

        </>
    )
}

export default Redireccion;