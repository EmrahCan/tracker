const express = require('express');
const Joi = require('joi');
const Missile = require('../models/Missile');
const { cache } = require('../config/redis');
const { getActiveMissiles } = require('../services/simulation');

const router = express.Router();

// Validation schemas
const querySchema = Joi.object({
  status: Joi.string().valid('launched', 'in-flight', 'intercepted', 'impact', 'failed'),
  country: Joi.string().valid('israel', 'iran', 'other'),
  type: Joi.string().valid('ballistic', 'cruise', 'interceptor', 'drone'),
  threat_level: Joi.string().valid('low', 'medium', 'high', 'critical'),
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
  sort: Joi.string().valid('launchTime', '-launchTime', 'status', 'threat_level').default('-launchTime')
});

const timeRangeSchema = Joi.object({
  start: Joi.date().iso(),
  end: Joi.date().iso(),
  hours: Joi.number().integer().min(1).max(168) // Max 1 week
});

// GET /api/missiles - Get missiles with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { error, value } = querySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    const { status, country, type, threat_level, limit, offset, sort } = value;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (country) query.country = country;
    if (type) query.type = type;
    if (threat_level) query.threat_level = threat_level;

    // Check cache
    const cacheKey = `missiles_${JSON.stringify(query)}_${limit}_${offset}_${sort}`;
    let cachedResult = await cache.get(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }

    // Query database
    const missiles = await Missile.find(query)
      .sort(sort)
      .limit(limit)
      .skip(offset)
      .lean();

    const total = await Missile.countDocuments(query);

    const result = {
      missiles,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      timestamp: new Date().toISOString()
    };

    // Cache for 30 seconds
    await cache.set(cacheKey, result, 30);

    res.json(result);

  } catch (error) {
    console.error('Error fetching missiles:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch missiles'
    });
  }
});

// GET /api/missiles/active - Get currently active missiles
router.get('/active', async (req, res) => {
  try {
    // Check cache first
    let activeMissiles = await cache.get('active_missiles');
    
    if (!activeMissiles) {
      // Get from simulation service (in-memory) and database
      const simulationMissiles = getActiveMissiles();
      const dbMissiles = await Missile.getActiveMissiles().lean();
      
      // Combine and deduplicate
      const missileMap = new Map();
      [...simulationMissiles, ...dbMissiles].forEach(missile => {
        missileMap.set(missile.id, missile);
      });
      
      activeMissiles = Array.from(missileMap.values());
      
      // Cache for 5 seconds
      await cache.set('active_missiles', activeMissiles, 5);
    }

    res.json({
      missiles: activeMissiles,
      count: activeMissiles.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching active missiles:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch active missiles'
    });
  }
});

// GET /api/missiles/recent - Get recent missiles
router.get('/recent', async (req, res) => {
  try {
    const { error, value } = timeRangeSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    let { start, end, hours } = value;
    
    // Default to last 24 hours if no time range specified
    if (!start && !end && !hours) {
      hours = 24;
    }
    
    if (hours) {
      end = new Date();
      start = new Date(Date.now() - hours * 60 * 60 * 1000);
    }

    const cacheKey = `recent_missiles_${start?.toISOString()}_${end?.toISOString()}`;
    let cachedResult = await cache.get(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const query = {};
    if (start || end) {
      query.launchTime = {};
      if (start) query.launchTime.$gte = start;
      if (end) query.launchTime.$lte = end;
    }

    const missiles = await Missile.find(query)
      .sort({ launchTime: -1 })
      .limit(100)
      .lean();

    const result = {
      missiles,
      timeRange: { start, end },
      count: missiles.length,
      timestamp: new Date().toISOString()
    };

    // Cache for 1 minute
    await cache.set(cacheKey, result, 60);

    res.json(result);

  } catch (error) {
    console.error('Error fetching recent missiles:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch recent missiles'
    });
  }
});

// GET /api/missiles/:id - Get specific missile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check cache first
    let missile = await cache.get(`missile_${id}`);
    
    if (!missile) {
      missile = await Missile.findOne({ id }).lean();
      
      if (!missile) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Missile not found'
        });
      }
      
      // Cache for 30 seconds
      await cache.set(`missile_${id}`, missile, 30);
    }

    res.json({
      missile,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching missile:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch missile'
    });
  }
});

// GET /api/missiles/:id/trajectory - Get missile trajectory
router.get('/:id/trajectory', async (req, res) => {
  try {
    const { id } = req.params;
    
    const missile = await Missile.findOne({ id }, 'id trajectory currentPosition status').lean();
    
    if (!missile) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Missile not found'
      });
    }

    res.json({
      id: missile.id,
      trajectory: missile.trajectory,
      currentPosition: missile.currentPosition,
      status: missile.status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching missile trajectory:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch missile trajectory'
    });
  }
});

// GET /api/missiles/stats/summary - Get missile statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const cacheKey = 'missile_stats_summary';
    let stats = await cache.get(cacheKey);
    
    if (!stats) {
      const [
        totalCount,
        activeCount,
        recentCount,
        statusCounts,
        countryCounts,
        typeCounts,
        threatCounts
      ] = await Promise.all([
        Missile.countDocuments(),
        Missile.countDocuments({ status: { $in: ['launched', 'in-flight'] } }),
        Missile.countDocuments({ 
          launchTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }),
        Missile.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Missile.aggregate([
          { $group: { _id: '$country', count: { $sum: 1 } } }
        ]),
        Missile.aggregate([
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ]),
        Missile.aggregate([
          { $group: { _id: '$threat_level', count: { $sum: 1 } } }
        ])
      ]);

      stats = {
        total: totalCount,
        active: activeCount,
        recent24h: recentCount,
        byStatus: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byCountry: countryCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byType: typeCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byThreatLevel: threatCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        timestamp: new Date().toISOString()
      };

      // Cache for 1 minute
      await cache.set(cacheKey, stats, 60);
    }

    res.json(stats);

  } catch (error) {
    console.error('Error fetching missile stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch missile statistics'
    });
  }
});

module.exports = router;
