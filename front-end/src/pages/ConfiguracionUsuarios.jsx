
import { useState, useEffect } from "react";
import ListaDeUsuarios from "../components/ListaDeUsarios";
import CrearUsuario from "../components/CrearUsuario";
import "../styles/ConfiguracionUsuarios.css";
function ConfiguraciónUsuarios(){
    const [usuarios, setUsuarios] = useState([]);
    return(
        <div className="container-configuracion-usuarios">
            <ListaDeUsuarios usuarios={usuarios} setUsuarios={setUsuarios} />
            <CrearUsuario setUsuarios={setUsuarios}/>
        </div>
    );
}

export default ConfiguraciónUsuarios;