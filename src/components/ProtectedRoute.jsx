import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userRole, loading } = useAuth();

  // If AuthContext is still loading initial state, you might want to show a loader here
  // But we handle loading in AuthContext to block rendering children

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified and user role is loaded, verify
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // Redirect to their respective dashboard
    if (userRole === 'patient') return <Navigate to="/patient" replace />;
    if (userRole === 'driver') return <Navigate to="/driver" replace />;
    if (userRole === 'hospital') return <Navigate to="/hospital" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
