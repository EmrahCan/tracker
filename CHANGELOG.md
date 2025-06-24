# Değişiklik Günlüğü (CHANGELOG)

Tüm önemli değişiklikler bu dosyada belgelenecektir.

## [1.1.0] - 2025-06-25

### 🌟 Eklenen Özellikler
- **🤖 AI Destekli Haber Analizi**: OpenAI GPT-3.5 entegrasyonu ile haber metinlerini analiz etme
- **📰 Çoklu Haber Kaynağı**: NewsAPI ve Guardian API entegrasyonu
- **🔍 Gerçek Zamanlı Füze Tespiti**: Haber kaynaklarından otomatik füze olayı çıkarma
- **📊 Geçmiş Veri Analizi**: Son 30 günün füze olaylarını yükleme özelliği
- **🎛️ Gerçek Veriler Sayfası**: `/news` rotasında yeni kontrol paneli
- **⚡ Canlı Güncelleme**: 5 dakikada bir otomatik haber kontrolü
- **🗺️ Koordinat Haritalama**: Şehir isimlerini coğrafi koordinatlara çevirme

### 🔧 Teknik İyileştirmeler
- **NewsService**: Haber API'lerinden veri çekme servisi eklendi
- **RealTimeService**: Gerçek zamanlı haber izleme ve analiz servisi
- **API Routes**: `/api/news` endpoint'leri eklendi
- **Duplikasyon Kontrolü**: Aynı füze olaylarının tekrarını önleme
- **Error Handling**: API hatalarını yönetme ve kullanıcı bildirimleri

### 🎨 Frontend Geliştirmeleri
- **Gerçek Veriler Sayfası**: API durumu ve kontrol paneli eklendi
- **Sidebar Menü**: "Gerçek Veriler" navigasyon öğesi eklendi
- **Toast Bildirimleri**: Kullanıcı geri bildirimi için bildirimler
- **API Durumu İzleme**: Gerçek zamanlı sistem durumu gösterimi
- **Manuel Kontroller**: Veri yenileme ve geçmiş yükleme butonları

### 📚 Dokümantasyon
- **API_KEYS_SETUP.md**: Detaylı API anahtarı kurulum rehberi eklendi
- **Güvenlik Notları**: API anahtarı yönetimi ve güvenlik önerileri
- **Deployment Rehberi**: Production ortamı için konfigürasyon

### ⚙️ Konfigürasyon Değişiklikleri
- `SIMULATION_ENABLED=false` - Simülasyon modu kapatıldı
- `REALTIME_ENABLED=true` - Gerçek veri modu aktif edildi
- Yeni environment variables eklendi:
  - `OPENAI_API_KEY` - OpenAI API anahtarı
  - `NEWS_API_KEY` - NewsAPI anahtarı
  - `GUARDIAN_API_KEY` - Guardian API anahtarı
  - `NEWS_CHECK_INTERVAL` - Haber kontrol aralığı

### 🐛 Düzeltilen Hatalar
- Frontend build hatalarını düzeltme (kullanılmayan import'lar)
- Backend service import path'lerini düzeltme
- Port çakışması sorunlarını çözme
- ESLint uyarılarını giderme

### 🔄 Değiştirilen Özellikler
- Simülasyon modundan gerçek veri moduna geçiş
- Backend port 5000'den 5001'e değiştirildi
- .env.example dosyası güncellendi

## [1.0.0] - 2025-06-24

### 🌟 İlk Tam Sürüm
- **🗺️ İnteraktif Harita**: Leaflet.js ile gerçek zamanlı füze takibi
- **📡 WebSocket Entegrasyonu**: Canlı veri akışı
- **📊 Analitik Dashboard**: Kapsamlı istatistikler ve grafikler
- **⚙️ Sistem Ayarları**: Kullanıcı konfigürasyon paneli
- **🎨 Responsive Tasarım**: Mobil uyumlu arayüz
- **🌙 Dark Theme**: Modern karanlık tema

### 🏗️ Teknik Altyapı
- **Frontend**: React 18, React Router, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js, Socket.io
- **Veritabanı**: MongoDB, Redis
- **Containerization**: Docker, Docker Compose
- **Deployment**: Netlify hazır konfigürasyon

### 📊 Özellikler
- Gerçek zamanlı füze simülasyonu
- İnteraktif harita görünümleri (dark, satellite, terrain)
- Alert sistemi ve bildirimler
- Kapsamlı analitik dashboard
- Sistem ayarları ve konfigürasyon yönetimi
- WebSocket tabanlı gerçek zamanlı iletişim
- Responsive mobil uyumlu tasarım

---

## Versiyon Formatı

Bu proje [Semantic Versioning](https://semver.org/) kullanır:
- **MAJOR**: Geriye uyumsuz API değişiklikleri
- **MINOR**: Geriye uyumlu yeni özellikler
- **PATCH**: Geriye uyumlu hata düzeltmeleri

## Etiketler
- `🌟 Eklenen` - Yeni özellikler için
- `🔧 Değiştirilen` - Mevcut işlevsellikte değişiklikler için
- `🗑️ Kaldırılan` - Artık kullanılmayan özellikler için
- `🐛 Düzeltilen` - Hata düzeltmeleri için
- `🔒 Güvenlik` - Güvenlik açıklarında düzeltmeler için
