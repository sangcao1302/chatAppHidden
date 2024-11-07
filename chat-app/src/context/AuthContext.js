import React, { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [userId, setUserId] = useState(() => localStorage.getItem('userId'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
    }
  }, [token, userId]);

  const logout = () => {
    setToken(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ token, userId, setToken, setUserId, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
