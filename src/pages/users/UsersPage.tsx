import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Edit3, Mail, Plus, Shield, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';

import type { CreateAdminForm, UserFilters, User as UserType } from '@/types';
import { formatDate } from '@/utils';
import { VALIDATION_RULES } from '@constants';
import { apiService } from '@services/api';
import { useAuthStore } from '@store/authStore';
import { log } from '@utils/logger';

import { FormField, SearchInput } from '@components/forms';
import {
  Badge,
  Button,
  Modal,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ToggleSwitch
} from '@components/ui';

const createAdminSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(VALIDATION_RULES.USERNAME.MIN_LENGTH, `Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`)
    .max(VALIDATION_RULES.USERNAME.MAX_LENGTH, `Username must be less than ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters`)
    .matches(VALIDATION_RULES.USERNAME.PATTERN, 'Username can only contain letters, numbers, and underscores'),
  password: yup
    .string()
    .required('Password is required')
    .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH, `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`),
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters'),
  store_id: yup
    .string()
    .optional(),
});

const editUserSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters'),
  role: yup
    .string()
    .oneOf(['admin', 'customer'], 'Invalid role')
    .required('Role is required'),
  is_active: yup
    .boolean()
    .required('Status is required'),
});

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [togglingUsers, setTogglingUsers] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Check if current user is super admin (with flexible role checking)
  const userRole = currentUser?.role as string;
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'superadmin' || userRole === 'SUPER_ADMIN';
  
  if (!currentUser || !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">
            Only Super Administrators can access the Users management section.
          </p>
        </div>
      </div>
    );
  }

  const { control, handleSubmit, reset } = useForm<CreateAdminForm>({
    resolver: yupResolver(createAdminSchema) as any,
    defaultValues: {
      username: '',
      password: '',
      name: '',
      store_id: '',
    },
  });

  const { control: editControl, handleSubmit: handleEditSubmit, reset: resetEdit, watch: watchEdit, setValue: setEditValue } = useForm({
    resolver: yupResolver(editUserSchema) as any,
    defaultValues: {
      name: '',
      role: 'customer',
      is_active: true,
    },
  });

  // Fetch users query - exclude super admins
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users', filters.search, filters.role, filters.is_active, filters.page, filters.limit],
    queryFn: async () => {
      const response = await apiService.getUsers(filters);
      // Filter out super admin users
      if (response.data) {
        response.data = response.data.filter(user => user.role !== 'super_admin');
      }
      return response;
    },
    placeholderData: (previousData) => previousData,
  });

  // Fetch stores for assignment
  const { data: storesData } = useQuery({
    queryKey: ['stores-for-assignment'],
    queryFn: () => apiService.getStores({ limit: 100 }), // Get all stores for assignment
    enabled: isSuperAdmin, // Only fetch if super admin
  });

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: (data: CreateAdminForm) => {
      return apiService.createAdmin(data);
    },
    onSuccess: () => {
      log.ui.userAction('admin-created');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateModalOpen(false);
      reset();
    },
  });

  // Edit user mutation
  const editUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiService.updateUser(id, data),
    onSuccess: () => {
      log.ui.userAction('user-updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditModalOpen(false);
      resetEdit();
      setSelectedUser(null);
    },
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: (id: string) => apiService.toggleUserStatus(id),
    onMutate: (id: string) => {
      // Add user to toggling set
      setTogglingUsers(prev => new Set(prev).add(id));
    },
    onSuccess: () => {
      log.ui.userAction('user-status-toggled');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onSettled: (_, __, id: string) => {
      // Remove user from toggling set
      setTogglingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    },
  });

  const handleSearch = useCallback((search: string) => {
    log.ui.userAction('users-search', { query: search });
    setFilters(prev => ({ ...prev, search, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const handleFilterChange = useCallback((key: keyof UserFilters, value: unknown) => {
    log.ui.userAction('users-filter-change', { key, value });
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleEditUser = (user: UserType) => {
    setSelectedUser(user);
    resetEdit({
      name: user.name,
      role: user.role,
      is_active: user.is_active,
    });
    setIsEditModalOpen(true);
    log.ui.userAction('edit-user-opened', { userId: user.id });
  };

  const onEditSubmit = async (data: any) => {
    if (!selectedUser) return;
    
    log.ui.userAction('edit-user-submit', { userId: selectedUser.id, data });
    editUserMutation.mutate({
      id: selectedUser.id,
      data,
    });
  };

  const handleToggleUserStatus = (user: UserType) => {
    log.ui.userAction('toggle-user-status', { 
      userId: user.id, 
      from: user.is_active, 
      to: !user.is_active 
    });
    
    toggleUserStatusMutation.mutate(user.id);
  };

  const onCreateAdmin = async (data: CreateAdminForm) => {
    log.form.submit('CreateAdminForm', { username: data.username, role: 'admin', store_id: data.store_id });
    // Always set role to 'admin' to prevent super admin creation
    const adminData = { ...data, role: 'admin' as const };
    console.log('Form data being submitted:', adminData); // Debug log
    createAdminMutation.mutate(adminData);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'danger';
      case 'admin': return 'warning';
      case 'customer': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (is_active: boolean) => {
    return is_active ? 'success' : 'secondary';
  };

  useEffect(() => {
    log.ui.componentMount('UsersPage', { filters });
  }, []); // Only run on mount, not when filters change

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        </div>
        <div className="bg-red-50 rounded-lg p-6">
          <p className="text-red-800">Error loading users. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
            <p className="text-gray-600 mt-2">
              Manage customers and admin users.
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            Create Admin
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SearchInput
            placeholder="Search users..."
            onSearch={handleSearch}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={filters.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.is_active === undefined ? '' : filters.is_active.toString()}
              onChange={(e) => handleFilterChange('is_active', e.target.value === '' ? undefined : e.target.value === 'true')}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <span className="ml-2">Loading users...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : usersData?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-gray-500">
                    <User className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No users found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              usersData?.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                        {user.username && (
                          <div className="text-xs text-gray-400">
                            @{user.username}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role === 'super_admin' && <Shield className="h-3 w-3 mr-1" />}
                      {user.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.is_active)}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {user.role === 'admin' && user.assigned_store ? (
                        <div 
                          className="text-xs bg-gray-100 px-2 py-1 rounded cursor-help"
                          title={`Assigned on ${new Date(user.assigned_store.assigned_at).toLocaleDateString()}`}
                        >
                          {user.assigned_store.store_name}
                        </div>
                      ) : user.role === 'admin' ? (
                        <span className="text-xs text-gray-400">No store assigned</span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {user.last_login_at ? formatDate(user.last_login_at) : 'Never'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        icon={<Edit3 className="h-3 w-3" />}
                      >
                        Edit
                      </Button>
                      <div className="flex items-center space-x-2">
                        <ToggleSwitch
                          checked={user.is_active}
                          onChange={() => handleToggleUserStatus(user)}
                          loading={togglingUsers.has(user.id)}
                          size="sm"
                          disabled={togglingUsers.has(user.id)}
                        />
                        <span className={`text-xs font-medium ${togglingUsers.has(user.id) ? 'text-blue-600' : user.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                          {togglingUsers.has(user.id) ? 'Updating...' : user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {usersData && usersData.meta?.pagination && usersData.meta.pagination.totalPages > 1 && (
          <Pagination
            currentPage={usersData.meta.pagination.currentPage || 1}
            totalPages={usersData.meta.pagination.totalPages || 1}
            totalItems={usersData.meta.pagination.totalItems || 0}
            itemsPerPage={usersData.meta.pagination.itemsPerPage || 10}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Create Admin Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Admin"
        description="Add a new administrator to the system (Single store assignment only)"
        size="md"
      >
        <form onSubmit={handleSubmit(onCreateAdmin)} className="space-y-4">
          <FormField
            name="username"
            control={control}
            label="Username"
            placeholder="Enter username"
            helperText="Must be 3-50 characters, letters, numbers, and underscores only"
          />

          <FormField
            name="name"
            control={control}
            label="Full Name"
            placeholder="Enter full name"
          />

          <FormField
            name="password"
            control={control}
            type="password"
            label="Password"
            placeholder="Enter password"
            helperText="Must be at least 8 characters"
          />

          {/* Info note about role and store assignment */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Only Admin users can be created through this interface. Super Admin creation is restricted for security purposes. Each admin can be assigned to only one store.
            </p>
          </div>

          {/* Store Assignment - Single store only */}
          {storesData?.data && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Store
              </label>
              <Controller
                name="store_id"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">No store assignment</option>
                    {storesData.data.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name} {store.address && `(${store.address})`}
                      </option>
                    ))}
                  </select>
                )}
              />
              <p className="text-xs text-gray-500 mt-1">
                Select a single store this admin will have access to. Leave empty for no store access.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createAdminMutation.isPending}
            >
              Create Admin
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
        description={`Edit details for ${selectedUser?.name || 'user'}`}
        size="md"
      >
        <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
          <FormField
            name="name"
            control={editControl}
            label="Full Name"
            placeholder="Enter full name"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              {...editControl.register?.('role')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              User Status
            </label>
            <ToggleSwitch
              checked={watchEdit('is_active') || false}
              onChange={(checked) => setEditValue('is_active', checked)}
              size="md"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={editUserMutation.isPending}
            >
              Update User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;
