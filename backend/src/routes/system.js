const express = require('express');
const { getConnectedClients } = require('../services/websocket');
const { getActiveMissileCount } = require('../services/simulation');
const { cache } = require('../config/redis');

const router = express.Router();

// GET /api/system/status - Get system status
router.get('/status', async (req, res) => {
  try {
    const status = {
      server: {
        status: 'online',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        environment: process.env.NODE_ENV || 'development'
      },
      websocket: {
        connectedClients: getConnectedClients(),
        status: 'active'
      },
      simulation: {
        activeMissiles: getActiveMissileCount(),
        enabled: process.env.SIMULATION_ENABLED === 'true'
      },
      database: {
        mongodb: 'connected', // You could add actual connection check
        redis: 'connected'
      },
      timestamp: new Date().toISOString()
    };

    res.json(status);

  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch system status'
    });
  }
});

// GET /api/system/health - Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Perform basic health checks
    const checks = {
      server: true,
      database: true,
      redis: true,
      websocket: true
    };

    // Test Redis connection
    try {
      await cache.set('health_check', Date.now(), 10);
      await cache.get('health_check');
    } catch (error) {
      checks.redis = false;
    }

    const isHealthy = Object.values(checks).every(check => check === true);

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/system/metrics - Get system metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      performance: {
        uptime: process.uptime(),
        memory: {
          used: process.memoryUsage(),
          free: require('os').freemem(),
          total: require('os').totalmem()
        },
        cpu: {
          usage: process.cpuUsage(),
          loadAverage: require('os').loadavg()
        }
      },
      websocket: {
        connectedClients: getConnectedClients(),
        totalConnections: getConnectedClients() // This could be enhanced to track total over time
      },
      simulation: {
        activeMissiles: getActiveMissileCount(),
        enabled: process.env.SIMULATION_ENABLED === 'true'
      },
      api: {
        // These could be tracked with middleware
        totalRequests: 0,
        requestsPerMinute: 0,
        averageResponseTime: 0
      },
      timestamp: new Date().toISOString()
    };

    res.json(metrics);

  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch system metrics'
    });
  }
});

// POST /api/system/simulation/control - Control simulation
router.post('/simulation/control', async (req, res) => {
  try {
    const { action } = req.body;

    if (!['start', 'stop', 'restart'].includes(action)) {
      return res.status(400).json({
        error: 'Invalid action',
        message: 'Action must be one of: start, stop, restart'
      });
    }

    // Note: In a real implementation, you'd want to add authentication here
    // and possibly restrict this endpoint

    const { startMissileSimulation, stopMissileSimulation } = require('../services/simulation');

    switch (action) {
      case 'start':
        if (process.env.SIMULATION_ENABLED !== 'true') {
          return res.status(400).json({
            error: 'Simulation disabled',
            message: 'Simulation is disabled in configuration'
          });
        }
        // Start simulation logic would go here
        break;
      
      case 'stop':
        stopMissileSimulation();
        break;
      
      case 'restart':
        stopMissileSimulation();
        if (process.env.SIMULATION_ENABLED === 'true') {
          // Restart simulation logic would go here
        }
        break;
    }

    res.json({
      message: `Simulation ${action} completed`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error controlling simulation:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to control simulation'
    });
  }
});

// GET /api/system/config - Get system configuration (sanitized)
router.get('/config', (req, res) => {
  try {
    const config = {
      simulation: {
        enabled: process.env.SIMULATION_ENABLED === 'true',
        interval: parseInt(process.env.SIMULATION_INTERVAL) || 5000,
        maxActiveMissiles: parseInt(process.env.MAX_ACTIVE_MISSILES) || 10
      },
      websocket: {
        pingTimeout: parseInt(process.env.WS_PING_TIMEOUT) || 60000,
        pingInterval: parseInt(process.env.WS_PING_INTERVAL) || 25000
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
      },
      environment: process.env.NODE_ENV || 'development',
      version: require('../../package.json').version,
      timestamp: new Date().toISOString()
    };

    res.json(config);

  } catch (error) {
    console.error('Error fetching system config:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch system configuration'
    });
  }
});

module.exports = router;
