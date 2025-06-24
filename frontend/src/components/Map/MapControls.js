import React from 'react';
import { motion } from 'framer-motion';
import { 
  Map, 
  Layers, 
  Eye, 
  EyeOff, 
  Target, 
  X,
  Satellite,
  Mountain,
  Globe
} from 'lucide-react';

const MapControls = ({
  mapStyle,
  onMapStyleChange,
  showTrajectories,
  onToggleTrajectories,
  showInactive,
  onToggleInactive,
  selectedMissile,
  onClearSelection
}) => {
  const mapStyles = [
    { key: 'dark', name: 'Dark', icon: Map },
    { key: 'satellite', name: 'Satellite', icon: Satellite },
    { key: 'terrain', name: 'Terrain', icon: Mountain },
    { key: 'default', name: 'Standard', icon: Globe }
  ];

  return (
    <div className="absolute top-4 right-4 z-10 space-y-2">
      {/* Map style selector */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-2"
      >
        <div className="flex items-center space-x-1">
          <Layers className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400 mr-2">Style:</span>
          {mapStyles.map(({ key, name, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onMapStyleChange(key)}
              className={`p-2 rounded transition-colors ${
                mapStyle === key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title={name}
            >
              <Icon className="w-3 h-3" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Display options */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-3 space-y-2"
      >
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Display Options
        </h3>
        
        {/* Show trajectories toggle */}
        <button
          onClick={() => onToggleTrajectories(!showTrajectories)}
          className={`w-full flex items-center justify-between p-2 rounded transition-colors ${
            showTrajectories
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            {showTrajectories ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
            <span className="text-sm">Trajectories</span>
          </div>
        </button>

        {/* Show inactive missiles toggle */}
        <button
          onClick={() => onToggleInactive(!showInactive)}
          className={`w-full flex items-center justify-between p-2 rounded transition-colors ${
            showInactive
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span className="text-sm">All Missiles</span>
          </div>
        </button>
      </motion.div>

      {/* Selected missile controls */}
      {selectedMissile && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Selected
            </h3>
            <button
              onClick={onClearSelection}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-sm text-white">
            <div className="font-mono text-xs text-gray-400">
              {selectedMissile.id.slice(0, 8)}
            </div>
            <div className="capitalize">
              {selectedMissile.status}
            </div>
            <div className={`text-xs capitalize ${
              selectedMissile.threat_level === 'critical' ? 'text-red-400' :
              selectedMissile.threat_level === 'high' ? 'text-orange-400' :
              selectedMissile.threat_level === 'medium' ? 'text-yellow-400' :
              'text-green-400'
            }`}>
              {selectedMissile.threat_level} threat
            </div>
          </div>
        </motion.div>
      )}

      {/* Zoom controls */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-lg p-1"
      >
        <div className="flex flex-col space-y-1">
          <button
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Zoom In"
          >
            <span className="text-lg font-bold">+</span>
          </button>
          <button
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Zoom Out"
          >
            <span className="text-lg font-bold">−</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default MapControls;
