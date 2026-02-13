
import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, History, PlusCircle, MessageSquare, LogIn, Menu, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router-dom";
import { generateGeminiResponse } from "@/services/gemini";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ReactMarkdown from 'react-markdown';

// Types derived from the API response
interface SearchResultData {
    id_surat: number;
    nama_surat: string;
    nama_surat_arab: string;
    nomor_ayat: number;
    isi?: string; // For 'tafsir'
    teks_arab?: string; // For 'ayat'
    teks_latin?: string; // For 'ayat'
    terjemahan_id?: string; // For 'ayat'
    terjemahan_en?: string; // For 'ayat'
}

interface SearchResult {
    tipe: "tafsir" | "ayat";
    skor: number;
    relevansi: string;
    data: SearchResultData;
}

interface SearchResponse {
    status: string;
    cari: string;
    jumlah: number;
    hasil: SearchResult[];
}

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string; // Now content is primarily string (Markdown)
    references?: SearchResult[]; // Optional references to display below answer
    timestamp: number;
    isStreaming?: boolean;
}

const AIChat = () => {
    const { user, isAuthenticated } = useAuth();
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<Array<ChatMessage>>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const suggestions = [
        { icon: "📖", text: "Apa isi kandungan surah Al-Fatihah?" },
        { icon: "🤲", text: "Ayat tentang sabar dalam menghadapi cobaan" },
        { icon: "🌙", text: "Doa sebelum tidur dan artinya" },
        { icon: "⏳", text: "Surah yang membahas tentang hari kiamat" },
    ];

    useEffect(() => {
        if (scrollRef.current) {
            // ... keep existing scroll logic
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isGenerating, messages.length]); // Added messages.length dependency

    const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
        e?.preventDefault();
        const searchQuery = customQuery || query;
        if (!searchQuery.trim() || isGenerating) return;
        if (!isAuthenticated) return;

        const userMsgId = Date.now().toString();
        const newMessages = [...messages, {
            id: userMsgId,
            role: "user" as const,
            content: searchQuery,
            timestamp: Date.now()
        }];
        setMessages(newMessages);
        setQuery("");
        setIsGenerating(true);

        const assistantMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            isStreaming: true,
            timestamp: Date.now()
        }]);

        try {
            const searchResponse = await fetch("https://equran.id/api/vector", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cari: searchQuery,
                    limit: 5,
                    minScore: 0.60
                }),
            });

            if (!searchResponse.ok) throw new Error("Gagal mencari ayat");
            const searchData = await searchResponse.json() as SearchResponse;
            const topResults = searchData.hasil.slice(0, 5);

            const aiResponse = await generateGeminiResponse(
                searchQuery,
                topResults,
                messages.slice(-4).map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: m.content
                }))
            );

            setMessages(prev => prev.map(msg =>
                msg.id === assistantMsgId
                    ? { ...msg, content: aiResponse, references: topResults, isStreaming: false }
                    : msg
            ));

        } catch (error) {
            console.error("Error:", error);
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMsgId
                    ? {
                        ...msg,
                        content: "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.",
                        isStreaming: false
                    }
                    : msg
            ));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setQuery("");
    };

    return (
        <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans">
            {/* Sidebar - Adjusted colors */}
            <aside className="hidden md:flex w-72 flex-col bg-[#0f172a] border-r border-slate-800">
                <div className="p-6">
                    <Button onClick={handleNewChat} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 justify-start h-12 text-md font-medium shadow-lg shadow-emerald-500/10">
                        <PlusCircle className="w-5 h-5" />
                        Percakapan Baru
                    </Button>
                </div>

                <ScrollArea className="flex-1 px-4">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Hari Ini</h3>
                            <div className="space-y-1">
                                <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-800/50 text-sm text-slate-300 hover:text-white transition-all truncate flex items-center gap-3 group">
                                    <MessageSquare className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-500 transition-colors" />
                                    <span className="truncate">Ayat tentang kesabaran</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-slate-800 bg-[#0f172a]">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer">
                            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                                <p className="text-xs text-emerald-500 font-medium">Free Plan</p>
                            </div>
                        </div>
                    ) : (
                        <Link to="/login">
                            <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-slate-300">
                                <LogIn className="w-4 h-4 mr-2" />
                                Masuk Akun
                            </Button>
                        </Link>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 relative bg-[#020617]">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-[#020617]/50 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
                    <div className="flex items-center gap-4">
                        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden text-slate-400">
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 border-r-slate-800 bg-[#0f172a] w-72">
                                {/* Sidebar content for mobile would go here - simplified for brevity */}
                                <div className="p-6">
                                    <Button onClick={() => { handleNewChat(); setIsSidebarOpen(false); }} className="w-full bg-emerald-600">Baru</Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                        <div className="flex items-center gap-2">
                            <Bot className="w-6 h-6 text-emerald-500" />
                            <span className="font-semibold text-lg text-white">Percakapan</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => { }}>
                            <History className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Riwayat</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={handleNewChat}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Baru</span>
                        </Button>
                    </div>
                </header>

                <ScrollArea className="flex-1 pt-16 pb-6">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                        {messages.length === 0 ? (
                            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-emerald-500/20">
                                    <Bot className="w-8 h-8 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Apa yang ingin Anda pelajari?</h2>
                                <p className="text-slate-400 mb-8 max-w-md">
                                    Tanyakan tentang tafsir, hukum fiqih, atau sejarah Islam berdasarkan sumber terpercaya.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSearch(undefined, s.text)}
                                            disabled={!isAuthenticated}
                                            className="text-left p-4 rounded-xl bg-[#0f172a] border border-slate-800 hover:border-emerald-500/50 hover:bg-[#1e293b] transition-all group"
                                        >
                                            <p className="font-medium text-slate-200 group-hover:text-emerald-400 transition-colors mb-1">{s.text}</p>
                                            <p className="text-xs text-slate-500">Tanyakan sekarang &rarr;</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 pb-12">
                                {messages.map((message) => (
                                    <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-500`}>

                                        {/* Avatar */}
                                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${message.role === 'assistant' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-600 text-white'}`}>
                                            {message.role === 'assistant' ? <Bot className="w-5 h-5" /> : (user?.email?.charAt(0).toUpperCase() || "U")}
                                        </div>

                                        {/* Content Bubble */}
                                        <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-center gap-2 px-1">
                                                <span className="text-xs font-medium text-white">
                                                    {message.role === 'assistant' ? 'EQuran AI' : 'Anda'}
                                                </span>
                                                <span className="text-[10px] text-slate-500">
                                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            <div className={`rounded-2xl p-4 sm:p-5 shadow-sm leading-relaxed ${message.role === 'user'
                                                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm'
                                                    : 'bg-[#0f172a] border border-slate-800 text-slate-300 rounded-tl-sm'
                                                }`}>
                                                {message.isStreaming && !message.content ? (
                                                    <div className="flex gap-1 items-center h-6">
                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                                                    </div>
                                                ) : (
                                                    <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 max-w-none prose-sm sm:prose-base">
                                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                                    </div>
                                                )}

                                                {/* References inside the bubble for Assistant */}
                                                {message.role === 'assistant' && message.references && message.references.length > 0 && (
                                                    <div className="mt-5 pt-4 border-t border-slate-800/80">
                                                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-3">
                                                            <Sparkles className="w-3 h-3" />
                                                            Referensi
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {message.references.map((ref, idx) => (
                                                                <Badge
                                                                    key={idx}
                                                                    variant="outline"
                                                                    className="bg-emerald-950/30 text-emerald-400 border-emerald-500/20 hover:bg-emerald-900/50 hover:border-emerald-500/40 cursor-pointer text-xs py-1 px-2.5 transition-colors"
                                                                >
                                                                    {ref.data.nama_surat} : {ref.data.nomor_ayat}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={scrollRef} />
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer Input Area */}
                <div className="p-4 sm:p-6 bg-[#020617] border-t border-slate-800/10 z-20">
                    <div className="max-w-4xl mx-auto">
                        {!isAuthenticated ? (
                            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#0f172a] p-1">
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                    <Link to="/login">
                                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 shadow-xl shadow-emerald-500/20">
                                            Login untuk bertanya
                                        </Button>
                                    </Link>
                                </div>
                                <div className="flex gap-2 p-3 opacity-30">
                                    <Input disabled value="Mohon login terlebih dahulu..." className="bg-transparent border-none text-slate-500" />
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSearch} className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur opacity-20 transition duration-500"></div>
                                <div className="relative flex items-center gap-2 bg-[#0f172a] border border-slate-800 rounded-2xl px-2 py-2 shadow-xl focus-within:border-emerald-500/30 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
                                    <Input
                                        ref={inputRef}
                                        placeholder="Tanyakan sesuatu tentang Al-Quran..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        disabled={isGenerating}
                                        className="flex-1 bg-transparent border-none focus-visible:ring-0 text-slate-200 placeholder:text-slate-600 h-12 px-4 text-base"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={isGenerating || !query.trim()}
                                        className={`h-10 w-10 p-0 rounded-xl transition-all duration-300 ${query.trim()
                                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                            : "bg-slate-800 text-slate-600 hover:bg-slate-700"
                                            }`}
                                    >
                                        {isGenerating ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                                        ) : (
                                            <Send className="w-4 h-4 ml-0.5" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-center text-[10px] text-slate-600 mt-4 font-medium tracking-wide">
                                    Jawaban dihasilkan berdasarkan data Al-Quran, Tafsir, dan Doa • Tekan Enter untuk kirim
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AIChat;
