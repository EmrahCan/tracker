import React, { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { motion } from 'framer-motion';
import L from 'leaflet';
import { Target, Clock, MapPin, Zap } from 'lucide-react';
import { format } from 'date-fns';

// Custom missile icons
const createMissileIcon = (threatLevel, status) => {
  const colors = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e'
  };

  const statusColors = {
    launched: '#ef4444',
    'in-flight': '#eab308',
    intercepted: '#22c55e',
    impact: '#7c2d12',
    failed: '#6b7280'
  };

  const color = colors[threatLevel] || statusColors[status] || '#6b7280';
  const size = threatLevel === 'critical' ? 16 : 12;

  return L.divIcon({
    html: `
      <div class="missile-marker" style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
        ${threatLevel === 'critical' ? 'animation: pulse 1s infinite;' : ''}
      "></div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      </style>
    `,
    className: 'custom-missile-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

const MissileMarker = ({ missile, isSelected, onSelect }) => {
  const [position, setPosition] = useState(null);

  // Update position based on missile data
  useEffect(() => {
    if (missile.current_position) {
      setPosition([missile.current_position.lat, missile.current_position.lng]);
    } else if (missile.origin) {
      setPosition([missile.origin.lat, missile.origin.lng]);
    }
  }, [missile]);

  if (!position) return null;

  const icon = createMissileIcon(missile.threat_level, missile.status);

  const handleClick = () => {
    onSelect(missile);
  };

  const formatTime = (timestamp) => {
    try {
      return format(new Date(timestamp), 'HH:mm:ss');
    } catch {
      return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'launched':
        return 'text-red-400';
      case 'in-flight':
        return 'text-yellow-400';
      case 'intercepted':
        return 'text-green-400';
      case 'impact':
        return 'text-red-600';
      case 'failed':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getThreatColor = (level) => {
    switch (level) {
      case 'critical':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        click: handleClick
      }}
    >
      <Popup
        className="missile-popup"
        maxWidth={300}
        closeButton={true}
      >
        <div className="bg-gray-800 text-white p-4 rounded-lg min-w-64">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold">Missile {missile.id.slice(0, 8)}</h3>
            </div>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              missile.threat_level === 'critical' ? 'bg-red-500' :
              missile.threat_level === 'high' ? 'bg-orange-500' :
              missile.threat_level === 'medium' ? 'bg-yellow-500' :
              'bg-green-500'
            } text-white`}>
              {missile.threat_level?.toUpperCase()}
            </span>
          </div>

          {/* Status */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-xs text-gray-400 mb-1">Status</div>
              <div className={`text-sm font-semibold capitalize ${getStatusColor(missile.status)}`}>
                {missile.status}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Type</div>
              <div className="text-sm text-white">{missile.type}</div>
            </div>
          </div>

          {/* Origin and Target */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-gray-400">Origin:</span>
              <span className="text-xs text-white">{missile.country}</span>
            </div>
            {missile.target_country && (
              <div className="flex items-center space-x-2">
                <Target className="w-3 h-3 text-red-400" />
                <span className="text-xs text-gray-400">Target:</span>
                <span className="text-xs text-white">{missile.target_country}</span>
              </div>
            )}
          </div>

          {/* Technical details */}
          <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
            {missile.speed && (
              <div>
                <div className="text-gray-400">Speed</div>
                <div className="text-white font-semibold">{missile.speed} km/h</div>
              </div>
            )}
            {missile.altitude && (
              <div>
                <div className="text-gray-400">Altitude</div>
                <div className="text-white font-semibold">{missile.altitude} m</div>
              </div>
            )}
            {missile.range && (
              <div>
                <div className="text-gray-400">Range</div>
                <div className="text-white font-semibold">{missile.range} km</div>
              </div>
            )}
            {missile.warhead_type && (
              <div>
                <div className="text-gray-400">Warhead</div>
                <div className="text-white font-semibold">{missile.warhead_type}</div>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="border-t border-gray-600 pt-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-gray-400">Launched:</span>
              </div>
              <span className="text-white">{formatTime(missile.launch_time)}</span>
            </div>
            
            {missile.estimated_impact_time && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span className="text-gray-400">Est. Impact:</span>
                </div>
                <span className="text-yellow-400">{formatTime(missile.estimated_impact_time)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Last Update:</span>
              <span className="text-white">{formatTime(missile.updated_at)}</span>
            </div>
          </div>

          {/* Progress bar for in-flight missiles */}
          {missile.status === 'in-flight' && missile.flight_progress !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Flight Progress</span>
                <span>{Math.round(missile.flight_progress * 100)}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${missile.flight_progress * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => onSelect(missile)}
              className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
            >
              Track
            </button>
            {missile.status === 'in-flight' && (
              <button className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors">
                Alert
              </button>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default MissileMarker;
