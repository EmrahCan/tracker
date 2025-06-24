import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  BarChart3, 
  Settings, 
  Target, 
  Activity,
  AlertTriangle,
  Map,
  Database
} from 'lucide-react';
import { useMissile } from '../../contexts/MissileContext';
import { useSocket } from '../../contexts/SocketContext';

const Sidebar = ({ isOpen, onToggle }) => {
  const { activeMissiles, alerts, stats } = useMissile();
  const { isConnected } = useSocket();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      badge: activeMissiles.length > 0 ? activeMissiles.length : null,
      badgeColor: 'bg-red-500'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      badge: null
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      badge: null
    }
  ];

  const quickStats = [
    {
      label: 'Active Missiles',
      value: activeMissiles.length,
      icon: Target,
      color: 'text-red-500'
    },
    {
      label: 'Total Tracked',
      value: stats.total || 0,
      icon: Database,
      color: 'text-blue-500'
    },
    {
      label: 'Active Alerts',
      value: alerts.length,
      icon: AlertTriangle,
      color: 'text-yellow-500'
    }
  ];

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-gray-800 border-r border-gray-700 z-50
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-16'}
      `}>
        {/* Logo section */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Target className="w-8 h-8 text-red-500" />
            </div>
            {isOpen && (
              <div>
                <h2 className="text-lg font-bold text-white">Missile Tracker</h2>
                <p className="text-xs text-gray-400">Real-time Monitoring</p>
              </div>
            )}
          </div>
        </div>

        {/* Connection status */}
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} />
            {isOpen && (
              <span className={`text-sm ${
                isConnected ? 'text-green-400' : 'text-red-400'
              }`}>
                {isConnected ? 'Live Data' : 'Disconnected'}
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-2">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) => `
                    flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className={`
                          px-2 py-1 text-xs font-medium rounded-full text-white
                          ${item.badgeColor}
                        `}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Quick stats */}
        {isOpen && (
          <div className="mt-8 px-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Quick Stats
            </h3>
            <div className="space-y-3">
              {quickStats.map((stat) => (
                <div key={stat.label} className="flex items-center space-x-3">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 truncate">{stat.label}</p>
                    <p className="text-sm font-semibold text-white">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Threat level indicators */}
        {isOpen && activeMissiles.length > 0 && (
          <div className="mt-6 px-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Threat Levels
            </h3>
            <div className="space-y-2">
              {['critical', 'high', 'medium', 'low'].map((level) => {
                const count = activeMissiles.filter(m => m.threat_level === level).length;
                if (count === 0) return null;
                
                const colors = {
                  critical: 'bg-red-500',
                  high: 'bg-orange-500',
                  medium: 'bg-yellow-500',
                  low: 'bg-green-500'
                };
                
                return (
                  <div key={level} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${colors[level]} ${
                        level === 'critical' ? 'animate-pulse' : ''
                      }`} />
                      <span className="text-xs text-gray-300 capitalize">{level}</span>
                    </div>
                    <span className="text-xs font-semibold text-white">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          {isOpen ? (
            <div className="text-xs text-gray-400">
              <p>© 2024 Missile Tracker</p>
              <p>Real-time Monitoring System</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <Activity className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
