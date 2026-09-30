/**
 * @file src/components/auth/ProtectedRoute.tsx
 * @description Route guard ensuring only authenticated sessions access protected views.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { session } = useApp();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
