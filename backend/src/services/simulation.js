const { v4: uuidv4 } = require('uuid');
const Missile = require('../models/Missile');
const { 
  broadcastNewMissile, 
  broadcastMissileUpdate, 
  broadcastMissileStatusChange,
  broadcastAlert 
} = require('./websocket');

// Predefined locations for Israel and Iran
const LOCATIONS = {
  israel: {
    cities: [
      { name: 'Tel Aviv', lat: 32.0853, lng: 34.7818 },
      { name: 'Jerusalem', lat: 31.7683, lng: 35.2137 },
      { name: 'Haifa', lat: 32.7940, lng: 34.9896 },
      { name: 'Eilat', lat: 29.5581, lng: 34.9482 },
      { name: 'Beersheba', lat: 31.2518, lng: 34.7915 }
    ],
    military: [
      { name: 'Iron Dome Site', lat: 31.8947, lng: 34.8096 },
      { name: 'Dimona', lat: 31.0595, lng: 35.0295 },
      { name: 'Palmachim', lat: 31.8947, lng: 34.6896 }
    ]
  },
  iran: {
    cities: [
      { name: 'Tehran', lat: 35.6892, lng: 51.3890 },
      { name: 'Isfahan', lat: 32.6546, lng: 51.6680 },
      { name: 'Shiraz', lat: 29.5918, lng: 52.5837 },
      { name: 'Tabriz', lat: 38.0962, lng: 46.2738 }
    ],
    military: [
      { name: 'Natanz', lat: 33.7248, lng: 51.7281 },
      { name: 'Fordow', lat: 34.9564, lng: 50.9896 },
      { name: 'Bushehr', lat: 28.9684, lng: 50.8385 }
    ]
  }
};

const MISSILE_TYPES = {
  ballistic: {
    speed: 2000, // m/s
    maxAltitude: 100000, // meters
    range: 2000000, // meters
    flightTime: 600 // seconds
  },
  cruise: {
    speed: 250,
    maxAltitude: 1000,
    range: 1500000,
    flightTime: 3600
  },
  interceptor: {
    speed: 1500,
    maxAltitude: 30000,
    range: 100000,
    flightTime: 120
  },
  drone: {
    speed: 50,
    maxAltitude: 5000,
    range: 500000,
    flightTime: 7200
  }
};

let activeMissiles = new Map();
let simulationInterval = null;

const startMissileSimulation = (io) => {
  console.log('🎯 Starting missile simulation...');
  
  const interval = parseInt(process.env.SIMULATION_INTERVAL) || 5000;
  const maxActive = parseInt(process.env.MAX_ACTIVE_MISSILES) || 10;
  
  simulationInterval = setInterval(() => {
    // Update existing missiles
    updateActiveMissiles();
    
    // Randomly launch new missiles
    if (activeMissiles.size < maxActive && Math.random() < 0.3) {
      launchRandomMissile();
    }
    
    // Randomly intercept missiles
    if (Math.random() < 0.1) {
      attemptInterception();
    }
    
  }, interval);
};

const stopMissileSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('🛑 Missile simulation stopped');
  }
};

const launchRandomMissile = async () => {
  try {
    const countries = ['israel', 'iran'];
    const launchingCountry = countries[Math.floor(Math.random() * countries.length)];
    const targetCountry = launchingCountry === 'israel' ? 'iran' : 'israel';
    
    const missileTypes = Object.keys(MISSILE_TYPES);
    const missileType = missileTypes[Math.floor(Math.random() * missileTypes.length)];
    
    // Select random origin and target
    const allOrigins = [...LOCATIONS[launchingCountry].cities, ...LOCATIONS[launchingCountry].military];
    const allTargets = [...LOCATIONS[targetCountry].cities, ...LOCATIONS[targetCountry].military];
    
    const origin = allOrigins[Math.floor(Math.random() * allOrigins.length)];
    const target = allTargets[Math.floor(Math.random() * allTargets.length)];
    
    const missileConfig = MISSILE_TYPES[missileType];
    const distance = calculateDistance(origin, target);
    const flightTime = Math.max(60, distance / missileConfig.speed); // Minimum 1 minute
    
    const missile = new Missile({
      id: uuidv4(),
      type: missileType,
      origin: { lat: origin.lat, lng: origin.lng },
      target: { lat: target.lat, lng: target.lng },
      currentPosition: { lat: origin.lat, lng: origin.lng },
      trajectory: [{ lat: origin.lat, lng: origin.lng }],
      status: 'launched',
      speed: missileConfig.speed,
      altitude: 0,
      launchTime: new Date(),
      estimatedImpactTime: new Date(Date.now() + flightTime * 1000),
      country: launchingCountry,
      threat_level: calculateThreatLevel(missileType, target),
      metadata: {
        range: distance,
        source: 'simulation',
        confidence: 0.95
      }
    });
    
    await missile.save();
    activeMissiles.set(missile.id, missile);
    
    console.log(`🚀 Launched ${missileType} missile from ${launchingCountry} (${origin.name}) to ${targetCountry} (${target.name})`);
    
    broadcastNewMissile(missile.toJSON());
    
    // Send alert for high threat missiles
    if (missile.threat_level === 'high' || missile.threat_level === 'critical') {
      broadcastAlert({
        type: 'missile_launch',
        message: `High threat ${missileType} missile launched from ${origin.name}`,
        severity: missile.threat_level,
        missile: missile.toJSON()
      });
    }
    
  } catch (error) {
    console.error('Error launching missile:', error);
  }
};

const updateActiveMissiles = async () => {
  for (const [missileId, missile] of activeMissiles) {
    try {
      if (missile.status !== 'in-flight' && missile.status !== 'launched') {
        continue;
      }
      
      const now = Date.now();
      const progress = Math.min(1, (now - missile.launchTime) / (missile.estimatedImpactTime - missile.launchTime));
      
      // Update status to in-flight if just launched
      if (missile.status === 'launched') {
        missile.status = 'in-flight';
        await missile.save();
        broadcastMissileStatusChange(missile.toJSON());
      }
      
      // Calculate new position
      const newPosition = interpolatePosition(missile.origin, missile.target, progress);
      const newAltitude = calculateAltitude(missile.type, progress);
      
      missile.currentPosition = newPosition;
      missile.altitude = newAltitude;
      missile.trajectory.push(newPosition);
      
      await missile.save();
      broadcastMissileUpdate(missile.toJSON());
      
      // Check if missile has reached target
      if (progress >= 1 || now >= missile.estimatedImpactTime) {
        missile.status = 'impact';
        missile.actualImpactTime = new Date();
        await missile.save();
        
        activeMissiles.delete(missileId);
        broadcastMissileStatusChange(missile.toJSON());
        
        // Send impact alert
        broadcastAlert({
          type: 'missile_impact',
          message: `Missile impact detected at ${missile.target.lat.toFixed(4)}, ${missile.target.lng.toFixed(4)}`,
          severity: 'critical',
          missile: missile.toJSON()
        });
        
        console.log(`💥 Missile ${missileId} impacted at target`);
      }
      
    } catch (error) {
      console.error(`Error updating missile ${missileId}:`, error);
    }
  }
};

const attemptInterception = async () => {
  const inFlightMissiles = Array.from(activeMissiles.values())
    .filter(m => m.status === 'in-flight' && m.type !== 'interceptor');
  
  if (inFlightMissiles.length === 0) return;
  
  const targetMissile = inFlightMissiles[Math.floor(Math.random() * inFlightMissiles.length)];
  
  // 70% chance of successful interception
  if (Math.random() < 0.7) {
    const interceptorId = uuidv4();
    
    targetMissile.status = 'intercepted';
    targetMissile.actualImpactTime = new Date();
    targetMissile.metadata.interceptor_id = interceptorId;
    
    await targetMissile.save();
    activeMissiles.delete(targetMissile.id);
    
    broadcastMissileStatusChange(targetMissile.toJSON());
    
    broadcastAlert({
      type: 'missile_intercepted',
      message: `Missile successfully intercepted by defense system`,
      severity: 'medium',
      missile: targetMissile.toJSON(),
      interceptor_id: interceptorId
    });
    
    console.log(`🛡️ Missile ${targetMissile.id} intercepted`);
  }
};

// Utility functions
const calculateDistance = (point1, point2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const toRadians = (degrees) => degrees * (Math.PI / 180);

const interpolatePosition = (start, end, progress) => {
  // Add some curve to the trajectory for realism
  const curveFactor = 0.3;
  const midProgress = 0.5;
  
  let adjustedProgress = progress;
  if (progress <= midProgress) {
    adjustedProgress = progress * (1 + curveFactor * (midProgress - progress));
  } else {
    adjustedProgress = progress * (1 + curveFactor * (progress - midProgress));
  }
  
  return {
    lat: start.lat + (end.lat - start.lat) * adjustedProgress,
    lng: start.lng + (end.lng - start.lng) * adjustedProgress
  };
};

const calculateAltitude = (missileType, progress) => {
  const config = MISSILE_TYPES[missileType];
  // Parabolic trajectory
  return config.maxAltitude * 4 * progress * (1 - progress);
};

const calculateThreatLevel = (missileType, target) => {
  const isPopulatedArea = target.name.includes('Tel Aviv') || 
                         target.name.includes('Tehran') || 
                         target.name.includes('Jerusalem');
  
  if (missileType === 'ballistic' && isPopulatedArea) return 'critical';
  if (missileType === 'ballistic') return 'high';
  if (isPopulatedArea) return 'high';
  if (missileType === 'cruise') return 'medium';
  return 'low';
};

module.exports = {
  startMissileSimulation,
  stopMissileSimulation,
  getActiveMissiles: () => Array.from(activeMissiles.values()),
  getActiveMissileCount: () => activeMissiles.size
};
