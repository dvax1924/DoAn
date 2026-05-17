import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import AdminLayout from '../components/AdminLayout';
import PageTransition from '../components/PageTransition';

import Home from '../pages/customer/Home';
import Login from '../pages/customer/Login';
import Register from '../pages/customer/Register';
import Products from '../pages/customer/Products';
import ProductDetail from '../pages/customer/ProductDetail';
import Cart from '../pages/customer/Cart';
import Checkout from '../pages/customer/Checkout';
import Profile from '../pages/customer/Profile';
import Orders from '../pages/customer/Orders';
import OrderUpdate from '../pages/customer/OrderUpdate';
import VnpayReturn from '../pages/customer/VnpayReturn';

import AdminDashboard from '../pages/admin/Dashboard';
import AdminProducts from '../pages/admin/Products';
import AdminCategories from '../pages/admin/Categories';
import AdminOrders from '../pages/admin/Orders';
import AdminCustomers from '../pages/admin/Customers';
import AdminAccounts from '../pages/admin/Accounts';
import AddProduct from '../pages/admin/AddProduct';
import EditProduct from '../pages/admin/EditProduct';
import NotFound from '../pages/NotFound';

// Chỉ cho Admin — customer bị redirect về /
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

// Chỉ cho Customer — admin bị redirect về /admin
function CustomerRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}

const AppRouter = () => {
  const location = useLocation();

  return (
    <PageTransition>
      <Routes location={location}>
        <Route path="/" element={<CustomerRoute><Layout><Home /></Layout></CustomerRoute>} />
        <Route path="/products" element={<CustomerRoute><Layout><Products /></Layout></CustomerRoute>} />
        <Route path="/products/:id" element={<CustomerRoute><Layout><ProductDetail /></Layout></CustomerRoute>} />
        <Route path="/cart" element={<CustomerRoute><Layout><Cart /></Layout></CustomerRoute>} />
        <Route path="/checkout" element={<CustomerRoute><Layout><Checkout /></Layout></CustomerRoute>} />
        <Route path="/payment/vnpay-return" element={<CustomerRoute><Layout><VnpayReturn /></Layout></CustomerRoute>} />
        <Route path="/profile" element={<CustomerRoute><Layout><Profile /></Layout></CustomerRoute>} />
        <Route path="/orders" element={<CustomerRoute><Layout><Orders /></Layout></CustomerRoute>} />
        <Route path="/orders/:id/edit" element={<CustomerRoute><Layout><OrderUpdate /></Layout></CustomerRoute>} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/admin" element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><AdminLayout><AdminProducts /></AdminLayout></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><AdminLayout><AdminCategories /></AdminLayout></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><AdminLayout><AdminOrders /></AdminLayout></AdminRoute>} />
        <Route path="/admin/customers" element={<AdminRoute><AdminLayout><AdminCustomers /></AdminLayout></AdminRoute>} />
        <Route path="/admin/accounts" element={<AdminRoute><AdminLayout><AdminAccounts /></AdminLayout></AdminRoute>} />
        <Route path="/admin/products/add" element={<AdminRoute><AdminLayout><AddProduct /></AdminLayout></AdminRoute>} />
        <Route path="/admin/products/edit/:id" element={<AdminRoute><AdminLayout><EditProduct /></AdminLayout></AdminRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageTransition>
  );
};

export default AppRouter;
