import React from 'react';
import { HelpCircle, Settings } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-[#E5E5EA] sticky top-0 z-10 dark:bg-gray-900/80 dark:border-gray-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-md flex items-center justify-center mr-3">
            <img src="/psychology.svg" alt="心理咨询" className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-semibold text-[#1D1D1F] dark:text-white">心理咨询助手</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <HelpCircle className="h-5 w-5 text-[#86868B] dark:text-[#A1A1A6]" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <Settings className="h-5 w-5 text-[#86868B] dark:text-[#A1A1A6]" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;