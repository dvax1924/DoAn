import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppRouter from './routes/AppRouter';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppRouter />
          <ToastContainer position="top-right" autoClose={3000} />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;