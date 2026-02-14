Dokumentasi ini disusun khusus untuk diimplementasikan oleh **AI Engineer** atau **Web Developer**. Fokus utamanya adalah efisiensi komputasi pada *browser* seluler dan kenyamanan *User Experience* (UX) untuk durasi membaca yang lama.

---

# Technical Documentation: Vertical Scroll Gesture via Nose-Tip Tracking

## 1. Pendahuluan

Dokumen ini menjelaskan spesifikasi teknis untuk mengimplementasikan navigasi vertikal (*scrolling*) tanpa sentuhan pada aplikasi web Al-Quran. Sistem ini menggunakan **MediaPipe Face Landmarker** untuk melacak pergerakan ujung hidung sebagai input kendali.

### Karakteristik Utama:

* **Target Device:** Smartphone (Handheld).
* **Jarak Fokus:** 10 – 20 cm (Ultra-close range).
* **Metode:** Relative Displacement dengan *Dynamic Neutral Zone*.

---

## 2. Arsitektur Teknis

Sistem bekerja dengan memetakan koordinat  dari ujung hidung ke dalam kecepatan gulir (*scroll velocity*).

### Komponen Utama:

1. **MediaPipe Face Landmarker:** Mengambil 478 titik wajah 3D.
2. **Point of Interest (POI):** Landmark ID **4** (Nose Tip).
3. **Coordinate Stabilizer:** Menggunakan *Exponential Moving Average* (EMA) untuk meredam *jitter* akibat tangan yang memegang HP.

---

## 3. Logika Algoritma (Core Logic)

### A. Kalibrasi Dinamis

Karena HP dipegang tangan, posisi "tengah" bersifat dinamis. Sistem harus mengambil sampel posisi hidung saat pengguna pertama kali membuka halaman atau menekan tombol "Calibrate".

* : Koordinat Y hidung saat posisi netral.

### B. Perhitungan Deadzone & Velocity

Agar layar tidak terus bergerak saat pengguna hanya diam membaca, kita menerapkan **Deadzone**.

**Keterangan:**

* : Posisi hidung saat ini.
* : *Threshold* Deadzone (disarankan 0.05 - 0.1 dalam koordinat ternormalisasi).
* : *Sensitivity Factor* (konstanta pengali untuk kecepatan scroll).

---

## 4. Strategi Implementasi (Software Engineering)

### 1. Smoothing (Anti-Jitter)

Gunakan rumus **LERP (Linear Interpolation)** untuk memastikan pergerakan scroll tidak patah-patah:

```javascript
// alpha 0.1 - 0.2 untuk kelembutan maksimal
smoothedY = (alpha * currentY) + ((1 - alpha) * lastY);

```

### 2. Penanganan Jarak Dekat (Edge Cases)

Pada jarak 10cm, Face Mesh mungkin sering *lost*.

* **Optimization:** Atur `minFaceDetectionConfidence: 0.5` dan `minFacePresenceConfidence: 0.5`.
* **Fallback:** Jika `results.faceLandmarks` kosong selama > 1 detik, hentikan semua proses scroll (Auto-stop) untuk mencegah layar "lari".

---

## 5. Referensi Snippet Kode (JavaScript/TypeScript)

```javascript
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let yRef = null; // Titik tengah kalibrasi
const DEADZONE = 0.08; 
const SENSITIVITY = 50; 

async function onResults(results) {
  if (results.faceLandmarks && results.faceLandmarks[0]) {
    const noseTip = results.faceLandmarks[0][4]; // Landmark ID 4
    const currentY = noseTip.y;

    if (yRef === null) yRef = currentY; // Auto-calibrate pertama kali

    const deltaY = currentY - yRef;

    if (Math.abs(deltaY) > DEADZONE) {
      const direction = deltaY > 0 ? 1 : -1;
      const speed = (Math.abs(deltaY) - DEADZONE) * SENSITIVITY;
      
      window.scrollBy({
        top: direction * speed,
        behavior: 'auto' // 'smooth' akan menyebabkan delay jika frame rate tinggi
      });
    }
  }
}

```

---

## 6. Tabel Parameter Konfigurasi (Recommended)

| Parameter | Value | Description |
| --- | --- | --- |
| `Running Mode` | `VIDEO` | Untuk pemrosesan real-time stream. |
| `Max Faces` | `1` | Mengurangi beban CPU browser. |
| `Deadzone` | `0.05 - 0.1` | Area toleransi agar layar diam. |
| `EMA Alpha` | `0.15` | Tingkat kehalusan filter (0.1 = sangat halus, 1 = raw). |
| `Z-Check` | `> 0.7` | Jika  mata terlalu besar, beri peringatan "Terlalu Dekat". |

---

## 7. Rekomendasi UX untuk Developer

1. **Visual Feedback:** Tambahkan titik kecil (pointer) atau bar indikator di pinggir layar yang menunjukkan posisi hidung relatif terhadap *deadzone*.
2. **Toggle Switch:** Berikan tombol mudah untuk menyalakan/mematikan fitur ini agar tidak mengganggu navigasi manual.
3. **Auto-Pause:** Jika mata terdeteksi tertutup (kedip lama) atau wajah hilang, hentikan scroll seketika.

---

