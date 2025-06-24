import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MapContainer from '../components/Map/MapContainer';
import { useMissile } from '../contexts/MissileContext';
import { useSocket } from '../contexts/SocketContext';
import { 
  Target, 
  Activity, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  Shield
} from 'lucide-react';

const Dashboard = () => {
  const { activeMissiles, stats, alerts } = useMissile();
  const { isConnected } = useSocket();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const quickStats = [
    {
      title: 'Active Missiles',
      value: activeMissiles.length,
      icon: Target,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    {
      title: 'Total Tracked',
      value: stats.total || 0,
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'Active Alerts',
      value: alerts.length,
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    },
    {
      title: 'Last 24h',
      value: stats.recent24h || 0,
      icon: Clock,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    }
  ];

  const threatLevelStats = [
    { level: 'Critical', count: activeMissiles.filter(m => m.threat_level === 'critical').length, color: 'text-red-500' },
    { level: 'High', count: activeMissiles.filter(m => m.threat_level === 'high').length, color: 'text-orange-500' },
    { level: 'Medium', count: activeMissiles.filter(m => m.threat_level === 'medium').length, color: 'text-yellow-500' },
    { level: 'Low', count: activeMissiles.filter(m => m.threat_level === 'low').length, color: 'text-green-500' }
  ];

  const recentMissiles = activeMissiles.slice(0, 5);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header Stats */}
      <div className="p-4 border-b border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${stat.bgColor} ${stat.borderColor}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Map Section */}
        <div className="flex-1 relative">
          <MapContainer />
          
          {/* Connection Status Overlay */}
          {!isConnected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"
            >
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Connection Lost</h3>
                <p className="text-gray-400">Attempting to reconnect to real-time data...</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* System Status */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">System Status</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Connection</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`} />
                  <span className={`text-sm ${
                    isConnected ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">System Time</span>
                <span className="text-sm text-white font-mono">
                  {currentTime.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Threat Level Breakdown */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">Threat Levels</h3>
            
            <div className="space-y-2">
              {threatLevelStats.map(({ level, count, color }) => (
                <div key={level} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      level === 'Critical' ? 'bg-red-500' :
                      level === 'High' ? 'bg-orange-500' :
                      level === 'Medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    } ${level === 'Critical' && count > 0 ? 'animate-pulse' : ''}`} />
                    <span className="text-sm text-gray-400">{level}</span>
                  </div>
                  <span className={`text-sm font-semibold ${color}`}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="flex-1 p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Recent Activity</h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentMissiles.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active missiles</p>
                </div>
              ) : (
                recentMissiles.map((missile) => (
                  <motion.div
                    key={missile.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono text-gray-300">
                        {missile.id.slice(0, 8)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        missile.threat_level === 'critical' ? 'bg-red-500' :
                        missile.threat_level === 'high' ? 'bg-orange-500' :
                        missile.threat_level === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      } text-white`}>
                        {missile.threat_level}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`capitalize ${
                          missile.status === 'launched' ? 'text-red-400' :
                          missile.status === 'in-flight' ? 'text-yellow-400' :
                          'text-gray-400'
                        }`}>
                          {missile.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="text-white">{missile.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Origin:</span>
                        <span className="text-white">{missile.country}</span>
                      </div>
                    </div>

                    {/* Progress bar for in-flight missiles */}
                    {missile.status === 'in-flight' && missile.flight_progress !== undefined && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(missile.flight_progress * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-1">
                          <div 
                            className="bg-yellow-500 h-1 rounded-full transition-all duration-1000"
                            style={{ width: `${missile.flight_progress * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-700">
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center space-x-2 p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Analytics</span>
              </button>
              <button className="flex items-center justify-center space-x-2 p-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Defense</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
