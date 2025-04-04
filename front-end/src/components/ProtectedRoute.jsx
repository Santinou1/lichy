import { Navigate, Outlet } from "react-router-dom";

export function ProtectedRoute({ children, user, requiredPermission}) {
    if (!user) {
        return <Navigate to="/" />;
    }
    const userPermissions = user.permisos || {};

    if (!userPermissions[`Ver-${requiredPermission}`]) {
        return <Navigate to="/bienvenido" />;
    }

    return children ? children : <Outlet />;
}