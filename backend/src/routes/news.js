const express = require('express');
const NewsService = require('../services/newsService');
const RealTimeService = require('../services/realTimeService');
const Missile = require('../models/Missile');

const router = express.Router();

// GET /api/news/status - Real-time service durumu
router.get('/status', async (req, res) => {
  try {
    // Global realTimeService instance'ını kontrol et
    const status = {
      realTimeEnabled: process.env.REALTIME_ENABLED === 'true',
      simulationEnabled: process.env.SIMULATION_ENABLED === 'true',
      lastUpdate: new Date(),
      totalMissiles: await Missile.countDocuments(),
      recentMissiles: await Missile.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    };

    res.json(status);
  } catch (error) {
    console.error('❌ Error getting news status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// POST /api/news/refresh - Manuel veri yenileme
router.post('/refresh', async (req, res) => {
  try {
    const newsService = new NewsService();
    
    console.log('🔄 Manual news refresh requested');
    
    // Son 24 saatin verilerini çek
    const events = await newsService.getRealtimeMissileData();
    
    res.json({
      success: true,
      message: `Found ${events.length} new missile events`,
      events: events.length,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Error refreshing news:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to refresh news data' 
    });
  }
});

// GET /api/news/historical - Geçmiş verileri yükle
router.post('/load-historical', async (req, res) => {
  try {
    const newsService = new NewsService();
    
    console.log('📚 Loading historical data requested');
    
    // Son 30 günün verilerini çek
    const events = await newsService.getHistoricalData();
    
    if (events.length > 0) {
      // RealTimeService ile kaydet
      const realTimeService = new RealTimeService();
      await realTimeService.saveMissileEvents(events);
    }
    
    res.json({
      success: true,
      message: `Loaded ${events.length} historical missile events`,
      events: events.length,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Error loading historical data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load historical data' 
    });
  }
});

// GET /api/news/sources - Haber kaynakları durumu
router.get('/sources', async (req, res) => {
  try {
    const sources = [
      {
        name: 'NewsAPI',
        status: process.env.NEWS_API_KEY ? 'configured' : 'missing_key',
        description: 'Global news aggregator'
      },
      {
        name: 'Guardian API',
        status: process.env.GUARDIAN_API_KEY ? 'configured' : 'missing_key',
        description: 'The Guardian newspaper API'
      },
      {
        name: 'OpenAI',
        status: process.env.OPENAI_API_KEY ? 'configured' : 'missing_key',
        description: 'AI analysis for missile detection'
      }
    ];

    res.json({
      sources,
      allConfigured: sources.every(s => s.status === 'configured')
    });
    
  } catch (error) {
    console.error('❌ Error getting sources:', error);
    res.status(500).json({ error: 'Failed to get sources' });
  }
});

// GET /api/news/recent - Son haberler
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const recentMissiles = await Missile.find({
      'metadata.realData': true
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('id timestamp origin target type status threatLevel metadata');

    res.json({
      missiles: recentMissiles,
      total: recentMissiles.length,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Error getting recent news:', error);
    res.status(500).json({ error: 'Failed to get recent news' });
  }
});

module.exports = router;
