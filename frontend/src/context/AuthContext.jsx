import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import socket from '../api/socket';
import { toast } from 'react-toastify';
import AuthContext from './AuthContextInstance';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const res = await api.get('/users/profile');
          if (isMounted) {
            setUser(res.data.user || res.data);
          }
        } catch {
          console.error('Token invalid');
          localStorage.removeItem('token');
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const updateUser = (nextUser) => {
    setUser((prevUser) => {
      if (!prevUser) {
        return nextUser;
      }

      return { ...prevUser, ...nextUser };
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    socket.disconnect();
  };

  useEffect(() => {
    if (!user?._id) {
      return undefined;
    }

    socket.connect();
    socket.emit('join', user._id);
    if (user.role === 'admin') {
      socket.emit('joinAdmin');
    }

    const handleUserProfileUpdated = (updatedUser) => {
      if (updatedUser?._id !== user._id) {
        return;
      }

      updateUser(updatedUser);
    };

    socket.on('userProfileUpdated', handleUserProfileUpdated);

    const handleUserPasswordUpdated = (passwordUpdate) => {
      if (passwordUpdate?._id !== user._id) {
        return;
      }

      updateUser({ passwordChangedAt: passwordUpdate.passwordChangedAt });

      if (passwordUpdate.changedByUserId === user._id) {
        return;
      }

      toast.info('Mật khẩu tài khoản của bạn vừa được thay đổi. Vui lòng đăng nhập lại.');
      logout();
      window.location.href = '/login';
    };

    socket.on('userPasswordUpdated', handleUserPasswordUpdated);

    return () => {
      socket.off('userProfileUpdated', handleUserProfileUpdated);
      socket.off('userPasswordUpdated', handleUserPasswordUpdated);
    };
  }, [user?._id, user?.role]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook để sử dụng AuthContext
