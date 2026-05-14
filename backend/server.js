const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { app, server, io } = require('./socket');

dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'Backend API is running...' });
});

connectDB();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (userId, callback) => {
    const roomId = String(userId);
    socket.join(roomId);
    socket.data.userId = roomId;
    console.log(`User ${roomId} joined room`);

    if (typeof callback === 'function') {
      callback({ success: true, roomId });
    }
  });

  socket.on('joinAdmin', () => {
    socket.join('admins');
    console.log(`Admin ${socket.id} joined admins room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
