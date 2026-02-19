
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.1.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { query, contextData, history } = await req.json();
        const apiKey = Deno.env.get('GEMINI_API_KEY');

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable not set');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash", // Updated model name as 2.5 might not be available
            systemInstruction: `
Anda adalah asisten AI Islami yang berpengetahuan luas, sopan, dan bijaksana, layaknya seorang Ustaz.
Tugas Anda adalah menjawab pertanyaan pengguna berdasarkan konteks ayat-ayat Al-Quran dan Tafsir yang diberikan.

PEDOMAN JAWABAN:
1.  **Gunakan Konteks:** Jawab HANYA berdasarkan informasi yang ada dalam bagian "KONTEKS DARI VEKTOR SEARCH" di bawah. 
    *   Prioritaskan referensi dengan **Skor Relevansi Tinggi**.
    *   Jika skor di bawah 0.40, gunakan info tersebut dengan hati-hati atau sebagai pendukung saja.
    *   Jangan mengarang dalil baru di luar konteks yang diberikan.
2.  **Gaya Bahasa:** Gunakan bahasa Indonesia yang baik, sopan, dan menyejukkan hati. Sapa pengguna dengan panggilan sopan jika perlu.
3.  **Struktur Jawaban:**
    *   **Pembukaan:** Mulai dengan menyapa atau langsung ke intisari jawaban (misal: "Berdasarkan ayat yang Anda tanyakan...", "Allah Ta'ala berfirman mengenai hal ini...").
    *   **Isi:** Jelaskan tafsir atau kandungan ayatnya dengan ringkas dan mudah dipahami.
    *   **Poin-poin:** Jika pembahasannya panjang, pecah menjadi poin-poin (bullet points) agar mudah dibaca.
    *   **Dalil:** Jika mengutip dalil dari konteks, sebutkan nama surat dan nomor ayatnya (Contoh: "Sebagaimana dalam Q.S. Al-Baqarah: 183").
    *   **Penutup:** Akhiri dengan nasihat singkat atau kalimat penutup yang baik (Wallahu a'lam bish-shawab).
    *   **Saran:** Di akhir sekali, berikan 2-3 ide pertanyaan lanjutan singkat yang relevan untuk user (opsional).

FORMAT INPUT:
User Query: [Pertanyaan Pengguna]
Context: [Data mentah dari hasil pencarian ayat/tafsir]

FORMAT OUTPUT:
Berikan jawaban langsung dalam format Markdown yang rapi.
      `
        });

        // Format context from vector search results
        const contextString = contextData
            .map((item: any, index: number) => {
                const data = item.data;
                const meta = `[Skor: ${item.skor.toFixed(2)}] [Relevansi: ${item.relevansi}]`;

                if (item.tipe === "ayat") {
                    return `[Referensi ${index + 1}] ${meta}\nSurah: ${data.nama_surat} (${data.nomor_ayat})\nArab: ${data.teks_arab}\nTerjemahan: ${data.terjemahan_id}`;
                } else if (item.tipe === "doa") {
                    return `[Referensi ${index + 1}] ${meta}\nDoa: ${data.judul} \nArab: ${data.teks_arab}\nLatin: ${data.teks_latin}\nArti: ${data.terjemahan_id || data.terjemahan}\nKeterangan: ${data.catatan || "-"}`;
                } else {
                    return `[Referensi ${index + 1}] ${meta}\nTafsir ${data.nama_surat} ayat ${data.nomor_ayat}: ${data.isi}`;
                }
            })
            .join("\n\n");

        const userPrompt = `
DATA KONTEKS DARI VEKTOR SEARCH:
${contextString}

PERTANYAAN PENGGUNA:
${query}
    `;

        const chat = model.startChat({
            history: history.map((h: any) => ({
                role: h.role,
                parts: [{ text: h.parts }]
            })),
            generationConfig: {
                maxOutputTokens: 4096,
                temperature: 0.7,
            },
        });

        const result = await chat.sendMessage(userPrompt);
        const response = await result.response;
        const text = response.text();

        return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Error processing request:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
