import type { ReactNode } from 'react';

import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return children;
}
