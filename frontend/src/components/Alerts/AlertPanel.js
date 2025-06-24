import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  X, 
  Bell, 
  BellOff, 
  Clock,
  Target,
  Zap,
  Shield
} from 'lucide-react';
import { useMissile } from '../../contexts/MissileContext';
import { format } from 'date-fns';

const AlertPanel = () => {
  const { alerts, removeAlert, clearAllAlerts } = useMissile();
  const [isMinimized, setIsMinimized] = useState(false);
  const [filter, setFilter] = useState('all'); // all, critical, high, medium, low

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.severity === filter;
  });

  const getAlertIcon = (type) => {
    switch (type) {
      case 'missile_launch':
        return Target;
      case 'impact_warning':
        return Zap;
      case 'interception':
        return Shield;
      case 'system':
        return Bell;
      default:
        return AlertTriangle;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-500',
          border: 'border-red-500',
          text: 'text-red-400',
          icon: 'text-red-500'
        };
      case 'high':
        return {
          bg: 'bg-orange-500',
          border: 'border-orange-500',
          text: 'text-orange-400',
          icon: 'text-orange-500'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-500',
          border: 'border-yellow-500',
          text: 'text-yellow-400',
          icon: 'text-yellow-500'
        };
      case 'low':
        return {
          bg: 'bg-blue-500',
          border: 'border-blue-500',
          text: 'text-blue-400',
          icon: 'text-blue-500'
        };
      default:
        return {
          bg: 'bg-gray-500',
          border: 'border-gray-500',
          text: 'text-gray-400',
          icon: 'text-gray-500'
        };
    }
  };

  const formatAlertTime = (timestamp) => {
    try {
      return format(new Date(timestamp), 'HH:mm:ss');
    } catch {
      return 'Unknown';
    }
  };

  if (alerts.length === 0) return null;

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      className={`fixed right-4 top-20 z-50 w-80 max-h-96 ${
        isMinimized ? 'h-auto' : ''
      }`}
    >
      <div className="bg-gray-800 bg-opacity-95 backdrop-blur-sm border border-gray-600 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-600">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-white">
              Alerts ({filteredAlerts.length})
            </h3>
          </div>
          
          <div className="flex items-center space-x-1">
            {/* Filter dropdown */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            {/* Clear all button */}
            {alerts.length > 0 && (
              <button
                onClick={clearAllAlerts}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Clear all alerts"
              >
                <BellOff className="w-4 h-4" />
              </button>
            )}
            
            {/* Minimize/maximize button */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Alert list */}
        {!isMinimized && (
          <div className="max-h-80 overflow-y-auto">
            <AnimatePresence>
              {filteredAlerts.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  No alerts matching filter
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const AlertIcon = getAlertIcon(alert.type);
                  const colors = getAlertColor(alert.severity);
                  
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 300 }}
                      className={`p-3 border-l-4 ${colors.border} border-b border-gray-700 last:border-b-0`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <AlertIcon className={`w-4 h-4 mt-0.5 ${colors.icon} flex-shrink-0`} />
                          
                          <div className="flex-1 min-w-0">
                            {/* Alert header */}
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-semibold uppercase ${colors.text}`}>
                                {alert.severity}
                              </span>
                              <div className="flex items-center space-x-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>{formatAlertTime(alert.timestamp)}</span>
                              </div>
                            </div>
                            
                            {/* Alert message */}
                            <p className="text-sm text-white mb-2 break-words">
                              {alert.message}
                            </p>
                            
                            {/* Alert metadata */}
                            {alert.missile_id && (
                              <div className="text-xs text-gray-400">
                                Missile: {alert.missile_id.slice(0, 8)}
                              </div>
                            )}
                            
                            {alert.location && (
                              <div className="text-xs text-gray-400">
                                Location: {alert.location}
                              </div>
                            )}
                            
                            {alert.estimated_impact && (
                              <div className="text-xs text-yellow-400">
                                Est. Impact: {formatAlertTime(alert.estimated_impact)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Close button */}
                        <button
                          onClick={() => removeAlert(alert.id)}
                          className="text-gray-400 hover:text-white transition-colors ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Action buttons for critical alerts */}
                      {alert.severity === 'critical' && alert.type === 'impact_warning' && (
                        <div className="mt-2 flex space-x-2">
                          <button className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors">
                            Emergency Alert
                          </button>
                          <button className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors">
                            Track Missile
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Summary when minimized */}
        {isMinimized && (
          <div className="p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Latest alerts</span>
              <div className="flex space-x-2">
                {['critical', 'high', 'medium'].map(severity => {
                  const count = alerts.filter(a => a.severity === severity).length;
                  if (count === 0) return null;
                  
                  const colors = getAlertColor(severity);
                  return (
                    <span key={severity} className={`px-2 py-1 rounded text-xs ${colors.bg} text-white`}>
                      {count}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AlertPanel;
