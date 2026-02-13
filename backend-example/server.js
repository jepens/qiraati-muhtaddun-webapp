const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { EQuran } = require('equran');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers));
  next();
});

// API Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all surahs from EQuran.id API
app.get('/api/quran/surat', async (req, res) => {
  try {
    const quran = new EQuran();
    const surahs = await quran.getAllSurat();
    // Maintain strict compatibility with existing frontend expectations
    // Frontend expects { code: 200, data: [...] }
    res.json({ code: 200, message: "Success fetching surahs", data: surahs });
  } catch (error) {
    console.error('Error fetching surahs:', error);
    res.status(500).json({ error: 'Failed to fetch surahs' });
  }
});

// Get specific surah details from EQuran.id API
app.get('/api/quran/surat/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const quran = new EQuran();
    const surah = await quran.getSurat(parseInt(id));
    // Maintain strict compatibility with existing frontend expectations
    // Frontend expects { code: 200, data: { ... } }
    res.json({ code: 200, message: "Success fetching surah detail", data: surah });
  } catch (error) {
    console.error('Error fetching surah details:', error);
    res.status(500).json({ error: 'Failed to fetch surah details' });
  }
});

// In-memory cache for prayer times
const prayerTimesCache = new Map();

// Get prayer times for specific date
app.get('/api/prayer-times/:year/:month/:date', async (req, res) => {
  try {
    const { year, month, date } = req.params;
    await handlePrayerTimesRequest(req, res, year, month, date);
  } catch (error) {
    console.error('Error in prayer times route:', error);
    res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
});

// Root prayer times endpoint - Defaults to today, Jakarta
app.get('/api/prayer-times', async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');

    // Allow overriding location via query params in future, current default is Jakarta
    await handlePrayerTimesRequest(req, res, year, month, date);
  } catch (error) {
    console.error('Error in root prayer times route:', error);
    res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
});

// Get list of provinces
app.get('/api/prayer-times/provinces', async (req, res) => {
  try {
    const response = await fetch('https://equran.id/api/v2/shalat/provinsi');

    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error fetching provinces:', error);
    res.status(500).json({ status: false, error: 'Failed to fetch provinces' });
  }
});

// Get list of cities (requires provinsi in body)
app.post('/api/prayer-times/cities', async (req, res) => {
  try {
    const { provinsi } = req.body;

    if (!provinsi) {
      return res.status(400).json({ status: false, error: 'Missing provinsi in body' });
    }

    const response = await fetch('https://equran.id/api/v2/shalat/kabkota', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provinsi })
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ status: false, error: 'Failed to fetch cities' });
  }
});

// Doa API Endpoints

// Get all Doa (supports keyword filtering)
app.get('/api/doa', async (req, res) => {
  try {
    const { keyword } = req.query;
    const response = await fetch('https://equran.id/api/doa');

    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    // API returns raw array of doa objects or { code: 200, data: [...] } ?
    // Based on docs: GET https://equran.id/api/doa returns array of objects directly? NO.
    // Docs say: GET /api/doa
    // Let's check the format carefully or assume safely.
    // Usually it is array of { id, judul, source, ... }

    // We will pass the data through.
    // If the API returns raw array, we wrap it? Or just send it.
    // Let's assume we want to proxy it directly for now but handle errors.

    const result = await response.json();

    // If client requested keyword filtering and API doesn't support it well via param (docs unclear on search param),
    // we can filter here. The user request showed a search bar.
    // Docs mentioned 'grup' and 'tag' but not 'keyword'.
    // We'll implement simple client-side search on the full list if needed, 
    // but better to let frontend handle filtering if the list isn't huge (227 items per screenshot).
    // Let's just return the list.

    res.json(result);
  } catch (error) {
    console.error('Error fetching doa list:', error);
    res.status(500).json({ status: false, error: 'Failed to fetch doa list' });
  }
});

// Get Doa Detail
app.get('/api/doa/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(`https://equran.id/api/doa/${id}`);

    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error fetching doa detail:', error);
    res.status(500).json({ status: false, error: 'Failed to fetch doa detail' });
  }
});

// Helper function to handle prayer times logic
async function handlePrayerTimesRequest(req, res, year, month, date) {
  const cacheKey = `${year}-${month}`; // Cache by month since API returns monthly data

  // Check cache first
  let monthlyData = prayerTimesCache.get(cacheKey);

  if (!monthlyData) {
    // Fetch from EQuran.id API
    const response = await fetch('https://equran.id/api/v2/shalat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provinsi: 'DKI Jakarta',
        kabkota: 'Kota Jakarta',
        bulan: parseInt(month),
        tahun: parseInt(year)
      })
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const result = await response.json();

    if (result.code === 200 && result.data && result.data.jadwal) {
      monthlyData = result.data;
      // Cache for 24 hours
      prayerTimesCache.set(cacheKey, monthlyData);
      // Clear cache after 24 hours (simple expiry)
      setTimeout(() => prayerTimesCache.delete(cacheKey), 24 * 60 * 60 * 1000);
    } else {
      throw new Error('Invalid data format from EQuran API');
    }
  }

  // Find specific date in monthly data
  // API Date format: "YYYY-MM-DD"
  // Note: API V2 returns "tanggal_lengkap": "YYYY-MM-DD", while "tanggal" is just the day number (int)
  const targetDate = `${year}-${month}-${date}`;

  const dailySchedule = monthlyData.jadwal.find(d =>
    d.tanggal === targetDate ||
    d.date === targetDate ||
    d.tanggal_lengkap === targetDate
  );

  if (dailySchedule) {
    // Format response to match frontend expectations
    // Frontend expects: { status: true, data: { jadwal: { ... } } }
    const responseData = {
      status: true,
      data: {
        id: "1301", // Mock ID for compatibility
        lokasi: "DKI Jakarta",
        daerah: "Kota Jakarta",
        jadwal: {
          tanggal: dailySchedule.tanggal_lengkap || dailySchedule.date, // Should be YYYY-MM-DD
          imsak: dailySchedule.imsak,
          subuh: dailySchedule.subuh,
          terbit: dailySchedule.terbit,
          dhuha: dailySchedule.dhuha,
          dzuhur: dailySchedule.dzuhur,
          ashar: dailySchedule.ashar,
          maghrib: dailySchedule.maghrib,
          isya: dailySchedule.isya,
          date: dailySchedule.date // redundancy for safety
        }
      }
    };
    res.json(responseData);
  } else {
    res.status(404).json({ status: false, error: 'Date not found in schedule' });
  }
}

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