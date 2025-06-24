const express = require('express');
const router = express.Router();

const missileRoutes = require('./missiles');
const analyticsRoutes = require('./analytics');
const systemRoutes = require('./system');
const newsRoutes = require('./news');

// API Routes
router.use('/missiles', missileRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/system', systemRoutes);
router.use('/news', newsRoutes);

// API Info
router.get('/', (req, res) => {
  res.json({
    name: 'Missile Tracker API',
    version: '1.0.0',
    description: 'Real-time missile tracking and monitoring system',
    endpoints: {
      missiles: '/api/missiles',
      analytics: '/api/analytics',
      system: '/api/system',
      news: '/api/news'
    },
    websocket: {
      url: '/socket.io',
      events: [
        'missile_update',
        'alert',
        'system_status',
        'connection_stats'
      ]
    },
    documentation: '/api/docs'
  });
});

module.exports = router;
