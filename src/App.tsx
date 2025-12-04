import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { AuthProvider } from '@/providers/AuthProvider';
import { ActivitiesProvider } from '@/hooks/useActivities';
import { GalleryProvider } from '@/hooks/useGallery';

// Lazy load pages for code splitting
const Homepage = lazy(() => import('@/pages/Homepage'));
const Qiraati = lazy(() => import('@/pages/Qiraati'));
const SurahDetail = lazy(() => import('@/pages/SurahDetail'));
const JadwalSholat = lazy(() => import('@/pages/JadwalSholat'));
const Kegiatan = lazy(() => import('@/pages/Kegiatan'));
const Galeri = lazy(() => import('@/pages/Galeri'));
const TentangKami = lazy(() => import('@/pages/TentangKami'));
const GameHafalan = lazy(() => import('@/pages/GameHafalan'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));

function App() {
  return (
    <Router>
      <AuthProvider>
        <ActivitiesProvider>
          <GalleryProvider>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            }>
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
          </GalleryProvider>
        </ActivitiesProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
