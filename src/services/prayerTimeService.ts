
// Route through proxy to avoid CORS
const BASE_URL = '/equran-api/shalat';

export interface PrayerSchedule {
    tanggal: string;
    tanggal_lengkap: string;
    hari: string;
    imsak: string;
    subuh: string;
    terbit: string;
    dhuha: string;
    dzuhur: string;
    ashar: string;
    maghrib: string;
    isya: string;
}

export interface MonthlyScheduleData {
    provinsi: string;
    kabkota: string;
    bulan: string;
    tahun: string;
    bulan_nama: string;
    jadwal: PrayerSchedule[];
}

export const getProvinces = async (): Promise<string[]> => {
    try {
        const response = await fetch(`${BASE_URL}/provinsi`);
        if (!response.ok) throw new Error('Failed to fetch provinces');
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error fetching provinces:', error);
        return [];
    }
};

export const getCities = async (province: string): Promise<string[]> => {
    try {
        const response = await fetch(`${BASE_URL}/kabkota`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ provinsi: province }),
        });
        if (!response.ok) throw new Error('Failed to fetch cities');
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error fetching cities:', error);
        return [];
    }
};

export const getPrayerSchedule = async (
    province: string,
    city: string,
    month?: number,
    year?: number
): Promise<MonthlyScheduleData | null> => {
    try {
        const body = {
            provinsi: province,
            kabkota: city,
            bulan: month,
            tahun: year,
        };

        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) throw new Error('Failed to fetch prayer schedule');
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error fetching prayer schedule:', error);
        return null;
    }
};
