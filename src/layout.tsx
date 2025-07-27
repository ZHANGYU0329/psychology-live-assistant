import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F8F5FF] dark:bg-[#1C1C1E]">
      {children}
    </div>
  );
};

export default Layout;