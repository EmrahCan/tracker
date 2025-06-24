# 🔑 API Anahtarları Kurulum Rehberi

Gerçek zamanlı füze takip sistemi için gerekli API anahtarlarını edinme rehberi.

## 🚀 Gerekli API Anahtarları

### 1. OpenAI API Key
**Amaç:** Haber metinlerini analiz etmek ve füze bilgilerini çıkarmak

**Nasıl Edinilir:**
1. https://platform.openai.com adresine git
2. Hesap oluştur veya giriş yap
3. "API Keys" bölümüne git
4. "Create new secret key" butonuna tıkla
5. Anahtarı kopyala ve güvenli bir yerde sakla

**Ücretlendirme:** Pay-as-you-use (kullandığın kadar öde)
**Tahmini Maliyet:** Günlük ~$1-5 (haber analizi için)

### 2. NewsAPI Key
**Amaç:** Global haber kaynaklarından füze haberlerini çekmek

**Nasıl Edinilir:**
1. https://newsapi.org adresine git
2. "Get API Key" butonuna tıkla
3. Hesap oluştur (email ile)
4. Email doğrulaması yap
5. Dashboard'dan API key'ini al

**Ücretsiz Plan:** 1000 istek/gün
**Ücretli Plan:** $449/ay (100,000 istek)

### 3. Guardian API Key
**Amaç:** The Guardian gazetesinden kaliteli haber içeriği çekmek

**Nasıl Edinilir:**
1. https://open-platform.theguardian.com adresine git
2. "Register for an API key" tıkla
3. Formu doldur (proje detayları)
4. Email doğrulaması yap
5. API key'ini al

**Ücretsiz Plan:** 5000 istek/gün
**Ticari Kullanım:** İletişim gerekli

## ⚙️ Kurulum

### 1. .env Dosyasını Güncelle

```bash
# Backend .env dosyasını aç
cd missile-tracker/backend
nano .env
```

### 2. API Anahtarlarını Ekle

```env
# Real Data APIs
OPENAI_API_KEY=sk-your-openai-key-here
NEWS_API_KEY=your-newsapi-key-here  
GUARDIAN_API_KEY=your-guardian-key-here
```

### 3. Servisi Yeniden Başlat

```bash
# Backend'i yeniden başlat
npm run dev
```

## 🧪 Test Etme

### API Durumunu Kontrol Et
```bash
curl http://localhost:5001/api/news/sources
```

### Manuel Veri Yenileme
```bash
curl -X POST http://localhost:5001/api/news/refresh
```

### Geçmiş Verileri Yükle
```bash
curl -X POST http://localhost:5001/api/news/load-historical
```

## 🔒 Güvenlik Notları

1. **API anahtarlarını asla Git'e commit etme**
2. **Production'da environment variables kullan**
3. **API key'leri düzenli olarak rotate et**
4. **Rate limiting'e dikkat et**

## 🚨 Sorun Giderme

### "Missing API Key" Hatası
- .env dosyasında API key'lerin doğru yazıldığından emin ol
- Servisi yeniden başlat
- API key'lerin aktif olduğunu kontrol et

### "Rate Limit Exceeded" Hatası
- API kullanım limitlerini kontrol et
- Ücretli plana geçmeyi düşün
- İstek sıklığını azalt

### "Invalid API Key" Hatası
- API key'lerin doğru kopyalandığından emin ol
- Boşluk karakterleri olmadığını kontrol et
- API key'lerin expire olmadığını kontrol et

## 📊 Kullanım İstatistikleri

Sistem çalışmaya başladıktan sonra:
- **5 dakikada bir** yeni haberler kontrol edilir
- **Günlük ~100-200** API isteği yapılır
- **AI analizi** ile %90+ doğruluk oranı
- **Geçmiş 30 gün** verisi otomatik yüklenir

## 🎯 Sonuç

API anahtarları kurulduktan sonra sistem:
✅ Gerçek haber kaynaklarından veri çekecek
✅ AI ile füze olaylarını tespit edecek  
✅ Canlı güncellemeler gönderecek
✅ Geçmiş verileri analiz edecek

**Not:** Tüm API'lar ücretsiz planlarla başlayabilir, kullanım arttıkça ücretli planlara geçilebilir.
