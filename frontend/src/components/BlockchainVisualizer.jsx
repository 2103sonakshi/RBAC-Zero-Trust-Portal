import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const BlockchainVisualizer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [chainInfo, setChainInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [stats, setStats] = useState(null);
  const [chainData, setChainData] = useState(null);

  // Fetch blockchain data
  const fetchBlockchainData = async () => {
    try {
      setLoading(true);

      // Fetch recent blocks
      const blocksResponse = await axios.get("/api/blockchain/recent?limit=15");
      if (blocksResponse.data.success) {
        setBlocks(blocksResponse.data.blocks);
      }

      // Fetch chain info
      const statsResponse = await axios.get("/api/blockchain/stats");
      if (statsResponse.data.success) {
        setChainInfo(statsResponse.data.stats);
      }

      // Verify chain (wrapped in its own try/catch since Guest user may not have permission)
      try {
        const verifyResponse = await axios.get("/api/blockchain/verify");
        if (verifyResponse.data.success) {
          setVerification(verifyResponse.data);
        }
      } catch (verifyError) {
        setVerification({
          valid: true,
          message: "Read-only view. Full verification requires Admin privileges.",
          blockCount: blocksResponse?.data?.blocks?.length || 0
        });
        if (verifyError.response?.status !== 403) {
          console.error("Error verifying chain:", verifyError);
        }
      }

      // Get full chain for visualization
      const chainResponse = await axios.get("/api/blockchain/chain");
      if (chainResponse.data.success) {
        setChainData(chainResponse.data.chain);
      }
    } catch (error) {
      console.error("Error fetching blockchain data:", error);
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error("Failed to load blockchain data");
      }
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
      TOKEN_VALIDATED:
        "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      USER_ROLE_CHANGED:
        "bg-purple-500/20 text-purple-400 border-purple-500/30",
      ROLE_CREATED: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      ROLE_UPDATED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      ROLE_DELETED: "bg-red-500/20 text-red-400 border-red-500/30",
      PERMISSION_ASSIGNED:
        "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    };
    return colors[action] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
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

  if (loading && blocks.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading blockchain data...</p>
          <p className="text-sm text-gray-500 mt-1">
            Fetching audit trail from distributed ledger
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <style>{styles}</style>

      {/* Header */}
      <div className="glass p-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl">
              <Link className="h-10 w-10 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Blockchain Audit Visualizer
              </h1>
              <p className="text-gray-400 mt-1">
                Immutable, tamper-proof audit trail using blockchain technology
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchBlockchainData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>


          </div>
        </div>

        {/* Stats Bar */}
        {chainInfo && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-800/50 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Blocks</p>
                  <p className="text-2xl font-bold">{chainInfo.totalBlocks}</p>
                </div>
                <Link className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Chain Integrity</p>
                  <p
                    className={`text-2xl font-bold ${chainInfo.integrity ? "text-green-400" : "text-red-400"}`}
                  >
                    {chainInfo.integrity ? "Valid" : "Invalid"}
                  </p>
                </div>
                {chainInfo.integrity ? (
                  <CheckCircle className="h-8 w-8 text-green-400" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-400" />
                )}
              </div>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">First Block</p>
                  <p className="text-sm font-mono">
                    {chainInfo.firstBlock
                      ? new Date(chainInfo.firstBlock).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Last Updated</p>
                  <p className="text-sm font-mono">
                    {chainInfo.lastBlock
                      ? new Date(chainInfo.lastBlock).toLocaleTimeString()
                      : "N/A"}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-cyan-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Blockchain Blocks */}
        <div className="lg:col-span-2">
          <div className="glass p-6 animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
                  <Link className="h-5 w-5 text-blue-400" />
                </div>
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Audit Blocks ({blocks.length})
                </span>
              </h2>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm text-gray-400">Valid</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-400">Tampered</span>
                </div>
                <div className="text-sm text-gray-400">
                  Auto-refresh:
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className="ml-2 px-2 py-1 bg-gray-800/50 rounded"
                  >
                    {autoRefresh ? "ON" : "OFF"}
                  </button>
                </div>
              </div>
            </div>

            {/* Blockchain Blocks List */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {blocks.map((block, index) => (
                <div key={block.index} className="relative">
                  {/* Chain connector */}
                  {index < blocks.length - 1 && (
                    <div className="absolute left-8 top-12 h-8 w-0.5 bg-gradient-to-b from-blue-500/50 to-transparent z-0"></div>
                  )}

                  <div
                    className={`relative glass p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.01] hover:border-blue-500/50 ${block.index === selectedBlock?.index
                      ? "border-blue-500"
                      : "border-gray-700/50"
                      }`}
                    onClick={() => setSelectedBlock(block)}
                  >
                    {/* Block indicator */}
                    <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
                      <div
                        className={`w-4 h-4 rounded-full ${block.index === 0
                          ? "bg-yellow-500"
                          : block.data.action?.includes("FAILED")
                            ? "bg-red-500"
                            : "bg-green-500"
                          }`}
                      ></div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-mono text-gray-400">
                            #{block.index}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-semibold ${getActionColor(block.data?.action)}`}
                          >
                            {block.data?.action || "UNKNOWN"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(block.timestamp)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <User className="h-3 w-3" />
                              <span>User</span>
                            </div>
                            <p className="font-mono text-xs">
                              {block.data?.userId || "system"}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <Server className="h-3 w-3" />
                              <span>IP Address</span>
                            </div>
                            <p className="font-mono text-xs">
                              {block.data?.ip || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <Hash className="h-3 w-3" />
                            <span>Block Hash</span>
                          </div>
                          <p className="font-mono text-xs truncate">
                            {block.hash}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Block Details & Verification */}
        <div className="space-y-6">
          {/* Selected Block Details */}
          <div className="glass p-6 animate-slide-in">
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
                  <div className="font-mono bg-gray-800/50 p-2 rounded">
                    {selectedBlock.index}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Timestamp
                  </label>
                  <div className="bg-gray-800/50 p-2 rounded">
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
                    {selectedBlock.data?.action || "UNKNOWN"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Description
                  </label>
                  <div className="bg-gray-800/50 p-2 rounded">
                    {selectedBlock.data?.description || "No description"}
                    {selectedBlock.data?.details &&
                      Object.keys(selectedBlock.data.details).length > 0 && (
                        <pre className="mt-2 text-xs text-gray-400">
                          {JSON.stringify(selectedBlock.data.details, null, 2)}
                        </pre>
                      )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Full Hash
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
                  <div className="font-mono bg-gray-800/50 p-2 rounded">
                    {selectedBlock.nonce}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a block to view details</p>
                <p className="text-sm mt-1">Click on any block in the list</p>
              </div>
            )}
          </div>

          {/* Chain Verification */}
          <div className="glass p-6 animate-slide-in">
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
                  className={`p-4 rounded-xl ${verification.valid
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
                            Block #{verification.invalidBlock}:{" "}
                            {verification.reason}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 p-3 rounded">
                    <p className="text-sm text-gray-400">Total Blocks</p>
                    <p className="text-xl font-bold">
                      {verification.blockCount || blocks.length}
                    </p>
                  </div>

                  <div className="bg-gray-800/50 p-3 rounded">
                    <p className="text-sm text-gray-400">Status</p>
                    <p
                      className={`text-xl font-bold ${verification.valid ? "text-green-400" : "text-red-400"
                        }`}
                    >
                      {verification.valid ? "Secure" : "Compromised"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={fetchBlockchainData}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all"
                >
                  <RefreshCw className="h-4 w-4" />
                  Re-verify Chain
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-400">Verifying chain...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      {chainInfo && chainInfo.actions && (
        <div className="glass p-6 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            Blockchain Statistics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
