import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Clock,
  MapPin,
  Activity,
  AlertTriangle,
  Download
} from 'lucide-react';
import { useMissile } from '../contexts/MissileContext';

const Analytics = () => {
  const { stats, fetchMissileStats } = useMissile();
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('launches');

  useEffect(() => {
    fetchMissileStats();
  }, [fetchMissileStats, timeRange]);

  const timeRanges = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ];

  const metrics = [
    { value: 'launches', label: 'Launches', icon: Target },
    { value: 'threats', label: 'Threat Levels', icon: AlertTriangle },
    { value: 'countries', label: 'By Country', icon: MapPin },
    { value: 'types', label: 'Missile Types', icon: Activity }
  ];

  const summaryCards = [
    {
      title: 'Total Missiles',
      value: stats.total || 0,
      change: '+12%',
      changeType: 'increase',
      icon: Target,
      color: 'blue'
    },
    {
      title: 'Active Threats',
      value: stats.active || 0,
      change: '-5%',
      changeType: 'decrease',
      icon: AlertTriangle,
      color: 'red'
    },
    {
      title: 'Intercepted',
      value: stats.byStatus?.intercepted || 0,
      change: '+8%',
      changeType: 'increase',
      icon: Activity,
      color: 'green'
    },
    {
      title: 'Avg Response Time',
      value: '2.3s',
      change: '-0.5s',
      changeType: 'decrease',
      icon: Clock,
      color: 'yellow'
    }
  ];

  const getCardColors = (color) => {
    const colors = {
      blue: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
      red: 'bg-red-500/10 border-red-500/20 text-red-500',
      green: 'bg-green-500/10 border-green-500/20 text-green-500',
      yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
    };
    return colors[color] || colors.blue;
  };

  const renderChart = () => {
    switch (selectedMetric) {
      case 'launches':
        return <LaunchesChart stats={stats} timeRange={timeRange} />;
      case 'threats':
        return <ThreatLevelsChart stats={stats} />;
      case 'countries':
        return <CountriesChart stats={stats} />;
      case 'types':
        return <TypesChart stats={stats} />;
      default:
        return <LaunchesChart stats={stats} timeRange={timeRange} />;
    }
  };

  return (
    <div className="h-full bg-gray-900 text-white overflow-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-gray-400">Comprehensive missile tracking analytics</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time range selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            
            {/* Export button */}
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-lg border ${getCardColors(card.color)}`}
            >
              <div className="flex items-center justify-between mb-4">
                <card.icon className="w-8 h-8" />
                <span className={`text-sm px-2 py-1 rounded ${
                  card.changeType === 'increase' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {card.change}
                </span>
              </div>
              
              <div>
                <h3 className="text-sm text-gray-400 mb-1">{card.title}</h3>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chart */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {metrics.find(m => m.value === selectedMetric)?.label} Analysis
                </h2>
                
                {/* Metric selector */}
                <div className="flex space-x-2">
                  {metrics.map(metric => (
                    <button
                      key={metric.value}
                      onClick={() => setSelectedMetric(metric.value)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        selectedMetric === metric.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <metric.icon className="w-4 h-4" />
                      <span className="text-sm">{metric.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {renderChart()}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Top Countries */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Top Origins</h3>
              <div className="space-y-3">
                {Object.entries(stats.byCountry || {}).slice(0, 5).map(([country, count]) => (
                  <div key={country} className="flex items-center justify-between">
                    <span className="text-gray-300">{country}</span>
                    <span className="text-white font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Status Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(stats.byStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        status === 'launched' ? 'bg-red-500' :
                        status === 'in-flight' ? 'bg-yellow-500' :
                        status === 'intercepted' ? 'bg-green-500' :
                        'bg-gray-500'
                      }`} />
                      <span className="text-gray-300 capitalize">{status}</span>
                    </div>
                    <span className="text-white font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Trends */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Trends</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Launch Frequency</span>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-400">+15%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Threat Level</span>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-red-500" />
                    <span className="text-red-400">+8%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Response Time</span>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-green-500 transform rotate-180" />
                    <span className="text-green-400">-12%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Chart Components
const LaunchesChart = ({ stats, timeRange }) => (
  <div className="h-64 flex items-center justify-center text-gray-400">
    <div className="text-center">
      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>Launch timeline chart would be rendered here</p>
      <p className="text-sm">Total launches: {stats.total || 0}</p>
    </div>
  </div>
);

const ThreatLevelsChart = ({ stats }) => (
  <div className="h-64 flex items-center justify-center text-gray-400">
    <div className="text-center">
      <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>Threat levels distribution chart</p>
      <div className="mt-4 space-y-2">
        {Object.entries(stats.byThreatLevel || {}).map(([level, count]) => (
          <div key={level} className="flex justify-between">
            <span className="capitalize">{level}:</span>
            <span>{count}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CountriesChart = ({ stats }) => (
  <div className="h-64 flex items-center justify-center text-gray-400">
    <div className="text-center">
      <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>Geographic distribution chart</p>
      <div className="mt-4 space-y-2">
        {Object.entries(stats.byCountry || {}).slice(0, 3).map(([country, count]) => (
          <div key={country} className="flex justify-between">
            <span>{country}:</span>
            <span>{count}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TypesChart = ({ stats }) => (
  <div className="h-64 flex items-center justify-center text-gray-400">
    <div className="text-center">
      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>Missile types breakdown chart</p>
      <div className="mt-4 space-y-2">
        {Object.entries(stats.byType || {}).slice(0, 3).map(([type, count]) => (
          <div key={type} className="flex justify-between">
            <span>{type}:</span>
            <span>{count}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Analytics;
