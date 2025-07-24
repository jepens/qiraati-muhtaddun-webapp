# Cara Menambahkan Google Maps di Halaman Tentang Kami

## 🎯 Fitur yang Diperbaiki

Fitur Google Maps embed telah diperbaiki untuk menerima **iframe HTML lengkap** dari Google Maps dan mengekstrak URL secara otomatis.

## 📋 Langkah-langkah Setup Google Maps Embed

### 1. Dapatkan Embed dari Google Maps

1. Buka [Google Maps](https://maps.google.com)
2. Cari lokasi **"Masjid Al-Muhtadun"**
3. Klik tombol **"Share"** (Bagikan)
4. Pilih tab **"Embed a map"** (Sematkan peta)
5. **Copy seluruh iframe HTML** yang muncul

### 2. Tambahkan ke Admin Panel

1. Login ke admin panel: `/admin/tentang-kami`
2. Scroll ke bagian **"Google Maps Embed"**
3. **Paste iframe HTML lengkap** yang sudah di-copy
4. Sistem akan otomatis mengekstrak URL-nya
5. Klik **"Simpan Perubahan"**

### 3. Hasil

- ✅ Peta akan muncul di halaman admin sebagai preview
- ✅ Peta juga akan muncul di halaman publik "Tentang Kami"
- ✅ Peta responsive dan dapat di-zoom/di-pan
- ✅ Error handling jika URL tidak valid

## 🔧 Fitur Baru yang Ditambahkan

### Admin Panel (`/admin/tentang-kami`)
- ✅ **Textarea** untuk paste iframe HTML lengkap
- ✅ **Auto-extract URL** dari iframe HTML
- ✅ **Preview peta** langsung di admin panel
- ✅ **Validasi URL** (harus dimulai dengan "https://")
- ✅ **Petunjuk step-by-step** yang jelas
- ✅ **Error handling** untuk URL tidak valid

### Halaman Publik (`/tentang-kami`)
- ✅ Tampilan peta di bagian "Lokasi Masjid"
- ✅ Peta responsive (mobile-friendly)
- ✅ Loading lazy untuk performa optimal
- ✅ Error handling jika iframe gagal load
- ✅ Petunjuk interaksi untuk pengguna

## 📝 Format Input yang Diterima

### ✅ Format 1: Iframe HTML Lengkap
```html
<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15861.406138127295!2d106.87684175000001!3d-6.34850865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ece8cfd090ef%3A0x6f06a64ae022c8f4!2sMasjid%20Al-Muhtadun!5e0!3m2!1sid!2sid!4v1753354855488!5m2!1sid!2sid" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
```

### ✅ Format 2: URL Embed Langsung
```
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15861.406138127295!2d106.87684175000001!3d-6.34850865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ece8cfd090ef%3A0x6f06a64ae022c8f4!2sMasjid%20Al-Muhtadun!5e0!3m2!1sid!2sid!4v1753354855488!5m2!1sid!2sid
```

## 🛠️ Database Migration

File migration sudah dibuat: `supabase/migrations/20240724000000_add_google_maps_embed.sql`

Jalankan migration di Supabase dashboard jika belum otomatis ter-apply.

## 🎨 Contoh URL Embed untuk Masjid Al-Muhtadun

```
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15861.406138127295!2d106.87684175000001!3d-6.34850865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ece8cfd090ef%3A0x6f06a64ae022c8f4!2sMasjid%20Al-Muhtadun!5e0!3m2!1sid!2sid!4v1753354855488!5m2!1sid!2sid
```

## 🚀 Cara Penggunaan

1. **Copy iframe HTML** dari Google Maps
2. **Paste di admin panel** (field akan otomatis mengekstrak URL)
3. **Simpan perubahan**
4. **Peta akan muncul** di halaman publik

## ⚠️ Troubleshooting

- **Peta tidak muncul:** Pastikan URL dimulai dengan "https://"
- **Preview error:** Periksa apakah iframe HTML valid
- **Peta kosong:** Pastikan lokasi "Masjid Al-Muhtadun" sudah benar di Google Maps 