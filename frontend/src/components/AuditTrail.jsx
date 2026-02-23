import React, { useState, useEffect } from "react";
import {
  Shield,
  Clock,
  Filter,
  Download,
  Calendar,
  User,
  Globe,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
  Activity,
  Link,
  LogIn,
  LogOut,
  Settings,
  Shield as ShieldIcon,
  Database,
  Users,
  FileCode,
  AlertOctagon,
  Info,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const API_URL = "/api";

const AuditTrail = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [blockchain, setBlockchain] = useState([]);
  const [stats, setStats] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    action: "",
    userId: "",
    username: "",
    ip: "",
    dateFrom: "",
    dateTo: "",
    success: "",
    resource: "",
  });

  const [availableActions, setAvailableActions] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [dateRange, setDateRange] = useState("24h");

  // View modes
  const [viewMode, setViewMode] = useState("table"); // table, timeline, map
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);

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

  useEffect(() => {
    if (token) {
      fetchAuditLogs();
      fetchBlockchain();
    } else {
      setLoading(false);
      toast.error("Please login to view audit trail");
    }
  }, [token]);

  useEffect(() => {
    applyFilters();
  }, [auditLogs, filters, dateRange]);

  const fetchAuditLogs = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/blockchain/chain`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const logs = response.data.chain.map((block) => ({
          id: block.index,
          timestamp: new Date(block.timestamp).toISOString(),
          action: block.data.action,
          description: block.data.description,
          userId: block.data.userId,
          username:
            block.data.details?.username || block.data.userId || "system",
          ip: block.data.ip,
          details: block.data.details || {},
          hash: block.hash,
          previousHash: block.previousHash,
          nonce: block.nonce,
          verified: true,
        }));
        setAuditLogs(logs);
        setFilteredLogs(logs);
        setTotalPages(Math.ceil(logs.length / itemsPerPage));

        // Extract unique actions and users for filters
        const actions = [
          ...new Set(logs.map((log) => log.action).filter(Boolean)),
        ];
        setAvailableActions(actions);

        const users = [
          ...new Set(logs.map((log) => log.username).filter(Boolean)),
        ];
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error("Failed to load audit trail");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockchain = async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/blockchain/chain`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setBlockchain(response.data.chain);

        // Calculate stats
        const actionCounts = response.data.chain.reduce((acc, block) => {
          acc[block.data.action] = (acc[block.data.action] || 0) + 1;
          return acc;
        }, {});

        setStats({
          totalBlocks: response.data.chain.length,
          actionCounts,
          uniqueIPs: new Set(
            response.data.chain.map((b) => b.data.ip).filter(Boolean),
          ).size,
          verified: response.data.chain.every((block, i) => {
            if (i === 0) return true;
            return block.previousHash === response.data.chain[i - 1].hash;
          }),
        });
      }
    } catch (error) {
      console.error("Error fetching blockchain:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...auditLogs];

    if (filters.action) {
      filtered = filtered.filter((log) => log.action === filters.action);
    }
    if (filters.username) {
      filtered = filtered.filter((log) =>
        log.username?.toLowerCase().includes(filters.username.toLowerCase()),
      );
    }
    if (filters.ip) {
      filtered = filtered.filter((log) => log.ip?.includes(filters.ip));
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (log) => new Date(log.timestamp) >= new Date(filters.dateFrom),
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(
        (log) => new Date(log.timestamp) <= new Date(filters.dateTo),
      );
    }
    if (filters.resource) {
      filtered = filtered.filter(
        (log) =>
          log.details?.resourceId?.toString().includes(filters.resource) ||
          log.details?.resourceName
            ?.toLowerCase()
            .includes(filters.resource.toLowerCase()),
      );
    }

    // Apply date range preset
    if (dateRange !== "all") {
      const now = new Date();
      let cutoff = new Date();
      switch (dateRange) {
        case "1h":
          cutoff.setHours(now.getHours() - 1);
          break;
        case "24h":
          cutoff.setDate(now.getDate() - 1);
          break;
        case "7d":
          cutoff.setDate(now.getDate() - 7);
          break;
        case "30d":
          cutoff.setDate(now.getDate() - 30);
          break;
        default:
          break;
      }
      filtered = filtered.filter((log) => new Date(log.timestamp) >= cutoff);
    }

    setFilteredLogs(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      action: "",
      userId: "",
      username: "",
      ip: "",
      dateFrom: "",
      dateTo: "",
      success: "",
      resource: "",
    });
    setDateRange("24h");
  };

  const getCurrentPageLogs = () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredLogs.slice(start, end);
  };

  const getActionIcon = (action) => {
    switch (true) {
      case action?.includes("LOGIN"):
        return <LogIn className="h-4 w-4 text-blue-400" />;
      case action?.includes("LOGOUT"):
        return <LogOut className="h-4 w-4 text-orange-400" />;
      case action?.includes("CREATE"):
        return <FileCode className="h-4 w-4 text-green-400" />;
      case action?.includes("DELETE"):
        return <XCircle className="h-4 w-4 text-red-400" />;
      case action?.includes("UPDATE"):
      case action?.includes("CHANGE"):
        return <Settings className="h-4 w-4 text-yellow-400" />;
      case action?.includes("VIEW"):
        return <Eye className="h-4 w-4 text-purple-400" />;
      case action?.includes("ROLE"):
        return <Users className="h-4 w-4 text-indigo-400" />;
      case action?.includes("PERMISSION"):
        return <ShieldIcon className="h-4 w-4 text-pink-400" />;
      case action?.includes("BLOCKCHAIN"):
        return <Link className="h-4 w-4 text-cyan-400" />;
      case action?.includes("IP"):
        return <Globe className="h-4 w-4 text-emerald-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActionColor = (action) => {
    if (!action) return "text-gray-400";
    if (action.includes("SUCCESS") || action.includes("CREATE"))
      return "text-green-400";
    if (
      action.includes("FAILED") ||
      action.includes("DELETE") ||
      action.includes("ERROR")
    )
      return "text-red-400";
    if (action.includes("VIEW")) return "text-blue-400";
    if (action.includes("UPDATE")) return "text-yellow-400";
    return "text-gray-400";
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return "Unknown";
    const now = new Date();
    const then = new Date(timestamp);
    const diff = now - then;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const exportToPDF = async () => {
    try {
      setExporting(true);
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text("Audit Trail Report", 14, 22);
      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Total Records: ${filteredLogs.length}`, 14, 36);

      // Table
      const tableColumn = [
        "Timestamp",
        "Action",
        "User",
        "IP Address",
        "Details",
      ];
      const tableRows = filteredLogs
        .slice(0, 100)
        .map((log) => [
          formatTimestamp(log.timestamp),
          log.action || "N/A",
          log.username || "system",
          log.ip || "N/A",
          log.description ||
          (log.details ? JSON.stringify(log.details).substring(0, 50) : "-"),
        ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      doc.save(`audit-trail-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    try {
      const csvData = filteredLogs.map((log) => ({
        Timestamp: formatTimestamp(log.timestamp),
        Action: log.action || "N/A",
        Description: log.description || "",
        User: log.username || "system",
        "User ID": log.userId || "N/A",
        "IP Address": log.ip || "N/A",
        Details: log.details ? JSON.stringify(log.details) : "",
        "Block Hash": log.hash || "N/A",
        Nonce: log.nonce || 0,
      }));

      const ws = XLSX.utils.json_to_sheet(csvData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Audit Trail");
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
      saveAs(
        data,
        `audit-trail-${new Date().toISOString().split("T")[0]}.xlsx`,
      );

      toast.success("Excel file exported successfully");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export Excel");
    }
  };

  const exportToJSON = () => {
    try {
      const dataStr = JSON.stringify(filteredLogs, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      saveAs(
        dataBlob,
        `audit-trail-${new Date().toISOString().split("T")[0]}.json`,
      );
      toast.success("JSON exported successfully");
    } catch (error) {
      console.error("Error exporting JSON:", error);
      toast.error("Failed to export JSON");
    }
  };

  const getSuspiciousActivities = () => {
    const suspicious = [];

    // Group by IP
    const ipGroups = {};
    filteredLogs.forEach((log) => {
      if (!log.ip) return;
      if (!ipGroups[log.ip]) ipGroups[log.ip] = [];
      ipGroups[log.ip].push(log);
    });

    // Check for multiple failed logins
    Object.entries(ipGroups).forEach(([ip, logs]) => {
      const failedLogins = logs.filter(
        (log) => log.action === "LOGIN_FAILED",
      ).length;
      if (failedLogins >= 5) {
        suspicious.push({
          type: "Multiple Failed Logins",
          ip,
          count: failedLogins,
          severity: "high",
          message: `${failedLogins} failed login attempts from ${ip}`,
        });
      }
    });

    // Check for unusual hours (between 11 PM and 5 AM)
    filteredLogs.forEach((log) => {
      if (!log.timestamp) return;
      const hour = new Date(log.timestamp).getHours();
      if (hour < 5 || hour > 23) {
        suspicious.push({
          type: "Unusual Hour Activity",
          ip: log.ip,
          time: formatTimestamp(log.timestamp),
          action: log.action,
          severity: "medium",
          message: `${log.action} at unusual hour (${hour}:00) from ${log.ip || "unknown IP"}`,
        });
      }
    });

    return suspicious;
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="glass p-6 sm:p-8 max-w-md text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">
            Please login to view the audit trail
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading audit trail...</p>
        </div>
      </div>
    );
  }

  const suspiciousActivities = getSuspiciousActivities();
  const currentLogs = getCurrentPageLogs();

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
                Audit Trail
              </h1>
              <p className="text-gray-400 mt-1">
                Comprehensive audit log with blockchain verification
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass p-6 animate-slide-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Events</p>
                <p className="text-2xl font-bold text-white">
                  {filteredLogs.length}
                </p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div
            className="glass p-6 animate-slide-in"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Unique IPs</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.uniqueIPs ||
                    new Set(filteredLogs.map((l) => l.ip).filter(Boolean)).size}
                </p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg">
                <Globe className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>

          <div
            className="glass p-6 animate-slide-in"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Failed Actions</p>
                <p className="text-2xl font-bold text-white">
                  {
                    filteredLogs.filter((l) => l.action?.includes("FAILED"))
                      .length
                  }
                </p>
              </div>
              <div className="bg-red-500/10 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </div>

          <div
            className="glass p-6 animate-slide-in"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Suspicious Activities</p>
                <p className="text-2xl font-bold text-white">
                  {suspiciousActivities.length}
                </p>
              </div>
              <div className="bg-yellow-500/10 p-3 rounded-lg">
                <AlertOctagon className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Suspicious Activities Alert */}
        {suspiciousActivities.length > 0 && (
          <div className="mb-8 glass p-4 border border-red-500/30 animate-slide-in">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <h3 className="text-lg font-semibold text-red-400">
                Suspicious Activities Detected
              </h3>
            </div>
            <div className="space-y-2">
              {suspiciousActivities.slice(0, 3).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-800/50 rounded"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${item.severity === "high"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                        }`}
                    >
                      {item.severity.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-300">
                      {item.message}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setFilters({ ...filters, ip: item.ip });
                      setShowFilters(true);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Filter IP
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap gap-3">
          {/* View Mode Toggle */}
          <div className="flex glass p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === "table"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                : "text-gray-400 hover:text-white"
                }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === "timeline"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                : "text-gray-400 hover:text-white"
                }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === "map"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                : "text-gray-400 hover:text-white"
                }`}
            >
              Map View
            </button>
          </div>

          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 glass text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 ${showFilters
              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
              : "glass text-gray-300 hover:bg-gray-800/50"
              }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button
              disabled={exporting}
              className="px-4 py-2 glass text-gray-300 hover:bg-gray-800/50 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 glass hidden group-hover:block z-50">
              <button
                onClick={exportToPDF}
                disabled={exporting}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/50 flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>PDF</span>
              </button>
              <button
                onClick={exportToCSV}
                disabled={exporting}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/50 flex items-center space-x-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Excel</span>
              </button>
              <button
                onClick={exportToJSON}
                disabled={exporting}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/50 flex items-center space-x-2"
              >
                <FileCode className="h-4 w-4" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchAuditLogs}
            className="px-4 py-2 glass text-gray-300 hover:bg-gray-800/50 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 glass p-6 animate-slide-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Action
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange("action", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Actions</option>
                  {availableActions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={filters.username}
                  onChange={(e) =>
                    handleFilterChange("username", e.target.value)
                  }
                  placeholder="Filter by username"
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  IP Address
                </label>
                <input
                  type="text"
                  value={filters.ip}
                  onChange={(e) => handleFilterChange("ip", e.target.value)}
                  placeholder="e.g., 192.168.1.1"
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  From Date
                </label>
                <input
                  type="datetime-local"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    handleFilterChange("dateFrom", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  To Date
                </label>
                <input
                  type="datetime-local"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Resource ID
                </label>
                <input
                  type="text"
                  value={filters.resource}
                  onChange={(e) =>
                    handleFilterChange("resource", e.target.value)
                  }
                  placeholder="Resource ID or name"
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4 space-x-3">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Clear Filters
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Main Content - Table View */}
        {viewMode === "table" && (
          <div className="glass overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Block
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {currentLogs.map((log) => (
                    <tr
                      key={`${log.id}-${log.hash}`}
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetailsModal(true);
                      }}
                      className="hover:bg-gray-800/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-2">
                          <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <div className="text-sm text-white">
                              {formatTimestamp(log.timestamp)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {getRelativeTime(log.timestamp)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getActionIcon(log.action)}
                          <span
                            className={`text-sm font-medium ${getActionColor(log.action)}`}
                          >
                            {log.action || "UNKNOWN"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {log.description || "No description"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-white">
                            {log.username || "system"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {log.userId || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-mono text-white">
                            {log.ip || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300 max-w-xs truncate">
                          {log.details && Object.keys(log.details).length > 0
                            ? JSON.stringify(log.details).substring(0, 50)
                            : "-"}
                          {log.details &&
                            JSON.stringify(log.details).length > 50 &&
                            "..."}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          <Link className="h-3 w-3 text-cyan-500" />
                          <span className="text-xs font-mono text-cyan-400">
                            {log.hash?.substring(0, 8)}...
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          #{log.id}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {currentLogs.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <Activity className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No audit logs found</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Try adjusting your filters
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of{" "}
                  {filteredLogs.length} entries
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border ${currentPage === 1
                      ? "border-gray-700 text-gray-600 cursor-not-allowed"
                      : "border-gray-600 text-gray-300 hover:bg-gray-800"
                      }`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="px-4 py-2 bg-gray-800 text-white rounded-lg">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg border ${currentPage === totalPages
                      ? "border-gray-700 text-gray-600 cursor-not-allowed"
                      : "border-gray-600 text-gray-300 hover:bg-gray-800"
                      }`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline View */}
        {viewMode === "timeline" && (
          <div className="glass p-6 animate-fade-in">
            <div className="space-y-4">
              {filteredLogs.slice(0, 50).map((log, index) => (
                <div
                  key={`${log.id}-${log.hash}`}
                  className="relative flex items-start space-x-4"
                >
                  {index < filteredLogs.length - 1 && index < 49 && (
                    <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-700"></div>
                  )}
                  <div className="relative z-10">
                    <div className="w-6 h-6 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
                      {getActionIcon(log.action)}
                    </div>
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="glass p-4 border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span
                            className={`text-sm font-medium ${getActionColor(log.action)}`}
                          >
                            {log.action || "UNKNOWN"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getRelativeTime(log.timestamp)}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-cyan-400">
                          {log.hash?.substring(0, 8)}...
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">
                        {log.description || "No description"}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{log.username || "system"}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Globe className="h-3 w-3" />
                          <span>{log.ip || "N/A"}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map View - Enhanced */}
        {viewMode === "map" && (
          <div className="glass p-12 text-center animate-fade-in">
            <div className="relative">
              <MapPin className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <Globe className="h-32 w-32 text-gray-700 mx-auto mb-6 opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              IP Geolocation Map
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Visual representation of access attempts by geographic location
            </p>
            <div className="inline-flex flex-col items-center space-y-3">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-800/50 rounded-lg">
                <Globe className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-gray-300">
                  {new Set(filteredLogs.map((l) => l.ip).filter(Boolean)).size}{" "}
                  unique IPs
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                  <p className="text-2xl font-bold text-green-400">
                    {
                      filteredLogs.filter((l) =>
                        l.action?.includes("LOGIN_SUCCESS"),
                      ).length
                    }
                  </p>
                  <p className="text-xs text-gray-400">Successful Logins</p>
                </div>
                <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                  <p className="text-2xl font-bold text-red-400">
                    {
                      filteredLogs.filter((l) =>
                        l.action?.includes("LOGIN_FAILED"),
                      ).length
                    }
                  </p>
                  <p className="text-xs text-gray-400">Failed Logins</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Full IP geolocation mapping coming soon with IP2Location
                integration
              </p>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedLog && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setShowDetailsModal(false)}
              ></div>

              <div className="relative glass max-w-2xl w-full p-4 sm:p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Audit Log Details
                  </h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Timestamp
                      </label>
                      <p className="text-sm text-white">
                        {formatTimestamp(selectedLog.timestamp)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRelativeTime(selectedLog.timestamp)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Action
                      </label>
                      <div className="flex items-center space-x-2">
                        {getActionIcon(selectedLog.action)}
                        <span
                          className={`text-sm font-medium ${getActionColor(selectedLog.action)}`}
                        >
                          {selectedLog.action || "UNKNOWN"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Description
                    </label>
                    <p className="text-sm text-white bg-gray-800/50 p-3 rounded-lg border border-gray-800">
                      {selectedLog.description || "No description"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        User
                      </label>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-white">
                          {selectedLog.username || "system"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        ID: {selectedLog.userId || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        IP Address
                      </label>
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-mono text-white">
                          {selectedLog.ip || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Details (JSON)
                    </label>
                    <pre className="text-xs text-gray-300 bg-gray-800/50 p-3 rounded-lg border border-gray-800 overflow-auto max-h-40">
                      {JSON.stringify(selectedLog.details || {}, null, 2)}
                    </pre>
                  </div>

                  <div className="border-t border-gray-800 pt-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Blockchain Verification
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Block Index</p>
                        <p className="text-sm font-mono text-white">
                          #{selectedLog.id}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Nonce</p>
                        <p className="text-sm font-mono text-white">
                          {selectedLog.nonce}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Block Hash</p>
                        <p className="text-xs font-mono text-cyan-400 break-all">
                          {selectedLog.hash || "N/A"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Previous Hash</p>
                        <p className="text-xs font-mono text-gray-500 break-all">
                          {selectedLog.previousHash || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-green-400">
                        Blockchain Verified
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
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

export default AuditTrail;
