import { useNavigate } from "react-router-dom";
import '../styles/Navegador.css';
import { useState } from "react";
import { useUserToggleContext } from "../UserProvider";
function Navegador({user}){
    const { logout } = useUserToggleContext();
    const navigate = useNavigate();
    const redirigir = (link) =>{
      navigate(link)
    }
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const toggleDropdown = () => {
      setIsDropdownOpen(!isDropdownOpen);
    };
    
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
                user.permisos["Ver-Items"] || user.permisos["Crear-Items"] ? <li style={{ marginRight: "20px", position: "relative" }}>
                <button className="boton-navegador" onClick={toggleDropdown}>
                  Configuración de items
                </button>
                {isDropdownOpen && (
                  <ul className="dropdown-menu">
                    <li>
                      <button className="boton-navegador" 
                      onClick={()=>{redirigir('/ver-items/producto')
                      toggleDropdown()
                      }}>
                        Agregar producto
                      </button>
                    </li>
                    <li>
                      <button className="boton-navegador" onClick={()=>{redirigir('/ver-items/color')
                         toggleDropdown()
                      }}>
                        Agregar Color
                      </button>
                    </li>
                    <li>
                      <button className="boton-navegador" onClick={()=>{redirigir('/ver-items/proveedor')
                         toggleDropdown()
                      }}>
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