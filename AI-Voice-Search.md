Dokumentasi ini dirancang untuk tim pengembang (Programmer & AI Engineer) sebagai panduan teknis implementasi fitur **Voice Search** pada aplikasi Al-Quran berbasis Web.

---

# Dokumentasi Teknis: Fitur Voice Search & AI Navigation

**Teknologi:** Web Speech API (Native) + TypeScript + equran.id Vector API
**Bahasa Target:** Bahasa Indonesia (`id-ID`)

---

## 1. Arsitektur Sistem

Sistem ini menggunakan pendekatan *Hybrid*: memanfaatkan kapabilitas browser lokal untuk pengenalan suara (ASR) dan API pihak ketiga untuk pencarian makna (Semantic Search).

---

## 2. Implementasi Web Speech API (ASR)

Karena kita menggunakan TypeScript, tantangan utamanya adalah *type definition* karena `window.SpeechRecognition` masih bersifat eksperimental dan sering membutuhkan prefix `webkit`.

### A. Definisi Tipe (Global Definition)

Tambahkan deklarasi ini di file `global.d.ts` atau di bagian atas komponen agar TypeScript tidak error.

```typescript
interface Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}

```

### B. Konfigurasi Service

Atur parameter utama agar optimal untuk Bahasa Indonesia:

* **Lang:** `id-ID`
* **InterimResults:** `true` (untuk memberikan feedback visual cepat saat user bicara).
* **Continuous:** `false` (berhenti otomatis setelah user selesai bicara satu kalimat).

---

## 3. Komponen Utama (React/Next.js .tsx)

Berikut adalah struktur logika untuk `VoiceSearch.tsx`:

```tsx
import React, { useState, useEffect } from 'react';

const VoiceSearch: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Browser Anda tidak mendukung Voice Search.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);
    };

    recognition.onend = () => {
      setIsListening(false);
      handleFinalIntent(transcript); // Proses teks setelah bicara selesai
    };

    recognition.start();
  };

  const handleFinalIntent = async (query: string) => {
    if (!query) return;

    // Logika AI Engineer: Memisahkan Navigasi vs Pencarian Vektor
    if (query.toLowerCase().includes("buka surat")) {
      // Logic Navigasi: Contoh "Buka surat Al-Baqarah"
      console.log("Navigasi ke surat:", query);
    } else {
      // Kirim ke Vector API equran.id
      executeVectorSearch(query);
    }
  };

  const executeVectorSearch = async (text: string) => {
    try {
      const response = await fetch('https://equran.id/apidev/vector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text })
      });
      const data = await response.json();
      console.log("Hasil Vector Search:", data);
    } catch (err) {
      console.error("Vector API Error:", err);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button 
        onClick={startRecognition}
        className={`p-4 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}
      >
        {isListening ? 'Mendengarkan...' : 'Klik untuk Bicara'}
      </button>
      <p className="mt-4 italic">"{transcript}"</p>
    </div>
  );
};

export default VoiceSearch;

```

---

## 4. Tugas untuk AI Engineer (Intent Classification)

Untuk meningkatkan akurasi, AI Engineer perlu mengolah string hasil ASR sebelum dikirim ke API:

1. **Stopword Removal (Opsional):** Jika user berkata *"Tolong carikan ayat tentang..."*, sistem harus bisa membersihkan kata *"Tolong carikan"* agar pencarian vektor lebih fokus pada *"ayat tentang..."*.
2. **Entity Extraction:** Mengidentifikasi nama surat dan nomor ayat jika input bersifat navigasi.
3. **Thresholding:** Mengatur skor kemiripan (*similarity score*) dari hasil `equran.id` agar hasil yang tidak relevan tidak ditampilkan.

---

## 5. Panduan User Experience (UX)

Agar fitur ini terasa "pintar", pastikan hal berikut tersedia:

* **Visualizer:** Animasi gelombang suara (*Waveform*) saat microphone aktif.
* **Instant Feedback:** Teks muncul di layar secara *real-time* (menggunakan `interimResults: true`).
* **Handling Error:** Pesan yang jelas jika koneksi internet terputus atau izin microphone ditolak.

---

## 6. Daftar Cek (Checklist) Implementasi

* [ ] Pastikan website menggunakan protokol **HTTPS** (Web Speech API wajib HTTPS).
* [ ] Uji coba di browser Chrome & Edge (dukungan terbaik untuk `id-ID`).
* [ ] Integrasi endpoint `https://equran.id/apidev/vector`.
* [ ] Mapping hasil API ke komponen tampilan Ayat.


# Tips Optimasi untuk aplikasi ini
Noise Suppression: Gunakan library seperti rnnoise atau fitur bawaan Web Audio API agar suara bising di sekitar masjid atau jalanan tidak mengganggu akurasi ASR.

Visual Feedback: Tambahkan animasi waveform saat user bicara untuk memberi tahu bahwa sistem sedang "mendengarkan".

Caching: Jika user menanyakan hal yang sama (misal: "zakat"), simpan hasil dari Vector API di local storage atau Redis untuk menghemat kuota API pihak ke-3.

---
