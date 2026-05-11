const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { app, server, io } = require('./socket');

dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (ảnh upload)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route
app.get('/', (req, res) => {
  res.json({ message: '🚀 Backend API is running...' });
});

// Kết nối DB
connectDB();

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Cho phép client join vào room theo userId để nhận thông báo riêng
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined room`);
  });

  socket.on('joinAdmin', () => {
    socket.join('admins');
    console.log(`Admin ${socket.id} joined admins room`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
