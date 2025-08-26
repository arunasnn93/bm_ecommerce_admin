# Role-Based Access Control (RBAC) Implementation

## 🔐 **Overview**

The BM Admin App now implements comprehensive Role-Based Access Control (RBAC) to ensure proper security and user management based on administrative privileges.

## 👥 **User Roles**

### **Super Admin** (`super_admin`)
- **Full System Access**: Complete control over all application features
- **User Management**: Can view, create, edit, and manage all users (except other super admins)
- **Exclusive Features**: Access to Users management section
- **Responsibilities**: System administration, user role assignment, security oversight

### **Admin** (`admin`) 
- **Standard Operations**: Access to core business functions
- **Limited User Access**: Cannot access user management
- **Features**: Dashboard, Orders, Store Images, Settings
- **Responsibilities**: Day-to-day operations, order management, content management

### **Customer** (`customer`)
- **Frontend Only**: No admin panel access
- **Restrictions**: Cannot access any admin features
- **Purpose**: End users of the e-commerce platform

## 🛡️ **Security Implementation**

### **1. Navigation Security**
```typescript
// Navigation items with role restrictions
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['super_admin'] }, // Super admin only
  { name: 'Orders', href: '/orders', icon: ShoppingBag, roles: ['super_admin', 'admin'] },
  { name: 'Store Images', href: '/images', icon: Images, roles: ['super_admin', 'admin'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['super_admin', 'admin'] },
];

// Dynamic filtering based on user role
const filteredNavigation = navigation.filter(item => 
  user?.role && item.roles.includes(user.role)
);
```

### **2. Page-Level Protection**
```typescript
// Super admin check in Users page
if (!currentUser || currentUser.role !== 'super_admin') {
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
```

### **3. Data Filtering**
```typescript
// Filter out super admin users from the list
const { data: usersData } = useQuery({
  queryKey: ['users', filters],
  queryFn: async () => {
    const response = await apiService.getUsers(filters);
    // Filter out super admin users
    if (response.data) {
      response.data = response.data.filter(user => user.role !== 'super_admin');
    }
    return response;
  },
});
```

## 📋 **Users Management Features (Super Admin Only)**

### **Enhanced User Table**
- **Comprehensive Display**: Name, email, username, role, status, last login, created date
- **Action Buttons**: Edit and Activate/Deactivate controls
- **Visual Indicators**: Role badges with icons, status indicators
- **Search & Filtering**: By role, status, and text search
- **Pagination**: Efficient handling of large user lists

### **User Creation**
- **Create Admin Users**: Add new admin and super admin accounts
- **Form Validation**: Username, password, name, and role validation
- **Security Rules**: Username pattern matching, password requirements
- **Role Assignment**: Select between admin and super admin roles

### **User Editing**
- **Update Profile**: Edit name, role, and active status
- **Role Management**: Change user roles (admin ↔ customer)
- **Status Control**: Enable/disable user accounts
- **Real-time Updates**: Immediate reflection of changes

### **Security Restrictions**
- **Super Admin Protection**: Super admins are hidden from the user list
- **Self-Protection**: Super admins cannot edit other super admins
- **Role Limitations**: Can only assign admin or customer roles (not super admin)

## 🎯 **Access Control Matrix**

| Feature | Super Admin | Admin | Customer |
|---------|-------------|-------|----------|
| Dashboard | ✅ | ✅ | ❌ |
| Users Management | ✅ | ❌ | ❌ |
| Orders | ✅ | ✅ | ❌ |
| Store Images | ✅ | ✅ | ❌ |
| Settings | ✅ | ✅ | ❌ |
| Create Users | ✅ | ❌ | ❌ |
| Edit Users | ✅ | ❌ | ❌ |
| View All Users | ✅ | ❌ | ❌ |

## 🔧 **Implementation Details**

### **Frontend Security**
- **Component Guards**: Role checks in components
- **Route Protection**: ProtectedRoute component validates authentication
- **Navigation Filtering**: Dynamic menu based on user role
- **UI Conditional Rendering**: Show/hide features based on permissions

### **API Security**
- **Endpoint Protection**: Backend validates user roles
- **Data Filtering**: Server-side filtering of sensitive data
- **Authentication Headers**: JWT tokens with role information
- **Request Validation**: Role-based request validation

### **Error Handling**
- **Access Denied Pages**: User-friendly access restriction messages
- **Graceful Degradation**: Fallback UI for unauthorized access
- **Security Logging**: Track unauthorized access attempts
- **User Feedback**: Clear messaging about permission requirements

## 🚀 **Usage Examples**

### **Super Admin Login**
1. Login with super admin credentials
2. Full navigation menu visible (including Users)
3. Access to all features and user management
4. Can create, edit, and manage other users

### **Admin Login**
1. Login with admin credentials  
2. Limited navigation menu (no Users section)
3. Access to operational features only
4. Cannot access user management

### **Unauthorized Access**
1. Admin tries to access `/users` directly
2. Shown access restriction message
3. Redirected or blocked from sensitive features
4. Clear explanation of permission requirements

## 🛠️ **Development Notes**

### **Adding New Roles**
1. Update type definitions in `@/types`
2. Add role to navigation permissions
3. Update page-level guards
4. Configure API endpoint permissions
5. Update access control matrix documentation

### **Role Hierarchy**
- **Super Admin**: Highest privileges, system administration
- **Admin**: Operational privileges, content management
- **Customer**: No admin access, frontend only

### **Security Best Practices**
- Always validate roles on both frontend and backend
- Use principle of least privilege
- Log security events and access attempts
- Regular security audits and role reviews
- Clear permission documentation

This RBAC implementation ensures secure, role-appropriate access to admin features while maintaining a smooth user experience for each user type.
