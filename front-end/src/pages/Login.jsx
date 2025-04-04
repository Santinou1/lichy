import imagenLogo from '../images/logo-lichytex.png';
import React,{useState} from 'react';
import '../styles/Login.css';
import { useUserContext,useUserToggleContext } from '../UserProvider';
import { Navigate } from 'react-router-dom';

function Login(){
    const { user, error} = useUserContext();
    const { login } = useUserToggleContext();
    const [email, setEmail] = useState('');
    const [contrasena, setContrasena] = useState('');

    const handleSubmit = async(e) => {
        e.preventDefault();
        await login(email, contrasena);
    };
    if(user){
        const permisoVer = Object.keys(user.permisos).find(permiso => permiso.startsWith('Ver-'));

        // Si encuentra un permiso "Ver", redirige a la página correspondiente
        if (permisoVer && permisoVer !== 'Ver-Items') {
            return <Navigate to={`/${permisoVer.toLowerCase()}`} />;
        }

        // Si no tiene permisos de "Ver", redirige a la página de bienvenida por defecto
        return <Navigate to='/bienvenido' />;
       
    }
    return(
        <div className='contenedor-login'>
            <form className='login-form' onSubmit={handleSubmit}>
                <h2 className="titulo-login">Gestión de</h2>
                <img src={imagenLogo} alt='Logo de Lichy'/>
                {error && <p className='error-message'>{error}</p>}
                <label htmlFor="email">
                    Usuario:
                    <input 
                        id="email" 
                        name="email" 
                        value={email} 
                        type="text" 
                        className='input-login'
                        onChange={(e) => setEmail(e.target.value)}
                        required    
                    />
                </label>
                <label htmlFor="contrasena">
                    Contraseña:
                    <input 
                        id="contrasena" 
                        name="contrasena"
                        type="password" 
                        className='input-login' 
                        value={contrasena}
                        onChange={(e) => setContrasena(e.target.value)}
                        required
                    />
                </label>
                <button className='boton-login'> Iniciar sesion</button>
            </form>
        
      </div>
    );
}

export default Login;