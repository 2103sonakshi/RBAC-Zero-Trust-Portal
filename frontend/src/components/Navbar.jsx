import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Shield,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Link,
  FolderOpen,
  Users,
  Settings,
  ChevronDown,
  Globe,
  Activity,
  AlertCircle,
} from "lucide-react";

const Navbar = ({ onLogout, mobileMenuOpen, setMobileMenuOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: contextLogout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  // Handle logout - use the prop if provided, otherwise use context
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      contextLogout();
    }
    navigate("/login");
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
    setProfileOpen(false);
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileOpen && !event.target.closest(".profile-menu")) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const isActive = (path) => location.pathname === path;

  const getRoleColor = () => {
    switch (user?.role) {
      case "ADMIN":
        return "from-purple-500 to-pink-500";
      case "USER":
        return "from-blue-500 to-cyan-500";
      case "GUEST":
        return "from-green-500 to-emerald-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case "ADMIN":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "USER":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "GUEST":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/30";
    }
  };

  // Menu items - filtered based on user role
  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      show: true,
    },
    {
      name: "Resources",
      path: "/resources",
      icon: <FolderOpen className="w-5 h-5" />,
      show: true,
    },
    {
      name: "Blockchain",
      path: "/blockchain",
      icon: <Link className="w-5 h-5" />,
      show: true,
    },
    {
      name: "Roles",
      path: "/roles",
      icon: <Settings className="w-5 h-5" />,
      show: true,
    },
    {
      name: "Users",
      path: "/users",
      icon: <Users className="w-5 h-5" />,
      show: true,
    },
    {
      name: "IP Control",
      path: "/ip-control",
      icon: <Globe className="w-5 h-5" />,
      show: true,
    },
    {
      name: "Audit Trail",
      path: "/audit",
      icon: <Activity className="w-5 h-5" />,
      show: true,
    },
  ];

  // Styles for glass effect
  const styles = `
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-fade-in {
      animation: fade-in 0.2s ease-out;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and brand */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <button
                  onClick={() => handleNavigate("/dashboard")}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className="relative">
                    <Shield className="h-8 w-8 text-blue-500" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-white font-bold text-lg hidden md:block">
                    RBAC Portal
                  </span>
                </button>
              </div>
            </div>

            {/* Desktop menu */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-1">
                {menuItems
                  .filter((item) => item.show)
                  .map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all duration-200 ${isActive(item.path)
                        ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white border-b-2 border-blue-500"
                        : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                        }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* User menu - Desktop */}
            <div className="hidden md:block">
              <div className="profile-menu ml-4 flex items-center md:ml-6 relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center space-x-3 focus:outline-none hover:bg-gray-800/50 rounded-lg px-3 py-2 transition-all"
                >
                  <div
                    className={`bg-gradient-to-r ${getRoleColor()} p-0.5 rounded-full`}
                  >
                    <div className="bg-gray-900 rounded-full p-1">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">
                      {user?.username}
                    </p>
                    <p className="text-xs text-gray-400">{user?.role}</p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Profile dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 top-12 w-56 bg-gray-800 rounded-lg shadow-lg py-1 border border-gray-700 z-50 animate-fade-in">
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-sm font-medium text-white">
                        {user?.username}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {user?.email || "No email"}
                      </p>
                      <div
                        className={`mt-2 px-2 py-1 rounded-full text-xs font-medium inline-block ${getRoleBadgeColor()}`}
                      >
                        {user?.role}
                      </div>
                    </div>

                    <div className="px-2 py-2">
                      <div className="text-xs text-gray-500 px-3 py-1">
                        User ID: {user?.id || "N/A"}
                      </div>
                    </div>

                    <div className="border-t border-gray-700 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700/50 flex items-center space-x-2 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={() =>
                  setMobileMenuOpen && setMobileMenuOpen(!mobileMenuOpen)
                }
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-800/95 backdrop-blur-sm border-t border-gray-700 animate-fade-in">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {menuItems
                .filter((item) => item.show)
                .map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full text-left px-3 py-3 rounded-lg text-base font-medium flex items-center space-x-3 transition-colors ${isActive(item.path)
                      ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white"
                      : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                      }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </button>
                ))}
            </div>

            {/* Mobile user info */}
            <div className="pt-4 pb-3 border-t border-gray-700">
              <div className="flex items-center px-5">
                <div
                  className={`bg-gradient-to-r ${getRoleColor()} p-0.5 rounded-full`}
                >
                  <div className="bg-gray-900 rounded-full p-1">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <div className="text-base font-medium text-white">
                    {user?.username}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor()}`}
                    >
                      {user?.role}
                    </span>
                    {user?.email && (
                      <span className="text-xs text-gray-400 truncate max-w-[150px]">
                        {user.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left block px-3 py-3 rounded-lg text-base font-medium text-red-400 hover:bg-gray-700/50 flex items-center space-x-3 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
