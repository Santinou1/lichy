import { useNavigate } from "react-router-dom";
import '../styles/Navegador.css';
import { useState, useRef, useEffect } from "react";
import { useUserToggleContext } from "../UserProvider";

function Navegador({user}){
    const { logout } = useUserToggleContext();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const timeoutRef = useRef(null);
    
    const redirigir = (link) =>{
      navigate(link);
      setIsDropdownOpen(false); // Cerrar el menú al navegar
    }
    
    const toggleDropdown = () => {
      setIsDropdownOpen(!isDropdownOpen);
    };
    
    const handleMouseEnter = () => {
      // Cancelar cualquier timeout pendiente cuando el mouse entra al área
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    
    const handleMouseLeave = () => {
      // Configurar un timeout para cerrar el menú después de un breve retraso
      // para evitar cierres accidentales cuando el usuario mueve el cursor
      timeoutRef.current = setTimeout(() => {
        setIsDropdownOpen(false);
      }, 300); // 300ms de retraso
    };
    
    // Limpiar el timeout cuando el componente se desmonta
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);
    
    return(
      <div className='contenedor-navegador'>
          <nav style={{display:"flex",listStyleType:"none", marginRight: "20px", alignItems:'center', height:'100%'}}>
            <ul style={{display:"flex",listStyleType:"none",padding:0,margin:0}}>
              { user.permisos["Ver-Contenedores"] ? 
              <li style={{marginRight: "20px"}}>
                <button className='boton-navegador' onClick={()=>redirigir('/ver-contenedores')}>Contenedores</button>
              </li> : <></>
              }

              {
                user.permisos["Crear-Contenedores"] ? 
                  <li style={{marginRight: "20px"}}>
                    <button className='boton-navegador' onClick={()=>redirigir('/nuevo-contenedor')}>Agregar Contenedor</button>
                  </li> : <></>
              }
              { user.permisos["Ver-Productos"] ?
              <li style={{marginRight: "20px"}}>
                <button className='boton-navegador' onClick={()=>redirigir('/ver-productos')}>Lista de productos</button>
              </li> : <></>
              }
              {
                user.permisos["Ver-Items"] || user.permisos["Crear-Items"] ? <li style={{ marginRight: "20px", position: "relative" }} ref={dropdownRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <button className="boton-navegador" onClick={toggleDropdown}>
                  Configuración de items
                </button>
                {isDropdownOpen && (
                  <ul className="dropdown-menu">
                    <li>
                      <button className="boton-navegador" 
                      onClick={()=>redirigir('/ver-items/producto')}>
                        Agregar producto
                      </button>
                    </li>
                    <li>
                      <button className="boton-navegador" onClick={()=>redirigir('/ver-items/color')}>
                        Agregar Color
                      </button>
                    </li>
                    <li>
                      <button className="boton-navegador" onClick={()=>redirigir('/ver-items/proveedor')}>
                        Agregar Proveedor
                      </button>
                    </li>
                  </ul>
                )}
              </li>: <></>
              }
              
              
      
              
              {
                user.permisos["Ver-Usuarios"] || user.permisos["Crear-Usuarios"]? <>
                <li style={{marginRight: "20px"}}>
                <button className='boton-navegador' onClick={()=>redirigir('/ver-usuarios')}>Configuración de usuarios</button> 
                </li>
                </>:
                <></>
              }            
              
            </ul>
        </nav>
        <button className="boton-navegador" onClick={logout}>Cerrar sesion</button>
      </div>
  );
}
export default Navegador;