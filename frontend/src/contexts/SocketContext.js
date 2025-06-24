import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStats, setConnectionStats] = useState({ totalConnections: 0 });
  const [lastPing, setLastPing] = useState(null);

  const connect = useCallback(() => {
    const socketUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 10
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      setIsConnected(true);
      toast.success('Connected to real-time updates');
      
      // Subscribe to channels
      newSocket.emit('subscribe', { 
        channels: ['missiles', 'alerts', 'system'] 
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket server:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, manual reconnection needed
        toast.error('Server disconnected. Attempting to reconnect...');
      } else {
        toast.error('Connection lost. Reconnecting...');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      toast.error('Failed to connect to server');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔌 Reconnected after ${attemptNumber} attempts`);
      toast.success('Reconnected to server');
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('🔌 Reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('🔌 Failed to reconnect');
      toast.error('Failed to reconnect. Please refresh the page.');
    });

    // Subscription confirmations
    newSocket.on('subscription_confirmed', (data) => {
      console.log('📡 Subscribed to channels:', data.channels);
    });

    newSocket.on('unsubscription_confirmed', (data) => {
      console.log('📡 Unsubscribed from channels:', data.channels);
    });

    // Connection stats
    newSocket.on('connection_stats', (stats) => {
      setConnectionStats(stats);
    });

    // Ping/Pong for connection monitoring
    newSocket.on('pong', (data) => {
      setLastPing(Date.now() - data.timestamp);
    });

    setSocket(newSocket);

    return newSocket;
  }, []);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  const subscribe = useCallback((channels) => {
    if (socket && isConnected) {
      socket.emit('subscribe', { channels });
    }
  }, [socket, isConnected]);

  const unsubscribe = useCallback((channels) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe', { channels });
    }
  }, [socket, isConnected]);

  const requestHistoricalData = useCallback((timeRange, filters) => {
    if (socket && isConnected) {
      socket.emit('request_historical_data', { timeRange, filters });
    }
  }, [socket, isConnected]);

  const ping = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('ping');
    }
  }, [socket, isConnected]);

  // Initialize connection on mount
  useEffect(() => {
    const newSocket = connect();
    
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [connect]);

  // Periodic ping for connection monitoring
  useEffect(() => {
    if (isConnected) {
      const pingInterval = setInterval(ping, 30000); // Ping every 30 seconds
      return () => clearInterval(pingInterval);
    }
  }, [isConnected, ping]);

  const value = {
    socket,
    isConnected,
    connectionStats,
    lastPing,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    requestHistoricalData,
    ping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
