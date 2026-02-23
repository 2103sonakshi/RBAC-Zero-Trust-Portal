import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, LogIn, User, Lock, Eye, EyeOff, Key } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(formData.username, formData.password);

      if (result.success) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (username, password) => {
    setFormData({ username, password });
  };

  const styles = `
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slide-in {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    .animate-fade-in {
      animation: fade-in 0.6s ease-out;
    }
    
    .animate-slide-in {
      animation: slide-in 0.5s ease-out;
    }
    
    .animate-pulse-slow {
      animation: pulse 3s ease-in-out infinite;
    }
    
    .glass {
      background: rgba(17, 25, 40, 0.75);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1.5rem;
    }
    
    .loading-spinner {
      width: 1.5rem;
      height: 1.5rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <style>{styles}</style>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl mb-4">
            <Shield className="h-12 w-12 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">RBAC Portal</h1>
          <p className="text-sm text-gray-400">Secure Access Control System</p>
        </div>

        {/* Login Card */}
        <div className="glass p-6 sm:p-8 relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <User className="h-4 w-4" />
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-4 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-200 placeholder-gray-500"
                  placeholder="Enter username"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-4 pr-12 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-200 placeholder-gray-500"
                  placeholder="Enter password"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="loading-spinner"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </div>
              )}
            </button>

            {/* Demo Credentials Toggle */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowDemo(!showDemo)}
                className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
              >
                {showDemo ? "Hide demo accounts" : "Show demo accounts"}
              </button>
            </div>

            {/* Demo Credentials (Collapsible) */}
            {showDemo && (
              <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700 space-y-2 animate-slide-in">
                <p className="text-xs font-medium text-gray-400 mb-2">
                  Quick Login (Click to fill credentials)
                </p>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials("admin", "Admin@123")}
                  className="w-full flex items-center justify-between p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors group"
                >
                  <span className="text-sm font-medium text-blue-400">
                    Admin
                  </span>
                  <span className="text-xs text-gray-500 group-hover:text-blue-400 transition-colors">
                    Full Access
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials("user", "User@123")}
                  className="w-full flex items-center justify-between p-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors group"
                >
                  <span className="text-sm font-medium text-green-400">
                    User
                  </span>
                  <span className="text-xs text-gray-500 group-hover:text-green-400 transition-colors">
                    Limited Access
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials("guest", "Guest@123")}
                  className="w-full flex items-center justify-between p-2 bg-gray-500/10 hover:bg-gray-500/20 rounded-lg transition-colors group"
                >
                  <span className="text-sm font-medium text-gray-400">
                    Guest
                  </span>
                  <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                    Read Only
                  </span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Footer - Minimal */}
        <p className="text-center text-xs text-gray-600 mt-6">
          RBAC Zero-Trust Portal with Blockchain Audit
        </p>
      </div>
    </div>
  );
};

export default Login;
