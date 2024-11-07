// src/components/ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode as jwt_decode } from 'jwt-decode';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decodedToken = jwt_decode(token);
        if (decodedToken.exp * 1000 > Date.now()) {
          setIsLoading(false); // Token is valid, allow access
          return;
        } else {
          localStorage.removeItem('token'); // Token expired, remove it
        }
      } catch (error) {
        console.error('Token error:', error);
        localStorage.removeItem('token');
      }
    }
    // Redirect to login if token is invalid or missing
    navigate('/login');
  }, [navigate]);

  // While loading, you can render a loader or return null
  if (isLoading) {
    return <div>Loading...</div>; // or a loading spinner component
  }

  return children; // Render the protected component if token is valid
};

export default ProtectedRoute;
