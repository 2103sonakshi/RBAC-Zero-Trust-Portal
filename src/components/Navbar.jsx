import React, { useState } from "react";
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
  Activity, // Add this import for Audit Trail icon
} from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
    setProfileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const getRoleColor = () => {
    switch (user?.role) {
      case "ADMIN":
        return "from-red-500 to-red-600";
      case "USER":
        return "from-blue-500 to-blue-600";
      case "GUEST":
        return "from-green-500 to-green-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

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
      show: user?.role === "ADMIN",
    },
    {
      name: "Users",
      path: "/users",
      icon: <Users className="w-5 h-5" />,
      show: user?.role === "ADMIN",
    },
    {
      name: "IP Control",
      path: "/ip-control",
      icon: <Globe className="w-5 h-5" />,
      show: user?.role === "ADMIN",
    },
    {
      name: "Audit Trail",
      path: "/audit",
      icon: <Activity className="w-5 h-5" />,
      show: user?.role === "ADMIN",
    },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-500" />
                <span className="text-white font-bold text-lg hidden md:block">
                  RBAC Portal
                </span>
              </div>
            </div>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {menuItems
                .filter((item) => item.show)
                .map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-all duration-200 ${
                      isActive(item.path)
                        ? "bg-gray-800 text-white border-b-2 border-blue-500"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
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
            <div className="ml-4 flex items-center md:ml-6 relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-3 focus:outline-none"
              >
                <div
                  className={`bg-gradient-to-r ${getRoleColor()} p-0.5 rounded-full`}
                >
                  <div className="bg-gray-900 rounded-full p-1">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-400">{user?.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {/* Profile dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-12 w-48 bg-gray-800 rounded-lg shadow-lg py-1 border border-gray-700 z-50">
                  <div className="px-4 py-2 border-b border-gray-700">
                    <p className="text-sm text-white">{user?.username}</p>
                    <p className="text-xs text-gray-400">
                      {user?.email || "No email"}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {menuItems
              .filter((item) => item.show)
              .map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-3 ${
                    isActive(item.path)
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
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
              <div className="ml-3">
                <div className="text-base font-medium text-white">
                  {user?.username}
                </div>
                <div className="text-sm font-medium text-gray-400">
                  {user?.role}
                </div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <button
                onClick={handleLogout}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-gray-700 flex items-center space-x-3"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
