import React, { useEffect, useState } from 'react';
import { Polyline, Circle } from 'react-leaflet';

const MissileTrajectory = ({ missile, isSelected }) => {
  const [trajectoryPoints, setTrajectoryPoints] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);

  useEffect(() => {
    const points = [];
    
    // Add origin point
    if (missile.origin) {
      points.push([missile.origin.lat, missile.origin.lng]);
    }

    // Add trajectory points if available
    if (missile.trajectory && Array.isArray(missile.trajectory)) {
      missile.trajectory.forEach(point => {
        if (point.lat && point.lng) {
          points.push([point.lat, point.lng]);
        }
      });
    }

    // Add current position if different from last trajectory point
    if (missile.current_position) {
      const currentPos = [missile.current_position.lat, missile.current_position.lng];
      const lastPoint = points[points.length - 1];
      
      if (!lastPoint || 
          Math.abs(lastPoint[0] - currentPos[0]) > 0.001 || 
          Math.abs(lastPoint[1] - currentPos[1]) > 0.001) {
        points.push(currentPos);
      }
      
      setCurrentPosition(currentPos);
    }

    // Add target point for completed trajectories
    if (missile.target && ['impact', 'intercepted'].includes(missile.status)) {
      points.push([missile.target.lat, missile.target.lng]);
    }

    setTrajectoryPoints(points);
  }, [missile]);

  if (trajectoryPoints.length < 2) return null;

  // Color based on threat level and status
  const getTrajectoryColor = () => {
    if (missile.status === 'intercepted') return '#22c55e'; // Green
    if (missile.status === 'impact') return '#dc2626'; // Dark red
    if (missile.status === 'failed') return '#6b7280'; // Gray
    
    // Active missiles - color by threat level
    switch (missile.threat_level) {
      case 'critical': return '#ef4444'; // Red
      case 'high': return '#f97316'; // Orange
      case 'medium': return '#eab308'; // Yellow
      case 'low': return '#22c55e'; // Green
      default: return '#6b7280'; // Gray
    }
  };

  const getLineStyle = () => {
    const baseStyle = {
      weight: isSelected ? 4 : 2,
      opacity: isSelected ? 0.9 : 0.7,
      color: getTrajectoryColor()
    };

    // Dashed line for predicted trajectory
    if (['launched', 'in-flight'].includes(missile.status)) {
      return {
        ...baseStyle,
        dashArray: '5, 10'
      };
    }

    return baseStyle;
  };

  const getCurrentPositionStyle = () => {
    return {
      color: getTrajectoryColor(),
      fillColor: getTrajectoryColor(),
      fillOpacity: 0.6,
      weight: 2,
      radius: isSelected ? 8 : 5
    };
  };

  return (
    <>
      {/* Trajectory line */}
      <Polyline
        positions={trajectoryPoints}
        pathOptions={getLineStyle()}
      />

      {/* Current position indicator for active missiles */}
      {currentPosition && ['launched', 'in-flight'].includes(missile.status) && (
        <Circle
          center={currentPosition}
          pathOptions={getCurrentPositionStyle()}
        />
      )}

      {/* Impact/Interception point */}
      {missile.target && ['impact', 'intercepted'].includes(missile.status) && (
        <Circle
          center={[missile.target.lat, missile.target.lng]}
          pathOptions={{
            color: missile.status === 'intercepted' ? '#22c55e' : '#dc2626',
            fillColor: missile.status === 'intercepted' ? '#22c55e' : '#dc2626',
            fillOpacity: 0.3,
            weight: 2,
            radius: 1000 // 1km radius
          }}
        />
      )}
    </>
  );
};

export default MissileTrajectory;
