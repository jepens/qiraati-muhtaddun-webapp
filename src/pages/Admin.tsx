import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

const Admin: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <AdminDashboard /> : <AdminLogin />;
};

export default Admin; 