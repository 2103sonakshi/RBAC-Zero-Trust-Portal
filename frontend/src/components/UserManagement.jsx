import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Search,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  User,
  Mail,
  Calendar,
  Award,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = "http://localhost:3000/api";

const UserManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
      toast.error("Failed to load users");
    }
  };

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
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role_id || "");
    setShowRoleModal(true);
  };

  const handleCloseModal = () => {
    setShowRoleModal(false);
    setSelectedUser(null);
    setSelectedRole("");
  };

  const handleChangeRole = async () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put(
        `${API_URL}/users/${selectedUser.id}/role`,
        { roleId: selectedRole },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        toast.success(`Role updated for ${selectedUser.username}`);
        handleCloseModal();
        fetchUsers();
      }
    } catch (err) {
      console.error("Error updating user role:", err);
      toast.error(err.response?.data?.error || "Failed to update role");
    } finally {
      setLoading(false);
    }
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
        return "bg-red-500";
      case "USER":
        return "bg-blue-500";
      case "GUEST":
        return "bg-green-500";
      default:
        return "bg-purple-500";
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role_name === "ADMIN").length,
    users: users.filter((u) => u.role_name === "USER").length,
    guests: users.filter((u) => u.role_name === "GUEST").length,
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            User Management
          </h1>
          <p className="text-gray-400">Manage user roles and permissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Admins</p>
                <p className="text-2xl font-bold text-white">{stats.admins}</p>
              </div>
              <div className="bg-red-500/10 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Regular Users</p>
                <p className="text-2xl font-bold text-white">{stats.users}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <User className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Guests</p>
                <p className="text-2xl font-bold text-white">{stats.guests}</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg">
                <User className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-750 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-r ${getRoleBadgeColor(user.role_name)} flex items-center justify-center text-white font-medium text-sm`}
                        >
                          {user.username[0].toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-white">
                            {user.full_name || user.username}
                          </div>
                          <div className="text-sm text-gray-400">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-300">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        {user.email || "No email"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user.role_name)}`}
                      >
                        {user.role_name || "No Role"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-300">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenRoleModal(user)}
                        disabled={user.id === currentUser?.id}
                        className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          user.id === currentUser?.id
                            ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Change Role
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Users className="h-12 w-12 text-gray-600 mb-3" />
                        <p className="text-gray-400">No users found</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Try adjusting your search
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Change Role Modal */}
        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div
                className="fixed inset-0 bg-black opacity-50"
                onClick={handleCloseModal}
              ></div>

              <div className="relative bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Change Role for {selectedUser.username}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Select New Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a role...</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} {role.is_system === 1 ? "(System)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangeRole}
                    disabled={!selectedRole || loading}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                      !selectedRole || loading
                        ? "bg-blue-800 text-blue-300 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Update Role
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

export default UserManagement;
