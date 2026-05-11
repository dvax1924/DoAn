import { io } from 'socket.io-client';

// Socket.IO server URL (cùng host với backend, không có /api)
const SOCKET_URL = import.meta.env.VITE_API_URL.replace('/api', '');

const socket = io(SOCKET_URL, {
  autoConnect: false, // Chỉ connect khi cần
});

export default socket;
