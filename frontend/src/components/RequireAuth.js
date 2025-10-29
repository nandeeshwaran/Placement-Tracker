import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/**
 * RequireAuth: component to wrap routes that need authentication and specific roles
 * props:
 *  - allowedRoles: array of roles e.g. ['admin']
 */
export default function RequireAuth({ children, allowedRoles = [] }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.isAuthenticated) {
    // not logged in -> go to login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(auth.role)) {
    // logged in but no permission -> redirect to student's overview or admin home based on role
    if (auth.role === 'student') return <Navigate to="/placement" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
