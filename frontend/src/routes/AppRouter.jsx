import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Suspense, lazy } from 'react';
import Layout from '../components/Layout';
import AdminLayout from '../components/AdminLayout';
import PageTransition from '../components/PageTransition';
import { PageSpinner } from '../components/ui/LoadingSpinner';

// Critical Pages (Eager Loading)
import Home from '../pages/customer/Home';
import Login from '../pages/customer/Login';
import Register from '../pages/customer/Register';
import NotFound from '../pages/NotFound';

// Lazy-loaded Customer Pages
const Products = lazy(() => import('../pages/customer/Products'));
const ProductDetail = lazy(() => import('../pages/customer/ProductDetail'));
const Cart = lazy(() => import('../pages/customer/Cart'));
const Checkout = lazy(() => import('../pages/customer/Checkout'));
const Profile = lazy(() => import('../pages/customer/Profile'));
const Orders = lazy(() => import('../pages/customer/Orders'));
const OrderUpdate = lazy(() => import('../pages/customer/OrderUpdate'));
const VnpayReturn = lazy(() => import('../pages/customer/VnpayReturn'));

// Lazy-loaded Admin Pages
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('../pages/admin/Products'));
const AdminCategories = lazy(() => import('../pages/admin/Categories'));
const AdminOrders = lazy(() => import('../pages/admin/Orders'));
const AdminCustomers = lazy(() => import('../pages/admin/Customers'));
const AdminAccounts = lazy(() => import('../pages/admin/Accounts'));
const AddProduct = lazy(() => import('../pages/admin/AddProduct'));
const EditProduct = lazy(() => import('../pages/admin/EditProduct'));

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

// Suspense Fallback Component
const PageLoader = () => <PageSpinner />;

const AppRouter = () => {
  const location = useLocation();

  return (
    <PageTransition>
      <Suspense fallback={<PageLoader />}>
        <Routes location={location}>
          <Route path="/" element={<CustomerRoute><Layout><Home /></Layout></CustomerRoute>} />
          <Route path="/products" element={<CustomerRoute><Layout><Products /></Layout></CustomerRoute>} />
          <Route path="/products/:slug" element={<CustomerRoute><Layout><ProductDetail /></Layout></CustomerRoute>} />
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
      </Suspense>
    </PageTransition>
  );
};

export default AppRouter;
