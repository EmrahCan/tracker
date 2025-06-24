import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Target, Activity, Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useMissile } from '../../contexts/MissileContext';

const Header = ({ onToggleSidebar }) => {
  const location = useLocation();
  const { isConnected, connectionStats, lastPing } = useSocket();
  const { stats, activeMissiles } = useMissile();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Real-time Dashboard';
      case '/analytics':
        return 'Analytics & Reports';
      case '/settings':
        return 'System Settings';
      default:
        return 'Missile Tracker';
    }
  };

  const formatPing = (ping) => {
    if (!ping) return 'N/A';
    return `${ping}ms`;
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
      {/* Left section */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-3">
          <Target className="w-6 h-6 text-red-500" />
          <div>
            <h1 className="text-lg font-semibold text-white">
              {getPageTitle()}
            </h1>
            <p className="text-xs text-gray-400">
              Real-time missile tracking system
            </p>
          </div>
        </div>
      </div>

      {/* Center section - Quick stats */}
      <div className="hidden md:flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-green-500" />
          <span className="text-sm text-gray-300">
            Active: <span className="font-semibold text-white">{activeMissiles.length}</span>
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-300">
            Total: <span className="font-semibold text-white">{stats.total || 0}</span>
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          <span className="text-sm text-gray-300">
            24h: <span className="font-semibold text-white">{stats.recent24h || 0}</span>
          </span>
        </div>
      </div>

      {/* Right section - Connection status */}
      <div className="flex items-center space-x-4">
        {/* Connection indicator */}
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <div className="hidden sm:block">
            <div className="text-xs text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            {isConnected && (
              <div className="text-xs text-gray-500">
                Ping: {formatPing(lastPing)}
              </div>
            )}
          </div>
        </div>

        {/* Connection stats */}
        {isConnected && connectionStats.totalConnections > 0 && (
          <div className="hidden lg:block text-xs text-gray-400">
            <div>Clients: {connectionStats.totalConnections}</div>
          </div>
        )}

        {/* System time */}
        <div className="hidden sm:block text-xs text-gray-400">
          <div>{new Date().toLocaleTimeString()}</div>
          <div>{new Date().toLocaleDateString()}</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
