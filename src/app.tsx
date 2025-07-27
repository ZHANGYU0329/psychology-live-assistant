import React, { useState } from 'react';
import { ThemeProvider } from './components/theme-provider';
import { HistoryProvider } from './contexts/history-context';
import Layout from './layout';
import ConsultantDashboard from './components/consultant-dashboard';
import { ApiTest } from './components/api-test';
import { HistoryPage } from './components/history-page';

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'api-test' | 'history'>('dashboard');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'api-test':
        return <ApiTest />;
      case 'history':
        return <HistoryPage />;
      default:
        return <ConsultantDashboard />;
    }
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="psychology-theme">
      <HistoryProvider>
        <Layout>
          <div className="container mx-auto px-4 py-4">
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setCurrentPage('dashboard')}
                className={`px-4 py-2 rounded transition-colors ${
                  currentPage === 'dashboard' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                心理咨询
              </button>
              <button 
                onClick={() => setCurrentPage('api-test')}
                className={`px-4 py-2 rounded transition-colors ${
                  currentPage === 'api-test' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                API测试
              </button>
              <button 
                onClick={() => setCurrentPage('history')}
                className={`px-4 py-2 rounded transition-colors ${
                  currentPage === 'history' 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                历史记录
              </button>
            </div>
            
            {renderCurrentPage()}
          </div>
        </Layout>
      </HistoryProvider>
    </ThemeProvider>
  );
}

export default App;