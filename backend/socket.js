const http = require('http');
const { Server } = require('socket.io');
const express = require('express');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

module.exports = { app, server, io };
