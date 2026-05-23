const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const Admin = require('./models/Admin');
const CollectionCenter = require('./models/CollectionCenter');
const Farmer = require('./models/Farmer');

let io;

const getToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  const header = socket.handshake.headers?.authorization;
  if (authToken) return authToken;
  if (header && header.startsWith('Bearer ')) return header.split(' ')[1];
  return null;
};

const loadSocketUser = async (decoded) => {
  if (decoded.role === 'admin') {
    const user = await Admin.findById(decoded.id).select('_id');
    return user ? { id: user._id.toString(), role: 'admin' } : null;
  }

  if (decoded.role === 'collection_head') {
    const center = await CollectionCenter.findById(decoded.id).select('_id');
    return center ? { id: center._id.toString(), role: 'collection_head' } : null;
  }

  if (decoded.role === 'farmer') {
    const farmer = await Farmer.findById(decoded.id).select('_id');
    return farmer ? { id: farmer._id.toString(), role: 'farmer', farmerId: farmer._id.toString() } : null;
  }

  return null;
};

const initSocket = (server, corsOrigin = '*') => {
  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT']
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = getToken(socket);
      if (!token) return next(new Error('Authentication token required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await loadSocketUser(decoded);
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.user.role === 'farmer') {
      socket.join(`farmer:${socket.user.farmerId}`);
    }
    socket.join(`user:${socket.user.id}`);
  });

  return io;
};

const getIo = () => io;

const emitToFarmer = (farmerId, event, payload) => {
  if (!io || !farmerId) return;
  io.to(`farmer:${farmerId.toString()}`).emit(event, payload);
};

module.exports = { initSocket, getIo, emitToFarmer };
