import { formatCurrency } from '@/utils';
import { ORDER_STATUS_LABELS } from '@constants';
import { apiService } from '@services/api';
import { useAuthStore } from '@store/authStore';
import { useQuery } from '@tanstack/react-query';
import { log } from '@utils/logger';
import { Activity, AlertCircle, Clock, DollarSign, RefreshCw, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);



  // Fetch dashboard stats - load once, manual refresh only
  const { data: dashboardStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats', selectedPeriod],
    queryFn: () => apiService.getDashboardStats(),
    enabled: !!user, // Only fetch when user is authenticated
    staleTime: Infinity, // Data stays fresh until manual refresh
    gcTime: Infinity, // Keep in cache indefinitely
    refetchOnMount: true, // Fetch on first load
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    refetchInterval: false, // No automatic refresh
  });

  // Fetch recent orders for activity feed - load once, manual refresh only
  const { data: recentOrders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => apiService.getOrders({ limit: 5 }),
    enabled: !!user, // Only fetch when user is authenticated
    staleTime: Infinity, // Data stays fresh until manual refresh
    gcTime: Infinity, // Keep in cache indefinitely
    refetchOnMount: true, // Fetch on first load
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false, // No automatic refresh
  });

  // Fetch recent users - load once, manual refresh only
  const { data: recentUsers, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['recent-users'],
    queryFn: () => apiService.getUsers({ limit: 5 }),
    enabled: !!user, // Only fetch when user is authenticated
    staleTime: Infinity, // Data stays fresh until manual refresh
    gcTime: Infinity, // Keep in cache indefinitely
    refetchOnMount: true, // Fetch on first load
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false, // No automatic refresh
  });

  const stats = dashboardStats?.data ? [
    {
      name: 'Total Users',
      value: dashboardStats.data.totalUsers.toLocaleString(),
      change: '+12%', // This would come from API comparison
      changeType: 'positive' as const,
      icon: Users,
      trend: 'up' as const,
    },
    {
      name: 'Total Orders',
      value: dashboardStats.data.totalOrders.toLocaleString(),
      change: '+8%',
      changeType: 'positive' as const,
      icon: ShoppingBag,
      trend: 'up' as const,
    },
    {
      name: 'Revenue',
      value: formatCurrency(dashboardStats.data.totalRevenue),
      change: '+15%',
      changeType: 'positive' as const,
      icon: DollarSign,
      trend: 'up' as const,
    },
    {
      name: 'Active Orders',
      value: dashboardStats.data.activeOrders.toString(),
      change: 'Live',
      changeType: 'neutral' as const,
      icon: Activity,
      trend: 'stable' as const,
    },
  ] : [];

  // Manual refresh function
  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple refreshes
    
    setIsRefreshing(true);
    log.ui.userAction('dashboard-manual-refresh', { selectedPeriod });
    
    try {
      // Refresh all queries in parallel
      await Promise.all([
        refetchStats(),
        refetchOrders(),
        refetchUsers(),
      ]);
      
      setLastRefresh(new Date());
      log.ui.userAction('dashboard-refresh-success');
    } catch (error) {
      log.ui.userAction('dashboard-refresh-error', { error });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Set initial refresh time when data loads
  useEffect(() => {
    if ((dashboardStats || recentOrders || recentUsers) && !lastRefresh) {
      setLastRefresh(new Date());
    }
  }, [dashboardStats, recentOrders, recentUsers, lastRefresh]);

  useEffect(() => {
    log.ui.componentMount('DashboardPage', { selectedPeriod });
  }, [selectedPeriod]);

  if (statsError) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <div className="bg-red-50 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800">Error loading dashboard data. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-gray-600 mt-2">
              Here's what's happening with your store today.
            </p>
          </div>
          
          {/* Controls: Period Selector + Refresh Button */}
          <div className="flex items-center space-x-4">

            
            {/* Last Refresh Time */}
            {lastRefresh && (
              <div className="text-sm text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
            )}
            
            {/* Period Selector */}
            <div className="flex space-x-2">
              {(['today', 'week', 'month'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || statsLoading || ordersLoading || usersLoading}
              className={`
                inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
                ${isRefreshing || statsLoading || ordersLoading || usersLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                }
                transition-colors duration-200
              `}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm flex items-center ${
                    stat.changeType === 'positive' 
                      ? 'text-green-600' 
                      : 'text-gray-500'
                  }`}>
                    {stat.changeType === 'positive' && <TrendingUp className="h-3 w-3 mr-1" />}
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Today's Highlights */}
      {dashboardStats?.data && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Highlights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{dashboardStats.data.newOrdersToday}</div>
              <div className="text-sm text-gray-500">New Orders</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{dashboardStats.data.completedOrdersToday}</div>
              <div className="text-sm text-gray-500">Completed Orders</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{dashboardStats.data.activeOrders}</div>
              <div className="text-sm text-gray-500">Active Orders</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            {ordersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="flex items-center justify-between py-3">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div className="ml-4">
                        <div className="h-4 bg-gray-200 rounded mb-2 w-16"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrders?.data.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent orders</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders?.data.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Order #{order.id.slice(-8)}</p>
                      <p className="text-sm text-gray-500">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(order.total_amount)}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                        order.status === 'ready' ? 'bg-green-100 text-green-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Users</h3>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            {usersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="flex items-center py-3">
                      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                      <div className="ml-3 flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentUsers?.data.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent users</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentUsers?.data.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="ml-auto">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
