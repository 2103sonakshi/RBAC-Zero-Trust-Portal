import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Shield,
  Users,
  FileText,
  Activity,
  LogOut,
  Plus,
  Trash2,
  Lock,
  Globe,
  UserCog,
  Settings,
  Bell,
  Search,
  Filter,
  Eye,
  BarChart3,
  ShieldCheck,
  Database,
  Key,
  User,
  AlertCircle,
  RefreshCw,
  Link,
  Hash,
  CheckCircle,
  XCircle,
  Menu,
  X,
  ChevronRight,
  Info,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const Dashboard = ({ onLogout }) => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [stats, setStats] = useState({
    users: 0,
    resources: 0,
    mySessions: 0,
    myResources: 0,
  });
  const [blockchainStats, setBlockchainStats] = useState(null);
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    access_level: "RESTRICTED",
  });
  const [isLoading, setIsLoading] = useState({
    resources: false,
    stats: false,
    blockchain: false,
    create: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showResourceDetails, setShowResourceDetails] = useState(false);

  const modalRef = useRef(null);
  const resourceModalRef = useRef(null);

  const fetchResources = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, resources: true }));
    try {
      const response = await axios.get("/api/resources");
      setResources(response.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch resources");
      console.error("Resources fetch error:", error);
    } finally {
      setIsLoading((prev) => ({ ...prev, resources: false }));
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, stats: true }));
    try {
      const response = await axios.get("/api/dashboard/stats");
      const data = response.data.data || {
        users: 0,
        resources: 0,
        mySessions: 0,
        myResources: 0,
      };
      setStats(data);

      if (data.blockchain) {
        setBlockchainStats(data.blockchain);
      }
    } catch (error) {
      console.error("Stats fetch error:", error);
      setStats({
        users: 1,
        resources: 0,
        mySessions: 1,
        myResources: 0,
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, stats: false }));
    }
  }, []);

  const fetchBlockchainStats = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, blockchain: true }));
    try {
      const response = await axios.get("/api/blockchain/stats");
      if (response.data.success) {
        setBlockchainStats(response.data.stats);
      }
    } catch (error) {
      console.error("Blockchain stats fetch error:", error);
    } finally {
      setIsLoading((prev) => ({ ...prev, blockchain: false }));
    }
  }, []);

  useEffect(() => {
    fetchResources();
    fetchStats();
    fetchBlockchainStats();
  }, [fetchResources, fetchStats, fetchBlockchainStats]);

  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!newResource.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (user?.role === "GUEST") {
      toast.error("Guest users cannot create resources");
      return;
    }

    setIsLoading((prev) => ({ ...prev, create: true }));
    try {
      const response = await axios.post("/api/resources", newResource);
      toast.success("✅ Resource created successfully");
      setNewResource({
        title: "",
        description: "",
        access_level: "RESTRICTED",
      });
      fetchResources();
      fetchStats();
      modalRef.current?.close();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create resource");
    } finally {
      setIsLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) {
      return;
    }

    try {
      await axios.delete(`/api/resources/${id}`);
      toast.success("🗑️ Resource deleted successfully");
      fetchResources();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete resource");
    }
  };

  const handleViewResource = (resource) => {
    setSelectedResource(resource);
    setShowResourceDetails(true);
  };

  const getAccessLevelIcon = (level) => {
    switch (level) {
      case "PUBLIC":
        return <Globe className="h-4 w-4 text-green-400" />;
      case "RESTRICTED":
        return <Lock className="h-4 w-4 text-yellow-400" />;
      default:
        return <Lock className="h-4 w-4 text-red-400" />;
    }
  };

  const getAccessLevelColor = (level) => {
    switch (level) {
      case "PUBLIC":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "RESTRICTED":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-red-500/10 text-red-400 border-red-500/30";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "USER":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "GUEST":
        return "bg-gray-500/10 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/30";
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "ADMIN":
        return "👑 ADMIN";
      case "USER":
        return "👤 USER";
      case "GUEST":
        return "👀 GUEST";
      default:
        return role;
    }
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterLevel === "ALL" || resource.access_level === filterLevel;
    return matchesSearch && matchesFilter;
  });

  const getRolePermissions = (role) => {
    switch (role) {
      case "ADMIN":
        return [
          "Full system access",
          "View all resources",
          "Create/Delete any resource",
          "User management",
          "System configuration",
          "Blockchain audit viewer",
        ];
      case "USER":
        return [
          "View public resources",
          "Create own resources",
          "Edit/Delete own resources",
          "View dashboard statistics",
          "View blockchain audit",
        ];
      case "GUEST":
        return [
          "View public resources only",
          "Read-only access",
          "Cannot create resources",
          "Limited blockchain view",
        ];
      default:
        return ["View public resources only"];
    }
  };

  // Mobile Stats Card Component
  const MobileStatsCard = ({ icon: Icon, label, value, color, bg }) => (
    <div className="bg-gray-800/30 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <span className="text-gray-300 text-sm">{label}</span>
      </div>
      <span className="text-xl font-bold text-white">{value}</span>
    </div>
  );

  // Blockchain Stats Card (Mobile Optimized)
  const BlockchainStatsCard = () => (
    <div className="glass p-4 sm:p-6 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <Link className="h-5 w-5 text-cyan-400" />
          Blockchain Status
        </h2>
        <button
          onClick={fetchBlockchainStats}
          disabled={isLoading.blockchain}
          className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors touch-manipulation"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading.blockchain ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {blockchainStats ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Total Blocks</span>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-blue-400" />
              <span className="font-bold text-white">
                {blockchainStats.totalBlocks}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Chain Integrity</span>
            <div
              className={`flex items-center gap-2 ${blockchainStats.integrity ? "text-green-400" : "text-red-400"}`}
            >
              {blockchainStats.integrity ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span className="font-bold text-sm">
                {blockchainStats.integrity ? "Secure" : "Compromised"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Difficulty</span>
            <span className="font-mono text-cyan-400 text-sm">
              {blockchainStats.difficulty || 1}
            </span>
          </div>

          <button
            onClick={() => (window.location.href = "/blockchain")}
            className="w-full mt-4 flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition-all touch-manipulation"
          >
            <Link className="h-4 w-4" />
            <span className="text-sm font-medium">View Blockchain Audit</span>
          </button>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="text-gray-400 mt-2 text-sm">Loading blockchain...</p>
        </div>
      )}
    </div>
  );

  // Security Status Card (Mobile Optimized)
  const SecurityStatusCard = () => (
    <div className="glass p-4 sm:p-6 rounded-xl">
      <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-green-400" />
        Security Status
      </h2>
      <div className="space-y-3">
        {[
          {
            label: "RBAC System",
            status: "Active",
            color: "text-green-400",
            icon: <Shield className="h-4 w-4" />,
          },
          {
            label: "Authentication",
            status: "Enabled",
            color: "text-green-400",
            icon: <Key className="h-4 w-4" />,
          },
          {
            label: "Blockchain Audit",
            status: blockchainStats?.integrity ? "Secure" : "Checking",
            color: blockchainStats?.integrity
              ? "text-green-400"
              : "text-yellow-400",
            icon: <Link className="h-4 w-4" />,
          },
          {
            label: "Your Role",
            status: user?.role || "USER",
            color:
              user?.role === "ADMIN"
                ? "text-blue-400"
                : user?.role === "USER"
                  ? "text-green-400"
                  : "text-gray-400",
            icon: <User className="h-4 w-4" />,
          },
        ].map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {item.icon}
              <span className="text-gray-400 text-sm">{item.label}</span>
            </div>
            <span className={`font-semibold text-sm ${item.color}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // User Profile Card (Mobile Optimized)
  const UserProfileCard = () => (
    <div className="glass p-4 sm:p-6 rounded-xl">
      <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
        <UserCog className="h-5 w-5 text-cyan-400" />
        Your Profile
      </h2>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl">
            {user?.role === "ADMIN" ? (
              <ShieldCheck className="h-8 w-8 text-cyan-400" />
            ) : (
              <User className="h-8 w-8 text-cyan-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {user?.username || "User"}
            </h3>
            <div
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${getRoleColor(user?.role || "USER")}`}
            >
              {getRoleBadge(user?.role || "USER")}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-gray-300 flex items-center gap-2 text-sm">
            <Key className="h-4 w-4" />
            Access Permissions
          </h4>
          <ul className="space-y-1.5">
            {getRolePermissions(user?.role || "USER")
              .slice(0, 3)
              .map((permission, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-xs text-gray-400"
                >
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                  {permission}
                </li>
              ))}
            {getRolePermissions(user?.role || "USER").length > 3 && (
              <li className="text-xs text-gray-500">
                +{getRolePermissions(user?.role || "USER").length - 3} more...
              </li>
            )}
          </ul>
        </div>

        <div className="pt-3 border-t border-gray-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Session Status</span>
            <span className="flex items-center gap-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Resource Card (Mobile Optimized)
  const ResourceCard = ({ resource }) => (
    <div className="glass p-4 rounded-xl hover:border-blue-500/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className={`px-2 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${getAccessLevelColor(resource.access_level)}`}
            >
              {getAccessLevelIcon(resource.access_level)}
              <span>{resource.access_level}</span>
            </span>
            {resource.user_id === user?.id && (
              <span className="px-2 py-1 rounded-lg text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Owner
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-gray-100 truncate">
            {resource.title}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewResource(resource)}
            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors touch-manipulation"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {(user?.role === "ADMIN" || resource.user_id === user?.id) && (
            <button
              onClick={() => handleDeleteResource(resource.id)}
              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors touch-manipulation"
              title="Delete Resource"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <p className="text-gray-400 text-xs mb-3 line-clamp-2">
        {resource.description || "No description provided"}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          <span className="truncate max-w-[100px]">
            {resource.owner || "System"}
          </span>
        </span>
        <button
          onClick={() => handleViewResource(resource)}
          className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          <span>Details</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-48 sm:w-72 h-48 sm:h-72 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header - Mobile Optimized */}
      <div className="sticky top-0 z-30 glass px-4 py-3 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl sm:rounded-2xl">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent truncate">
                RBAC Dashboard
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getRoleColor(user?.role || "USER")}`}
                >
                  {getRoleBadge(user?.role || "USER")}
                </span>
                <span className="text-gray-400 text-xs sm:text-sm truncate">
                  Welcome,{" "}
                  <span className="font-semibold text-gray-300">
                    {user?.username || "User"}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-2 sm:p-2.5 glass hover:bg-gray-800/50 rounded-lg sm:rounded-xl transition-all duration-300 relative"
              onClick={() => toast("No new notifications")}
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30 rounded-lg sm:rounded-xl hover:bg-red-500/30 transition-all duration-300"
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm font-semibold hidden xs:inline">
                Logout
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 sm:px-4 md:px-6 pb-6">
        {/* Stats Grid - Mobile: Horizontal Scroll, Tablet/Desktop: Grid */}
        <div className="mb-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2 text-gray-200">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            {user?.role === "ADMIN" ? "System Overview" : "Your Overview"}
          </h2>

          {/* Mobile Horizontal Scroll */}
          <div className="flex lg:hidden gap-3 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide">
            {getRoleSpecificStats().map((stat, index) => (
              <div key={index} className="flex-none w-48">
                <MobileStatsCard {...stat} />
              </div>
            ))}
          </div>

          {/* Desktop Grid */}
          <div className="hidden lg:grid grid-cols-2 xl:grid-cols-4 gap-4">
            {getRoleSpecificStats().map((stat, index) => (
              <div key={index} className="glass p-5 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <span className="text-gray-300 text-sm">{stat.label}</span>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {stat.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Grid - Mobile: Stack, Tablet: 2 Columns, Desktop: 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          {/* User Profile - Full width on mobile, 2 columns on tablet */}
          <div className="md:col-span-1 lg:col-span-1">
            <UserProfileCard />
          </div>

          {/* Blockchain Stats - Full width on mobile */}
          <div className="md:col-span-1 lg:col-span-1">
            <BlockchainStatsCard />
          </div>

          {/* Security Status - Full width on mobile */}
          <div className="md:col-span-2 lg:col-span-2">
            <SecurityStatusCard />
          </div>
        </div>

        {/* Resources Section */}
        <div className="glass p-4 sm:p-6 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-3">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Resources
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {user?.role === "ADMIN"
                  ? "Manage all system resources"
                  : user?.role === "USER"
                    ? "Create and manage your resources"
                    : "View public resources (Read-only)"}
              </p>
            </div>

            {user?.role !== "GUEST" && (
              <button
                onClick={() => modalRef.current?.showModal()}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500/30 transition-all touch-manipulation text-sm sm:text-base"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Create</span>
              </button>
            )}
          </div>

          {/* Search and Filter - Mobile Optimized */}
          <div className="mb-6">
            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 sm:py-3 bg-gray-800/50 border-2 border-gray-700/50 rounded-xl focus:border-blue-500 focus:bg-gray-800/90 transition-all text-gray-200 text-sm"
                placeholder="Search resources..."
              />
            </div>

            {/* Mobile Filter Toggle */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-400"
              >
                <Filter className="h-4 w-4" />
                <span>Filter {filterLevel !== "ALL" && `(1)`}</span>
              </button>
              <button
                onClick={() => {
                  fetchResources();
                  fetchStats();
                  fetchBlockchainStats();
                }}
                className="p-2.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 rounded-xl"
                disabled={isLoading.resources}
              >
                <RefreshCw
                  className={`h-5 w-5 ${isLoading.resources ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            {/* Mobile Filter Panel */}
            {showMobileFilters && (
              <div className="mt-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                <label className="block text-xs text-gray-400 mb-2">
                  Access Level
                </label>
                <select
                  value={filterLevel}
                  onChange={(e) => {
                    setFilterLevel(e.target.value);
                    setShowMobileFilters(false);
                  }}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 text-sm"
                >
                  <option value="ALL">All Levels</option>
                  <option value="PUBLIC">Public</option>
                  <option value="RESTRICTED">Restricted</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>
            )}

            {/* Desktop Filter */}
            <div className="hidden sm:flex items-center gap-3">
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-4 py-2.5 bg-gray-800/50 border-2 border-gray-700/50 rounded-xl focus:border-blue-500 focus:bg-gray-800/90 transition-all text-gray-200 text-sm"
              >
                <option value="ALL">All Access Levels</option>
                <option value="PUBLIC">Public</option>
                <option value="RESTRICTED">Restricted</option>
                <option value="PRIVATE">Private</option>
              </select>

              <button
                onClick={() => {
                  fetchResources();
                  fetchStats();
                  fetchBlockchainStats();
                }}
                className="p-2.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all"
                disabled={isLoading.resources}
              >
                <RefreshCw
                  className={`h-5 w-5 ${isLoading.resources ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Resources Grid - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.length === 0 ? (
              <div className="col-span-full text-center py-8 sm:py-12">
                <div className="inline-flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6">
                  <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-600" />
                </div>
                <h3 className="text-base sm:text-xl font-semibold text-gray-300 mb-2">
                  {searchTerm || filterLevel !== "ALL"
                    ? "No Matching Resources"
                    : "No Resources Found"}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6 px-4">
                  {searchTerm || filterLevel !== "ALL"
                    ? "Try adjusting your search or filter criteria"
                    : user?.role === "GUEST"
                      ? "No public resources available"
                      : "Create your first resource to get started"}
                </p>
                {user?.role !== "GUEST" && (
                  <button
                    onClick={() => modalRef.current?.showModal()}
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Create First Resource
                  </button>
                )}
              </div>
            ) : (
              filteredResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Resource Modal - Mobile Optimized */}
      <dialog
        ref={modalRef}
        className="glass w-[95%] sm:w-full max-w-lg rounded-2xl p-4 sm:p-6 backdrop:bg-black/70"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg sm:rounded-xl">
              <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
            </div>
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Create Resource
            </span>
          </h2>
          <button
            onClick={() => modalRef.current?.close()}
            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleCreateResource} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={newResource.title}
              onChange={(e) =>
                setNewResource({ ...newResource, title: e.target.value })
              }
              className="w-full p-3 sm:p-4 bg-gray-800/50 border-2 border-gray-700/50 rounded-xl focus:border-blue-500 focus:bg-gray-800/90 transition-all text-gray-200 text-sm"
              placeholder="Enter title"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={newResource.description}
              onChange={(e) =>
                setNewResource({ ...newResource, description: e.target.value })
              }
              className="w-full p-3 sm:p-4 bg-gray-800/50 border-2 border-gray-700/50 rounded-xl focus:border-blue-500 focus:bg-gray-800/90 transition-all text-gray-200 text-sm resize-none"
              placeholder="Describe your resource..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
              Access Level
            </label>
            <select
              value={newResource.access_level}
              onChange={(e) =>
                setNewResource({ ...newResource, access_level: e.target.value })
              }
              className="w-full p-3 sm:p-4 bg-gray-800/50 border-2 border-gray-700/50 rounded-xl focus:border-blue-500 focus:bg-gray-800/90 transition-all text-gray-200 text-sm"
            >
              <option value="PRIVATE">🔒 Private (Only you)</option>
              <option value="RESTRICTED">🛡️ Restricted (Specific users)</option>
              <option value="PUBLIC">🌍 Public (All users)</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={() => modalRef.current?.close()}
              className="px-4 sm:px-6 py-2.5 sm:py-3 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-xl transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading.create}
              className="flex items-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 text-sm"
            >
              {isLoading.create ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Create</span>
                </>
              )}
            </button>
          </div>
        </form>
      </dialog>

      {/* Resource Details Modal - Mobile Optimized */}
      {selectedResource && (
        <dialog
          ref={resourceModalRef}
          open={showResourceDetails}
          className="glass w-[95%] sm:w-full max-w-lg rounded-2xl p-4 sm:p-6 backdrop:bg-black/70"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg sm:rounded-xl">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
              </div>
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Resource Details
              </span>
            </h2>
            <button
              onClick={() => {
                setShowResourceDetails(false);
                setSelectedResource(null);
              }}
              className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getAccessLevelColor(selectedResource.access_level)}`}
              >
                {getAccessLevelIcon(selectedResource.access_level)}
                <span>{selectedResource.access_level}</span>
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                {selectedResource.title}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {selectedResource.description || "No description provided"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-800/30 p-3 rounded-lg">
                <span className="text-gray-500 text-xs">Owner</span>
                <p className="text-gray-300 font-medium mt-1">
                  {selectedResource.owner || "System"}
                </p>
              </div>
              <div className="bg-gray-800/30 p-3 rounded-lg">
                <span className="text-gray-500 text-xs">Created</span>
                <p className="text-gray-300 font-medium mt-1">
                  {new Date(selectedResource.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {(user?.role === "ADMIN" ||
              selectedResource.user_id === user?.id) && (
              <button
                onClick={() => {
                  handleDeleteResource(selectedResource.id);
                  setShowResourceDetails(false);
                  setSelectedResource(null);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-all text-sm"
              >
                <Trash2 className="h-4 w-4" />
                Delete Resource
              </button>
            )}

            <button
              onClick={() => {
                setShowResourceDetails(false);
                setSelectedResource(null);
              }}
              className="w-full p-3 bg-gray-800/50 text-gray-400 rounded-xl hover:bg-gray-700/50 transition-all text-sm"
            >
              Close
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default Dashboard;
