import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Link,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Hash,
  Clock,
  User,
  Server,
  RefreshCw,
  Lock,
  Unlock,
  Plus,
  Copy,
  ExternalLink,
  BarChart3,
  Activity,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Globe,
  Download,
  Eye,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const BlockchainVisualizer = () => {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [chainInfo, setChainInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [stats, setStats] = useState(null);
  const [chainData, setChainData] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showBlockDetails, setShowBlockDetails] = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState({});
  const [filterAction, setFilterAction] = useState("ALL");
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'

  const detailsModalRef = useRef(null);

  // Fetch blockchain data
  const fetchBlockchainData = async () => {
    try {
      setLoading(true);

      // Fetch recent blocks
      const blocksResponse = await axios.get("/api/blockchain/recent?limit=20");
      if (blocksResponse.data.success) {
        setBlocks(blocksResponse.data.blocks);
      }

      // Fetch chain info
      const statsResponse = await axios.get("/api/blockchain/stats");
      if (statsResponse.data.success) {
        setChainInfo(statsResponse.data.stats);
      }

      // Verify chain
      const verifyResponse = await axios.get("/api/blockchain/verify");
      if (verifyResponse.data.success) {
        setVerification(verifyResponse.data);
      }

      // Get full chain for visualization
      const chainResponse = await axios.get("/api/blockchain/chain");
      if (chainResponse.data.success) {
        setChainData(chainResponse.data.chain);
      }
    } catch (error) {
      console.error("Error fetching blockchain data:", error);
      toast.error("Failed to load blockchain data");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchBlockchainData();

    if (autoRefresh) {
      const interval = setInterval(fetchBlockchainData, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Add test block
  const addTestBlock = async () => {
    try {
      const response = await axios.post("/api/blockchain/test");
      if (response.data.success) {
        toast.success(`Test block added: ${response.data.message}`);
        fetchBlockchainData();
      }
    } catch (error) {
      toast.error("Failed to add test block");
    }
  };

  // Toggle block expansion on mobile
  const toggleBlockExpand = (index) => {
    setExpandedBlocks((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // View block details
  const viewBlockDetails = (block) => {
    setSelectedBlock(block);
    setShowBlockDetails(true);
    if (detailsModalRef.current) {
      detailsModalRef.current.showModal();
    }
  };

  // Get action color
  const getActionColor = (action) => {
    const colors = {
      LOGIN: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      LOGIN_SUCCESS: "bg-green-500/20 text-green-400 border-green-500/30",
      LOGIN_FAILED: "bg-red-500/20 text-red-400 border-red-500/30",
      CREATE_RESOURCE:
        "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      DELETE_RESOURCE: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      UPDATE_PERMISSION: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      ROLE_ASSIGNMENT: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      AUTHENTICATE: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      AUTH_FAILED: "bg-red-500/20 text-red-400 border-red-500/30",
      MFA_SETUP: "bg-violet-500/20 text-violet-400 border-violet-500/30",
      GENESIS_BLOCK: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      DASHBOARD_VIEW: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      RESOURCE_VIEW: "bg-teal-500/20 text-teal-400 border-teal-500/30",
      BLOCKCHAIN_VIEW: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      SERVER_ERROR: "bg-red-500/20 text-red-400 border-red-500/30",
      ENDPOINT_NOT_FOUND:
        "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return colors[action] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  // Get action icon
  const getActionIcon = (action) => {
    switch (action) {
      case "LOGIN":
      case "LOGIN_SUCCESS":
        return <User className="h-3 w-3" />;
      case "LOGIN_FAILED":
      case "AUTH_FAILED":
        return <XCircle className="h-3 w-3" />;
      case "CREATE_RESOURCE":
        return <Plus className="h-3 w-3" />;
      case "DELETE_RESOURCE":
        return <X className="h-3 w-3" />;
      case "GENESIS_BLOCK":
        return <Shield className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Format date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Filter blocks by action
  const filteredBlocks = blocks.filter(
    (block) => filterAction === "ALL" || block.data?.action === filterAction,
  );

  // Get unique actions for filter
  const uniqueActions = [
    "ALL",
    ...new Set(blocks.map((b) => b.data?.action).filter(Boolean)),
  ];

  if (loading && blocks.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-sm sm:text-base text-gray-400">
            Loading blockchain data...
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Fetching audit trail from distributed ledger
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header - Mobile Optimized */}
      <div className="glass p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl sm:rounded-2xl">
              <Link className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent truncate">
                Blockchain Audit
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1 truncate">
                Immutable, tamper-proof audit trail
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={fetchBlockchainData}
              className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 rounded-lg sm:rounded-xl hover:bg-blue-500/30 transition-all touch-manipulation"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm hidden xs:inline">
                Refresh
              </span>
            </button>

            {user?.role === "ADMIN" && (
              <button
                onClick={addTestBlock}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 rounded-lg sm:rounded-xl hover:bg-green-500/30 transition-all touch-manipulation"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm hidden xs:inline">
                  Test
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Bar - Mobile Optimized */}
        {chainInfo && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-gray-800/50 p-2 sm:p-4 rounded-lg sm:rounded-xl">
              <p className="text-gray-400 text-xs">Blocks</p>
              <p className="text-base sm:text-2xl font-bold">
                {chainInfo.totalBlocks}
              </p>
            </div>

            <div className="bg-gray-800/50 p-2 sm:p-4 rounded-lg sm:rounded-xl">
              <p className="text-gray-400 text-xs">Integrity</p>
              <p
                className={`text-base sm:text-2xl font-bold ${chainInfo.integrity ? "text-green-400" : "text-red-400"}`}
              >
                {chainInfo.integrity ? "Valid" : "Invalid"}
              </p>
            </div>

            <div className="bg-gray-800/50 p-2 sm:p-4 rounded-lg sm:rounded-xl">
              <p className="text-gray-400 text-xs">First</p>
              <p className="text-xs sm:text-sm font-mono">
                {new Date(chainInfo.firstBlock)
                  .toLocaleDateString()
                  .slice(0, 5)}
              </p>
            </div>

            <div className="bg-gray-800/50 p-2 sm:p-4 rounded-lg sm:rounded-xl">
              <p className="text-gray-400 text-xs">Last</p>
              <p className="text-xs sm:text-sm font-mono">
                {formatTime(chainInfo.lastBlock)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex items-center gap-2 sm:hidden">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-400 text-sm"
        >
          <Activity className="h-4 w-4" />
          <span>Filter {filterAction !== "ALL" && "(1)"}</span>
        </button>

        <button
          onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
          className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-400"
        >
          {viewMode === "list" ? "⊞" : "☰"}
        </button>

        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`px-4 py-2.5 rounded-xl text-sm ${
            autoRefresh
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-gray-800/50 text-gray-400 border border-gray-700"
          }`}
        >
          {autoRefresh ? "ON" : "OFF"}
        </button>
      </div>

      {/* Mobile Filter Panel */}
      {showMobileFilters && (
        <div className="sm:hidden glass p-4 rounded-xl">
          <label className="block text-xs text-gray-400 mb-2">
            Filter by Action
          </label>
          <select
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value);
              setShowMobileFilters(false);
            }}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-200 text-sm"
          >
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action === "ALL" ? "All Actions" : action}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Desktop Controls */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2.5 bg-gray-800/50 border-2 border-gray-700/50 rounded-xl focus:border-blue-500 focus:bg-gray-800/90 transition-all text-gray-200 text-sm"
          >
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action === "ALL" ? "All Actions" : action}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                viewMode === "list"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-gray-400"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                viewMode === "grid"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-gray-400"
              }`}
            >
              Grid
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm text-gray-400">Valid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-400">Tampered</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Auto-refresh:</span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                autoRefresh
                  ? "bg-green-500/20 text-green-400"
                  : "bg-gray-800/50 text-gray-400"
              }`}
            >
              {autoRefresh ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Blockchain Blocks */}
        <div className="lg:col-span-2">
          <div className="glass p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg sm:rounded-xl">
                  <Link className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                </div>
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent text-sm sm:text-base">
                  Audit Blocks ({filteredBlocks.length})
                </span>
              </h2>
            </div>

            {/* Blockchain Blocks List/Grid */}
            <div
              className={`
              ${
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
                  : "space-y-3"
              }
              max-h-[500px] overflow-y-auto pr-1 sm:pr-2
            `}
            >
              {filteredBlocks.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-400 text-sm">
                    No blocks match filter
                  </p>
                </div>
              ) : (
                filteredBlocks.map((block, index) => (
                  <div key={block.index} className="relative">
                    {/* Chain connector for list view only */}
                    {viewMode === "list" &&
                      index < filteredBlocks.length - 1 && (
                        <div className="absolute left-6 top-12 h-6 w-0.5 bg-gradient-to-b from-blue-500/50 to-transparent z-0"></div>
                      )}

                    <div
                      className={`relative glass p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-blue-500/50 ${
                        block.index === selectedBlock?.index
                          ? "border-blue-500"
                          : "border-gray-700/50"
                      }`}
                      onClick={() => viewBlockDetails(block)}
                    >
                      {/* Block indicator */}
                      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            block.index === 0
                              ? "bg-yellow-500"
                              : block.data?.action?.includes("FAILED")
                                ? "bg-red-500"
                                : "bg-green-500"
                          }`}
                        ></div>
                      </div>

                      {/* Mobile: Collapsible view */}
                      <div className="sm:hidden">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-400">
                              #{block.index}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${getActionColor(block.data?.action)}`}
                            >
                              {getActionIcon(block.data?.action)}
                              <span>
                                {block.data?.action?.slice(0, 8) || "UNKNOWN"}
                              </span>
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBlockExpand(block.index);
                            }}
                          >
                            {expandedBlocks[block.index] ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>

                        <div className="flex justify-between text-xs text-gray-400">
                          <span>{formatTime(block.timestamp)}</span>
                          <span>{block.data?.ip || "N/A"}</span>
                        </div>

                        {expandedBlocks[block.index] && (
                          <div className="mt-3 pt-2 border-t border-gray-700/50 space-y-2">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Hash</p>
                              <p className="font-mono text-xs break-all">
                                {block.hash?.slice(0, 32)}...
                              </p>
                            </div>
                            {block.previousHash &&
                              block.previousHash !== "0".repeat(64) && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    Previous
                                  </p>
                                  <p className="font-mono text-xs break-all">
                                    {block.previousHash?.slice(0, 32)}...
                                  </p>
                                </div>
                              )}
                          </div>
                        )}
                      </div>

                      {/* Tablet/Desktop: Full view */}
                      <div className="hidden sm:block">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <span className="text-sm font-mono text-gray-400">
                                #{block.index}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${getActionColor(block.data?.action)}`}
                              >
                                {getActionIcon(block.data?.action)}
                                <span>{block.data?.action}</span>
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTime(block.timestamp)}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <div className="flex items-center gap-1 text-gray-400 mb-1">
                                  <User className="h-3 w-3" />
                                  <span>User</span>
                                </div>
                                <p className="font-mono truncate">
                                  {block.data?.userId || "N/A"}
                                </p>
                              </div>

                              <div>
                                <div className="flex items-center gap-1 text-gray-400 mb-1">
                                  <Server className="h-3 w-3" />
                                  <span>IP Address</span>
                                </div>
                                <p className="font-mono truncate">
                                  {block.data?.ip || "N/A"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-2">
                              <div className="flex items-center gap-1 text-gray-400 mb-1">
                                <Hash className="h-3 w-3" />
                                <span>Hash</span>
                              </div>
                              <p className="font-mono text-xs truncate">
                                {block.hash}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(block.hash);
                              }}
                              className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-800/50 text-gray-400 rounded-lg hover:bg-gray-800 text-xs"
                            >
                              <Copy className="h-3 w-3" />
                              <span className="hidden xl:inline">Copy</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                viewBlockDetails(block);
                              }}
                              className="flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 text-xs"
                            >
                              <Eye className="h-3 w-3" />
                              <span className="hidden xl:inline">Details</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Previous hash for desktop */}
                      {viewMode === "list" &&
                        block.previousHash &&
                        block.previousHash !== "0".repeat(64) && (
                          <div className="hidden sm:block mt-3 pt-3 border-t border-gray-800/50">
                            <div className="flex items-center gap-2 text-gray-400 text-xs">
                              <Link className="h-3 w-3" />
                              <span>
                                Links to: {block.previousHash.substring(0, 24)}
                                ...
                              </span>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Block Details & Verification */}
        <div className="space-y-4 sm:space-y-6">
          {/* Quick Stats for Mobile */}
          <div className="lg:hidden">
            {/* Chain Verification - Mobile Optimized */}
            <div className="glass p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                {verification?.valid ? (
                  <ShieldCheck className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
                Chain Integrity
              </h3>

              {verification ? (
                <div className="space-y-3">
                  <div
                    className={`p-3 rounded-lg ${
                      verification.valid
                        ? "bg-green-500/10 border border-green-500/30"
                        : "bg-red-500/10 border border-red-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {verification.valid ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <div>
                            <p className="text-xs font-semibold text-green-400">
                              Chain Valid
                            </p>
                            <p className="text-xs text-gray-400">
                              {verification.message}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-400" />
                          <div>
                            <p className="text-xs font-semibold text-red-400">
                              Chain Invalid
                            </p>
                            <p className="text-xs text-gray-400">
                              Block #{verification.invalidBlock}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              )}
            </div>
          </div>

          {/* Selected Block Details - Desktop */}
          <div className="hidden lg:block glass p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              Block Details
            </h3>

            {selectedBlock ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Block Index
                  </label>
                  <div className="font-mono bg-gray-800/50 p-2 rounded text-sm">
                    {selectedBlock.index}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Timestamp
                  </label>
                  <div className="bg-gray-800/50 p-2 rounded text-sm">
                    {formatDate(selectedBlock.timestamp)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Action
                  </label>
                  <div
                    className={`px-3 py-1 rounded-lg text-sm font-semibold inline-block ${getActionColor(selectedBlock.data?.action)}`}
                  >
                    {selectedBlock.data?.action}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Hash
                  </label>
                  <div className="font-mono text-xs bg-gray-800/50 p-2 rounded break-all">
                    {selectedBlock.hash}
                    <button
                      onClick={() => copyToClipboard(selectedBlock.hash)}
                      className="ml-2 text-blue-400 hover:text-blue-300"
                    >
                      <Copy className="h-3 w-3 inline" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Previous Hash
                  </label>
                  <div className="font-mono text-xs bg-gray-800/50 p-2 rounded break-all">
                    {selectedBlock.previousHash}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Nonce
                  </label>
                  <div className="font-mono bg-gray-800/50 p-2 rounded text-sm">
                    {selectedBlock.nonce}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a block to view details</p>
              </div>
            )}
          </div>

          {/* Chain Verification - Desktop */}
          <div className="hidden lg:block glass p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {verification?.valid ? (
                <ShieldCheck className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
              Chain Integrity
            </h3>

            {verification ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl ${
                    verification.valid
                      ? "bg-green-500/10 border border-green-500/30"
                      : "bg-red-500/10 border border-red-500/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {verification.valid ? (
                      <>
                        <CheckCircle className="h-8 w-8 text-green-400" />
                        <div>
                          <p className="font-semibold text-green-400">
                            Chain Valid
                          </p>
                          <p className="text-sm text-gray-400">
                            {verification.message}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-8 w-8 text-red-400" />
                        <div>
                          <p className="font-semibold text-red-400">
                            Chain Invalid
                          </p>
                          <p className="text-sm text-gray-400">
                            Block #{verification.invalidBlock}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={fetchBlockchainData}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all text-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  Re-verify Chain
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            )}
          </div>

          {/* Quick Actions - Mobile & Desktop */}
          <div className="glass p-4 sm:p-6">
            <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
              Quick Actions
            </h3>
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={() => window.open("/api/blockchain/chain", "_blank")}
                className="w-full flex items-center justify-between p-2 sm:p-3 bg-gray-800/50 rounded-lg sm:rounded-xl hover:bg-gray-800/70 transition-all text-sm"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                  <span className="text-xs sm:text-sm">View Full Chain</span>
                </div>
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              </button>

              <button
                onClick={() => window.open("/api/blockchain/stats", "_blank")}
                className="w-full flex items-center justify-between p-2 sm:p-3 bg-gray-800/50 rounded-lg sm:rounded-xl hover:bg-gray-800/70 transition-all text-sm"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                  <span className="text-xs sm:text-sm">View Statistics</span>
                </div>
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              </button>

              <button
                onClick={() => (window.location.href = "/dashboard")}
                className="w-full flex items-center justify-between p-2 sm:p-3 bg-gray-800/50 rounded-lg sm:rounded-xl hover:bg-gray-800/70 transition-all text-sm"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400" />
                  <span className="text-xs sm:text-sm">Go to Dashboard</span>
                </div>
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Block Details Modal - Mobile */}
      <dialog
        ref={detailsModalRef}
        className="glass w-[95%] sm:w-full max-w-lg rounded-2xl p-4 sm:p-6 backdrop:bg-black/70"
      >
        {selectedBlock && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg sm:rounded-xl">
                  <Link className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                </div>
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Block #{selectedBlock.index}
                </span>
              </h2>
              <button
                onClick={() => detailsModalRef.current?.close()}
                className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/30 p-3 rounded-lg">
                  <span className="text-gray-500 text-xs">Timestamp</span>
                  <p className="text-gray-300 text-sm mt-1">
                    {formatTime(selectedBlock.timestamp)}
                  </p>
                </div>
                <div className="bg-gray-800/30 p-3 rounded-lg">
                  <span className="text-gray-500 text-xs">Date</span>
                  <p className="text-gray-300 text-sm mt-1">
                    {new Date(selectedBlock.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/30 p-3 rounded-lg">
                <span className="text-gray-500 text-xs">Action</span>
                <div
                  className={`mt-1 px-3 py-1 rounded-lg text-sm font-semibold inline-flex items-center gap-1 ${getActionColor(selectedBlock.data?.action)}`}
                >
                  {getActionIcon(selectedBlock.data?.action)}
                  <span>{selectedBlock.data?.action}</span>
                </div>
              </div>

              <div className="bg-gray-800/30 p-3 rounded-lg">
                <span className="text-gray-500 text-xs">User ID / IP</span>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-gray-300 text-sm">
                    User: {selectedBlock.data?.userId || "N/A"}
                  </p>
                  <p className="text-gray-300 text-sm">
                    IP: {selectedBlock.data?.ip || "N/A"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/30 p-3 rounded-lg">
                <span className="text-gray-500 text-xs">Block Hash</span>
                <div className="flex items-center justify-between mt-1">
                  <p className="font-mono text-xs text-gray-300 break-all max-w-[80%]">
                    {selectedBlock.hash}
                  </p>
                  <button
                    onClick={() => copyToClipboard(selectedBlock.hash)}
                    className="ml-2 text-blue-400 hover:text-blue-300"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="bg-gray-800/30 p-3 rounded-lg">
                <span className="text-gray-500 text-xs">Previous Hash</span>
                <p className="font-mono text-xs text-gray-300 mt-1 break-all">
                  {selectedBlock.previousHash}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/30 p-3 rounded-lg">
                  <span className="text-gray-500 text-xs">Nonce</span>
                  <p className="text-gray-300 text-sm mt-1 font-mono">
                    {selectedBlock.nonce}
                  </p>
                </div>
                <div className="bg-gray-800/30 p-3 rounded-lg">
                  <span className="text-gray-500 text-xs">Difficulty</span>
                  <p className="text-gray-300 text-sm mt-1">
                    {selectedBlock.difficulty || 2}
                  </p>
                </div>
              </div>

              <button
                onClick={() => detailsModalRef.current?.close()}
                className="w-full p-3 bg-gray-800/50 text-gray-400 rounded-xl hover:bg-gray-700/50 transition-all text-sm"
              >
                Close
              </button>
            </div>
          </>
        )}
      </dialog>

      {/* Bottom Stats - Mobile Optimized */}
      {chainInfo && chainInfo.actions && (
        <div className="glass p-3 sm:p-6">
          <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
            Blockchain Statistics
          </h3>

          {/* Mobile: Horizontal scroll */}
          <div className="flex sm:hidden gap-3 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide">
            {Object.entries(chainInfo.actions).map(([action, count]) => (
              <div
                key={action}
                className="flex-none w-36 bg-gray-800/50 p-3 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 truncate">
                      {action.slice(0, 12)}
                    </p>
                    <p className="text-lg font-bold">{count}</p>
                  </div>
                  <div className={`p-1.5 rounded-lg ${getActionColor(action)}`}>
                    {getActionIcon(action)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Grid */}
          <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(chainInfo.actions).map(([action, count]) => (
              <div key={action} className="bg-gray-800/50 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 truncate">{action}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${getActionColor(action)}`}>
                    {action === "GENESIS_BLOCK" ? (
                      <Shield className="h-4 w-4" />
                    ) : action.includes("LOGIN") ? (
                      <User className="h-4 w-4" />
                    ) : action.includes("RESOURCE") ? (
                      <Server className="h-4 w-4" />
                    ) : (
                      <Activity className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainVisualizer;
