import React, { useState } from 'react';
import CryptoJS from 'crypto-js';

const API_URL = 'http://localhost:8080'; // Replace with your actual API URL

const App = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    // Hash the password using CryptoJS
    const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);

    const loginData = {
      username: username,
      password: hashedPassword,
    };

    try {
      const response = await fetch(`${API_URL}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Login successful!');
      } else {
        alert(result.error || 'Failed to log in.');
      }
    } catch (error) {
      alert('Could not connect to the server.');
    }
  };

  return (
    <div className="login-container">
      <h2 className="form-title">Log In</h2>
      <form onSubmit={handleLogin} className="login-form">
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="Username"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="input-wrapper">
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-button">Log In</button>
      </form>
    </div>
  );
};

export default App;