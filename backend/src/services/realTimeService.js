const NewsService = require('./newsService');
const Missile = require('../models/Missile');

class RealTimeService {
  constructor(io) {
    this.io = io;
    this.newsService = new NewsService();
    this.isRunning = false;
    this.checkInterval = 5 * 60 * 1000; // 5 dakika
    this.lastCheck = new Date();
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🌐 Real-time news monitoring started');
    
    // İlk başta geçmiş verileri yükle
    await this.loadHistoricalData();
    
    // Periyodik kontrol başlat
    this.intervalId = setInterval(async () => {
      await this.checkForNewMissileEvents();
    }, this.checkInterval);
    
    // İlk kontrol
    await this.checkForNewMissileEvents();
  }

  async stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    console.log('🛑 Real-time monitoring stopped');
  }

  async loadHistoricalData() {
    try {
      console.log('📚 Loading historical missile data...');
      
      // Veritabanında veri var mı kontrol et
      const existingCount = await Missile.countDocuments();
      
      if (existingCount > 0) {
        console.log(`📊 Found ${existingCount} existing missiles in database`);
        return;
      }

      // Geçmiş verileri çek ve kaydet
      const historicalEvents = await this.newsService.getHistoricalData();
      
      if (historicalEvents.length > 0) {
        await this.saveMissileEvents(historicalEvents);
        console.log(`✅ Loaded ${historicalEvents.length} historical missile events`);
      }
      
    } catch (error) {
      console.error('❌ Error loading historical data:', error);
    }
  }

  async checkForNewMissileEvents() {
    try {
      console.log('🔍 Checking for new missile events...');
      
      const realtimeEvents = await this.newsService.getRealtimeMissileData();
      
      if (realtimeEvents.length === 0) {
        console.log('📰 No new missile events found');
        return;
      }

      // Yeni olayları filtrele (veritabanında olmayan)
      const newEvents = await this.filterNewEvents(realtimeEvents);
      
      if (newEvents.length > 0) {
        await this.saveMissileEvents(newEvents);
        
        // WebSocket ile canlı güncelleme gönder
        this.broadcastNewEvents(newEvents);
        
        console.log(`🚀 Found and broadcasted ${newEvents.length} new missile events`);
      } else {
        console.log('📊 All events already exist in database');
      }
      
      this.lastCheck = new Date();
      
    } catch (error) {
      console.error('❌ Error checking for new events:', error);
    }
  }

  async filterNewEvents(events) {
    const newEvents = [];
    
    for (const event of events) {
      // Benzer olay var mı kontrol et (aynı gün, benzer lokasyon)
      const existing = await Missile.findOne({
        timestamp: {
          $gte: new Date(event.timestamp).setHours(0, 0, 0, 0),
          $lt: new Date(event.timestamp).setHours(23, 59, 59, 999)
        },
        'origin.country': event.origin.country,
        'target.country': event.target.country,
        type: event.type
      });

      if (!existing) {
        newEvents.push(event);
      }
    }
    
    return newEvents;
  }

  async saveMissileEvents(events) {
    try {
      const missiles = events.map(event => ({
        id: event.id || this.generateId(),
        timestamp: new Date(event.timestamp),
        origin: event.origin,
        target: event.target,
        currentPosition: event.origin.coordinates || [0, 0],
        type: event.type,
        status: event.status,
        threatLevel: event.threatLevel,
        speed: this.calculateSpeed(event.type),
        altitude: this.calculateAltitude(event.type),
        trajectory: this.calculateTrajectory(event.origin.coordinates, event.target.coordinates),
        metadata: {
          description: event.description,
          source: event.source,
          realData: true,
          newsAnalysis: true
        }
      }));

      await Missile.insertMany(missiles);
      console.log(`💾 Saved ${missiles.length} missile events to database`);
      
      return missiles;
      
    } catch (error) {
      console.error('❌ Error saving missile events:', error);
      return [];
    }
  }

  broadcastNewEvents(events) {
    events.forEach(event => {
      // Yeni füze eklendi
      this.io.emit('missile:new', {
        id: event.id,
        timestamp: event.timestamp,
        origin: event.origin,
        target: event.target,
        type: event.type,
        status: event.status,
        threatLevel: event.threatLevel,
        metadata: event.metadata
      });

      // Alert oluştur
      this.io.emit('alert:new', {
        id: `alert_${event.id}`,
        type: 'missile_detected',
        severity: event.threatLevel,
        title: `${event.type} missile detected`,
        message: `${event.origin.country} → ${event.target.country}`,
        timestamp: new Date(),
        metadata: {
          missileId: event.id,
          source: 'news_analysis'
        }
      });
    });
  }

  generateId() {
    return `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  calculateSpeed(type) {
    const speeds = {
      'ballistic': 7000, // km/h
      'cruise': 800,
      'drone': 200,
      'rocket': 3000,
      'interceptor': 5000
    };
    return speeds[type] || 1000;
  }

  calculateAltitude(type) {
    const altitudes = {
      'ballistic': 150000, // meters
      'cruise': 500,
      'drone': 1000,
      'rocket': 50000,
      'interceptor': 30000
    };
    return altitudes[type] || 10000;
  }

  calculateTrajectory(origin, target) {
    if (!origin || !target) return [];
    
    const steps = 10;
    const trajectory = [];
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const lat = origin[1] + (target[1] - origin[1]) * ratio;
      const lng = origin[0] + (target[0] - origin[0]) * ratio;
      trajectory.push([lng, lat]);
    }
    
    return trajectory;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheck: this.lastCheck,
      checkInterval: this.checkInterval,
      nextCheck: new Date(this.lastCheck.getTime() + this.checkInterval)
    };
  }
}

module.exports = RealTimeService;
