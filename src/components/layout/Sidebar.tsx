import {
  Images,
  LayoutDashboard,
  ShoppingBag,
  Store as StoreIcon,
  Tag,
  Users,
  X
} from 'lucide-react';
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['super_admin'] },
  { name: 'Orders', href: '/orders', icon: ShoppingBag, roles: ['super_admin', 'admin'] },
  { name: 'Stores', href: '/stores', icon: StoreIcon, roles: ['super_admin'] },
  { name: 'Store Images', href: '/images', icon: Images, roles: ['super_admin', 'admin'] },
  { name: 'Store Offers', href: '/offers', icon: Tag, roles: ['super_admin', 'admin'] },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  
  // Filter navigation items based on user role (with flexible role checking)
  const filteredNavigation = navigation.filter(item => {
    const userRole = user?.role as string;
    const isSuperAdmin = userRole === 'super_admin' || userRole === 'superadmin' || userRole === 'SUPER_ADMIN';
    const isAdmin = userRole === 'admin' || userRole === 'ADMIN';
    
    // Check if user has access to this navigation item
    const hasAccess = item.roles.some(role => {
      if (role === 'super_admin') return isSuperAdmin;
      if (role === 'admin') return isAdmin || isSuperAdmin; // Super admins can access admin features too
      return false;
    });
    
    return hasAccess;
  });
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">BM</span>
            </div>
            <span className="ml-2 text-xl font-semibold text-gray-900">Admin</span>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {filteredNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "sidebar-link",
                    isActive && "active"
                  )
                }
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            BM E-commerce Admin v1.0.0
          </div>
        </div>
      </div>
    </>
  );
};
