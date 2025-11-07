import React from 'react';
import { Navigate } from 'react-router-dom';

function isAuthenticated() {
  return Boolean(localStorage.getItem('authToken'));
}

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default ProtectedRoute;


