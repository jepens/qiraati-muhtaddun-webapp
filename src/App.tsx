import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/Layout';
import Homepage from '@/pages/Homepage';
import Qiraati from '@/pages/Qiraati';
import SurahDetail from '@/pages/SurahDetail';
import JadwalSholat from '@/pages/JadwalSholat';
import Kegiatan from '@/pages/Kegiatan';
import Galeri from '@/pages/Galeri';
import TentangKami from '@/pages/TentangKami';
import GameHafalan from '@/pages/GameHafalan';
import NotFound from '@/pages/NotFound';
import Login from '@/pages/Login';
import Dashboard from '@/pages/admin/Dashboard';
import PrivateRoute from '@/components/PrivateRoute';
import { AuthProvider } from '@/providers/AuthProvider';
import { ActivitiesProvider } from '@/hooks/useActivities';
import { GalleryProvider } from '@/hooks/useGallery';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ActivitiesProvider>
          <GalleryProvider>
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
            <Toaster />
          </GalleryProvider>
        </ActivitiesProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
