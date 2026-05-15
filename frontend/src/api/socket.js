import { io } from 'socket.io-client';
import { SOCKET_BASE_URL } from './apiBaseUrl';

const socket = io(SOCKET_BASE_URL, {
  autoConnect: false,
  transports: ['polling', 'websocket'],
  upgrade: true,
});

export default socket;
