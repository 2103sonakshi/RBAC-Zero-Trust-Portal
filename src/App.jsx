import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  Shield,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Link,
  Menu,
  X,
} from "lucide-react";

// Import Components
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import BlockchainVisualizer from "./components/BlockchainVisualizer";
import ResourceManager from "./components/ResourceManager";
import RoleManagement from "./components/RoleManagement";
import UserManagement from "./components/UserManagement";
import IPControl from "./components/IPControl";
import AuditTrail from "./components/AuditTrail";
import Navbar from "./components/Navbar";

// Import Auth Provider and hook
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function AppContent() {
  const { user, token, logout: authLogout } = useAuth();
  const [userRoles, setUserRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [blockchainStats, setBlockchainStats] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check system health on startup
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get("/health");
        setSystemHealth(response.data);
        console.log("✅ System Health:", response.data);

        // Only fetch blockchain stats if authenticated
        if (token) {
          const statsResponse = await axios.get("/api/blockchain/stats", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (statsResponse.data.success) {
            setBlockchainStats(statsResponse.data.stats);
          }
        }
      } catch (error) {
        console.error("❌ Health check failed:", error);
      }
    };
    checkHealth();
  }, [token]);

  // Initialize user roles and permissions when user changes
  useEffect(() => {
    const initializeUserData = async () => {
      if (user && token) {
        try {
          if (user.roles) {
            setUserRoles(user.roles);
          }

          // Fetch permissions
          const response = await axios.get("/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.success && response.data.data.permissions) {
            setPermissions(response.data.data.permissions);
          }
        } catch (error) {
          console.error("Failed to fetch user permissions:", error);
        }
      } else {
        setUserRoles([]);
        setPermissions([]);
      }
    };

    initializeUserData();
  }, [user, token]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // RBAC helper functions
  const hasRole = useCallback(
    (roleName) => {
      if (!user) return false;
      return user?.role === roleName || userRoles.includes(roleName);
    },
    [user, userRoles],
  );

  const hasPermission = useCallback(
    (permissionName) => {
      if (!user) return false;
      if (hasRole("ADMIN")) return true;
      return permissions.includes(permissionName);
    },
    [permissions, hasRole, user],
  );

  const handleLogout = useCallback(async () => {
    try {
      await axios.post("/api/auth/logout").catch(() => {});
    } catch (error) {
      console.warn("Logout API call failed:", error);
    } finally {
      authLogout(); // Use the logout from AuthContext
      toast.success("Logged out successfully");
      setMobileMenuOpen(false);
    }
  }, [authLogout]);

  // Loading Component
  const LoadingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl"></div>
        <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur"></div>
              <div className="relative flex items-center justify-center">
                <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-white animate-pulse" />
                <Link className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400 absolute -right-2 -top-2" />
              </div>
            </div>
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-center space-x-4">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-blue-400"></div>
                <p className="text-sm sm:text-base text-gray-300 font-medium">
                  Initializing RBAC System
                </p>
              </div>
              <div className="h-1 w-32 sm:w-48 mx-auto bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-[shimmer_2s_infinite]"></div>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 text-center">
                Loading blockchain audit trail...
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
          <span>Auth</span>
        </div>
        <div className="h-1 w-6 sm:w-8 bg-gray-700 rounded-full"></div>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-400"></div>
          <span>Blockchain</span>
        </div>
        <div className="h-1 w-6 sm:w-8 bg-gray-700 rounded-full"></div>
        <div className="flex items-center space-x-2">
          <Link className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-500" />
          <span>Audit</span>
        </div>
      </div>
    </div>
  );

  // Private Route Component
  const PrivateRoute = ({
    children,
    requiredPermission = null,
    requiredRole = null,
  }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (requiredRole && !hasRole(requiredRole) && !hasRole("ADMIN")) {
      toast.error(`Access denied. ${requiredRole} role required.`);
      return <Navigate to="/dashboard" replace />;
    }

    if (
      requiredPermission &&
      !hasPermission(requiredPermission) &&
      !hasRole("ADMIN")
    ) {
      toast.error(`Access denied. ${requiredPermission} permission required.`);
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Toast Notifications - Mobile Optimized */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1f2937",
            color: "#f3f4f6",
            border: "1px solid #374151",
            borderRadius: "0.75rem",
            padding: "0.75rem",
            fontSize: "0.875rem",
            maxWidth: "90vw",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />

      {/* System Health Banner - Mobile Optimized */}
      {systemHealth && (
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-3 sm:px-4 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div
                  className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${
                    systemHealth.status === "healthy"
                      ? "bg-green-500 animate-pulse"
                      : "bg-red-500"
                  }`}
                ></div>
                <span className="text-gray-300 font-medium truncate max-w-[120px] sm:max-w-none">
                  RBAC Portal
                </span>
                <span className="text-gray-400 hidden xs:inline">v1.0</span>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4">
                {blockchainStats && (
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Link className="h-3 w-3 text-cyan-400" />
                    <span className="text-xs text-gray-400">
                      {blockchainStats.totalBlocks} Blocks
                    </span>
                    <span
                      className={`text-xs hidden sm:inline ${
                        blockchainStats.integrity
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {blockchainStats.integrity ? "✓ Secure" : "✗ Tampered"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar - Only show when logged in */}
      {user && (
        <Navbar
          onLogout={handleLogout}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content - with padding for mobile */}
      <main className="flex-1 px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={user ? <Navigate to="/dashboard" replace /> : <Login />}
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/blockchain"
              element={
                <PrivateRoute>
                  <BlockchainVisualizer />
                </PrivateRoute>
              }
            />

            <Route
              path="/resources"
              element={
                <PrivateRoute>
                  <ResourceManager />
                </PrivateRoute>
              }
            />

            {/* Admin-only routes */}
            <Route
              path="/roles"
              element={
                <PrivateRoute requiredRole="ADMIN">
                  <RoleManagement />
                </PrivateRoute>
              }
            />

            <Route
              path="/users"
              element={
                <PrivateRoute requiredRole="ADMIN">
                  <UserManagement />
                </PrivateRoute>
              }
            />

            <Route
              path="/ip-control"
              element={
                <PrivateRoute requiredRole="ADMIN">
                  <IPControl />
                </PrivateRoute>
              }
            />

            <Route
              path="/audit"
              element={
                <PrivateRoute requiredRole="ADMIN">
                  <AuditTrail />
                </PrivateRoute>
              }
            />

            {/* Default Redirect */}
            <Route
              path="/"
              element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
            />

            {/* 404 Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* Footer - Mobile Optimized */}
      <footer className="border-t border-gray-800 bg-gray-900/50 mt-auto">
        <div className="px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              <span className="text-gray-400">
                RBAC Portal •{" "}
                {systemHealth?.status === "healthy"
                  ? "🟢 Operational"
                  : "🔴 Degraded"}
              </span>
            </div>
            <div className="text-gray-500 text-center sm:text-right">
              <span>© 2025 • </span>
              {user && (
                <span className="text-gray-400">
                  <span className="hidden xs:inline">Logged in as </span>
                  <span className="text-blue-400 font-medium">
                    {user?.username}
                  </span>
                  <span className="ml-2 px-2 py-0.5 bg-gray-800 rounded-full text-xs">
                    {user?.role}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
