import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const location = useLocation();
  const credentials = sessionStorage.getItem('adminCredentials');

  if (!credentials) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute; 