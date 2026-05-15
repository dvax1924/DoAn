import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import socket from '../api/socket';
import { toast } from '@/components/ui/Toast';
import AuthContext from './AuthContextInstance';

const LOCKED_MSG_KEY = 'accountLockedMessage';
const DEFAULT_LOCKED_MESSAGE =
  'Tài khoản của bạn đã bị vô hiệu hóa hoặc không tồn tại. Vui lòng liên hệ quản trị viên 0975959982';

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockedMessage, setLockedMessage] = useState(
    () => sessionStorage.getItem(LOCKED_MSG_KEY) || null
  );

  const saveLockedMessage = useCallback((message) => {
    const nextMessage = message || DEFAULT_LOCKED_MESSAGE;
    sessionStorage.setItem(LOCKED_MSG_KEY, nextMessage);
    setLockedMessage(nextMessage);
  }, []);

  const clearLockedMessage = useCallback(() => {
    setLockedMessage(null);
    sessionStorage.removeItem(LOCKED_MSG_KEY);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    socket.disconnect();
  }, []);

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
        } catch (err) {
          localStorage.removeItem('token');

          if (err.response?.data?.code === 'ACCOUNT_LOCKED') {
            saveLockedMessage(err.response.data.message);
          }
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
  }, [saveLockedMessage]);

  const login = useCallback((userData, token) => {
    localStorage.setItem('token', token);
    clearLockedMessage();
    setUser(userData);
  }, [clearLockedMessage]);

  const updateUser = useCallback((nextUser) => {
    setUser((prevUser) => {
      if (!prevUser) {
        return nextUser;
      }

      return { ...prevUser, ...nextUser };
    });
  }, []);

  useEffect(() => {
    if (!user?._id) {
      return undefined;
    }

    const joinUserRooms = () => {
      socket.emit('join', String(user._id));

      if (user.role === 'admin') {
        socket.emit('joinAdmin');
      }
    };

    const forceLogoutForLockedAccount = (message) => {
      saveLockedMessage(message);
      logout();
      navigate('/login', { replace: true });
    };

    socket.connect();
    joinUserRooms();

    const handleUserProfileUpdated = (updatedUser) => {
      if (!updatedUser?._id || String(updatedUser._id) !== String(user._id)) {
        return;
      }

      if (updatedUser.isActive === false) {
        forceLogoutForLockedAccount(updatedUser.message);
        return;
      }

      updateUser(updatedUser);
    };

    const handleUserPasswordUpdated = (passwordUpdate) => {
      if (!passwordUpdate?._id || String(passwordUpdate._id) !== String(user._id)) {
        return;
      }

      updateUser({ passwordChangedAt: passwordUpdate.passwordChangedAt });

      if (String(passwordUpdate.changedByUserId) === String(user._id)) {
        return;
      }

      toast.info('Mật khẩu tài khoản của bạn vừa được thay đổi. Vui lòng đăng nhập lại.');
      logout();
      navigate('/login', { replace: true });
    };

    const handleAccountLocked = (data) => {
      forceLogoutForLockedAccount(data?.message);
    };

    socket.on('connect', joinUserRooms);
    socket.on('userProfileUpdated', handleUserProfileUpdated);
    socket.on('userPasswordUpdated', handleUserPasswordUpdated);
    socket.on('accountLocked', handleAccountLocked);

    // Fallback polling: kiểm tra trạng thái tài khoản mỗi 30s
    // phòng trường hợp Socket.IO không hoạt động (Render free tier)
    const pollInterval = setInterval(async () => {
      if (socket.connected) return;
      try {
        const res = await api.get('/users/profile');
        const profile = res.data.user || res.data;
        if (profile?.isActive === false) {
          forceLogoutForLockedAccount();
        }
      } catch (err) {
        if (err.response?.data?.code === 'ACCOUNT_LOCKED') {
          forceLogoutForLockedAccount(err.response.data.message);
        }
      }
    }, 30_000);

    return () => {
      socket.off('connect', joinUserRooms);
      socket.off('userProfileUpdated', handleUserProfileUpdated);
      socket.off('userPasswordUpdated', handleUserPasswordUpdated);
      socket.off('accountLocked', handleAccountLocked);
      clearInterval(pollInterval);
    };
  }, [logout, navigate, saveLockedMessage, updateUser, user?._id, user?.role]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        updateUser,
        lockedMessage,
        clearLockedMessage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
