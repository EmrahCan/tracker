import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Activity, AlertCircle } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';

const ConnectionStatus = () => {
  const { isConnected, lastPing, connectionStats } = useSocket();

  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-500';
    if (lastPing > 1000) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (lastPing > 1000) return 'Slow Connection';
    return 'Connected';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 z-40"
    >
      <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm border border-gray-600 rounded-lg p-3 min-w-48">
        <div className="flex items-center space-x-3">
          {/* Connection icon */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${
              isConnected ? 'animate-pulse' : ''
            }`} />
          </div>

          {/* Status text */}
          <div className="flex-1">
            <div className="text-sm font-medium text-white">
              {getStatusText()}
            </div>
            {isConnected && lastPing && (
              <div className="text-xs text-gray-400">
                Ping: {lastPing}ms
              </div>
            )}
          </div>

          {/* Connection stats */}
          {isConnected && connectionStats.totalConnections > 0 && (
            <div className="text-xs text-gray-400">
              <Activity className="w-3 h-3 inline mr-1" />
              {connectionStats.totalConnections}
            </div>
          )}
        </div>

        {/* Warning for poor connection */}
        {isConnected && lastPing > 2000 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 flex items-center space-x-1 text-xs text-yellow-400"
          >
            <AlertCircle className="w-3 h-3" />
            <span>Poor connection quality</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ConnectionStatus;
