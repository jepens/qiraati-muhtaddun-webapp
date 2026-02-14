import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './ui/navbar';
import { Footer } from './ui/footer';
import { useSmartReader } from '@/providers/SmartReaderHooks';

const Layout = () => {
  const { isSmartMode } = useSmartReader();

  return (
    <div className={`flex flex-col ${isSmartMode ? '' : 'min-h-screen'}`}>
      {!isSmartMode && <Navbar />}
      <main className={isSmartMode ? '' : 'flex-grow'}>
        <Outlet />
      </main>
      {!isSmartMode && <Footer />}
    </div>
  );
};

export default Layout;
