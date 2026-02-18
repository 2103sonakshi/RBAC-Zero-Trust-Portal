import React, { useState, useEffect, useRef } from "react";
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
  Home,
  ShieldAlert,
} from "lucide-react";

const Navbar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    if (setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
    setProfileOpen(false);
  }, [location.pathname, setMobileMenuOpen]);

  const handleNavigate = (path) => {
    navigate(path);
    if (setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
    setProfileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    if (setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
    setProfileOpen(false);
  };

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
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "USER":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "GUEST":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      show: true,
      description: "Overview & statistics",
    },
    {
      name: "Resources",
      path: "/resources",
      icon: <FolderOpen className="w-5 h-5" />,
      show: true,
      description: "Manage your resources",
    },
    {
      name: "Blockchain",
      path: "/blockchain",
      icon: <Link className="w-5 h-5" />,
      show: true,
      description: "View blockchain audit trail",
    },
    {
      name: "Roles",
      path: "/roles",
      icon: <Settings className="w-5 h-5" />,
      show: user?.role === "ADMIN",
      description: "Manage user roles",
    },
    {
      name: "Users",
      path: "/users",
      icon: <Users className="w-5 h-5" />,
      show: user?.role === "ADMIN",
      description: "User management",
    },
    {
      name: "IP Control",
      path: "/ip-control",
      icon: <Globe className="w-5 h-5" />,
      show: user?.role === "ADMIN",
      description: "IP whitelist/blacklist",
    },
    {
      name: "Audit Trail",
      path: "/audit",
      icon: <Activity className="w-5 h-5" />,
      show: user?.role === "ADMIN",
      description: "View audit logs",
    },
  ];

  return (
    <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo and brand - Left side */}
          <div className="flex items-center flex-1">
            <button
              onClick={() => handleNavigate("/dashboard")}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="relative">
                <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500" />
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-white font-bold text-base sm:text-lg hidden xs:block">
                RBAC<span className="text-blue-500">Portal</span>
              </span>
            </button>

            {/* Role badge - visible on tablet/desktop */}
            <div className="hidden md:block ml-4">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor()}`}
              >
                {user?.role}
              </span>
            </div>
          </div>

          {/* Desktop Navigation - Center */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-1">
              {menuItems
                .filter((item) => item.show)
                .map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={`relative px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all duration-200 group ${
                      isActive(item.path)
                        ? "text-white bg-gray-800"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/70"
                    }`}
                  >
                    <span
                      className={
                        isActive(item.path)
                          ? "text-blue-400"
                          : "text-gray-400 group-hover:text-blue-400"
                      }
                    >
                      {item.icon}
                    </span>
                    <span>{item.name}</span>

                    {/* Active indicator */}
                    {isActive(item.path) && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></span>
                    )}

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full mb-1 hidden group-hover:block bg-gray-800 text-xs text-gray-300 px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                      {item.description}
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* User menu - Right side */}
          <div className="flex items-center justify-end flex-1 space-x-2 sm:space-x-3">
            {/* User profile - Desktop */}
            <div className="hidden md:block relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-2 focus:outline-none group"
              >
                <div className="relative">
                  <div
                    className={`bg-gradient-to-r ${getRoleColor()} p-[2px] rounded-full`}
                  >
                    <div className="bg-gray-900 rounded-full p-1.5">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-gray-900"></div>
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-sm font-medium text-white max-w-[100px] truncate">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-400">{user?.role}</p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Profile dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-12 w-56 bg-gray-800 rounded-xl shadow-xl py-2 border border-gray-700 z-50 animate-fadeIn">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">
                      {user?.username}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {user?.email || "No email"}
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor()}`}
                      >
                        {user?.role}
                      </span>
                      <span className="text-xs text-gray-500">
                        ID: {user?.id || "N/A"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700/70 flex items-center space-x-3 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() =>
                setMobileMenuOpen && setMobileMenuOpen(!mobileMenuOpen)
              }
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Mobile user avatar (quick access) */}
            <div className="md:hidden">
              <div
                className={`bg-gradient-to-r ${getRoleColor()} p-[2px] rounded-full`}
              >
                <div className="bg-gray-900 rounded-full p-1.5">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu slide-in panel */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
        />

        {/* Menu panel */}
        <div className="absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-gray-900 shadow-2xl overflow-y-auto">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div
                className={`bg-gradient-to-r ${getRoleColor()} p-[3px] rounded-full`}
              >
                <div className="bg-gray-900 rounded-full p-2">
                  <User className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-base font-medium text-white">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {user?.email || "No email"}
                </p>
                <span
                  className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor()}`}
                >
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3">
            {menuItems
              .filter((item) => item.show)
              .map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full text-left px-4 py-3 rounded-xl mb-1 text-base font-medium flex items-center space-x-4 transition-all ${
                    isActive(item.path)
                      ? "bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-400 border-l-4 border-blue-500"
                      : "text-gray-300 hover:bg-gray-800/70"
                  }`}
                >
                  <span
                    className={
                      isActive(item.path) ? "text-blue-400" : "text-gray-400"
                    }
                  >
                    {item.icon}
                  </span>
                  <div className="flex-1">
                    <span>{item.name}</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </button>
              ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-gray-900">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
