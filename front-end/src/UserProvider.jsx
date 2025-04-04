import React, { useState, useContext } from 'react';
import axios from 'axios';

const UserContext = React.createContext();
const UserToggleContext = React.createContext();

export const useUserContext = () => {
    return useContext(UserContext);
};

export const useUserToggleContext = () => {
    return useContext(UserToggleContext);
};

const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const login = async (email, contrasena) => {
        try {
            const response = await axios.post('http://localhost:3000/api/usuarios/login', { email, contrasena });
            if(response.status === 200) {
                const userData = response.data;
                if (typeof userData.permisos === "string") {
                    userData.permisos = JSON.parse(userData.permisos);
                }
                setUser(userData);
                
            }
        } catch (error) {
            if(error.response) {
                setError(error.response.data || 'Credenciales incorrectas');
            }else{
                setError('Error en el servidor');
            }
            setUser(null);
        }
    };  
    const logout = () => {
        setUser(null);
        setError(null);
    };

    return (
        <UserContext.Provider value={{ user, error }}>
            <UserToggleContext.Provider value={{ login, logout }}>
                {children}
            </UserToggleContext.Provider>    
        </UserContext.Provider>
    );
};

export default UserProvider;