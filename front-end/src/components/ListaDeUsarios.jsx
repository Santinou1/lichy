import axios from "axios";
import { useEffect } from "react";
function ListaDeUsuarios({ usuarios, setUsuarios }){

    useEffect(()=>{

        axios.get('http://localhost:3000/api/usuarios/test').then((response)=>{
            setUsuarios(response.data);
        }).catch((error) => {
            console.error("Error al obtener la lista de usuarios:", error);
        });
    },[setUsuarios]);
    return(
    <div className="container-lista-usuarios">
        <h1>Lista de usuarios</h1>
        <ul>
        {usuarios.map((usuario, index) => (
            <li key={index}>
                <div>Email: {usuario.email}</div>
                <div>Tipo de Usuario: {usuario.tipoUsuario}</div>
                <div>Permisos: {usuario.permisos}</div>
            </li>
        ))}
        </ul>
    </div>);
}

export default ListaDeUsuarios;