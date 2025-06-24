import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  RefreshCw, 
  Database, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  AlertTriangle,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

const RealTimeNews = () => {
  const [status, setStatus] = useState(null);
  const [sources, setSources] = useState([]);
  const [recentMissiles, setRecentMissiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchSources();
    fetchRecentMissiles();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/news/status`);
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
      toast.error('Durum bilgisi alınamadı');
    }
  };

  const fetchSources = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/news/sources`);
      const data = await response.json();
      setSources(data.sources || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  const fetchRecentMissiles = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/news/recent?limit=10`);
      const data = await response.json();
      setRecentMissiles(data.missiles || []);
    } catch (error) {
      console.error('Error fetching recent missiles:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`http://localhost:5001/api/news/refresh`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`${data.events} yeni olay bulundu`);
        fetchStatus();
        fetchRecentMissiles();
      } else {
        toast.error('Yenileme başarısız');
      }
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Yenileme hatası');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadHistorical = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5001/api/news/load-historical`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`${data.events} geçmiş olay yüklendi`);
        fetchStatus();
        fetchRecentMissiles();
      } else {
        toast.error('Geçmiş veriler yüklenemedi');
      }
    } catch (error) {
      console.error('Error loading historical:', error);
      toast.error('Geçmiş veri yükleme hatası');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'configured': return 'text-green-400';
      case 'missing_key': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'configured': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'missing_key': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getThreatLevelColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Gerçek Zamanlı Haber Analizi
          </h1>
          <p className="text-gray-400">
            AI destekli haber kaynakları ile canlı füze takibi
          </p>
        </div>
        
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                     disabled:opacity-50 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLoadHistorical}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 
                     disabled:opacity-50 rounded-lg transition-colors"
          >
            <Database className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
            <span>Geçmiş Yükle</span>
          </motion.button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Globe className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Sistem Durumu</h3>
          </div>
          
          {status && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Mod:</span>
                <span className={`font-medium ${status.realTimeEnabled ? 'text-green-400' : 'text-yellow-400'}`}>
                  {status.realTimeEnabled ? 'Gerçek Zamanlı' : 'Simülasyon'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Toplam Füze:</span>
                <span className="text-white font-medium">{status.totalMissiles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Son 24 Saat:</span>
                <span className="text-white font-medium">{status.recentMissiles}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* API Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Settings className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">API Kaynakları</h3>
          </div>
          
          <div className="space-y-3">
            {sources.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-400">{source.name}</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(source.status)}
                  <span className={`text-sm ${getStatusColor(source.status)}`}>
                    {source.status === 'configured' ? 'Aktif' : 'Eksik'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">İstatistikler</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Son Güncelleme:</span>
              <span className="text-white text-sm">
                {status?.lastUpdate ? new Date(status.lastUpdate).toLocaleTimeString('tr-TR') : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Veri Kaynağı:</span>
              <span className="text-green-400 font-medium">Haber API'leri</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">AI Analizi:</span>
              <span className="text-blue-400 font-medium">OpenAI GPT</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Missiles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <Clock className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Son Füze Olayları</h3>
        </div>
        
        <div className="space-y-4">
          {recentMissiles.length > 0 ? (
            recentMissiles.map((missile) => (
              <div key={missile.id} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded text-xs border ${getThreatLevelColor(missile.threatLevel)}`}>
                      {missile.threatLevel?.toUpperCase()}
                    </span>
                    <span className="text-white font-medium">{missile.type}</span>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {new Date(missile.timestamp).toLocaleString('tr-TR')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    {missile.origin?.country} ({missile.origin?.city}) → {missile.target?.country} ({missile.target?.city})
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    missile.status === 'impact' ? 'bg-red-500/20 text-red-400' :
                    missile.status === 'intercepted' ? 'bg-green-500/20 text-green-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {missile.status}
                  </span>
                </div>
                
                {missile.metadata?.description && (
                  <p className="text-gray-400 text-sm mt-2">{missile.metadata.description}</p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Globe className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Henüz gerçek veri bulunamadı</p>
              <p className="text-gray-500 text-sm">API anahtarlarını kontrol edin</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RealTimeNews;
