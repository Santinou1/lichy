import axios from "axios";
import { useState,useEffect } from "react";
import Permisos from "./Permisos";
import { permisosPredeterminados } from "../utils/getPermisos";
function CrearUsuario({ setUsuarios }) {
    const [formData, setFormData] = useState({
        nombre: "",
        email: "",
        contrasena: "",
        tipoUsuario: "",
    });
    const [permisos, setPermisos] = useState({})
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSend = { ...formData, permisos };
        axios
            .post("http://localhost:3000/api/usuarios/agregar", dataToSend)
            .then(() => {
                alert("Usuario creado exitosamente");
                axios.get("http://localhost:3000/api/usuarios/test")
                    .then((response) => {
                        setUsuarios(response.data);
                    });
            })
            .catch((error) => {
                alert("Error al crear el usuario");
                console.error(error);
            });
    };
    useEffect(() => {
        if (formData.tipoUsuario) {
            setPermisos(permisosPredeterminados[formData.tipoUsuario] || {});
        }
    }, [formData.tipoUsuario]);
    const setTipoUsuarioPersonalizado = () => {
        setFormData((prev) => ({ ...prev, tipoUsuario: "personalizado" }));
    };
    return (
        <div className="container-lista-usuarios">
            <h1>Crear Usuario</h1>
            <form className='form-nuevo-usuario' onSubmit={handleSubmit}>
                <div className='input-container-usuario'>
                    <label>Nombre:</label>
                    <br></br>
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className='input-container-usuario'>
                    <label>Email:</label>
                    <br></br>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className='input-container-usuario'>
                    <label>Contraseña:</label>
                    <br></br>
                    <input
                        type="password"
                        name="contrasena"
                        value={formData.contrasena}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className='input-container-usuario'> 
                    <label>Tipo de Usuario:</label>
                    <br></br>
                    <select
                        name="tipoUsuario"
                        value={formData.tipoUsuario}
                        onChange={handleChange}
                        required
                    >
                        <option value="personalizado">Personalizado</option>
                        <option value="admin">Admin</option>
                        <option value="flujo">flujo</option>
                        <option value="status">status</option>
                    </select>
                    <Permisos permisos={permisos} setPermisos={setPermisos} setTipoUsuarioPersonalizado={setTipoUsuarioPersonalizado} />
                </div>
                <button type="submit" style={{marginTop:"15px"}}>Crear Usuario</button>
            </form>
        </div>
    );
}

export default CrearUsuario;
