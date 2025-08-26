import type { PaginatedResponse, Store } from '@/types';
import { Button, Input, Modal, Pagination, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { apiService } from '@services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { log } from '@utils/logger';
import { useCallback, useEffect, useState } from 'react';

const StoresPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<{ search?: string; page: number; limit: number }>({ page: 1, limit: 10 });
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; description: string; address: string; is_active: boolean }>({
    name: '',
    description: '',
    address: '',
    is_active: true,
  });

  useEffect(() => {
    log.ui.componentMount('StoresPage');
  }, []);

  const { data } = useQuery<PaginatedResponse<Store>>({
    queryKey: ['stores', filters.search, filters.page, filters.limit],
    queryFn: () => apiService.getStores(filters),
  });

  const createMutation = useMutation({
    mutationFn: () => apiService.createStore({
      name: form.name,
      description: form.description || undefined,
      address: form.address || undefined,
      is_active: form.is_active,
    }),
    onSuccess: () => {
      setIsCreateOpen(false);
      setForm({ name: '', description: '', address: '', is_active: true });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!selectedStore) throw new Error('No store selected');
      return apiService.updateStore(selectedStore.id, {
        name: form.name || undefined,
        description: form.description || undefined,
        address: form.address || undefined,
        is_active: form.is_active,
      });
    },
    onSuccess: () => {
      setIsEditOpen(false);
      setSelectedStore(null);
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteStore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  }, []);

  const openCreate = () => {
    setForm({ name: '', description: '', address: '', is_active: true });
    setIsCreateOpen(true);
  };

  const openEdit = (store: Store) => {
    setSelectedStore(store);
    setForm({
      name: store.name || '',
      description: store.description || '',
      address: store.address || '',
      is_active: store.is_active ?? true,
    });
    setIsEditOpen(true);
  };

  const onPageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const stores = data?.data || [];
  const pagination = data?.meta?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stores Management</h1>
            <p className="text-gray-600 mt-2">
              Manage store locations and information.
            </p>
          </div>
          <Button onClick={openCreate}>Create Store</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input 
              placeholder="Search stores..." 
              value={filters.search || ''} 
              onChange={handleSearch}
              className="max-w-md"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.address || '-'}</TableCell>
                <TableCell>{s.is_active ? 'Active' : 'Inactive'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)}>Edit</Button>
                    <Button size="sm" variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(s.id)}>Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={pagination.currentPage || 1}
              totalPages={pagination.totalPages || 1}
              totalItems={pagination.totalItems || 0}
              itemsPerPage={pagination.itemsPerPage || 10}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Store">
        <div className="space-y-4">
          <Input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input placeholder="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Create</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Store">
        <div className="space-y-4">
          <Input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input placeholder="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button loading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StoresPage;


