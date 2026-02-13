
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("VITE_GEMINI_API_KEY is not set in .env.local");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// System prompt untuk persona "Ustaz"
const SYSTEM_PROMPT = `
Anda adalah asisten AI Islami yang berpengetahuan luas, sopan, dan bijaksana, layaknya seorang Ustaz.
Tugas Anda adalah menjawab pertanyaan pengguna berdasarkan konteks ayat-ayat Al-Quran dan Tafsir yang diberikan.

PEDOMAN JAWABAN:
1.  **Gunakan Konteks:** Jawab HANYA berdasarkan informasi yang ada dalam bagian "KONTEKS DARI VEKTOR SEARCH" di bawah. 
    *   Prioritaskan referensi dengan **Skor Relevansi Tinggi**.
    *   Jika skor di bawah 0.70, gunakan info tersebut dengan hati-hati atau sebagai pendukung saja.
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
`;

export interface IUpdateHistory {
    role: "user" | "model";
    parts: string;
}

export const generateGeminiResponse = async (
    query: string,
    contextData: any[],
    history: IUpdateHistory[] = []
): Promise<string> => {
    try {
        // Use gemini-2.5-flash as requested
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: SYSTEM_PROMPT // Move system prompt here
        });

        // Format context from vector search results
        const contextString = contextData
            .map((item, index) => {
                const data = item.data;
                const meta = `[Skor: ${item.skor.toFixed(2)}] [Relevansi: ${item.relevansi}]`;

                if (item.tipe === "ayat") {
                    return `[Referensi ${index + 1}] ${meta}\nSurah: ${data.nama_surat} (${data.nomor_ayat})\nArab: ${data.teks_arab}\nTerjemahan: ${data.terjemahan_id}`;
                } else {
                    return `[Referensi ${index + 1}] ${meta}\nTafsir ${data.nama_surat} ayat ${data.nomor_ayat}: ${data.isi}`;
                }
            })
            .join("\n\n");

        // User prompt now only contains context and query
        const userPrompt = `
DATA KONTEKS DARI VEKTOR SEARCH:
${contextString}

PERTANYAAN PENGGUNA:
${query}
    `;

        const chat = model.startChat({
            history: history.map(h => ({
                role: h.role,
                parts: [{ text: h.parts }]
            })),
            generationConfig: {
                maxOutputTokens: 4096, // Increased limit significantly
                temperature: 0.7,
            },
        });

        const result = await chat.sendMessage(userPrompt);
        const response = await result.response;

        // Log for debugging truncation
        console.log("Gemini Response Finish Reason:", response.candidates?.[0]?.finishReason);

        return response.text();

    } catch (error) {
        console.error("Error generating Gemini response:", error);
        return "Mohon maaf, saat ini saya tidak dapat memproses jawaban karena gangguan pada layanan AI. Namun, Anda tetap dapat merujuk pada ayat-ayat yang tampil di atas.";
    }
};
