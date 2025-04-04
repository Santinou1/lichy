import { useState } from "react";
function Permisos({permisos,setPermisos,setTipoUsuarioPersonalizado}){
    
    const acciones = ["Ver", "Editar", "Crear"];
    const opciones = ["Contenedores", "Items", "Productos", "Usuarios"];

    
    const handleCheckboxChange = (accion, opcion) => {
        setPermisos((prev) => {
            return {
                ...prev,
                [`${accion}-${opcion}`]: !prev[`${accion}-${opcion}`] || false, 
            };
        });
    
        setTipoUsuarioPersonalizado(); 
        
    };

    return (
        <div className="permisos-container">
            {   acciones.map((accion) => (
                <div key={accion} className={`display-container`}>
                  
                    <label>{accion}:</label>
                    {opciones.map((opcion) => (
                        <div key={opcion} className="permiso-opcion">
                            <input
                                type="checkbox"
                                id={`${accion.toLowerCase()}-${opcion.toLowerCase()}`}
                                name={`${accion.toLowerCase()}-${opcion.toLowerCase()}`}
                                checked={!!permisos[`${accion}-${opcion}`]}
                                onChange={() => handleCheckboxChange(accion, opcion)}
                            />
                            <label htmlFor={`${accion.toLowerCase()}-${opcion.toLowerCase()}`}>
                                {opcion}
                            </label>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export default Permisos;