import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import AlertPanel from '../Alerts/AlertPanel';
import ConnectionStatus from '../Status/ConnectionStatus';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main content area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'ml-64' : 'ml-16'
      }`}>
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Main content */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
        
        {/* Connection Status */}
        <ConnectionStatus />
      </div>
      
      {/* Alert Panel */}
      <AlertPanel />
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
