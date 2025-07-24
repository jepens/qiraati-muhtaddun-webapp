-- Create facilities table
CREATE TABLE IF NOT EXISTS facilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_facilities_updated_at
    BEFORE UPDATE ON facilities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
INSERT INTO facilities (name, description, icon_name) VALUES
    ('Ruang Sholat', 'Kapasitas 500 jamaah dengan AC dan sound system', 'users'),
    ('Perpustakaan', 'Koleksi buku-buku Islam dan Al-Quran', 'book'),
    ('Ruang Kajian', 'Tempat pengajian dan diskusi keislaman', 'clock'); 