import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';

const MissileContext = createContext();

export const useMissile = () => {
  const context = useContext(MissileContext);
  if (!context) {
    throw new Error('useMissile must be used within a MissileProvider');
  }
  return context;
};

// Action types
const MISSILE_ACTIONS = {
  SET_MISSILES: 'SET_MISSILES',
  ADD_MISSILE: 'ADD_MISSILE',
  UPDATE_MISSILE: 'UPDATE_MISSILE',
  REMOVE_MISSILE: 'REMOVE_MISSILE',
  SET_ACTIVE_MISSILES: 'SET_ACTIVE_MISSILES',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_ALERT: 'ADD_ALERT',
  REMOVE_ALERT: 'REMOVE_ALERT',
  SET_FILTERS: 'SET_FILTERS',
  SET_STATS: 'SET_STATS'
};

// Initial state
const initialState = {
  missiles: [],
  activeMissiles: [],
  loading: false,
  error: null,
  alerts: [],
  filters: {
    status: 'all',
    country: 'all',
    type: 'all',
    threatLevel: 'all'
  },
  stats: {
    total: 0,
    active: 0,
    recent24h: 0,
    byStatus: {},
    byCountry: {},
    byType: {},
    byThreatLevel: {}
  }
};

// Reducer function
const missileReducer = (state, action) => {
  switch (action.type) {
    case MISSILE_ACTIONS.SET_MISSILES:
      return {
        ...state,
        missiles: action.payload,
        loading: false,
        error: null
      };

    case MISSILE_ACTIONS.ADD_MISSILE:
      return {
        ...state,
        missiles: [action.payload, ...state.missiles],
        activeMissiles: ['launched', 'in-flight'].includes(action.payload.status)
          ? [action.payload, ...state.activeMissiles]
          : state.activeMissiles
      };

    case MISSILE_ACTIONS.UPDATE_MISSILE:
      const updatedMissiles = state.missiles.map(missile =>
        missile.id === action.payload.id ? { ...missile, ...action.payload } : missile
      );
      
      const updatedActiveMissiles = state.activeMissiles.map(missile =>
        missile.id === action.payload.id ? { ...missile, ...action.payload } : missile
      ).filter(missile => ['launched', 'in-flight'].includes(missile.status));

      return {
        ...state,
        missiles: updatedMissiles,
        activeMissiles: updatedActiveMissiles
      };

    case MISSILE_ACTIONS.REMOVE_MISSILE:
      return {
        ...state,
        missiles: state.missiles.filter(missile => missile.id !== action.payload),
        activeMissiles: state.activeMissiles.filter(missile => missile.id !== action.payload)
      };

    case MISSILE_ACTIONS.SET_ACTIVE_MISSILES:
      return {
        ...state,
        activeMissiles: action.payload
      };

    case MISSILE_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case MISSILE_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case MISSILE_ACTIONS.ADD_ALERT:
      const newAlert = {
        ...action.payload,
        id: Date.now() + Math.random(),
        timestamp: new Date()
      };
      return {
        ...state,
        alerts: [newAlert, ...state.alerts.slice(0, 49)] // Keep max 50 alerts
      };

    case MISSILE_ACTIONS.REMOVE_ALERT:
      return {
        ...state,
        alerts: state.alerts.filter(alert => alert.id !== action.payload)
      };

    case MISSILE_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };

    case MISSILE_ACTIONS.SET_STATS:
      return {
        ...state,
        stats: action.payload
      };

    default:
      return state;
  }
};

export const MissileProvider = ({ children }) => {
  const [state, dispatch] = useReducer(missileReducer, initialState);
  const { socket, isConnected } = useSocket();

  // WebSocket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Missile updates
    const handleMissileUpdate = (data) => {
      const { type, data: missileData } = data;
      
      switch (type) {
        case 'new':
          dispatch({ type: MISSILE_ACTIONS.ADD_MISSILE, payload: missileData });
          
          // Show toast for new high-threat missiles
          if (['high', 'critical'].includes(missileData.threat_level)) {
            toast.error(
              `New ${missileData.threat_level} threat missile detected from ${missileData.country}`,
              { duration: 8000 }
            );
          }
          break;

        case 'update':
          dispatch({ type: MISSILE_ACTIONS.UPDATE_MISSILE, payload: missileData });
          break;

        case 'status_change':
          dispatch({ type: MISSILE_ACTIONS.UPDATE_MISSILE, payload: missileData });
          
          // Show toast for status changes
          if (missileData.status === 'intercepted') {
            toast.success(`Missile ${missileData.id.slice(0, 8)} intercepted`);
          } else if (missileData.status === 'impact') {
            toast.error(`Missile ${missileData.id.slice(0, 8)} impact detected`);
          }
          break;

        default:
          break;
      }
    };

    // Alert handler
    const handleAlert = (alertData) => {
      dispatch({ type: MISSILE_ACTIONS.ADD_ALERT, payload: alertData });
      
      // Show toast based on alert type
      const alertMessage = alertData.message || 'New alert received';
      
      switch (alertData.severity) {
        case 'critical':
          toast.error(alertMessage, { duration: 10000 });
          break;
        case 'high':
          toast.error(alertMessage, { duration: 8000 });
          break;
        case 'medium':
          toast(alertMessage, { duration: 6000 });
          break;
        default:
          toast(alertMessage, { duration: 4000 });
          break;
      }
    };

    // System status handler
    const handleSystemStatus = (statusData) => {
      console.log('System status update:', statusData);
    };

    // Historical data handler
    const handleHistoricalData = (data) => {
      dispatch({ type: MISSILE_ACTIONS.SET_MISSILES, payload: data.data });
    };

    // Error handler
    const handleError = (errorData) => {
      console.error('WebSocket error:', errorData);
      dispatch({ type: MISSILE_ACTIONS.SET_ERROR, payload: errorData.message });
      toast.error(errorData.message);
    };

    // Register event listeners
    socket.on('missile_update', handleMissileUpdate);
    socket.on('alert', handleAlert);
    socket.on('system_status', handleSystemStatus);
    socket.on('historical_data', handleHistoricalData);
    socket.on('error', handleError);

    // Cleanup
    return () => {
      socket.off('missile_update', handleMissileUpdate);
      socket.off('alert', handleAlert);
      socket.off('system_status', handleSystemStatus);
      socket.off('historical_data', handleHistoricalData);
      socket.off('error', handleError);
    };
  }, [socket, isConnected]);

  // API functions
  const fetchMissiles = useCallback(async (params = {}) => {
    dispatch({ type: MISSILE_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(`/api/missiles?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      dispatch({ type: MISSILE_ACTIONS.SET_MISSILES, payload: data.missiles });
      
    } catch (error) {
      console.error('Error fetching missiles:', error);
      dispatch({ type: MISSILE_ACTIONS.SET_ERROR, payload: error.message });
      toast.error('Failed to fetch missiles');
    }
  }, []);

  const fetchActiveMissiles = useCallback(async () => {
    try {
      const response = await fetch('/api/missiles/active');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      dispatch({ type: MISSILE_ACTIONS.SET_ACTIVE_MISSILES, payload: data.missiles });
      
    } catch (error) {
      console.error('Error fetching active missiles:', error);
      toast.error('Failed to fetch active missiles');
    }
  }, []);

  const fetchMissileStats = useCallback(async () => {
    try {
      const response = await fetch('/api/missiles/stats/summary');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      dispatch({ type: MISSILE_ACTIONS.SET_STATS, payload: data });
      
    } catch (error) {
      console.error('Error fetching missile stats:', error);
    }
  }, []);

  const getMissileById = useCallback((id) => {
    return state.missiles.find(missile => missile.id === id);
  }, [state.missiles]);

  const getFilteredMissiles = useCallback(() => {
    return state.missiles.filter(missile => {
      if (state.filters.status !== 'all' && missile.status !== state.filters.status) {
        return false;
      }
      if (state.filters.country !== 'all' && missile.country !== state.filters.country) {
        return false;
      }
      if (state.filters.type !== 'all' && missile.type !== state.filters.type) {
        return false;
      }
      if (state.filters.threatLevel !== 'all' && missile.threat_level !== state.filters.threatLevel) {
        return false;
      }
      return true;
    });
  }, [state.missiles, state.filters]);

  const updateFilters = useCallback((newFilters) => {
    dispatch({ type: MISSILE_ACTIONS.SET_FILTERS, payload: newFilters });
  }, []);

  const removeAlert = useCallback((alertId) => {
    dispatch({ type: MISSILE_ACTIONS.REMOVE_ALERT, payload: alertId });
  }, []);

  const clearAllAlerts = useCallback(() => {
    state.alerts.forEach(alert => {
      dispatch({ type: MISSILE_ACTIONS.REMOVE_ALERT, payload: alert.id });
    });
  }, [state.alerts]);

  // Auto-remove alerts after timeout
  useEffect(() => {
    state.alerts.forEach(alert => {
      if (!alert.timeout) {
        const timeout = setTimeout(() => {
          removeAlert(alert.id);
        }, 30000); // Remove after 30 seconds
        
        alert.timeout = timeout;
      }
    });

    return () => {
      state.alerts.forEach(alert => {
        if (alert.timeout) {
          clearTimeout(alert.timeout);
        }
      });
    };
  }, [state.alerts, removeAlert]);

  // Initial data fetch
  useEffect(() => {
    if (isConnected) {
      fetchActiveMissiles();
      fetchMissileStats();
    }
  }, [isConnected, fetchActiveMissiles, fetchMissileStats]);

  const value = {
    ...state,
    fetchMissiles,
    fetchActiveMissiles,
    fetchMissileStats,
    getMissileById,
    getFilteredMissiles,
    updateFilters,
    removeAlert,
    clearAllAlerts
  };

  return (
    <MissileContext.Provider value={value}>
      {children}
    </MissileContext.Provider>
  );
};
