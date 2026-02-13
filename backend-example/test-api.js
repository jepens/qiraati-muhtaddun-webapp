const fetch = require('node-fetch');

async function testEndpoints() {
    console.log('🧪 Testing Backend API Endpoints...\n');

    const BASE_URL = 'http://localhost:3001/api';

    try {
        // Test 1: Health Check
        console.log('1. Testing Health Check...');
        const health = await fetch('http://localhost:3001/health');
        const healthData = await health.json();
        if (healthData.status === 'OK') {
            console.log('✅ Health Check Passed');
        } else {
            console.error('❌ Health Check Failed:', healthData);
        }

        // Test 2: Get All Surahs
        console.log('\n2. Testing Get All Surahs...');
        const surahs = await fetch(`${BASE_URL}/quran/surat`);
        const surahsData = await surahs.json();

        if (surahsData.code === 200 && Array.isArray(surahsData.data) && surahsData.data.length > 0) {
            console.log(`✅ Get All Surahs Passed. Found ${surahsData.data.length} surahs.`);
            console.log(`   Sample: ${surahsData.data[0].namaLatin}`);
        } else {
            console.error('❌ Get All Surahs Failed:', surahsData);
        }

        // Test 3: Get Specific Surah (Al-Fatihah)
        console.log('\n3. Testing Get Surah Al-Fatihah...');
        const surah = await fetch(`${BASE_URL}/quran/surat/1`);
        const surahData = await surah.json();

        if (surahData.code === 200 && surahData.data && surahData.data.nomor === 1) {
            console.log(`✅ Get Surah Detail Passed: ${surahData.data.namaLatin}`);
            console.log(`   Ayat Count: ${surahData.data.ayat ? surahData.data.ayat.length : 'N/A'}`);
        } else {
            console.error('❌ Get Surah Detail Failed:', surahData);
        }

    } catch (error) {
        console.error('\n❌ Error running tests:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Hint: Is the backend server running? (npm run dev)');
        }
    }
}

async function testPrayerTimes() {
    console.log('\n4. Testing Prayer Times (Jakarta)...');
    const BASE_URL = 'http://localhost:3001/api';
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');

    try {
        const prayer = await fetch(`${BASE_URL}/prayer-times/${year}/${month}/${date}`);
        const prayerData = await prayer.json();

        if (prayerData.status && prayerData.data && prayerData.data.jadwal) {
            console.log(`✅ Get Prayer Times Passed for ${prayerData.data.jadwal.tanggal}`);
            console.log(`   Maghrib: ${prayerData.data.jadwal.maghrib}`);
        } else {
            console.error('❌ Get Prayer Times Failed:', prayerData);
        }
    } catch (error) {
        console.error('❌ Error fetching prayer times:', error.message);
    }
}

async function testPrayerTimesEnhanced() {
    console.log('\n5. Testing Prayer Times (Enhanced)...');
    const BASE_URL = 'http://localhost:3001/api';
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');

    try {
        console.log('   Testing specific date endpoint...');
        const prayer = await fetch(`${BASE_URL}/prayer-times/${year}/${month}/${date}`);
        const prayerData = await prayer.json();

        if (prayerData.status && prayerData.data && prayerData.data.jadwal) {
            console.log(`✅ Get Prayer Times (Specific) Passed for ${prayerData.data.jadwal.tanggal}`);
        } else {
            console.error('❌ Get Prayer Times (Specific) Failed:', prayerData);
        }

        console.log('   Testing root endpoint (Today)...');
        const rootPrayer = await fetch(`${BASE_URL}/prayer-times`);
        const rootData = await rootPrayer.json();

        if (rootData.status && rootData.data && rootData.data.jadwal) {
            console.log(`✅ Get Prayer Times (Root) Passed for ${rootData.data.jadwal.tanggal}`);
        } else {
            console.error('❌ Get Prayer Times (Root) Failed:', rootData);
        }

        console.log('   Testing Provinces endpoint...');
        const provResponse = await fetch(`${BASE_URL}/prayer-times/provinces`);
        if (!provResponse.ok) throw new Error(`Provinces API failed: ${provResponse.status}`);
        const provData = await provResponse.json();

        // API returns { code: 200, message: "...", data: ["Aceh", "Bali", ...] }
        if (provData.data && Array.isArray(provData.data) && provData.data.length > 0) {
            console.log(`✅ Get Provinces Passed. Found ${provData.data.length} provinces.`);
            console.log(`   Sample: ${provData.data[0]}`);

            console.log('   Testing Cities endpoint...');
            const firstProv = provData.data[0];
            const cityResponse = await fetch(`${BASE_URL}/prayer-times/cities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provinsi: firstProv })
            });
            const cityData = await cityResponse.json();

            // Expected city response similar to province: { code: 200, data: ["..."] }
            if (cityData.data && Array.isArray(cityData.data)) {
                console.log(`✅ Get Cities Passed. Found ${cityData.data.length} cities in ${firstProv}.`);
                console.log(`   Sample: ${cityData.data[0]}`);
            } else {
                console.error(`⚠️ Get Cities response format unexpected:`, JSON.stringify(cityData).substring(0, 100));
            }

        } else {
            console.error('❌ Get Provinces returned invalid data behavior:', JSON.stringify(provData).substring(0, 100));
        }

    } catch (error) {
        console.error('❌ Error in Prayer Times tests:', error.message);
    }
}

// Modify the end of the file to call both
testEndpoints()
    .then(() => testPrayerTimes())
    .then(() => testPrayerTimesEnhanced());
