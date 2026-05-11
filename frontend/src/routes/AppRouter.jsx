import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import AdminLayout from '../components/AdminLayout';

// Customer Pages
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

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import AdminProducts from '../pages/admin/Products';
import AdminCategories from '../pages/admin/Categories';
import AdminOrders from '../pages/admin/Orders';
import AdminCustomers from '../pages/admin/Customers';
import AdminAccounts from '../pages/admin/Accounts';
import AddProduct from '../pages/admin/AddProduct';
import EditProduct from '../pages/admin/EditProduct';

const AppRouter = () => {
  return (
    <Routes>
      {/* Customer Routes */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/products" element={<Layout><Products /></Layout>} />
      <Route path="/products/:id" element={<Layout><ProductDetail /></Layout>} />
      <Route path="/cart" element={<Layout><Cart /></Layout>} />
      <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
      <Route path="/profile" element={<Layout><Profile /></Layout>} />
      <Route path="/orders" element={<Layout><Orders /></Layout>} />
      <Route path="/orders/:id/edit" element={<Layout><OrderUpdate /></Layout>} />

      {/* Login & Register không dùng Layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ==================== ADMIN ROUTES ==================== */}
      <Route path="/admin" element={
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      } />
      <Route path="/admin/products" element={
        <AdminLayout>
          <AdminProducts />
        </AdminLayout>
      } />
      <Route path="/admin/categories" element={
        <AdminLayout>
          <AdminCategories />
        </AdminLayout>
      } />
      <Route path="/admin/orders" element={
        <AdminLayout>
          <AdminOrders />
        </AdminLayout>
      } />
      <Route path="/admin/customers" element={
        <AdminLayout>
          <AdminCustomers />
        </AdminLayout>
      } />
      <Route path="/admin/accounts" element={
        <AdminLayout>
          <AdminAccounts />
        </AdminLayout>
      } />
      <Route path="/admin/products/add" element={
  <AdminLayout>
    <AddProduct />
  </AdminLayout>
} />
      <Route path="/admin/products/edit/:id" element={
  <AdminLayout>
    <EditProduct />
  </AdminLayout>
} />
    </Routes>
    
    
  );
};

export default AppRouter;
