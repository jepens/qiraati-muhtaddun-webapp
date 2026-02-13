import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { AuthProvider } from '@/providers/auth-provider';
import { ActivitiesProvider } from '@/providers/activities-provider';
import { GalleryProvider } from '@/providers/gallery-provider';
import { SmartReaderProvider } from '@/providers/SmartReaderContext';
import LoadingFallback from '@/components/LoadingFallback';

// Lazy load pages
const Homepage = React.lazy(() => import('@/pages/Homepage'));
const Qiraati = React.lazy(() => import('@/pages/Qiraati'));
const SurahDetail = React.lazy(() => import('@/pages/SurahDetail'));
const JadwalSholat = React.lazy(() => import('@/pages/JadwalSholat'));
const Kegiatan = React.lazy(() => import('@/pages/Kegiatan'));
const Galeri = React.lazy(() => import('@/pages/Galeri'));
const TentangKami = React.lazy(() => import('@/pages/TentangKami'));
const GameHafalan = React.lazy(() => import('@/pages/GameHafalan'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));
const Login = React.lazy(() => import('@/pages/Login'));
const Dashboard = React.lazy(() => import('@/pages/admin/Dashboard'));
const Doa = React.lazy(() => import('@/pages/Doa'));
const DoaDetail = React.lazy(() => import('@/pages/DoaDetail'));
const AIChat = React.lazy(() => import('@/pages/AIChat'));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <ActivitiesProvider>
            <GalleryProvider>
              <SmartReaderProvider>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route element={<Layout />}>
                      <Route path="/" element={<Homepage />} />
                      <Route path="/qiraati" element={<Qiraati />} />
                      <Route path="/qiraati/surat/:id" element={<SurahDetail />} />
                      <Route path="/game-hafalan" element={<GameHafalan />} />
                      <Route path="/jadwal-sholat" element={<JadwalSholat />} />
                      <Route path="/kegiatan" element={<Kegiatan />} />
                      <Route path="/galeri" element={<Galeri />} />
                      <Route path="/tentang-kami" element={<TentangKami />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/doa" element={<Doa />} />
                      <Route path="/doa/:id" element={<DoaDetail />} />
                      <Route path="/ai-chat" element={<AIChat />} />
                      <Route
                        path="/admin/*"
                        element={
                          <PrivateRoute>
                            <Dashboard />
                          </PrivateRoute>
                        }
                      />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Routes>
                </Suspense>
                <Toaster />
              </SmartReaderProvider>
            </GalleryProvider>
          </ActivitiesProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
