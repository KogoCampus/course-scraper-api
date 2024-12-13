import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Create base64 encoded credentials
    const credentials = btoa(`${username}:${password}`);

    try {
      // Test credentials against any admin API endpoint
      const response = await fetch('/api/admin/school-entries', {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      if (response.ok) {
        // Store credentials in sessionStorage
        sessionStorage.setItem('adminCredentials', credentials);
        
        // Redirect to the page they were trying to access, or home
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      setError('Failed to authenticate');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title text-center mb-0">Admin Login</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <button type="submit" className="btn btn-primary w-100">
                  Login
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage; 