const { cache } = require('../config/redis');

let io = null;
const connectedClients = new Map();

const initializeWebSocket = (socketIo) => {
  io = socketIo;

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    // Store client info
    connectedClients.set(socket.id, {
      id: socket.id,
      connectedAt: new Date(),
      lastActivity: new Date()
    });

    // Send current stats
    sendConnectionStats();

    // Handle client events
    socket.on('subscribe', (data) => {
      handleSubscribe(socket, data);
    });

    socket.on('unsubscribe', (data) => {
      handleUnsubscribe(socket, data);
    });

    socket.on('request_historical_data', (data) => {
      handleHistoricalDataRequest(socket, data);
    });

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
      connectedClients.delete(socket.id);
      sendConnectionStats();
    });

    // Update last activity on any event
    socket.onAny(() => {
      const client = connectedClients.get(socket.id);
      if (client) {
        client.lastActivity = new Date();
      }
    });
  });

  // Periodic cleanup of inactive connections
  setInterval(() => {
    cleanupInactiveConnections();
  }, 60000); // Every minute
};

const handleSubscribe = (socket, data) => {
  const { channels } = data;
  
  if (Array.isArray(channels)) {
    channels.forEach(channel => {
      socket.join(channel);
      console.log(`📡 Client ${socket.id} subscribed to ${channel}`);
    });
  }
  
  socket.emit('subscription_confirmed', { channels });
};

const handleUnsubscribe = (socket, data) => {
  const { channels } = data;
  
  if (Array.isArray(channels)) {
    channels.forEach(channel => {
      socket.leave(channel);
      console.log(`📡 Client ${socket.id} unsubscribed from ${channel}`);
    });
  }
  
  socket.emit('unsubscription_confirmed', { channels });
};

const handleHistoricalDataRequest = async (socket, data) => {
  try {
    const { timeRange, filters } = data;
    
    // Check cache first
    const cacheKey = `historical_${JSON.stringify({ timeRange, filters })}`;
    let historicalData = await cache.get(cacheKey);
    
    if (!historicalData) {
      // Fetch from database (implement based on your needs)
      historicalData = await fetchHistoricalData(timeRange, filters);
      
      // Cache for 5 minutes
      await cache.set(cacheKey, historicalData, 300);
    }
    
    socket.emit('historical_data', {
      data: historicalData,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Error handling historical data request:', error);
    socket.emit('error', {
      message: 'Failed to fetch historical data',
      code: 'HISTORICAL_DATA_ERROR'
    });
  }
};

const cleanupInactiveConnections = () => {
  const now = new Date();
  const timeout = 5 * 60 * 1000; // 5 minutes
  
  connectedClients.forEach((client, socketId) => {
    if (now - client.lastActivity > timeout) {
      console.log(`🧹 Cleaning up inactive connection: ${socketId}`);
      connectedClients.delete(socketId);
      
      // Disconnect the socket if it still exists
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
      }
    }
  });
};

const sendConnectionStats = () => {
  const stats = {
    totalConnections: connectedClients.size,
    timestamp: Date.now()
  };
  
  io.emit('connection_stats', stats);
};

// Broadcast functions
const broadcastMissileUpdate = (missileData) => {
  if (!io) return;
  
  io.to('missiles').emit('missile_update', {
    type: 'update',
    data: missileData,
    timestamp: Date.now()
  });
};

const broadcastNewMissile = (missileData) => {
  if (!io) return;
  
  io.to('missiles').emit('missile_update', {
    type: 'new',
    data: missileData,
    timestamp: Date.now()
  });
};

const broadcastMissileStatusChange = (missileData) => {
  if (!io) return;
  
  io.to('missiles').emit('missile_update', {
    type: 'status_change',
    data: missileData,
    timestamp: Date.now()
  });
  
  // Send alert for critical events
  if (['intercepted', 'impact'].includes(missileData.status)) {
    io.to('alerts').emit('alert', {
      type: missileData.status,
      missile: missileData,
      severity: missileData.threat_level,
      timestamp: Date.now()
    });
  }
};

const broadcastAlert = (alertData) => {
  if (!io) return;
  
  io.to('alerts').emit('alert', {
    ...alertData,
    timestamp: Date.now()
  });
};

const broadcastSystemStatus = (statusData) => {
  if (!io) return;
  
  io.emit('system_status', {
    ...statusData,
    timestamp: Date.now()
  });
};

// Helper function to fetch historical data
const fetchHistoricalData = async (timeRange, filters) => {
  // This would typically query your database
  // For now, return empty array
  return [];
};

module.exports = {
  initializeWebSocket,
  broadcastMissileUpdate,
  broadcastNewMissile,
  broadcastMissileStatusChange,
  broadcastAlert,
  broadcastSystemStatus,
  getConnectedClients: () => connectedClients.size
};
