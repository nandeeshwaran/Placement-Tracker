import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import "./Form.css";
import { useAuth } from './auth/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [adminCredentials, setAdminCredentials] = useState({ username: "", password: "" });
  const [studentCredentials, setStudentCredentials] = useState({ username: "", password: "" });
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (userRole) => {
    const creds = userRole === "admin" ? adminCredentials : studentCredentials;

    if (!creds.username || !creds.password) {
      setError("Both fields are required.");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: creds.username, password: creds.password, role: userRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      setError("");
      // Save auth state and navigate based on role
      auth.login({ username: data.username || creds.username, role: userRole, token: data.token });
      if (userRole === 'admin') navigate('/admin-dashboard');
      else navigate('/placement');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <header className="auth-header">
        <h1>College Portal</h1>
        <p>Welcome to the College Management System</p>
      </header>

      <main className="auth-container">
        <div className="auth-login-grid">
          <div className="auth-box" aria-labelledby="admin-login">
            <h2 id="admin-login">Admin Login</h2>
            <form onSubmit={(e) => e.preventDefault()}>
              <input
                className="auth-input form-input"
                aria-label="Admin username"
                type="text"
                placeholder="User Name"
                value={adminCredentials.username}
                onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
              />
              <input
                className="auth-input form-input"
                aria-label="Admin password"
                type="password"
                placeholder="Password"
                value={adminCredentials.password}
                onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
              />
              {error && role === "admin" && <p className="auth-error">{error}</p>}
              <button type="button" className="auth-button form-submit" onClick={() => { setRole('admin'); handleLogin("admin"); }}>
                Login as Admin
              </button>
            </form>
          </div>

          <div className="auth-box" aria-labelledby="student-login">
            <h2 id="student-login">Student Login</h2>
            <form onSubmit={(e) => e.preventDefault()}>
              <input
                className="auth-input form-input"
                aria-label="Student username"
                type="text"
                placeholder="User Name"
                value={studentCredentials.username}
                onChange={(e) => setStudentCredentials({ ...studentCredentials, username: e.target.value })}
              />
              <input
                className="auth-input form-input"
                aria-label="Student password"
                type="password"
                placeholder="Password"
                value={studentCredentials.password}
                onChange={(e) => setStudentCredentials({ ...studentCredentials, password: e.target.value })}
              />
              {error && role === "student" && <p className="auth-error">{error}</p>}
              <button type="button" className="auth-button form-submit" onClick={() => { setRole('student'); handleLogin("student"); }}>
                Login as Student
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="auth-footer">
        <p>&copy; 2025 College Portal. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LoginPage;
