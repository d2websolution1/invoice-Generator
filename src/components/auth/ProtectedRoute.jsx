import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../../services/authService";

/**
 * ProtectedRoute layout component.
 * Validates active admin session: if yes, renders children routes; if no, redirects to login.
 */
const ProtectedRoute = () => {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
};

export default ProtectedRoute;
