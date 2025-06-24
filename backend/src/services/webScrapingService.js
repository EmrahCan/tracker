const axios = require('axios');
const cheerio = require('cheerio');

class WebScrapingService {
  constructor() {
    this.sources = [
      {
        name: 'BBC News Middle East',
        url: 'https://www.bbc.com/news/world/middle_east',
        selector: '.gs-c-promo-heading__title',
        linkSelector: '.gs-c-promo-heading__title',
        enabled: true
      },
      {
        name: 'Reuters Middle East',
        url: 'https://www.reuters.com/world/middle-east/',
        selector: '[data-testid="Heading"]',
        linkSelector: 'a[data-testid="Link"]',
        enabled: true
      },
      {
        name: 'Al Jazeera',
        url: 'https://www.aljazeera.com/news/',
        selector: '.gc__title',
        linkSelector: '.gc__title a',
        enabled: true
      },
      {
        name: 'CNN International',
        url: 'https://edition.cnn.com/world/middle-east',
        selector: '.container__headline-text',
        linkSelector: '.container__link',
        enabled: true
      }
    ];
    
    this.missileKeywords = [
      'missile', 'rocket', 'ballistic', 'intercepted', 'launched',
      'iran', 'israel', 'gaza', 'lebanon', 'hezbollah', 'hamas',
      'air strike', 'bombardment', 'defense system', 'iron dome',
      'füze', 'roket', 'saldırı', 'savunma', 'hava saldırısı'
    ];
  }

  async scrapeNews() {
    console.log('🕷️ Starting web scraping for missile news...');
    const allArticles = [];

    for (const source of this.sources) {
      if (!source.enabled) continue;

      try {
        console.log(`📰 Scraping ${source.name}...`);
        const articles = await this.scrapeSource(source);
        allArticles.push(...articles);
        
        // Rate limiting - wait between requests
        await this.delay(2000);
        
      } catch (error) {
        console.error(`❌ Error scraping ${source.name}:`, error.message);
      }
    }

    // Filter for missile-related content
    const missileArticles = this.filterMissileContent(allArticles);
    console.log(`🎯 Found ${missileArticles.length} missile-related articles`);
    
    return missileArticles;
  }

  async scrapeSource(source) {
    try {
      const response = await axios.get(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const articles = [];

      $(source.selector).each((index, element) => {
        const title = $(element).text().trim();
        let link = '';
        
        if (source.linkSelector) {
          const linkElement = $(element).closest('a').length > 0 
            ? $(element).closest('a') 
            : $(element).find('a');
          link = linkElement.attr('href') || '';
        }

        // Make relative URLs absolute
        if (link && link.startsWith('/')) {
          const baseUrl = new URL(source.url).origin;
          link = baseUrl + link;
        }

        if (title && title.length > 10) {
          articles.push({
            title,
            link,
            source: source.name,
            scrapedAt: new Date(),
            content: title // For now, just use title as content
          });
        }
      });

      console.log(`✅ Scraped ${articles.length} articles from ${source.name}`);
      return articles;
      
    } catch (error) {
      console.error(`❌ Error scraping ${source.name}:`, error.message);
      return [];
    }
  }

  filterMissileContent(articles) {
    return articles.filter(article => {
      const text = (article.title + ' ' + article.content).toLowerCase();
      return this.missileKeywords.some(keyword => 
        text.includes(keyword.toLowerCase())
      );
    });
  }

  async analyzeWithLocalAI(articles) {
    // Simple rule-based analysis without external AI
    const analyzedArticles = [];

    for (const article of articles) {
      const analysis = this.performLocalAnalysis(article);
      if (analysis.isMissileEvent) {
        analyzedArticles.push({
          ...article,
          analysis
        });
      }
    }

    return analyzedArticles;
  }

  performLocalAnalysis(article) {
    const text = (article.title + ' ' + article.content).toLowerCase();
    
    // Location detection
    const locations = this.extractLocations(text);
    
    // Missile type detection
    const missileType = this.detectMissileType(text);
    
    // Threat level assessment
    const threatLevel = this.assessThreatLevel(text);
    
    // Check if it's a missile event
    const isMissileEvent = this.isMissileEvent(text);

    return {
      isMissileEvent,
      locations,
      missileType,
      threatLevel,
      confidence: this.calculateConfidence(text),
      extractedAt: new Date()
    };
  }

  extractLocations(text) {
    const locationKeywords = {
      'israel': { lat: 31.0461, lng: 34.8516, country: 'Israel' },
      'gaza': { lat: 31.3547, lng: 34.3088, country: 'Palestine' },
      'lebanon': { lat: 33.8547, lng: 35.8623, country: 'Lebanon' },
      'iran': { lat: 32.4279, lng: 53.6880, country: 'Iran' },
      'tehran': { lat: 35.6892, lng: 51.3890, country: 'Iran' },
      'tel aviv': { lat: 32.0853, lng: 34.7818, country: 'Israel' },
      'jerusalem': { lat: 31.7683, lng: 35.2137, country: 'Israel' },
      'beirut': { lat: 33.8938, lng: 35.5018, country: 'Lebanon' }
    };

    const foundLocations = [];
    
    for (const [location, coords] of Object.entries(locationKeywords)) {
      if (text.includes(location)) {
        foundLocations.push({
          name: location,
          coordinates: [coords.lat, coords.lng],
          country: coords.country
        });
      }
    }

    return foundLocations;
  }

  detectMissileType(text) {
    if (text.includes('ballistic')) return 'ballistic';
    if (text.includes('cruise')) return 'cruise';
    if (text.includes('rocket')) return 'rocket';
    if (text.includes('drone')) return 'drone';
    return 'unknown';
  }

  assessThreatLevel(text) {
    if (text.includes('nuclear') || text.includes('chemical')) return 'critical';
    if (text.includes('ballistic') || text.includes('long-range')) return 'high';
    if (text.includes('intercepted') || text.includes('defense')) return 'medium';
    return 'low';
  }

  isMissileEvent(text) {
    const eventKeywords = [
      'launched', 'fired', 'strike', 'attack', 'intercepted',
      'defense', 'missile', 'rocket', 'bombardment'
    ];
    
    return eventKeywords.some(keyword => text.includes(keyword));
  }

  calculateConfidence(text) {
    let confidence = 0;
    
    // More specific keywords = higher confidence
    if (text.includes('missile launched')) confidence += 0.3;
    if (text.includes('ballistic missile')) confidence += 0.2;
    if (text.includes('intercepted')) confidence += 0.2;
    if (text.includes('iran') && text.includes('israel')) confidence += 0.2;
    if (text.includes('defense system')) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convert analyzed articles to missile events
  convertToMissileEvents(analyzedArticles) {
    return analyzedArticles.map(article => {
      const locations = article.analysis.locations;
      const sourceLocation = locations[0] || { coordinates: [32.0, 35.0], country: 'Unknown' };
      const targetLocation = locations[1] || { coordinates: [31.5, 34.5], country: 'Unknown' };

      // Mongoose şeması için lat/lng formatına çevir
      const sourceCoords = {
        lat: sourceLocation.coordinates[0],
        lng: sourceLocation.coordinates[1]
      };
      
      const targetCoords = {
        lat: targetLocation.coordinates[0], 
        lng: targetLocation.coordinates[1]
      };

      return {
        id: `scraped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: article.analysis.missileType === 'unknown' ? 'ballistic' : article.analysis.missileType,
        status: 'launched',
        source: {
          ...sourceCoords,
          country: this.mapCountryName(sourceLocation.country),
          location: sourceLocation.name || 'Unknown'
        },
        target: {
          ...targetCoords,
          country: this.mapCountryName(targetLocation.country),
          location: targetLocation.name || 'Unknown'
        },
        origin: sourceCoords, // Mongoose için
        currentPosition: sourceCoords, // Mongoose için
        country: this.mapCountryName(sourceLocation.country), // Mongoose enum için
        threat_level: article.analysis.threatLevel,
        threatLevel: article.analysis.threatLevel, // Hem camelCase hem snake_case
        launchTime: new Date(),
        estimatedImpactTime: new Date(Date.now() + 10 * 60 * 1000), // 10 dakika sonra
        speed: this.calculateSpeedByType(article.analysis.missileType),
        altitude: this.calculateAltitudeByType(article.analysis.missileType),
        timestamp: new Date(),
        metadata: {
          newsSource: article.source,
          newsTitle: article.title,
          newsLink: article.link,
          confidence: article.analysis.confidence,
          scrapingMethod: 'web_scraping',
          source: 'web_scraping'
        }
      };
    });
  }

  // Ülke isimlerini Mongoose enum'una uygun hale getir
  mapCountryName(country) {
    const countryMap = {
      'Israel': 'israel',
      'Iran': 'iran',
      'Palestine': 'other',
      'Lebanon': 'other',
      'Unknown': 'other'
    };
    
    return countryMap[country] || 'other';
  }

  // Tip bazında hız hesaplama
  calculateSpeedByType(type) {
    const speeds = {
      'ballistic': 7000,
      'cruise': 800,
      'drone': 200,
      'rocket': 3000
    };
    return speeds[type] || 1000;
  }

  // Tip bazında yükseklik hesaplama  
  calculateAltitudeByType(type) {
    const altitudes = {
      'ballistic': 150000,
      'cruise': 500,
      'drone': 1000,
      'rocket': 50000
    };
    return altitudes[type] || 10000;
  }
}

module.exports = WebScrapingService;
