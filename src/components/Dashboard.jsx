import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext"; // FIXED: Import from AuthContext instead of App

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

      // Keep blockchain stats if available
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

  // KEEP: Fetch blockchain stats
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
    fetchBlockchainStats(); // KEEP: Fetch blockchain stats
  }, [fetchResources, fetchStats, fetchBlockchainStats]);

  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!newResource.title.trim()) {
      toast.error("Title is required");
      return;
    }

    // GUEST users cannot create resources
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

  // KEEP: Blockchain Stats Card
  const BlockchainStatsCard = () => (
    <div
      className="glass p-6 animate-slide-in"
      style={{ animationDelay: "0.3s" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Link className="h-5 w-5 text-cyan-400" />
          Blockchain Status
        </h2>
        <button
          onClick={fetchBlockchainStats}
          disabled={isLoading.blockchain}
          className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading.blockchain ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {blockchainStats ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Total Blocks</span>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-blue-400" />
              <span className="font-bold">{blockchainStats.totalBlocks}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Chain Integrity</span>
            <div
              className={`flex items-center gap-2 ${blockchainStats.integrity ? "text-green-400" : "text-red-400"}`}
            >
              {blockchainStats.integrity ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span className="font-bold">
                {blockchainStats.integrity ? "Secure" : "Compromised"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Difficulty</span>
            <span className="font-mono text-cyan-400">
              {blockchainStats.difficulty || 1}
            </span>
          </div>

          <button
            onClick={() => (window.location.href = "/blockchain")}
            className="w-full mt-4 flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition-all"
          >
            <Link className="h-4 w-4" />
            View Blockchain Audit
          </button>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading blockchain...</p>
        </div>
      )}
    </div>
  );

  // Security Status Card - Includes blockchain
  const SecurityStatusCard = () => (
    <div
      className="glass p-6 animate-slide-in"
      style={{ animationDelay: "0.4s" }}
    >
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
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
              <span className="text-gray-400">{item.label}</span>
            </div>
            <span className={`font-semibold ${item.color}`}>{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // Show different stats based on role
  const getRoleSpecificStats = () => {
    if (user?.role === "ADMIN") {
      return [
        {
          icon: Users,
          label: "Total Users",
          value: stats?.users || 0,
          color: "text-blue-400",
          bg: "bg-blue-500/10",
        },
        {
          icon: FileText,
          label: "All Resources",
          value: stats?.resources || 0,
          color: "text-green-400",
          bg: "bg-green-500/10",
        },
        {
          icon: Activity,
          label: "System Sessions",
          value: stats?.mySessions || 0,
          color: "text-purple-400",
          bg: "bg-purple-500/10",
        },
        {
          icon: Database,
          label: "Your Resources",
          value: stats?.myResources || 0,
          color: "text-cyan-400",
          bg: "bg-cyan-500/10",
        },
      ];
    } else {
      return [
        {
          icon: FileText,
          label: "Visible Resources",
          value: filteredResources.length,
          color: "text-green-400",
          bg: "bg-green-500/10",
        },
        {
          icon: Database,
          label: "Your Resources",
          value: stats?.myResources || 0,
          color: "text-cyan-400",
          bg: "bg-cyan-500/10",
        },
        {
          icon: Activity,
          label: "Your Sessions",
          value: stats?.mySessions || 0,
          color: "text-purple-400",
          bg: "bg-purple-500/10",
        },
        {
          icon: Shield,
          label: "Access Level",
          value: user?.role || "USER",
          color: "text-yellow-400",
          bg: "bg-yellow-500/10",
        },
      ];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-6">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/3 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="glass p-6 mb-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl">
              <Shield className="h-10 w-10 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Role-Based Access Dashboard
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getRoleColor(user?.role || "USER")}`}
                >
                  {getRoleBadge(user?.role || "USER")}
                </span>
                <span className="text-gray-400">
                  Welcome,{" "}
                  <span className="font-semibold text-gray-300">
                    {user?.username || "User"}
                  </span>
                  !
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="p-3 glass hover:bg-gray-800/50 rounded-xl transition-all duration-300 relative"
              onClick={() => toast("No new notifications")}
            >
              <Bell className="h-5 w-5 text-gray-400" />
            </button>
            <button
              className="p-3 glass hover:bg-gray-800/50 rounded-xl transition-all duration-300"
              onClick={() => (window.location.href = "/blockchain")}
            >
              <Link className="h-5 w-5 text-cyan-400" />
            </button>
            <button
              className="p-3 glass hover:bg-gray-800/50 rounded-xl transition-all duration-300"
              onClick={() => toast("Settings panel coming soon")}
            >
              <Settings className="h-5 w-5 text-gray-400" />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 hover:border-red-500/50 transition-all duration-300 group"
            >
              <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              <span className="font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Stats & User Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Stats */}
          <div
            className="glass p-6 animate-slide-in"
            style={{ animationDelay: "0.1s" }}
          >
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              {user?.role === "ADMIN" ? "System Overview" : "Your Overview"}
            </h2>
            <div className="space-y-4">
              {getRoleSpecificStats().map((stat, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <span className="text-gray-300">{stat.label}</span>
                  </div>
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Profile Card */}
          <div
            className="glass p-6 animate-slide-in"
            style={{ animationDelay: "0.2s" }}
          >
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <UserCog className="h-5 w-5 text-cyan-400" />
              Your Profile
            </h2>
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl mb-4">
                  {user?.role === "ADMIN" ? (
                    <ShieldCheck className="h-12 w-12 text-cyan-400" />
                  ) : (
                    <User className="h-12 w-12 text-cyan-400" />
                  )}
                </div>
                <h3 className="text-xl font-bold">
                  {user?.username || "User"}
                </h3>
                <div
                  className={`px-4 py-2 rounded-full mt-2 font-semibold ${getRoleColor(user?.role || "USER")}`}
                >
                  {getRoleBadge(user?.role || "USER")}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-300 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Access Permissions
                </h4>
                <ul className="space-y-2">
                  {getRolePermissions(user?.role || "USER").map(
                    (permission, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-400"
                      >
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                        {permission}
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Session Status</span>
                  <span className="flex items-center gap-2 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* KEEP: Blockchain Stats Card */}
          <BlockchainStatsCard />

          {/* Security Status Card */}
          <SecurityStatusCard />
        </div>

        {/* Right Column - Resources Management */}
        <div className="lg:col-span-3">
          <div className="glass p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-400" />
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Resource Management
                  </span>
                </h2>
                <p className="text-gray-400 mt-1">
                  {user?.role === "ADMIN"
                    ? "Manage all system resources"
                    : user?.role === "USER"
                      ? "Create and manage your resources"
                      : "View public resources (Read-only)"}
                </p>
              </div>

              {/* Create Resource Button (hidden for GUEST) */}
              {user?.role !== "GUEST" && (
                <button
                  onClick={() =>
                    document.getElementById("create-resource-modal").showModal()
                  }
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500/30 transition-all"
                >
                  <Plus className="h-5 w-5" />
                  Create Resource
                </button>
              )}
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border-2 border-gray-700/50 rounded-xl focus:border-blue-500 focus:bg-gray-800/90 transition-all text-gray-200"
                  placeholder="Search resources..."
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="px-4 py-3 bg-gray-800/50 border-2 border-gray-700/50 rounded-xl focus:border-blue-500 focus:bg-gray-800/90 transition-all text-gray-200"
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
                  className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all"
                  disabled={isLoading.resources}
                >
                  <RefreshCw
                    className={`h-5 w-5 ${isLoading.resources ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>

            {/* Resources List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <div className="inline-flex items-center justify-center p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-3xl mb-6">
                    <FileText className="h-16 w-16 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-3">
                    {searchTerm || filterLevel !== "ALL"
                      ? "No Matching Resources"
                      : "No Resources Found"}
                  </h3>
                  <p className="text-gray-400 mb-8">
                    {searchTerm || filterLevel !== "ALL"
                      ? "Try adjusting your search or filter criteria"
                      : user?.role === "GUEST"
                        ? "No public resources available"
                        : "Create your first resource to get started"}
                  </p>
                  {user?.role !== "GUEST" && (
                    <button
                      onClick={() =>
                        document
                          .getElementById("create-resource-modal")
                          .showModal()
                      }
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all"
                    >
                      <Plus className="h-5 w-5" />
                      Create First Resource
                    </button>
                  )}
                </div>
              ) : (
                filteredResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="glass p-6 group hover:border-blue-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-semibold ${getAccessLevelColor(resource.access_level)}`}
                          >
                            {getAccessLevelIcon(resource.access_level)}
                            <span className="ml-1">
                              {resource.access_level}
                            </span>
                          </span>
                          {resource.user_id === user?.id && (
                            <span className="px-2 py-1 rounded-lg text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30">
                              Owner
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-100 group-hover:text-blue-300 transition-colors">
                          {resource.title}
                        </h3>
                      </div>

                      {/* Action buttons based on role and ownership */}
                      {(user?.role === "ADMIN" ||
                        resource.user_id === user?.id) && (
                        <button
                          onClick={() => handleDeleteResource(resource.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete Resource"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-gray-400 text-sm mb-6 line-clamp-3">
                      {resource.description || "No description provided"}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {resource.owner || "System"}
                        </span>
                      </div>

                      <button
                        onClick={() => toast.info(`Viewing: ${resource.title}`)}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Resource Modal */}
      <dialog
        id="create-resource-modal"
        className="glass p-8 max-w-lg w-full rounded-2xl backdrop:bg-black/70"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
              <Plus className="h-6 w-6 text-green-400" />
            </div>
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Create New Resource
            </span>
          </h2>
          <button
            onClick={() =>
              document.getElementById("create-resource-modal").close()
            }
            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreateResource} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Resource Title *
            </label>
            <input
              type="text"
              value={newResource.title}
              onChange={(e) =>
                setNewResource({ ...newResource, title: e.target.value })
              }
              className="w-full p-4 bg-gray-800/50 border-2 border-gray-700/50 rounded-xl focus:border-blue-500 focus:bg-gray-800/90 transition-all text-gray-200"
              placeholder="Enter resource title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Description
            </label>
            <textarea
              value={newResource.description}
              onChange={(e) =>
                setNewResource({ ...newResource, description: e.target.value })
              }
              className="w-full p-4 bg-gray-800/50 border-2 border-gray-700/50 rounded-xl focus:border-blue-500 focus:bg-gray-800/90 transition-all text-gray-200 resize-none"
              placeholder="Describe your resource..."
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Access Level
            </label>
            <select
              value={newResource.access_level}
              onChange={(e) =>
                setNewResource({ ...newResource, access_level: e.target.value })
              }
              className="w-full p-4 bg-gray-800/50 border-2 border-gray-700/50 rounded-xl focus:border-blue-500 focus:bg-gray-800/90 transition-all text-gray-200"
            >
              <option value="PRIVATE">🔒 Private (Only you)</option>
              <option value="RESTRICTED">🛡️ Restricted (Specific users)</option>
              <option value="PUBLIC">🌍 Public (All users)</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-800">
            <button
              type="button"
              onClick={() =>
                document.getElementById("create-resource-modal").close()
              }
              className="px-6 py-3 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading.create}
              className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading.create ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  <span>Create Resource</span>
                </>
              )}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
};

export default Dashboard;
