import { BrowserRouter as Router } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import 'react-toastify/dist/ReactToastify.css';
import { GoldieToastContainer } from './components/ui/Toast';
import AppRouter from './routes/AppRouter';

function App() {
  useEffect(() => {
    document.title = 'Goldie Vietnam';
  }, []);

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