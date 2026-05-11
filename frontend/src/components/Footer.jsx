import React from 'react';
import { FaInstagram, FaFacebook } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#1A1A1B',
      color: '#aaa',
      padding: '60px 0 40px',
      marginTop: 'auto'
    }}>
      <div className="container" style={{ textAlign: 'center' }}>

        {/* Logo Goldie */}
        <p style={{ 
          fontSize: '18px', 
          fontWeight: '500', 
          color: 'white',
          marginBottom: '12px'
        }}>
          GOLDIE VIETNAM
        </p>

        {/* Copyright */}
        <p style={{ marginBottom: '20px' }}>
          &copy; 2026 Goldie Vietnam. All rights reserved.
        </p>

        {/* Social Icons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '25px',
          marginBottom: '10px'
        }}>
          
          {/* Instagram */}
          <a 
            href="https://www.instagram.com/theonlygoldieofficial/" 
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              color: '#aaa', 
              fontSize: '28px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#E1306C'}
            onMouseLeave={(e) => e.target.style.color = '#aaa'}
          >
            <FaInstagram />
          </a>

          {/* Facebook */}
          <a 
            href="https://facebook.com/goldievietnam" 
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              color: '#aaa', 
              fontSize: '28px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#1877F2'}
            onMouseLeave={(e) => e.target.style.color = '#aaa'}
          >
            <FaFacebook />
          </a>

        </div>

        {/* Text nhỏ dưới icon */}
        <p style={{ fontSize: '13px', color: '#666' }}>
          Follow us on social media
        </p>

      </div>
    </footer>
  );
};

export default Footer;