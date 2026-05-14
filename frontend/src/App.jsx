import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import 'react-toastify/dist/ReactToastify.css';
import { GoldieToastContainer } from './components/ui/Toast';
import AppRouter from './routes/AppRouter';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppRouter />
          <GoldieToastContainer />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;