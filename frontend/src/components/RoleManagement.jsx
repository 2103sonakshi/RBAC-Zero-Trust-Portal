import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  Lock,
  Check,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = "http://localhost:3000/api";

const RoleManagement = () => {
  const { user, token } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: "", description: "" });
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setRoles(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
      setError("Failed to load roles");
      toast.error("Failed to load roles");
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await axios.get(`${API_URL}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setPermissions(response.data.grouped || {});
      }
    } catch (err) {
      console.error("Error fetching permissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRoleModal = (role = null) => {
    if (role) {
      setSelectedRole(role);
      setRoleForm({ name: role.name, description: role.description || "" });
    } else {
      setSelectedRole(null);
      setRoleForm({ name: "", description: "" });
    }
    setShowRoleModal(true);
  };

  const handleCloseRoleModal = () => {
    setShowRoleModal(false);
    setSelectedRole(null);
    setRoleForm({ name: "", description: "" });
  };

  const handleOpenPermissionModal = async (role) => {
    setSelectedRole(role);
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/roles/${role.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        const rolePermissions = response.data.data.permissions || [];
        setSelectedPermissions(rolePermissions.map((p) => p.id));
      }
    } catch (err) {
      console.error("Error fetching role permissions:", err);
      toast.error("Failed to load role permissions");
    } finally {
      setLoading(false);
      setShowPermissionModal(true);
    }
  };

  const handleClosePermissionModal = () => {
    setShowPermissionModal(false);
    setSelectedRole(null);
    setSelectedPermissions([]);
  };

  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    try {
      setLoading(true);
      let response;

      if (selectedRole) {
        response = await axios.put(
          `${API_URL}/roles/${selectedRole.id}`,
          roleForm,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      } else {
        response = await axios.post(`${API_URL}/roles`, roleForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (response.data.success) {
        toast.success(
          selectedRole
            ? "Role updated successfully"
            : "Role created successfully",
        );
        handleCloseRoleModal();
        fetchRoles();
      }
    } catch (err) {
      console.error("Error saving role:", err);
      toast.error(err.response?.data?.error || "Failed to save role");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm("Are you sure you want to delete this role?")) {
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        toast.success("Role deleted successfully");
        fetchRoles();
      }
    } catch (err) {
      console.error("Error deleting role:", err);
      toast.error(err.response?.data?.error || "Failed to delete role");
    }
  };

  const handleSavePermissions = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/roles/${selectedRole.id}/permissions`,
        { permissionIds: selectedPermissions },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        toast.success("Permissions assigned successfully");
        handleClosePermissionModal();
        fetchRoles();
      }
    } catch (err) {
      console.error("Error saving permissions:", err);
      toast.error(err.response?.data?.error || "Failed to save permissions");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getRoleColor = (roleName) => {
    switch (roleName?.toUpperCase()) {
      case "ADMIN":
        return "bg-red-100 text-red-800 border-red-200";
      case "USER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "GUEST":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-purple-100 text-purple-800 border-purple-200";
    }
  };

  const getRoleBadgeColor = (roleName) => {
    switch (roleName?.toUpperCase()) {
      case "ADMIN":
        return "from-red-500 to-red-600";
      case "USER":
        return "from-blue-500 to-blue-600";
      case "GUEST":
        return "from-green-500 to-green-600";
      default:
        return "from-purple-500 to-purple-600";
    }
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPermissions = Object.values(permissions).reduce(
    (sum, perms) => sum + perms.length,
    0,
  );

  if (loading && roles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Role Management
            </h1>
            <p className="text-gray-400">
              Create and manage roles with granular permissions
            </p>
          </div>
          <button
            onClick={() => handleOpenRoleModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create New Role</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Roles</p>
                <p className="text-2xl font-bold text-white">{roles.length}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {roles.filter((r) => r.is_system).length} system roles
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">
                  {roles.reduce((sum, role) => sum + (role.user_count || 0), 0)}
                </p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg">
                <Users className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Across all roles</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Permissions</p>
                <p className="text-2xl font-bold text-white">
                  {totalPermissions}
                </p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-lg">
                <Lock className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Available permissions</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search roles by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Roles Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredRoles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-gray-750 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-r ${getRoleBadgeColor(role.name)} flex items-center justify-center text-white font-medium text-sm`}
                        >
                          {role.name[0]}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-white">
                            {role.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-300">
                        {role.description || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                        {role.user_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-300">
                        {role.permission_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          role.is_system
                            ? "bg-gray-700 text-gray-300 border-gray-600"
                            : "bg-blue-900 text-blue-300 border-blue-800"
                        }`}
                      >
                        {role.is_system ? "System" : "Custom"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleOpenPermissionModal(role)}
                          className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          title="Manage Permissions"
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenRoleModal(role)}
                          disabled={role.is_system === 1}
                          className={`p-2 rounded-lg transition-colors ${
                            role.is_system === 1
                              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                          title="Edit Role"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          disabled={role.is_system === 1 || role.user_count > 0}
                          className={`p-2 rounded-lg transition-colors ${
                            role.is_system === 1 || role.user_count > 0
                              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                          title="Delete Role"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredRoles.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Shield className="h-12 w-12 text-gray-600 mb-3" />
                        <p className="text-gray-400">No roles found</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Create your first role to get started
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Role Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div
                className="fixed inset-0 bg-black opacity-50"
                onClick={handleCloseRoleModal}
              ></div>

              <div className="relative bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    {selectedRole ? "Edit Role" : "Create New Role"}
                  </h3>
                  <button
                    onClick={handleCloseRoleModal}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Role Name *
                    </label>
                    <input
                      type="text"
                      value={roleForm.name}
                      onChange={(e) =>
                        setRoleForm({ ...roleForm, name: e.target.value })
                      }
                      placeholder="e.g., MANAGER, EDITOR, VIEWER"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={selectedRole?.is_system === 1}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Description
                    </label>
                    <textarea
                      value={roleForm.description}
                      onChange={(e) =>
                        setRoleForm({
                          ...roleForm,
                          description: e.target.value,
                        })
                      }
                      rows="3"
                      placeholder="Describe the purpose of this role..."
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={selectedRole?.is_system === 1}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCloseRoleModal}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRole}
                    disabled={
                      !roleForm.name.trim() ||
                      selectedRole?.is_system === 1 ||
                      loading
                    }
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                      !roleForm.name.trim() ||
                      selectedRole?.is_system === 1 ||
                      loading
                        ? "bg-blue-800 text-blue-300 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {selectedRole ? "Update" : "Create"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Permission Assignment Modal */}
        {showPermissionModal && selectedRole && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div
                className="fixed inset-0 bg-black opacity-50"
                onClick={handleClosePermissionModal}
              ></div>

              <div className="relative bg-gray-800 rounded-lg max-w-4xl w-full p-6 border border-gray-700 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-800 pt-2 pb-4 border-b border-gray-700">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Manage Permissions for {selectedRole.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Select permissions to assign to this role
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                      {selectedPermissions.length} selected
                    </span>
                    <button
                      onClick={handleClosePermissionModal}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 mt-4">
                  {Object.entries(permissions).map(([resource, perms]) => (
                    <div
                      key={resource}
                      className="border border-gray-700 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleSection(resource)}
                        className="w-full px-4 py-3 bg-gray-750 hover:bg-gray-700 flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          {expandedSections[resource] ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="font-medium text-white capitalize">
                            {resource}
                          </span>
                          <span className="text-sm text-gray-400">
                            ({perms.length})
                          </span>
                        </div>
                      </button>

                      {expandedSections[resource] && (
                        <div className="p-4 bg-gray-750 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {perms.map((perm) => (
                            <label
                              key={perm.id}
                              className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(perm.id)}
                                onChange={() => handlePermissionToggle(perm.id)}
                                className="mt-1 h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-0"
                              />
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {perm.action}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {perm.description}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700 sticky bottom-0 bg-gray-800 pb-2">
                  <button
                    onClick={handleClosePermissionModal}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePermissions}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                      loading
                        ? "bg-blue-800 text-blue-300 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Permissions
                      </>
                    )}
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

export default RoleManagement;
