import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Homepage from "./pages/Homepage";
import Qiraati from "./pages/Qiraati";
import SurahDetail from "./pages/SurahDetail";
import JadwalSholat from "./pages/JadwalSholat";
import TentangKami from "./pages/TentangKami";
import Kegiatan from "./pages/Kegiatan";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/qiraati" element={<Qiraati />} />
            <Route path="/qiraati/surat/:id" element={<SurahDetail />} />
            <Route path="/jadwal-sholat" element={<JadwalSholat />} />
            <Route path="/tentang-kami" element={<TentangKami />} />
            <Route path="/kegiatan" element={<Kegiatan />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
