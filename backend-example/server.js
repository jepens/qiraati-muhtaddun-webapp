const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all surahs from EQuran.id API
app.get('/api/quran/surat', async (req, res) => {
  try {
    const response = await fetch('https://equran.id/api/v2/surat');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching surahs:', error);
    res.status(500).json({ error: 'Failed to fetch surahs' });
  }
});

// Get specific surah details from EQuran.id API
app.get('/api/quran/surat/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(`https://equran.id/api/v2/surat/${id}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching surah details:', error);
    res.status(500).json({ error: 'Failed to fetch surah details' });
  }
});

// Get prayer times from MyQuran.com API
app.get('/api/prayer-times/:year/:month/:date', async (req, res) => {
  try {
    const { year, month, date } = req.params;
    const lokasi = '1301'; // Jakarta
    
    const response = await fetch(
      `https://api.myquran.com/v2/sholat/jadwal/${lokasi}/${year}/${month}/${date}`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    res.status(500).json({ error: 'Failed to fetch prayer times' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Masjid Al-Muhtaddun API Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🕌 Masjid Al-Muhtaddun API Server running on port ${PORT}`);
  console.log(`📚 Qiraati API endpoints available at http://localhost:${PORT}/api/quran/`);
  console.log(`🕐 Prayer times API available at http://localhost:${PORT}/api/prayer-times/`);
});

module.exports = app;