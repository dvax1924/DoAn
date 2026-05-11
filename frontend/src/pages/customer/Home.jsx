import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      {/* Hero Banner - Full screen, giống Goldie Vietnam */}
      <div style={{
        height: '100vh',                    // Chiếm toàn bộ chiều cao màn hình
        minHeight: '700px',
        backgroundImage: 'linear-gradient(rgba(26, 26, 27, 0.50), rgba(26, 26, 27, 0.50)), url(/trangchu.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        <div>
          <h1 style={{ 
            fontSize: '78px', 
            fontWeight: '700',
            letterSpacing: '-3px',
            marginBottom: '24px',
            lineHeight: '1.1'
          }}>
            GOLDIE
          </h1>
          


          {/* Nút chính với hiệu ứng hover */}
          <Link 
            to="/products" 
            style={{
              display: 'inline-block',
              backgroundColor: 'white',
              color: '#1A1A1B',
              padding: '18px 52px',
              fontSize: '17px',
              fontWeight: '600',
              textDecoration: 'none',
              borderRadius: '6px',
              transition: 'all 0.4s ease',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1A1A1B';
              e.target.style.color = 'white';
              e.target.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.color = '#1A1A1B';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            KHÁM PHÁ BỘ SƯU TẬP
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;