# Cara Menambahkan Google Maps di Halaman Tentang Kami

## Langkah-langkah Setup Google Maps Embed

### 1. Dapatkan URL Embed dari Google Maps

1. Buka [Google Maps](https://maps.google.com)
2. Cari lokasi Masjid Al-Muhtaddun
3. Klik tombol **"Share"** (Bagikan)
4. Pilih tab **"Embed a map"** (Sematkan peta)
5. Copy URL yang muncul (format: `https://www.google.com/maps/embed?pb=...`)

### 2. Tambahkan ke Admin Panel

1. Login ke admin panel: `/admin/tentang-kami`
2. Scroll ke bagian **"Google Maps Embed URL"**
3. Paste URL embed yang sudah di-copy
4. Klik **"Simpan Perubahan"**

### 3. Hasil

- Peta akan muncul di halaman admin sebagai preview
- Peta juga akan muncul di halaman publik "Tentang Kami"
- Peta responsive dan dapat di-zoom/di-pan

## Fitur yang Ditambahkan

### Admin Panel (`/admin/tentang-kami`)
- ✅ Input field untuk Google Maps embed URL
- ✅ Preview peta langsung di admin panel
- ✅ Petunjuk cara mendapatkan URL embed

### Halaman Publik (`/tentang-kami`)
- ✅ Tampilan peta di bagian "Lokasi Masjid"
- ✅ Peta responsive (mobile-friendly)
- ✅ Loading lazy untuk performa optimal

## Database Migration

File migration sudah dibuat: `supabase/migrations/20240724000000_add_google_maps_embed.sql`

Jalankan migration di Supabase dashboard jika belum otomatis ter-apply.

## Contoh URL Embed

```
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.1234567890!2d106.1234567890!3d-6.1234567890!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMDcnMjQuMCJTIDEwNsKwMDcnMjQuMCJF!5e0!3m2!1sen!2sid!4v1234567890
``` 