import { supabase } from "@/lib/supabase";

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
        console.log("Invoking ask-gemini function...");
        const { data, error } = await supabase.functions.invoke('ask-gemini', {
            body: { query, contextData, history }
        });

        if (error) {
            console.error("Supabase Function Error:", error);
            throw error;
        }

        if (!data || !data.text) {
            console.error("Invalid response format:", data);
            throw new Error("Invalid response from AI service");
        }

        return data.text;

    } catch (error) {
        console.error("Error generating Gemini response:", error);
        return "Mohon maaf, saat ini saya tidak dapat memproses jawaban karena gangguan pada layanan AI. Namun, Anda tetap dapat merujuk pada ayat-ayat yang tampil di atas.";
    }
};
