import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import "../Login.css";

const socket = io('http://localhost:3000'); // Initialize the socket connection

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if a token already exists in local storage
    const token = localStorage.getItem('token');
    if (token) {
      // If a token exists, emit login event and navigate to chat
      const userId = localStorage.getItem('userId'); // Assume you stored userId in local storage as well
      socket.emit('login', userId);
      navigate('/chat', { state: { userId } }); // Redirect to chat
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Reset error message

    try {
      const response = await axios.post('http://localhost:3000/login', { email, password });
      alert(response.data.message);
      onLogin(response.data.token); // Pass token to parent component
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId); // Store userId

      // Emit login event with userId
      socket.emit('login', response.data.userId); 

      navigate('/chat', { state: { userId: response.data.userId } }); // Navigate to chat after login
    } catch (error) {
      // Display error message
      setErrorMessage(error.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="login-container">
      <form className="login-form w-100" onSubmit={handleLogin}>
        <div className="form-group">
          <h2>Login Form</h2>
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
          <input
            type="email"
            className="form-control"
            aria-label="Email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="form-control mt-3"
            aria-label="Password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary mt-3">Login</button>
          <div className="text-center mt-3">
            <p>
              Forgot password? <a href="#">Click Here</a><br />
              Don’t have an account? <a href="#">Sign up</a>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;
