-- Create about_content table
CREATE TABLE IF NOT EXISTS about_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    history_text TEXT NOT NULL,
    vision_text TEXT NOT NULL,
    mission_items TEXT[] NOT NULL DEFAULT '{}',
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    office_hours TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_about_content_updated_at
    BEFORE UPDATE ON about_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
INSERT INTO about_content (
    history_text,
    vision_text,
    mission_items,
    address,
    phone,
    email,
    office_hours
) VALUES (
    'Masjid Al-Muhtaddun didirikan pada tahun 1995 oleh sekelompok umat Muslim yang memiliki visi untuk menciptakan tempat ibadah yang tidak hanya berfungsi sebagai tempat sholat, tetapi juga sebagai pusat pendidikan dan dakwah Islam.',
    'Menjadi masjid yang memakmur dalam menjalankan fungsi ibadah, pendidikan, dan dakwah untuk membentuk umat yang bertakwa, berilmu, dan berakhlaq mulia.',
    ARRAY[
        'Menyelenggarakan ibadah yang khusyuk dan berjamaah',
        'Memberikan pendidikan agama untuk segala usia',
        'Melaksanakan dakwah Islam dengan bijaksana',
        'Memberdayakan umat melalui kegiatan sosial',
        'Mempererat ukhuwah islamiyah'
    ],
    'Jl. Masjid Al-Muhtaddun No. 123
Jakarta Selatan 12345
Indonesia',
    '(021) 1234-5678
+62 812-3456-7890',
    'info@almuhtaddun.org
takmir@almuhtaddun.org',
    '24 jam (untuk ibadah)
Kantor: 08.00 - 17.00 WIB'
); 