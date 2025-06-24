const axios = require('axios');
const { OpenAI } = require('openai');

class NewsService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.newsAPIs = [
      {
        name: 'NewsAPI',
        url: 'https://newsapi.org/v2/everything',
        key: process.env.NEWS_API_KEY,
        params: {
          q: 'missile attack Iran Israel OR rocket launch OR ballistic missile OR intercepted',
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 50
        }
      },
      {
        name: 'Guardian',
        url: 'https://content.guardianapis.com/search',
        key: process.env.GUARDIAN_API_KEY,
        params: {
          q: 'missile Iran Israel rocket attack',
          'show-fields': 'headline,body,thumbnail',
          'page-size': 50,
          'order-by': 'newest'
        }
      }
    ];
  }

  async fetchNews(fromDate = null) {
    try {
      const allArticles = [];
      
      // Son 30 gün için tarih ayarla
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateFrom = fromDate || thirtyDaysAgo.toISOString().split('T')[0];

      for (const api of this.newsAPIs) {
        try {
          const articles = await this.fetchFromAPI(api, dateFrom);
          allArticles.push(...articles);
        } catch (error) {
          console.error(`❌ Error fetching from ${api.name}:`, error.message);
        }
      }

      // Duplicate'leri temizle
      const uniqueArticles = this.removeDuplicates(allArticles);
      
      console.log(`📰 Fetched ${uniqueArticles.length} unique articles`);
      return uniqueArticles;
      
    } catch (error) {
      console.error('❌ Error in fetchNews:', error);
      return [];
    }
  }

  async fetchFromAPI(api, dateFrom) {
    const params = {
      ...api.params,
      from: dateFrom,
      apiKey: api.key || api.params['api-key']
    };

    if (api.name === 'Guardian') {
      params['from-date'] = dateFrom;
      params['api-key'] = api.key;
      delete params.apiKey;
    }

    const response = await axios.get(api.url, { 
      params,
      timeout: 10000 
    });

    if (api.name === 'NewsAPI') {
      return response.data.articles || [];
    } else if (api.name === 'Guardian') {
      return response.data.response?.results || [];
    }

    return [];
  }

  removeDuplicates(articles) {
    const seen = new Set();
    return articles.filter(article => {
      const title = article.title || article.webTitle || '';
      const key = title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async analyzeWithAI(articles) {
    try {
      console.log(`🤖 Analyzing ${articles.length} articles with AI...`);
      
      const missileEvents = [];
      
      // Batch'ler halinde işle (API limit'leri için)
      const batchSize = 5;
      for (let i = 0; i < articles.length; i += batchSize) {
        const batch = articles.slice(i, i + batchSize);
        const batchResults = await this.processBatch(batch);
        missileEvents.push(...batchResults);
        
        // Rate limiting için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`✅ AI analysis complete: ${missileEvents.length} missile events found`);
      return missileEvents;
      
    } catch (error) {
      console.error('❌ Error in AI analysis:', error);
      return [];
    }
  }

  async processBatch(articles) {
    const articlesText = articles.map((article, index) => {
      const title = article.title || article.webTitle || '';
      const content = article.description || article.content || article.fields?.body || '';
      const date = article.publishedAt || article.webPublicationDate || '';
      
      return `Article ${index + 1}:
Title: ${title}
Date: ${date}
Content: ${content.substring(0, 500)}...
---`;
    }).join('\n\n');

    const prompt = `
Analyze these news articles and extract missile/rocket attack information between Iran and Israel. 
For each missile event found, return a JSON object with this exact structure:

{
  "id": "unique_id",
  "timestamp": "ISO_date_string",
  "origin": {
    "country": "Iran" or "Israel",
    "city": "specific_city_if_mentioned",
    "coordinates": [longitude, latitude] or null
  },
  "target": {
    "country": "Israel" or "Iran", 
    "city": "specific_city_if_mentioned",
    "coordinates": [longitude, latitude] or null
  },
  "type": "ballistic" or "cruise" or "drone" or "rocket" or "interceptor",
  "status": "launched" or "intercepted" or "impact" or "failed",
  "threatLevel": "critical" or "high" or "medium" or "low",
  "description": "brief_description",
  "source": "article_title"
}

Only extract events that are clearly about missile/rocket attacks. Ignore general political news.
Return only valid JSON array, no other text.

Articles:
${articlesText}
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system", 
            content: "You are a military intelligence analyst. Extract missile attack data from news articles and return only valid JSON."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      // JSON parse et
      try {
        const events = JSON.parse(content);
        return Array.isArray(events) ? events : [];
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        return [];
      }

    } catch (error) {
      console.error('❌ OpenAI API error:', error);
      return [];
    }
  }

  // Koordinat bilgilerini ekle
  addCoordinates(events) {
    const locations = {
      // Iran cities
      'Tehran': [51.3890, 35.6892],
      'Isfahan': [51.6746, 32.6546],
      'Shiraz': [52.5836, 29.5918],
      'Bushehr': [50.8203, 28.9684],
      'Fordow': [51.7328, 34.9564],
      'Natanz': [51.9065, 33.7248],
      
      // Israel cities  
      'Jerusalem': [35.2137, 31.7683],
      'Tel Aviv': [34.7818, 32.0853],
      'Haifa': [34.9896, 32.7940],
      'Beersheba': [34.7913, 31.2518],
      'Eilat': [34.9482, 29.5581],
      'Dimona': [35.0293, 31.0686],
      'Palmachim': [34.6961, 31.9394]
    };

    return events.map(event => {
      if (event.origin && event.origin.city && locations[event.origin.city]) {
        event.origin.coordinates = locations[event.origin.city];
      }
      if (event.target && event.target.city && locations[event.target.city]) {
        event.target.coordinates = locations[event.target.city];
      }
      return event;
    });
  }

  async getRealtimeMissileData() {
    try {
      // Son 24 saatin haberlerini çek
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const articles = await this.fetchNews(yesterday.toISOString().split('T')[0]);
      
      if (articles.length === 0) {
        console.log('📰 No recent articles found');
        return [];
      }

      const events = await this.analyzeWithAI(articles);
      const eventsWithCoords = this.addCoordinates(events);
      
      console.log(`🎯 Found ${eventsWithCoords.length} real missile events`);
      return eventsWithCoords;
      
    } catch (error) {
      console.error('❌ Error getting realtime data:', error);
      return [];
    }
  }

  async getHistoricalData() {
    try {
      console.log('📚 Fetching historical missile data (last 30 days)...');
      
      const articles = await this.fetchNews();
      const events = await this.analyzeWithAI(articles);
      const eventsWithCoords = this.addCoordinates(events);
      
      console.log(`📊 Historical analysis complete: ${eventsWithCoords.length} events`);
      return eventsWithCoords;
      
    } catch (error) {
      console.error('❌ Error getting historical data:', error);
      return [];
    }
  }
}

module.exports = NewsService;
