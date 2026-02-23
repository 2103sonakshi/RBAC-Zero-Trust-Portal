import React, { useState, useEffect } from "react";
import {
  Shield,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  MapPin,
  Clock,
  User,
  Activity,
  Filter,
  Download,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = "/api";

const IPControl = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-ip");
  const [myIPInfo, setMyIPInfo] = useState(null);
  const [whitelist, setWhitelist] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [ipStats, setIpStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddIPModal, setShowAddIPModal] = useState(false);
  const [newIP, setNewIP] = useState({
    address: "",
    description: "",
    reason: "",
    type: "whitelist",
  });

  // Check if user has admin permissions
  const isAdmin = user?.role === "ADMIN";

  // Styles
  const styles = `
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slide-in {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    .animate-fade-in {
      animation: fade-in 0.6s ease-out;
    }
    
    .animate-slide-in {
      animation: slide-in 0.5s ease-out;
    }
    
    .glass {
      background: rgba(17, 25, 40, 0.75);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1.5rem;
    }
  `;

  const tabs = [
    { id: "my-ip", name: "My IP Info", icon: <Globe className="h-5 w-5" /> },
    {
      id: "whitelist",
      name: "Whitelist",
      icon: <CheckCircle className="h-5 w-5" />,
      requiresAdmin: true,
    },
    {
      id: "blacklist",
      name: "Blacklist",
      icon: <XCircle className="h-5 w-5" />,
      requiresAdmin: true,
    },
    {
      id: "stats",
      name: "Statistics",
      icon: <Activity className="h-5 w-5" />,
      requiresAdmin: true,
    },
  ];

  // Filter tabs based on user role
  const accessibleTabs = tabs.filter((tab) => !tab.requiresAdmin || isAdmin);

  useEffect(() => {
    if (!token) {
      toast.error("Please login to access IP control");
      return;
    }

    // If active tab requires admin but user is not admin, switch to my-ip
    const currentTab = tabs.find((t) => t.id === activeTab);
    if (currentTab?.requiresAdmin && !isAdmin) {
      setActiveTab("my-ip");
    } else {
      fetchData();
    }
  }, [activeTab, token, isAdmin]);

  const fetchData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      if (activeTab === "my-ip") {
        await fetchMyIPInfo();
      } else if (activeTab === "whitelist" && isAdmin) {
        await fetchWhitelist();
      } else if (activeTab === "blacklist" && isAdmin) {
        await fetchBlacklist();
      } else if (activeTab === "stats" && isAdmin) {
        await fetchIPStats();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 403) {
        toast.error("You don't have permission to view this data");
      } else if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error("Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMyIPInfo = async () => {
    const response = await axios.get(`${API_URL}/ip/my-info`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.data.success) {
      setMyIPInfo(response.data.data);
    }
  };

  const fetchWhitelist = async () => {
    const response = await axios.get(`${API_URL}/ip/whitelist`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.data.success) {
      setWhitelist(response.data.data);
    }
  };

  const fetchBlacklist = async () => {
    const response = await axios.get(`${API_URL}/ip/blacklist`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.data.success) {
      setBlacklist(response.data.data);
    }
  };

  const fetchIPStats = async () => {
    const response = await axios.get(`${API_URL}/ip/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.data.success) {
      setIpStats(response.data.data);
    }
  };

  const handleAddToWhitelist = async () => {
    if (!newIP.address) {
      toast.error("IP address is required");
      return;
    }

    // Basic IP validation
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(newIP.address)) {
      toast.error("Please enter a valid IP address");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/ip/whitelist`,
        {
          ip: newIP.address,
          description: newIP.description,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("IP added to whitelist");
      setShowAddIPModal(false);
      setNewIP({ address: "", description: "", reason: "", type: "whitelist" });
      fetchWhitelist();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add IP");
    }
  };

  const handleAddToBlacklist = async () => {
    if (!newIP.address) {
      toast.error("IP address is required");
      return;
    }

    // Basic IP validation
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(newIP.address)) {
      toast.error("Please enter a valid IP address");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/ip/blacklist`,
        {
          ip: newIP.address,
          reason: newIP.reason,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("IP added to blacklist");
      setShowAddIPModal(false);
      setNewIP({ address: "", description: "", reason: "", type: "blacklist" });
      fetchBlacklist();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add IP");
    }
  };

  const handleRemoveFromWhitelist = async (ip) => {
    if (
      !window.confirm(`Are you sure you want to remove ${ip} from whitelist?`)
    ) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/ip/whitelist/${ip}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("IP removed from whitelist");
      fetchWhitelist();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to remove IP");
    }
  };

  const handleRemoveFromBlacklist = async (ip) => {
    if (
      !window.confirm(`Are you sure you want to remove ${ip} from blacklist?`)
    ) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/ip/blacklist/${ip}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("IP removed from blacklist");
      fetchBlacklist();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to remove IP");
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "whitelisted":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "blacklisted":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="glass p-6 sm:p-8 max-w-md text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">
            Please login to access IP control
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6">
      <style>{styles}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass p-6 mb-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl">
              <Shield className="h-10 w-10 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                IP Access Control
              </h1>
              <p className="text-gray-400 mt-1">
                Monitor and control access based on IP addresses
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800 mb-8">
          <nav className="flex space-x-8">
            {accessibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 flex items-center space-x-2 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700"
                  }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {/* My IP Info Tab */}
          {activeTab === "my-ip" && (
            <div className="space-y-6">
              {loading ? (
                <div className="glass p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-400">
                    Loading IP information...
                  </p>
                </div>
              ) : myIPInfo ? (
                <>
                  {/* Current IP Card */}
                  <div className="glass p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-white">
                        Your IP Information
                      </h2>
                      <div
                        className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(
                          myIPInfo.isBlacklisted
                            ? "blacklisted"
                            : myIPInfo.isWhitelisted
                              ? "whitelisted"
                              : "normal",
                        )}`}
                      >
                        {myIPInfo.isBlacklisted
                          ? "Blacklisted"
                          : myIPInfo.isWhitelisted
                            ? "Whitelisted"
                            : "Normal"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center space-x-3 mb-2">
                          <Globe className="h-5 w-5 text-blue-400" />
                          <p className="text-sm text-gray-400">IP Address</p>
                        </div>
                        <p className="text-xl font-mono text-white">
                          {myIPInfo.ip}
                        </p>
                      </div>

                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center space-x-3 mb-2">
                          <Activity className="h-5 w-5 text-green-400" />
                          <p className="text-sm text-gray-400">Success Rate</p>
                        </div>
                        <p className="text-xl font-bold text-white">
                          {myIPInfo.successRate || 0}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {myIPInfo.successAttempts || 0} successful /{" "}
                          {myIPInfo.failedAttempts || 0} failed
                        </p>
                      </div>

                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center space-x-3 mb-2">
                          <Clock className="h-5 w-5 text-purple-400" />
                          <p className="text-sm text-gray-400">Last Attempt</p>
                        </div>
                        <p className="text-sm text-white">
                          {myIPInfo.lastAttempt
                            ? formatDate(myIPInfo.lastAttempt.attempt_time)
                            : "Never"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {myIPInfo.lastAttempt?.success
                            ? "Successful"
                            : "Failed"}
                        </p>
                      </div>

                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center space-x-3 mb-2">
                          <MapPin className="h-5 w-5 text-orange-400" />
                          <p className="text-sm text-gray-400">Status</p>
                        </div>
                        <p className="text-sm text-white">
                          {myIPInfo.isBlacklisted
                            ? "Blocked"
                            : myIPInfo.isWhitelisted
                              ? "Trusted"
                              : "Normal"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {myIPInfo.totalAttempts || 0} total attempts
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Attempts */}
                  {myIPInfo.recentAttempts &&
                    myIPInfo.recentAttempts.length > 0 && (
                      <div className="glass p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">
                          Recent Login Attempts
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-900/50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                  Time
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                  Username
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                  Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                  User Agent
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                              {myIPInfo.recentAttempts.map((attempt, index) => (
                                <tr
                                  key={index}
                                  className="hover:bg-gray-800/50"
                                >
                                  <td className="px-4 py-3 text-sm text-gray-300">
                                    {formatDate(attempt.attempt_time)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-300">
                                    {attempt.username || "Unknown"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${attempt.success
                                        ? "bg-green-500/10 text-green-400"
                                        : "bg-red-500/10 text-red-400"
                                        }`}
                                    >
                                      {attempt.success ? "Success" : "Failed"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-400 truncate max-w-xs">
                                    {attempt.user_agent || "Unknown"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                </>
              ) : (
                <div className="glass p-12 text-center">
                  <Globe className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No IP information available</p>
                </div>
              )}
            </div>
          )}

          {/* Whitelist Tab */}
          {activeTab === "whitelist" && isAdmin && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">
                  IP Whitelist
                </h2>
                <button
                  onClick={() => {
                    setNewIP({
                      address: "",
                      description: "",
                      reason: "",
                      type: "whitelist",
                    });
                    setShowAddIPModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add IP to Whitelist</span>
                </button>
              </div>

              <div className="glass overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Loading whitelist...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-900/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            IP Address
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Description
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Added By
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Added At
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {whitelist.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-800/50">
                            <td className="px-6 py-4">
                              <span className="font-mono text-white">
                                {item.ip_address}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">
                              {item.description || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">
                              {item.created_by_username || "System"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">
                              {formatDate(item.created_at)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() =>
                                  handleRemoveFromWhitelist(item.ip_address)
                                }
                                className="text-red-400 hover:text-red-300 transition-colors"
                                title="Remove from whitelist"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {whitelist.length === 0 && (
                          <tr>
                            <td colSpan="5" className="px-6 py-12 text-center">
                              <CheckCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                              <p className="text-gray-400">
                                No IPs in whitelist
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Add trusted IP addresses to the whitelist
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Blacklist Tab */}
          {activeTab === "blacklist" && isAdmin && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">
                  IP Blacklist
                </h2>
                <button
                  onClick={() => {
                    setNewIP({
                      address: "",
                      description: "",
                      reason: "",
                      type: "blacklist",
                    });
                    setShowAddIPModal(true);
                  }}
                  className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-orange-600 transition-all flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add IP to Blacklist</span>
                </button>
              </div>

              <div className="glass overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Loading blacklist...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-900/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            IP Address
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Reason
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Added By
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                            Added At
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {blacklist.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-800/50">
                            <td className="px-6 py-4">
                              <span className="font-mono text-white">
                                {item.ip_address}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">
                              {item.reason || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">
                              {item.created_by_username || "System"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">
                              {formatDate(item.created_at)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() =>
                                  handleRemoveFromBlacklist(item.ip_address)
                                }
                                className="text-green-400 hover:text-green-300 transition-colors"
                                title="Remove from blacklist"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {blacklist.length === 0 && (
                          <tr>
                            <td colSpan="5" className="px-6 py-12 text-center">
                              <CheckCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                              <p className="text-gray-400">
                                No IPs in blacklist
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Add malicious IP addresses to the blacklist
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === "stats" && isAdmin && (
            <div className="space-y-6">
              {loading ? (
                <div className="glass p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-400">Loading statistics...</p>
                </div>
              ) : ipStats ? (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="glass p-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-gray-400 text-sm">
                          Total Attempts (24h)
                        </p>
                        <Activity className="h-5 w-5 text-blue-400" />
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {ipStats.totalAttemptsToday || 0}
                      </p>
                    </div>

                    <div className="glass p-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-gray-400 text-sm">Whitelisted IPs</p>
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {ipStats.whitelistCount || 0}
                      </p>
                    </div>

                    <div className="glass p-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-gray-400 text-sm">Blacklisted IPs</p>
                        <XCircle className="h-5 w-5 text-red-400" />
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {ipStats.blacklistCount || 0}
                      </p>
                    </div>

                    <div className="glass p-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-gray-400 text-sm">Suspicious IPs</p>
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {ipStats.topFailedIPs?.length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Top Failed IPs */}
                  {ipStats.topFailedIPs && ipStats.topFailedIPs.length > 0 && (
                    <div className="glass p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Top Failed Attempt IPs (7 days)
                      </h3>
                      <div className="space-y-4">
                        {ipStats.topFailedIPs.map((ip, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                          >
                            <div className="flex items-center space-x-4">
                              <span className="text-sm font-medium text-gray-400">
                                #{index + 1}
                              </span>
                              <span className="font-mono text-white">
                                {ip.ip_address}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-400">
                                {ip.failed_count} failed / {ip.attempt_count}{" "}
                                total
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${ip.failed_count > 10
                                  ? "bg-red-500/10 text-red-400"
                                  : "bg-yellow-500/10 text-yellow-400"
                                  }`}
                              >
                                {(
                                  (ip.failed_count / ip.attempt_count) *
                                  100
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Activity */}
                  {ipStats.recentActivity &&
                    ipStats.recentActivity.length > 0 && (
                      <div className="glass p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">
                          Recent Activity (Last Hour)
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-900/50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                  Time
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                  IP Address
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                  Username
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                              {ipStats.recentActivity.map((activity, index) => (
                                <tr
                                  key={index}
                                  className="hover:bg-gray-800/50"
                                >
                                  <td className="px-4 py-3 text-sm text-gray-300">
                                    {formatDate(activity.attempt_time)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="font-mono text-sm text-gray-300">
                                      {activity.ip_address}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-300">
                                    {activity.username || "Unknown"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${activity.success
                                        ? "bg-green-500/10 text-green-400"
                                        : "bg-red-500/10 text-red-400"
                                        }`}
                                    >
                                      {activity.success ? "Success" : "Failed"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                </>
              ) : (
                <div className="glass p-12 text-center">
                  <Activity className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No statistics available</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add IP Modal */}
        {showAddIPModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setShowAddIPModal(false)}
              ></div>

              <div className="relative glass max-w-md w-full p-4 sm:p-6 animate-fade-in">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Add IP to{" "}
                  {newIP.type === "whitelist" ? "Whitelist" : "Blacklist"}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      IP Address *
                    </label>
                    <input
                      type="text"
                      value={newIP.address}
                      onChange={(e) =>
                        setNewIP({ ...newIP, address: e.target.value })
                      }
                      placeholder="e.g., 192.168.1.1"
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {newIP.type === "whitelist" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={newIP.description}
                        onChange={(e) =>
                          setNewIP({ ...newIP, description: e.target.value })
                        }
                        placeholder="Why is this IP whitelisted?"
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Reason for blocking
                      </label>
                      <textarea
                        value={newIP.reason}
                        onChange={(e) =>
                          setNewIP({ ...newIP, reason: e.target.value })
                        }
                        rows="3"
                        placeholder="Why is this IP being blocked?"
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddIPModal(false)}
                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={
                      newIP.type === "whitelist"
                        ? handleAddToWhitelist
                        : handleAddToBlacklist
                    }
                    disabled={!newIP.address}
                    className={`px-4 py-2 rounded-lg transition-all ${!newIP.address
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : newIP.type === "whitelist"
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600"
                        : "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                      }`}
                  >
                    Add to{" "}
                    {newIP.type === "whitelist" ? "Whitelist" : "Blacklist"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IPControl;
