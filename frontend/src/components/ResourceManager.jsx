import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Eye,
  Lock,
  Globe,
  Users,
  Search,
  Filter,
  Download,
  Upload,
  Shield,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  MoreVertical,
  Copy,
  ExternalLink,
  BarChart,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const ResourceManager = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAccess, setFilterAccess] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    access_level: "RESTRICTED",
  });
  const [editingResource, setEditingResource] = useState(null);

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

  // Check if user can create resources
  const canCreate = user?.role === "ADMIN" || user?.role === "USER";
  // Check if user can delete resources (admin or owner)
  const canDelete = (resource) =>
    user?.role === "ADMIN" || resource.user_id === user?.id;
  // Check if user can edit resources (admin or owner)
  const canEdit = (resource) =>
    user?.role === "ADMIN" || resource.user_id === user?.id;

  // Fetch resources
  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/resources");
      if (response.data.success) {
        setResources(response.data.data || []);
        setFilteredResources(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error("Failed to load resources");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // Filter resources
  useEffect(() => {
    let filtered = resources;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (resource) =>
          resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by access level
    if (filterAccess !== "ALL") {
      filtered = filtered.filter(
        (resource) => resource.access_level === filterAccess,
      );
    }

    setFilteredResources(filtered);
  }, [searchTerm, filterAccess, resources]);

  // Create resource
  const handleCreateResource = async (e) => {
    e.preventDefault();

    if (!canCreate) {
      toast.error("You don't have permission to create resources");
      return;
    }

    if (!newResource.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.post("/api/resources", newResource);
      if (response.data.success) {
        toast.success("Resource created successfully");
        setShowCreateModal(false);
        setNewResource({
          title: "",
          description: "",
          access_level: "RESTRICTED",
        });
        fetchResources();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create resource");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete resource
  const handleDeleteResource = async (id) => {
    const resource = resources.find((r) => r.id === id);

    if (!canDelete(resource)) {
      toast.error("You don't have permission to delete this resource");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this resource?")) {
      return;
    }

    setActionLoading(true);
    try {
      await axios.delete(`/api/resources/${id}`);
      toast.success("Resource deleted successfully");
      fetchResources();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete resource");
    } finally {
      setActionLoading(false);
    }
  };

  // Edit resource
  const handleEditResource = (resource) => {
    if (!canEdit(resource)) {
      toast.error("You don't have permission to edit this resource");
      return;
    }
    setEditingResource(resource);
    setNewResource({
      title: resource.title,
      description: resource.description || "",
      access_level: resource.access_level,
    });
    setShowCreateModal(true);
  };

  // Update resource
  const handleUpdateResource = async (e) => {
    e.preventDefault();

    if (!editingResource) return;

    if (!newResource.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.put(
        `/api/resources/${editingResource.id}`,
        newResource,
      );
      if (response.data.success) {
        toast.success("Resource updated successfully");
        setShowCreateModal(false);
        setEditingResource(null);
        setNewResource({
          title: "",
          description: "",
          access_level: "RESTRICTED",
        });
        fetchResources();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update resource");
    } finally {
      setActionLoading(false);
    }
  };

  // Get access level icon
  const getAccessIcon = (level) => {
    switch (level) {
      case "PUBLIC":
        return <Globe className="h-4 w-4 text-green-400" />;
      case "RESTRICTED":
        return <Users className="h-4 w-4 text-yellow-400" />;
      default:
        return <Lock className="h-4 w-4 text-red-400" />;
    }
  };

  // Get access level color
  const getAccessColor = (level) => {
    switch (level) {
      case "PUBLIC":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "RESTRICTED":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-red-500/10 text-red-400 border-red-500/30";
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="glass p-6 sm:p-8 max-w-md text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">Please login to access resources</p>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6">
      <style>{styles}</style>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass p-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl">
                <FileText className="h-10 w-10 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Resource Manager
                </h1>
                <p className="text-gray-400 mt-1">
                  Manage and control access to your protected resources
                </p>
              </div>
            </div>

            {canCreate && (
              <button
                onClick={() => {
                  setEditingResource(null);
                  setNewResource({
                    title: "",
                    description: "",
                    access_level: "RESTRICTED",
                  });
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500/30 transition-all"
              >
                <Plus className="h-4 w-4" />
                Create Resource
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-800/50 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Resources</p>
                  <p className="text-2xl font-bold">{resources.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Public Resources</p>
                  <p className="text-2xl font-bold">
                    {
                      resources.filter((r) => r.access_level === "PUBLIC")
                        .length
                    }
                  </p>
                </div>
                <Globe className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Restricted</p>
                  <p className="text-2xl font-bold">
                    {
                      resources.filter((r) => r.access_level === "RESTRICTED")
                        .length
                    }
                  </p>
                </div>
                <Users className="h-8 w-8 text-yellow-400" />
              </div>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Your Resources</p>
                  <p className="text-2xl font-bold">
                    {resources.filter((r) => r.user_id === user?.id).length}
                  </p>
                </div>
                <User className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="glass p-6 animate-slide-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border-2 border-gray-700/50 rounded-xl focus:border-blue-500 focus:bg-gray-800/90 transition-all text-gray-200"
                placeholder="Search resources by title or description..."
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filterAccess}
                onChange={(e) => setFilterAccess(e.target.value)}
                className="px-4 py-3 bg-gray-800/50 border-2 border-gray-700/50 rounded-xl focus:border-blue-500 focus:bg-gray-800/90 transition-all text-gray-200"
              >
                <option value="ALL">All Access Levels</option>
                <option value="PUBLIC">Public</option>
                <option value="RESTRICTED">Restricted</option>
                <option value="PRIVATE">Private</option>
              </select>

              <button
                onClick={fetchResources}
                className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all"
                title="Refresh"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
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
                {searchTerm || filterAccess !== "ALL"
                  ? "No Matching Resources"
                  : "No Resources Found"}
              </h3>
              <p className="text-gray-400 mb-8">
                {searchTerm || filterAccess !== "ALL"
                  ? "Try adjusting your search or filter criteria"
                  : canCreate
                    ? "Create your first resource to get started"
                    : "No resources available"}
              </p>
              {canCreate && (
                <button
                  onClick={() => {
                    setEditingResource(null);
                    setNewResource({
                      title: "",
                      description: "",
                      access_level: "RESTRICTED",
                    });
                    setShowCreateModal(true);
                  }}
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
                className="glass p-6 group hover:border-blue-500/30 transition-all animate-fade-in"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-semibold ${getAccessColor(resource.access_level)}`}
                      >
                        {getAccessIcon(resource.access_level)}
                        <span className="ml-1">{resource.access_level}</span>
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
                  <div className="relative">
                    <button className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
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
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(resource.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {canEdit(resource) && (
                      <button
                        onClick={() => handleEditResource(resource)}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="Edit Resource"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}

                    {canDelete(resource) && (
                      <button
                        onClick={() => handleDeleteResource(resource.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Delete Resource"
                        disabled={actionLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800/50">
                  <button
                    onClick={() => toast.info(`Viewing: ${resource.title}`)}
                    className="w-full flex items-center justify-center gap-2 p-3 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all group"
                  >
                    <span>View Details</span>
                    <ExternalLink className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Resource Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass p-6 sm:p-8 max-w-lg w-full animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                  {editingResource ? (
                    <Edit className="h-6 w-6 text-blue-400" />
                  ) : (
                    <Plus className="h-6 w-6 text-green-400" />
                  )}
                </div>
                <span
                  className={`bg-gradient-to-r ${editingResource
                      ? "from-blue-400 to-cyan-400"
                      : "from-green-400 to-emerald-400"
                    } bg-clip-text text-transparent`}
                >
                  {editingResource ? "Edit Resource" : "Create New Resource"}
                </span>
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingResource(null);
                  setNewResource({
                    title: "",
                    description: "",
                    access_level: "RESTRICTED",
                  });
                }}
                className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={
                editingResource ? handleUpdateResource : handleCreateResource
              }
              className="space-y-6"
            >
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
                  disabled={actionLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Description
                </label>
                <textarea
                  value={newResource.description}
                  onChange={(e) =>
                    setNewResource({
                      ...newResource,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-4 bg-gray-800/50 border-2 border-gray-700/50 rounded-xl focus:border-blue-500 focus:bg-gray-800/90 transition-all text-gray-200 resize-none"
                  placeholder="Describe your resource..."
                  rows={4}
                  disabled={actionLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Access Level
                </label>
                <select
                  value={newResource.access_level}
                  onChange={(e) =>
                    setNewResource({
                      ...newResource,
                      access_level: e.target.value,
                    })
                  }
                  className="w-full p-4 bg-gray-800/50 border-2 border-gray-700/50 rounded-xl focus:border-blue-500 focus:bg-gray-800/90 transition-all text-gray-200"
                  disabled={actionLoading}
                >
                  <option value="PRIVATE">🔒 Private (Owner only)</option>
                  <option value="RESTRICTED">
                    🛡️ Restricted (Specific users)
                  </option>
                  <option value="PUBLIC">🌍 Public (All users)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingResource(null);
                    setNewResource({
                      title: "",
                      description: "",
                      access_level: "RESTRICTED",
                    });
                  }}
                  className="px-6 py-3 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-xl transition-all"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>
                        {editingResource ? "Updating..." : "Creating..."}
                      </span>
                    </>
                  ) : (
                    <>
                      {editingResource ? (
                        <Edit className="h-5 w-5" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                      <span>
                        {editingResource
                          ? "Update Resource"
                          : "Create Resource"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceManager;
