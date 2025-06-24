import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Database,
  Shield,
  Monitor,
  Eye,
  EyeOff,
  Save,
  RotateCcw
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useMissile } from '../contexts/MissileContext';
import toast from 'react-hot-toast';

const Settings = () => {
  const { isConnected, ping } = useSocket();
  const { updateFilters, filters } = useMissile();
  
  const [settings, setSettings] = useState({
    // Notification settings
    notifications: {
      enabled: true,
      sound: true,
      criticalOnly: false,
      desktop: true,
      email: false
    },
    
    // Display settings
    display: {
      theme: 'dark',
      mapStyle: 'dark',
      showTrajectories: true,
      showInactive: false,
      autoCenter: true,
      showAlerts: true
    },
    
    // Data settings
    data: {
      refreshInterval: 1000,
      maxMissiles: 100,
      retentionDays: 30,
      cacheEnabled: true
    },
    
    // Security settings
    security: {
      autoLogout: 30,
      requireAuth: false,
      apiTimeout: 10000
    }
  });

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    // Save settings to localStorage or API
    localStorage.setItem('missileTrackerSettings', JSON.stringify(settings));
    toast.success('Settings saved successfully');
  };

  const handleReset = () => {
    // Reset to default settings
    localStorage.removeItem('missileTrackerSettings');
    toast.success('Settings reset to defaults');
  };

  const testConnection = () => {
    ping();
    toast.success('Connection test initiated');
  };

  const SettingCard = ({ title, icon: Icon, children }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
    >
      <div className="flex items-center space-x-3 mb-4">
        <Icon className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      {children}
    </motion.div>
  );

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        {description && (
          <div className="text-xs text-gray-400">{description}</div>
        )}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="h-full bg-gray-900 text-white overflow-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">System Settings</h1>
            <p className="text-gray-400">Configure your missile tracking system</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="mb-6">
          <SettingCard title="System Status" icon={Monitor}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`} />
                <div className="text-sm text-gray-300">Connection</div>
                <div className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <Database className="w-4 h-4 mx-auto mb-2 text-blue-500" />
                <div className="text-sm text-gray-300">Database</div>
                <div className="text-xs text-green-400">Online</div>
              </div>
              
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <Shield className="w-4 h-4 mx-auto mb-2 text-yellow-500" />
                <div className="text-sm text-gray-300">Security</div>
                <div className="text-xs text-green-400">Active</div>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={testConnection}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Test Connection
              </button>
            </div>
          </SettingCard>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notification Settings */}
          <SettingCard title="Notifications" icon={Bell}>
            <div className="space-y-4">
              <ToggleSwitch
                enabled={settings.notifications.enabled}
                onChange={(value) => handleSettingChange('notifications', 'enabled', value)}
                label="Enable Notifications"
                description="Receive alerts for missile activities"
              />
              
              <ToggleSwitch
                enabled={settings.notifications.sound}
                onChange={(value) => handleSettingChange('notifications', 'sound', value)}
                label="Sound Alerts"
                description="Play sound for notifications"
              />
              
              <ToggleSwitch
                enabled={settings.notifications.criticalOnly}
                onChange={(value) => handleSettingChange('notifications', 'criticalOnly', value)}
                label="Critical Only"
                description="Only show critical threat notifications"
              />
              
              <ToggleSwitch
                enabled={settings.notifications.desktop}
                onChange={(value) => handleSettingChange('notifications', 'desktop', value)}
                label="Desktop Notifications"
                description="Show browser notifications"
              />
            </div>
          </SettingCard>

          {/* Display Settings */}
          <SettingCard title="Display" icon={Eye}>
            <div className="space-y-4">
              <ToggleSwitch
                enabled={settings.display.showTrajectories}
                onChange={(value) => handleSettingChange('display', 'showTrajectories', value)}
                label="Show Trajectories"
                description="Display missile flight paths"
              />
              
              <ToggleSwitch
                enabled={settings.display.showInactive}
                onChange={(value) => handleSettingChange('display', 'showInactive', value)}
                label="Show Inactive Missiles"
                description="Display completed missions"
              />
              
              <ToggleSwitch
                enabled={settings.display.autoCenter}
                onChange={(value) => handleSettingChange('display', 'autoCenter', value)}
                label="Auto Center Map"
                description="Automatically center on new missiles"
              />
              
              <ToggleSwitch
                enabled={settings.display.showAlerts}
                onChange={(value) => handleSettingChange('display', 'showAlerts', value)}
                label="Show Alert Panel"
                description="Display the alerts sidebar"
              />
              
              <div className="py-2">
                <label className="block text-sm font-medium text-white mb-2">
                  Map Style
                </label>
                <select
                  value={settings.display.mapStyle}
                  onChange={(e) => handleSettingChange('display', 'mapStyle', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="dark">Dark</option>
                  <option value="satellite">Satellite</option>
                  <option value="terrain">Terrain</option>
                  <option value="default">Standard</option>
                </select>
              </div>
            </div>
          </SettingCard>

          {/* Data Settings */}
          <SettingCard title="Data Management" icon={Database}>
            <div className="space-y-4">
              <div className="py-2">
                <label className="block text-sm font-medium text-white mb-2">
                  Refresh Interval (ms)
                </label>
                <input
                  type="number"
                  value={settings.data.refreshInterval}
                  onChange={(e) => handleSettingChange('data', 'refreshInterval', parseInt(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  min="500"
                  max="10000"
                  step="500"
                />
              </div>
              
              <div className="py-2">
                <label className="block text-sm font-medium text-white mb-2">
                  Max Missiles to Display
                </label>
                <input
                  type="number"
                  value={settings.data.maxMissiles}
                  onChange={(e) => handleSettingChange('data', 'maxMissiles', parseInt(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  min="10"
                  max="1000"
                  step="10"
                />
              </div>
              
              <div className="py-2">
                <label className="block text-sm font-medium text-white mb-2">
                  Data Retention (days)
                </label>
                <input
                  type="number"
                  value={settings.data.retentionDays}
                  onChange={(e) => handleSettingChange('data', 'retentionDays', parseInt(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  min="1"
                  max="365"
                />
              </div>
              
              <ToggleSwitch
                enabled={settings.data.cacheEnabled}
                onChange={(value) => handleSettingChange('data', 'cacheEnabled', value)}
                label="Enable Caching"
                description="Cache data for better performance"
              />
            </div>
          </SettingCard>

          {/* Security Settings */}
          <SettingCard title="Security" icon={Shield}>
            <div className="space-y-4">
              <div className="py-2">
                <label className="block text-sm font-medium text-white mb-2">
                  Auto Logout (minutes)
                </label>
                <input
                  type="number"
                  value={settings.security.autoLogout}
                  onChange={(e) => handleSettingChange('security', 'autoLogout', parseInt(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  min="5"
                  max="480"
                  step="5"
                />
              </div>
              
              <div className="py-2">
                <label className="block text-sm font-medium text-white mb-2">
                  API Timeout (ms)
                </label>
                <input
                  type="number"
                  value={settings.security.apiTimeout}
                  onChange={(e) => handleSettingChange('security', 'apiTimeout', parseInt(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  min="1000"
                  max="60000"
                  step="1000"
                />
              </div>
              
              <ToggleSwitch
                enabled={settings.security.requireAuth}
                onChange={(value) => handleSettingChange('security', 'requireAuth', value)}
                label="Require Authentication"
                description="Require login to access system"
              />
            </div>
          </SettingCard>
        </div>

        {/* Filter Settings */}
        <div className="mt-6">
          <SettingCard title="Default Filters" icon={SettingsIcon}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Status Filter
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => updateFilters({ status: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="launched">Launched</option>
                  <option value="in-flight">In Flight</option>
                  <option value="intercepted">Intercepted</option>
                  <option value="impact">Impact</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Country Filter
                </label>
                <select
                  value={filters.country}
                  onChange={(e) => updateFilters({ country: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">All Countries</option>
                  <option value="Iran">Iran</option>
                  <option value="Israel">Israel</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Type Filter
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => updateFilters({ type: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">All Types</option>
                  <option value="Ballistic">Ballistic</option>
                  <option value="Cruise">Cruise</option>
                  <option value="Short-range">Short-range</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Threat Level
                </label>
                <select
                  value={filters.threatLevel}
                  onChange={(e) => updateFilters({ threatLevel: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">All Levels</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </SettingCard>
        </div>
      </div>
    </div>
  );
};

export default Settings;
