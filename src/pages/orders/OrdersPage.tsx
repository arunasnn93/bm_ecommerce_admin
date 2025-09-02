import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Calendar,
    CheckCircle,
    ChefHat,
    Clock,
    DollarSign,
    Eye,
    MapPin,
    MessageSquare,
    Phone,
    Truck,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import type { Order, OrderFilters, SendMessageForm, UpdateOrderPriceForm, UpdateOrderStatusForm } from '@/types';
import { formatCurrency, formatDate } from '@/utils';
import { DEFAULTS, ORDER_STATUS, ORDER_STATUS_LABELS } from '@constants';
import { apiService } from '@services/api';
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
    TableRow
} from '@components/ui';

const updateStatusSchema = yup.object({
  status: yup
    .string()
    .oneOf(Object.values(ORDER_STATUS), 'Invalid status')
    .required('Status is required'),
  message: yup.string(),
});

const sendMessageSchema = yup.object({
  message: yup
    .string()
    .required('Message is required')
    .min(1, 'Message cannot be empty')
    .max(500, 'Message must be less than 500 characters'),
});

const updatePriceSchema = yup.object({
  total_amount: yup
    .number()
    .required('Total amount is required')
    .positive('Total amount must be positive')
    .min(0.01, 'Total amount must be at least 0.01'),
  note: yup
    .string()
    .optional()
    .max(500, 'Note must be less than 500 characters'),
});

const OrdersPage: React.FC = () => {
  const [filters, setFilters] = useState<OrderFilters>(DEFAULTS.ORDER_FILTERS);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; filename: string; orderId: string } | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { control: statusControl, handleSubmit: handleStatusSubmit, reset: resetStatus } = useForm<UpdateOrderStatusForm>({
    resolver: yupResolver(updateStatusSchema) as any,
  });

  const { control: messageControl, handleSubmit: handleMessageSubmit, reset: resetMessage } = useForm<SendMessageForm>({
    resolver: yupResolver(sendMessageSchema),
  });

  const { control: priceControl, handleSubmit: handlePriceSubmit, reset: resetPrice } = useForm<UpdateOrderPriceForm>({
    resolver: yupResolver(updatePriceSchema) as any,
  });

  // Fetch orders query
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      console.log('🔍 [OrdersPage] Fetching orders with filters:', filters);
      try {
        const response = await apiService.getOrders(filters);
        console.log('✅ [OrdersPage] Orders API response:', response);
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`📊 [OrdersPage] Found ${response.data.length} orders`);
          
          // Transform backend response to match frontend expectations
          const transformedData = response.data.map(order => ({
            ...order,
            // Map customer data from nested object to direct fields
            customer_name: order.customer?.name || 'Unknown Customer',
            customer_mobile: order.customer?.mobile || order.delivery_phone || 'No Phone',
            // Map order_items to items
            items: order.order_items || [],
            // Add empty arrays for missing data
            images: order.order_images || [],
            status_history: order.status_history || [],
            // Transform delivery_address from string to object
            delivery_address: typeof order.delivery_address === 'string' ? {
              street: order.delivery_address,
              city: '',
              state: '',
              zip_code: ''
            } : order.delivery_address || {
              street: '',
              city: '',
              state: '',
              zip_code: ''
            }
          }));
          
          console.log('🔄 [OrdersPage] Transformed orders:', transformedData);
          
          transformedData.forEach((order, index) => {
            console.log(`📦 [OrdersPage] Order ${index + 1}:`, {
              id: order.id,
              customer_name: order.customer_name,
              has_items: !!order.items,
              items_count: order.items?.length || 0,
              has_images: !!order.images,
              images_count: order.images?.length || 0,
              has_status_history: !!order.status_history,
              status_history_count: order.status_history?.length || 0,
              full_order: order
            });
            
            // Log order images details
            if (order.images && order.images.length > 0) {
              console.log(`🖼️ [OrdersPage] Order ${index + 1} images:`, order.images.map(img => ({
                id: img.id,
                url: img.url,
                filename: img.filename
              })));
            }
          });
          
          return {
            ...response,
            data: transformedData
          };
        } else {
          console.log('⚠️ [OrdersPage] No orders data or invalid format:', response);
        }
        
        return response;
      } catch (error) {
        console.error('❌ [OrdersPage] Error fetching orders:', error);
        throw error;
      }
    },
    placeholderData: (previousData) => previousData,
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderStatusForm }) => 
      apiService.updateOrderStatus(id, data),
    onSuccess: () => {
      log.ui.userAction('order-status-updated');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsStatusModalOpen(false);
      resetStatus();
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SendMessageForm }) => 
      apiService.sendOrderMessage(id, data),
    onSuccess: () => {
      log.ui.userAction('order-message-sent');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsMessageModalOpen(false);
      resetMessage();
    },
  });

  // Update order price mutation
  const updatePriceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderPriceForm }) => 
      apiService.updateOrderPrice(id, data),
    onSuccess: () => {
      log.ui.userAction('order-price-updated');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsPriceModalOpen(false);
      resetPrice();
    },
  });

  const handleSearch = (search: string) => {
    log.ui.userAction('orders-search', { query: search });
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (key: keyof OrderFilters, value: unknown) => {
    log.ui.userAction('orders-filter-change', { key, value });
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleViewOrder = (order: Order) => {
    log.ui.userAction('view-order', { orderId: order.id });
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateStatus = (order: Order) => {
    log.ui.userAction('update-order-status-open', { orderId: order.id });
    setSelectedOrder(order);
    resetStatus({ status: order.status, message: '' });
    setIsStatusModalOpen(true);
  };

  const handleSendMessage = (order: Order) => {
    log.ui.userAction('send-order-message-open', { orderId: order.id });
    setSelectedOrder(order);
    resetMessage({ message: '' });
    setIsMessageModalOpen(true);
  };

  const handleViewImage = (image: any, order: Order) => {
    log.ui.userAction('view-order-image', { orderId: order.id, imageId: image.id });
    setSelectedImage({
      url: image.url,
      filename: image.filename,
      orderId: order.id
    });
    setSelectedOrder(order);
    setIsImageModalOpen(true);
  };

  const handleUpdatePrice = (order: Order) => {
    log.ui.userAction('update-order-price-open', { orderId: order.id });
    setSelectedOrder(order);
    resetPrice({ total_amount: order.total_amount, note: '' });
    setIsPriceModalOpen(true);
  };

  const onUpdateStatus = async (data: UpdateOrderStatusForm) => {
    if (!selectedOrder) return;
    log.form.submit('UpdateOrderStatusForm', { 
      orderId: selectedOrder.id, 
      fromStatus: selectedOrder.status, 
      toStatus: data.status 
    });
    updateStatusMutation.mutate({ id: selectedOrder.id, data });
  };

  const onSendMessage = async (data: SendMessageForm) => {
    if (!selectedOrder) return;
    log.form.submit('SendMessageForm', { orderId: selectedOrder.id });
    sendMessageMutation.mutate({ id: selectedOrder.id, data });
  };

  const onUpdatePrice = async (data: UpdateOrderPriceForm) => {
    if (!selectedOrder) return;
    log.form.submit('UpdateOrderPriceForm', { orderId: selectedOrder.id, newPrice: data.total_amount });
    updatePriceMutation.mutate({ id: selectedOrder.id, data });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case ORDER_STATUS.ACCEPTED: return 'info';
      case ORDER_STATUS.PACKING: return 'warning';
      case ORDER_STATUS.READY: return 'success';
      case ORDER_STATUS.DELIVERED: return 'success';
      case ORDER_STATUS.REJECTED: return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case ORDER_STATUS.SUBMITTED: return <Clock className="h-4 w-4" />;
      case ORDER_STATUS.ACCEPTED: return <CheckCircle className="h-4 w-4" />;
      case ORDER_STATUS.PACKING: return <ChefHat className="h-4 w-4" />;
      case ORDER_STATUS.READY: return <CheckCircle className="h-4 w-4" />;
      case ORDER_STATUS.DELIVERED: return <Truck className="h-4 w-4" />;
      case ORDER_STATUS.REJECTED: return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    log.ui.componentMount('OrdersPage');
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
        </div>
        <div className="bg-red-50 rounded-lg p-6">
          <p className="text-red-800">Error loading orders. Please try again.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
            <p className="text-gray-600 mt-2">
              View and manage customer orders.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Total Orders: {ordersData?.meta?.pagination?.totalItems || 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SearchInput
            placeholder="Search orders..."
            onSearch={handleSearch}
            initialValue={filters.search || ''}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
                <option key={status} value={status}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Images</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <span className="ml-2">Loading orders...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : ordersData?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-gray-500">
                    <ChefHat className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No orders found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              ordersData?.data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">#{order.id.slice(-8)}</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer_name}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {order.customer_mobile}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.images && order.images.length > 0 ? (
                        <div className="flex space-x-1">
                          {order.images.slice(0, 2).map((image: any, index: number) => (
                            <div
                              key={image.id}
                              className="w-8 h-8 rounded border border-gray-200 overflow-hidden cursor-pointer hover:opacity-75"
                              title={`Image ${index + 1}`}
                              onClick={() => handleViewImage(image, order)}
                            >
                              <img
                                src={image.url}
                                alt={`Order image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {order.images.length > 2 && (
                            <div className="w-8 h-8 rounded border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                              +{order.images.length - 2}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No images</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm font-medium">
                      {formatCurrency(order.total_amount)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      <span className="flex items-center">
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{ORDER_STATUS_LABELS[order.status]}</span>
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(order.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                        icon={<Eye className="h-3 w-3" />}
                      >
                        View
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateStatus(order)}
                        icon={getStatusIcon(order.status)}
                      >
                        Status
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendMessage(order)}
                        icon={<MessageSquare className="h-3 w-3" />}
                      >
                        Message
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdatePrice(order)}
                        icon={<DollarSign className="h-3 w-3" />}
                      >
                        Price
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {ordersData && ordersData.meta?.pagination && ordersData.meta.pagination.totalPages > 1 && (
          <Pagination
            currentPage={ordersData.meta.pagination.currentPage || 1}
            totalPages={ordersData.meta.pagination.totalPages || 1}
            totalItems={ordersData.meta.pagination.totalItems || 0}
            itemsPerPage={ordersData.meta.pagination.itemsPerPage || 10}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Order Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Order #${selectedOrder?.id.slice(-8)}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Customer Info */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Customer Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center">
                  <span className="font-medium w-24">Name:</span>
                  <span>{selectedOrder.customer_name}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span className="font-medium w-24">Phone:</span>
                  <span>{selectedOrder.customer_mobile}</span>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                  <span className="font-medium w-24">Address:</span>
                  <div>
                    {typeof selectedOrder.delivery_address === 'string' ? (
                      <div>{selectedOrder.delivery_address}</div>
                    ) : (
                      <>
                        <div>{selectedOrder.delivery_address.street}</div>
                        <div>{selectedOrder.delivery_address.city}, {selectedOrder.delivery_address.state} {selectedOrder.delivery_address.zip_code}</div>
                        {selectedOrder.delivery_address.landmark && (
                          <div className="text-sm text-gray-600">Landmark: {selectedOrder.delivery_address.landmark}</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Order Items</h4>
              <div className="space-y-2">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No items found for this order
                  </div>
                )}
                <div className="border-t pt-2 mt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Images */}
            {selectedOrder.images && selectedOrder.images.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Order Images</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedOrder.images.map((image, index) => (
                    <div key={image.id} className="relative">
                      <img
                        src={image.url}
                        alt={`Order image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleViewImage(image, selectedOrder)}
                      />
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        Image {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Instructions */}
            {selectedOrder.special_instructions && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Special Instructions</h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">{selectedOrder.special_instructions}</p>
                </div>
              </div>
            )}

            {/* Order Notes */}
            {selectedOrder.notes && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Order Notes</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-800">{selectedOrder.notes}</p>
                </div>
              </div>
            )}

            {/* Admin Notes */}
            {selectedOrder.admin_notes && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Admin Notes</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800">{selectedOrder.admin_notes}</p>
                </div>
              </div>
            )}

            {/* Status History */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Status History</h4>
              <div className="space-y-2">
                {selectedOrder.status_history && selectedOrder.status_history.length > 0 ? (
                  selectedOrder.status_history.map((history, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{ORDER_STATUS_LABELS[history.status as keyof typeof ORDER_STATUS_LABELS]}</div>
                        {history.note && (
                          <div className="text-sm text-gray-600">{history.note}</div>
                        )}
                        <div className="text-xs text-gray-500">by {history.created_by}</div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(history.created_at)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No status history available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Order Status"
        description="Change the status of this order"
        size="md"
      >
        <form onSubmit={handleStatusSubmit(onUpdateStatus as any)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              {...statusControl.register?.('status')}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
                <option key={status} value={status}>{label}</option>
              ))}
            </select>
          </div>

          <FormField
            name="message"
            control={statusControl as any}
            label="Message (Optional)"
            placeholder="Add a message about this status change..."
            helperText="This message will be stored in status update log"
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={updateStatusMutation.isPending}
            >
              Update Status
            </Button>
          </div>
        </form>
      </Modal>

      {/* Send Message Modal */}
      <Modal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        title="Send Message to Customer"
        description="Send a message to the customer via WhatsApp"
        size="md"
      >
        <form onSubmit={handleMessageSubmit(onSendMessage)} className="space-y-4">
          <FormField
            name="message"
            control={messageControl}
            label="Message"
            placeholder="Type your message here..."
            helperText="This message will be sent to the customer via WhatsApp"
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMessageModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={sendMessageMutation.isPending}
              icon={<MessageSquare className="h-4 w-4" />}
            >
              Send Message
            </Button>
          </div>
        </form>
      </Modal>

             {/* Update Price Modal */}
       <Modal
         isOpen={isPriceModalOpen}
         onClose={() => setIsPriceModalOpen(false)}
         title="Update Order Price"
         description="Change the total amount of this order"
         size="md"
       >
         <form onSubmit={handlePriceSubmit(onUpdatePrice as any)} className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Total Amount
             </label>
             <input
               type="number"
               {...priceControl.register?.('total_amount')}
               className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
               step="0.01"
               min="0.01"
             />
           </div>

           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Note (Optional)
             </label>
             <textarea
               {...priceControl.register?.('note')}
               className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
               placeholder="Add a note about this price change..."
               rows={3}
             />
             <p className="text-xs text-gray-500 mt-1">This note will be stored in price update log</p>
           </div>

           <div className="flex justify-end space-x-3 pt-4">
             <Button
               type="button"
               variant="outline"
               onClick={() => setIsPriceModalOpen(false)}
             >
               Cancel
             </Button>
             <Button
               type="submit"
               loading={updatePriceMutation.isPending}
             >
               Update Price
             </Button>
           </div>
         </form>
       </Modal>

      {/* Image View Modal */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        title={`Order Image - #${selectedOrder?.id.slice(-8)}`}
        size="xl"
      >
        {selectedImage && selectedOrder && (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Order Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Customer:</span>
                  <span className="ml-2">{selectedOrder.customer_name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <span className="ml-2">{selectedOrder.customer_mobile}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="ml-2">
                    <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                      {ORDER_STATUS_LABELS[selectedOrder.status]}
                    </Badge>
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Total:</span>
                  <span className="ml-2">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-700">Address:</span>
                  <span className="ml-2">
                    {typeof selectedOrder.delivery_address === 'string' 
                      ? selectedOrder.delivery_address 
                      : `${selectedOrder.delivery_address.street}, ${selectedOrder.delivery_address.city}`
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Image Display */}
            <div className="text-center">
              <img
                src={selectedImage.url}
                alt={`Order image - ${selectedImage.filename}`}
                className="max-w-full max-h-96 object-contain rounded-lg border border-gray-200"
              />
              <div className="mt-2 text-sm text-gray-500">
                {selectedImage.filename}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(selectedImage.url, '_blank')}
              >
                Open in New Tab
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsImageModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrdersPage;
