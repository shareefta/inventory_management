import type { ReactNode } from 'react';

import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Optional: Handle unauthorized access to wrong dashboard
  // if (location.pathname === '/dashboard/admin' && user.role !== 'Admin') {
  //   return <Navigate to="/" replace />;
  // }

  return children;
}
