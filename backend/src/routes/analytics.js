const express = require('express');
const Missile = require('../models/Missile');
const { cache } = require('../config/redis');

const router = express.Router();

// GET /api/analytics/timeline - Get missile activity timeline
router.get('/timeline', async (req, res) => {
  try {
    const { hours = 24, interval = 'hour' } = req.query;
    
    const cacheKey = `analytics_timeline_${hours}_${interval}`;
    let cachedResult = await cache.get(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    let groupBy;
    switch (interval) {
      case 'minute':
        groupBy = {
          year: { $year: '$launchTime' },
          month: { $month: '$launchTime' },
          day: { $dayOfMonth: '$launchTime' },
          hour: { $hour: '$launchTime' },
          minute: { $minute: '$launchTime' }
        };
        break;
      case 'hour':
        groupBy = {
          year: { $year: '$launchTime' },
          month: { $month: '$launchTime' },
          day: { $dayOfMonth: '$launchTime' },
          hour: { $hour: '$launchTime' }
        };
        break;
      case 'day':
        groupBy = {
          year: { $year: '$launchTime' },
          month: { $month: '$launchTime' },
          day: { $dayOfMonth: '$launchTime' }
        };
        break;
      default:
        groupBy = {
          year: { $year: '$launchTime' },
          month: { $month: '$launchTime' },
          day: { $dayOfMonth: '$launchTime' },
          hour: { $hour: '$launchTime' }
        };
    }

    const timeline = await Missile.aggregate([
      {
        $match: {
          launchTime: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          byStatus: {
            $push: '$status'
          },
          byCountry: {
            $push: '$country'
          },
          byType: {
            $push: '$type'
          },
          byThreatLevel: {
            $push: '$threat_level'
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1, '_id.minute': 1 }
      }
    ]);

    // Process the results to include breakdowns
    const processedTimeline = timeline.map(item => ({
      timestamp: item._id,
      total: item.count,
      breakdown: {
        status: countArray(item.byStatus),
        country: countArray(item.byCountry),
        type: countArray(item.byType),
        threatLevel: countArray(item.byThreatLevel)
      }
    }));

    const result = {
      timeline: processedTimeline,
      timeRange: {
        start: startTime,
        end: new Date(),
        hours: parseInt(hours),
        interval
      },
      timestamp: new Date().toISOString()
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300);

    res.json(result);

  } catch (error) {
    console.error('Error fetching timeline analytics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch timeline analytics'
    });
  }
});

// GET /api/analytics/heatmap - Get geographical heatmap data
router.get('/heatmap', async (req, res) => {
  try {
    const { hours = 24, type = 'launches' } = req.query;
    
    const cacheKey = `analytics_heatmap_${hours}_${type}`;
    let cachedResult = await cache.get(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    let matchStage = {
      launchTime: { $gte: startTime }
    };

    let locationField;
    switch (type) {
      case 'launches':
        locationField = '$origin';
        break;
      case 'targets':
        locationField = '$target';
        break;
      case 'impacts':
        matchStage.status = { $in: ['impact', 'intercepted'] };
        locationField = '$target';
        break;
      default:
        locationField = '$origin';
    }

    const heatmapData = await Missile.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            lat: { $round: [locationField + '.lat', 2] },
            lng: { $round: [locationField + '.lng', 2] }
          },
          count: { $sum: 1 },
          missiles: {
            $push: {
              id: '$id',
              type: '$type',
              status: '$status',
              threat_level: '$threat_level',
              launchTime: '$launchTime'
            }
          }
        }
      },
      {
        $project: {
          lat: '$_id.lat',
          lng: '$_id.lng',
          count: 1,
          intensity: { $min: [{ $divide: ['$count', 10] }, 1] }, // Normalize to 0-1
          missiles: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    const result = {
      heatmap: heatmapData,
      type,
      timeRange: {
        start: startTime,
        end: new Date(),
        hours: parseInt(hours)
      },
      totalPoints: heatmapData.length,
      timestamp: new Date().toISOString()
    };

    // Cache for 2 minutes
    await cache.set(cacheKey, result, 120);

    res.json(result);

  } catch (error) {
    console.error('Error fetching heatmap analytics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch heatmap analytics'
    });
  }
});

// GET /api/analytics/patterns - Get pattern analysis
router.get('/patterns', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const cacheKey = `analytics_patterns_${days}`;
    let cachedResult = await cache.get(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      hourlyPattern,
      dailyPattern,
      countryPattern,
      typePattern,
      successRate
    ] = await Promise.all([
      // Hourly pattern
      Missile.aggregate([
        { $match: { launchTime: { $gte: startTime } } },
        {
          $group: {
            _id: { $hour: '$launchTime' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      
      // Daily pattern
      Missile.aggregate([
        { $match: { launchTime: { $gte: startTime } } },
        {
          $group: {
            _id: { $dayOfWeek: '$launchTime' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      
      // Country pattern
      Missile.aggregate([
        { $match: { launchTime: { $gte: startTime } } },
        {
          $group: {
            _id: '$country',
            count: { $sum: 1 },
            avgThreatLevel: { $avg: { $switch: {
              branches: [
                { case: { $eq: ['$threat_level', 'low'] }, then: 1 },
                { case: { $eq: ['$threat_level', 'medium'] }, then: 2 },
                { case: { $eq: ['$threat_level', 'high'] }, then: 3 },
                { case: { $eq: ['$threat_level', 'critical'] }, then: 4 }
              ],
              default: 2
            }}}
          }
        }
      ]),
      
      // Type pattern
      Missile.aggregate([
        { $match: { launchTime: { $gte: startTime } } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            intercepted: {
              $sum: { $cond: [{ $eq: ['$status', 'intercepted'] }, 1, 0] }
            },
            impacted: {
              $sum: { $cond: [{ $eq: ['$status', 'impact'] }, 1, 0] }
            }
          }
        }
      ]),
      
      // Success/Interception rate
      Missile.aggregate([
        { $match: { launchTime: { $gte: startTime } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            intercepted: {
              $sum: { $cond: [{ $eq: ['$status', 'intercepted'] }, 1, 0] }
            },
            impacted: {
              $sum: { $cond: [{ $eq: ['$status', 'impact'] }, 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    const result = {
      patterns: {
        hourly: hourlyPattern.map(item => ({
          hour: item._id,
          count: item.count
        })),
        daily: dailyPattern.map(item => ({
          dayOfWeek: item._id,
          count: item.count
        })),
        byCountry: countryPattern.map(item => ({
          country: item._id,
          count: item.count,
          avgThreatLevel: Math.round(item.avgThreatLevel * 100) / 100
        })),
        byType: typePattern.map(item => ({
          type: item._id,
          count: item.count,
          intercepted: item.intercepted,
          impacted: item.impacted,
          interceptionRate: item.count > 0 ? Math.round((item.intercepted / item.count) * 100) : 0
        }))
      },
      successRates: successRate[0] ? {
        total: successRate[0].total,
        intercepted: successRate[0].intercepted,
        impacted: successRate[0].impacted,
        failed: successRate[0].failed,
        interceptionRate: Math.round((successRate[0].intercepted / successRate[0].total) * 100),
        impactRate: Math.round((successRate[0].impacted / successRate[0].total) * 100)
      } : null,
      timeRange: {
        start: startTime,
        end: new Date(),
        days: parseInt(days)
      },
      timestamp: new Date().toISOString()
    };

    // Cache for 10 minutes
    await cache.set(cacheKey, result, 600);

    res.json(result);

  } catch (error) {
    console.error('Error fetching pattern analytics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch pattern analytics'
    });
  }
});

// Helper function to count array elements
function countArray(arr) {
  return arr.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}

module.exports = router;
