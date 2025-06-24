import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MissileMarker from './MissileMarker';
import MissileTrajectory from './MissileTrajectory';
import MapControls from './MapControls';
import { useMissile } from '../../contexts/MissileContext';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom map styles
const mapStyles = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  default: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
};

const MapView = () => {
  const { activeMissiles, getFilteredMissiles } = useMissile();
  const [mapStyle, setMapStyle] = useState('dark');
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedMissile, setSelectedMissile] = useState(null);
  const mapRef = useRef();

  // Center map on Middle East region
  const defaultCenter = [31.0461, 34.8516]; // Israel/Palestine region
  const defaultZoom = 7;

  // Get missiles to display
  const missilesToShow = showInactive ? getFilteredMissiles() : activeMissiles;

  // Auto-center map when new missiles appear
  useEffect(() => {
    if (activeMissiles.length > 0 && mapRef.current) {
      const map = mapRef.current;
      const bounds = L.latLngBounds();
      
      activeMissiles.forEach(missile => {
        if (missile.current_position) {
          bounds.extend([missile.current_position.lat, missile.current_position.lng]);
        }
        if (missile.origin) {
          bounds.extend([missile.origin.lat, missile.origin.lng]);
        }
        if (missile.target) {
          bounds.extend([missile.target.lat, missile.target.lng]);
        }
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [activeMissiles]);

  const MapController = () => {
    const map = useMap();
    
    useEffect(() => {
      mapRef.current = map;
    }, [map]);

    return null;
  };

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="w-full h-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        <MapController />
        
        {/* Tile layer */}
        <TileLayer
          url={mapStyles[mapStyle]}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={18}
          className="map-tiles"
        />

        {/* Missile markers and trajectories */}
        {missilesToShow.map(missile => (
          <React.Fragment key={missile.id}>
            {/* Missile marker */}
            <MissileMarker
              missile={missile}
              isSelected={selectedMissile?.id === missile.id}
              onSelect={setSelectedMissile}
            />
            
            {/* Trajectory line */}
            {showTrajectories && (
              <MissileTrajectory
                missile={missile}
                isSelected={selectedMissile?.id === missile.id}
              />
            )}
          </React.Fragment>
        ))}
      </MapContainer>

      {/* Map controls */}
      <MapControls
        mapStyle={mapStyle}
        onMapStyleChange={setMapStyle}
        showTrajectories={showTrajectories}
        onToggleTrajectories={setShowTrajectories}
        showInactive={showInactive}
        onToggleInactive={setShowInactive}
        selectedMissile={selectedMissile}
        onClearSelection={() => setSelectedMissile(null)}
      />

      {/* Missile count indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-3 z-10"
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-white">
            {activeMissiles.length} Active Missiles
          </span>
        </div>
        {missilesToShow.length !== activeMissiles.length && (
          <div className="text-xs text-gray-400 mt-1">
            Showing {missilesToShow.length} total
          </div>
        )}
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-3 z-10"
      >
        <h3 className="text-sm font-semibold text-white mb-2">Threat Levels</h3>
        <div className="space-y-1">
          {[
            { level: 'Critical', color: 'bg-red-500', textColor: 'text-red-400' },
            { level: 'High', color: 'bg-orange-500', textColor: 'text-orange-400' },
            { level: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
            { level: 'Low', color: 'bg-green-500', textColor: 'text-green-400' }
          ].map(({ level, color, textColor }) => (
            <div key={level} className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className={`text-xs ${textColor}`}>{level}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Selected missile info */}
      {selectedMissile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute top-4 right-4 bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-lg p-4 z-10 max-w-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Missile Details</h3>
            <button
              onClick={() => setSelectedMissile(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">ID:</span>
              <span className="text-white font-mono">{selectedMissile.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={`font-semibold capitalize ${
                selectedMissile.status === 'launched' ? 'text-red-400' :
                selectedMissile.status === 'in-flight' ? 'text-yellow-400' :
                selectedMissile.status === 'intercepted' ? 'text-green-400' :
                'text-gray-400'
              }`}>
                {selectedMissile.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Type:</span>
              <span className="text-white">{selectedMissile.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Country:</span>
              <span className="text-white">{selectedMissile.country}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Threat:</span>
              <span className={`font-semibold capitalize ${
                selectedMissile.threat_level === 'critical' ? 'text-red-400' :
                selectedMissile.threat_level === 'high' ? 'text-orange-400' :
                selectedMissile.threat_level === 'medium' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {selectedMissile.threat_level}
              </span>
            </div>
            {selectedMissile.speed && (
              <div className="flex justify-between">
                <span className="text-gray-400">Speed:</span>
                <span className="text-white">{selectedMissile.speed} km/h</span>
              </div>
            )}
            {selectedMissile.altitude && (
              <div className="flex justify-between">
                <span className="text-gray-400">Altitude:</span>
                <span className="text-white">{selectedMissile.altitude} m</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* No missiles message */}
      {missilesToShow.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="text-gray-400 mb-2">No missiles to display</div>
            <div className="text-sm text-gray-500">
              {showInactive ? 'No missiles match current filters' : 'No active missiles detected'}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MapView;
