import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { login, clearError, checkSetup } from '../store/slices/authSlice';
import { Database, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, isSetupComplete, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkSetup());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const resultAction = await dispatch(login({ username, password }));
    if (login.fulfilled.match(resultAction)) {
      navigate('/');
    }
  };

  // Check setup status first
  if (isSetupComplete === false) {
    return <Navigate to="/setup" replace />;
  }

  // Check if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-card shadow-soft border border-border p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <Database className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Sign in to MlDock</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-input text-sm flex items-center mb-6">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-2 border border-border rounded-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2 border border-border rounded-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-btn transition-colors flex items-center justify-center disabled:opacity-50 mt-6"
          >
            {status === 'loading' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
