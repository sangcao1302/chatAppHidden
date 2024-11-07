import React, { useState } from 'react';
import axios from 'axios';
import '../SignUp.css'; // Import the CSS file
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [gender, setGender] = useState(''); // New gender state
  const navigate = useNavigate();
  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:3000/signup', {
        username,
        email,
        password,
        age,
        location,
        gender // Send gender to the server
      });
      alert(response.data.message);
      navigate('/login')
    } catch (error) {
      console.error('Error during signup:', error);
      alert('Signup failed');
    }
  };

  return (
    <div className='form-singup'> 
            <form onSubmit={handleSignup} className='singnUpInput'>
      <h2>SignUp</h2>
      
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <input
        type="number"
        value={age}
        onChange={(e) => setAge(e.target.value)}
        placeholder="Age"
        required
      />
      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location"
        required
      />
      <select value={gender} onChange={(e) => setGender(e.target.value)} required>
        <option value="" disabled>Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
      <button type="submit">Sign Up</button>
    </form>
    </div>
  
  );
};

export default Signup;
