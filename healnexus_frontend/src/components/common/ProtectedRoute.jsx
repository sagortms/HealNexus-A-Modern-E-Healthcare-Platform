import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');

    // 1. If no token exists, kick to login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    let decoded = null;
    try {
        // 2. Decode the token to check the user's role
        decoded = jwtDecode(token);
    } catch (error) {
        // If the token is invalid or expired, clear it and kick to login
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }

    // 3. If this route is restricted to specific roles, check it
    if (decoded && allowedRoles && !allowedRoles.includes(decoded.role)) {
        // Redirect to their proper dashboard instead
        if (decoded.role === 'patient') return <Navigate to="/patient" replace />;
        if (decoded.role === 'doctor') return <Navigate to="/doctor" replace />;
        if (decoded.role === 'admin') return <Navigate to="/admin" replace />;
    }

    // 4. If everything is good, render the page
    return children;
};

export default ProtectedRoute;