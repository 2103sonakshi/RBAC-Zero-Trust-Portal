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

const API_URL = "http://localhost:3000/api";

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

  const tabs = [
    { id: "my-ip", name: "My IP Info", icon: <Globe className="h-5 w-5" /> },
    {
      id: "whitelist",
      name: "Whitelist",
      icon: <CheckCircle className="h-5 w-5" />,
    },
    {
      id: "blacklist",
      name: "Blacklist",
      icon: <XCircle className="h-5 w-5" />,
    },
    { id: "stats", name: "Statistics", icon: <Activity className="h-5 w-5" /> },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "my-ip") {
        await fetchMyIPInfo();
      } else if (activeTab === "whitelist") {
        await fetchWhitelist();
      } else if (activeTab === "blacklist") {
        await fetchBlacklist();
      } else if (activeTab === "stats") {
        await fetchIPStats();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
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
    try {
      await axios.delete(`${API_URL}/ip/whitelist/${ip}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("IP removed from whitelist");
      fetchWhitelist();
    } catch (error) {
      toast.error("Failed to remove IP");
    }
  };

  const handleRemoveFromBlacklist = async (ip) => {
    try {
      await axios.delete(`${API_URL}/ip/blacklist/${ip}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("IP removed from blacklist");
      fetchBlacklist();
    } catch (error) {
      toast.error("Failed to remove IP");
    }
  };

  const formatDate = (date) => {
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

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            IP Access Control
          </h1>
          <p className="text-gray-400">
            Monitor and control access based on IP addresses
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800 mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 flex items-center space-x-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
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
          {activeTab === "my-ip" && myIPInfo && (
            <div className="space-y-6">
              {/* Current IP Card */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
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
                  <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center space-x-3 mb-2">
                      <Globe className="h-5 w-5 text-blue-400" />
                      <p className="text-sm text-gray-400">IP Address</p>
                    </div>
                    <p className="text-xl font-mono text-white">
                      {myIPInfo.ip}
                    </p>
                  </div>

                  <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center space-x-3 mb-2">
                      <Activity className="h-5 w-5 text-green-400" />
                      <p className="text-sm text-gray-400">Success Rate</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {myIPInfo.successRate}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {myIPInfo.successAttempts} successful /{" "}
                      {myIPInfo.failedAttempts} failed
                    </p>
                  </div>

                  <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
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
                      {myIPInfo.lastAttempt?.success ? "Successful" : "Failed"}
                    </p>
                  </div>

                  <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center space-x-3 mb-2">
                      <MapPin className="h-5 w-5 text-orange-400" />
                      <p className="text-sm text-gray-400">Location</p>
                    </div>
                    <p className="text-sm text-white">
                      {myIPInfo.geolocation?.city},{" "}
                      {myIPInfo.geolocation?.country}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {myIPInfo.geolocation?.isp}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Attempts */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Recent Login Attempts
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900">
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
                    <tbody className="divide-y divide-gray-700">
                      {myIPInfo.recentAttempts?.map((attempt, index) => (
                        <tr key={index} className="hover:bg-gray-750">
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {formatDate(attempt.attempt_time)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {attempt.username || "Unknown"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                attempt.success
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
            </div>
          )}

          {/* Whitelist Tab */}
          {activeTab === "whitelist" && (
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
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add IP to Whitelist</span>
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900">
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
                    <tbody className="divide-y divide-gray-700">
                      {whitelist.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-750">
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
                            <p className="text-gray-400">No IPs in whitelist</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Blacklist Tab */}
          {activeTab === "blacklist" && (
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
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add IP to Blacklist</span>
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900">
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
                    <tbody className="divide-y divide-gray-700">
                      {blacklist.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-750">
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
                            <p className="text-gray-400">No IPs in blacklist</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === "stats" && ipStats && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-400 text-sm">
                      Total Attempts (24h)
                    </p>
                    <Activity className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {ipStats.totalAttemptsToday?.count || 0}
                  </p>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-400 text-sm">Whitelisted IPs</p>
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {ipStats.whitelistCount}
                  </p>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-400 text-sm">Blacklisted IPs</p>
                    <XCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {ipStats.blacklistCount}
                  </p>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
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
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Top Failed Attempt IPs (7 days)
                </h3>
                <div className="space-y-4">
                  {ipStats.topFailedIPs?.map((ip, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-750 rounded-lg"
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
                          {ip.failed_count} failed / {ip.attempt_count} total
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ip.failed_count > 10
                              ? "bg-red-500/10 text-red-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          }`}
                        >
                          {((ip.failed_count / ip.attempt_count) * 100).toFixed(
                            1,
                          )}
                          % failure
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Recent Activity (Last Hour)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900">
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
                    <tbody className="divide-y divide-gray-700">
                      {ipStats.recentActivity?.map((activity, index) => (
                        <tr key={index} className="hover:bg-gray-750">
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
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                activity.success
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
            </div>
          )}
        </div>

        {/* Add IP Modal */}
        {showAddIPModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div
                className="fixed inset-0 bg-black opacity-50"
                onClick={() => setShowAddIPModal(false)}
              ></div>

              <div className="relative bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
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
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddIPModal(false)}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
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
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      !newIP.address
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : newIP.type === "whitelist"
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-red-600 text-white hover:bg-red-700"
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
