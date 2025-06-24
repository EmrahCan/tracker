const NewsService = require('./newsService');
const WebScrapingService = require('./webScrapingService');
const Missile = require('../models/Missile');

class RealTimeService {
  constructor(io) {
    this.io = io;
    this.newsService = new NewsService();
    this.webScrapingService = new WebScrapingService();
    this.isRunning = false;
    this.checkInterval = 5 * 60 * 1000; // 5 dakika
    this.lastCheck = new Date();
    this.useWebScraping = true; // Web scraping'i varsayılan olarak aktif
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
      
      let realtimeEvents = [];
      
      // Önce API'lerden dene
      try {
        realtimeEvents = await this.newsService.getRealtimeMissileData();
        console.log(`📰 API'lerden ${realtimeEvents.length} olay bulundu`);
      } catch (error) {
        console.log('⚠️ API hatası, web scraping\'e geçiliyor...');
      }
      
      // API'ler çalışmıyorsa veya yeterli veri yoksa web scraping kullan
      if (this.useWebScraping && realtimeEvents.length === 0) {
        try {
          console.log('🕷️ Web scraping ile haber toplama başlatılıyor...');
          const scrapedArticles = await this.webScrapingService.scrapeNews();
          const analyzedArticles = await this.webScrapingService.analyzeWithLocalAI(scrapedArticles);
          const scrapedEvents = this.webScrapingService.convertToMissileEvents(analyzedArticles);
          
          realtimeEvents = [...realtimeEvents, ...scrapedEvents];
          console.log(`🕷️ Web scraping ile ${scrapedEvents.length} olay bulundu`);
        } catch (error) {
          console.error('❌ Web scraping hatası:', error.message);
        }
      }
      
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
      // Veri formatını kontrol et
      if (!event.source || !event.target) {
        console.log('⚠️ Event missing source/target, skipping:', event.id);
        continue;
      }
      
      // Benzer olay var mı kontrol et (aynı gün, benzer lokasyon)
      const existing = await Missile.findOne({
        timestamp: {
          $gte: new Date(event.timestamp).setHours(0, 0, 0, 0),
          $lt: new Date(event.timestamp).setHours(23, 59, 59, 999)
        },
        'source.country': event.source.country,
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
      const missiles = events.map(event => {
        // Web scraping'den gelen veriler 'source' kullanıyor, API'ler 'origin' kullanıyor
        const origin = event.origin || event.source;
        const target = event.target;
        
        return {
          id: event.id || this.generateId(),
          timestamp: new Date(event.timestamp),
          origin: origin,
          target: target,
          currentPosition: origin?.coordinates || [0, 0],
          type: event.type,
          status: event.status,
          threatLevel: event.threatLevel,
          speed: this.calculateSpeed(event.type),
          altitude: this.calculateAltitude(event.type),
          trajectory: this.calculateTrajectory(origin?.coordinates, target?.coordinates),
          metadata: {
            description: event.description,
            source: event.source,
            realData: true,
            newsAnalysis: true,
            ...event.metadata // Web scraping metadata'sını da dahil et
          }
        };
      });

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
      // Veri formatını kontrol et
      const origin = event.origin || event.source;
      const target = event.target;
      
      if (!origin || !target) {
        console.log('⚠️ Event missing origin/target for broadcast, skipping:', event.id);
        return;
      }
      
      // Yeni füze eklendi
      this.io.emit('missile:new', {
        id: event.id,
        timestamp: event.timestamp,
        origin: origin,
        target: target,
        type: event.type,
        status: event.status,
        threatLevel: event.threatLevel || event.threat_level,
        metadata: event.metadata
      });

      // Alert oluştur
      this.io.emit('alert:new', {
        id: `alert_${event.id}`,
        type: 'missile_detected',
        severity: event.threatLevel || event.threat_level,
        title: `${event.type} missile detected`,
        message: `${origin.country || 'Unknown'} → ${target.country || 'Unknown'}`,
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
      nextCheck: new Date(this.lastCheck.getTime() + this.checkInterval),
      useWebScraping: this.useWebScraping,
      dataSources: {
        newsAPI: this.newsService ? true : false,
        webScraping: this.webScrapingService ? true : false
      }
    };
  }

  // Web scraping'i açma/kapama
  toggleWebScraping(enabled) {
    this.useWebScraping = enabled;
    console.log(`🕷️ Web scraping ${enabled ? 'enabled' : 'disabled'}`);
  }
}

module.exports = RealTimeService;
