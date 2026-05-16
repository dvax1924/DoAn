import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <div style={{ 
      minHeight: '100dvh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#F5F5F3'
    }}>
      <Navbar />

      <main style={{ 
        flex: 1,
      }}>
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;