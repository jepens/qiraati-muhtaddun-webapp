
import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, History, PlusCircle, MessageSquare, LogIn, Menu, RotateCcw, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router-dom";
import { generateGeminiResponse } from "@/services/gemini";
import { supabase } from "@/lib/supabase";

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
    sumber?: string; // For 'doa'
    judul?: string; // For 'doa'
    id_doa?: number; // For 'doa'
    grup?: string; // For 'doa'
    catatan?: string; // For 'doa' (contains source/hadith)
}

interface SearchResult {
    tipe: "tafsir" | "ayat" | "doa";
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
    content: string;
    references?: SearchResult[];
    timestamp: number;
    isStreaming?: boolean;
}

interface ChatSession {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

const AIChat = () => {
    const { user, isAuthenticated } = useAuth();
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<Array<ChatMessage>>([]);
    const [sessions, setSessions] = useState<Array<ChatSession>>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const suggestions = [
        { icon: "📖", text: "Apa isi kandungan surah Al-Fatihah?" },
        { icon: "🤲", text: "Ayat tentang sabar dalam menghadapi cobaan" },
        { icon: "🌙", text: "Doa sebelum tidur dan artinya" },
        { icon: "⏳", text: "Surah yang membahas tentang hari kiamat" },
    ];

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages.length]);

    // Fetch sessions on mount/auth change
    useEffect(() => {
        if (isAuthenticated && user) {
            fetchSessions();
        } else {
            setSessions([]);
            setMessages([]);
            setCurrentSessionId(null);
        }
    }, [isAuthenticated, user]);

    const fetchSessions = async () => {
        try {
            const { data, error } = await supabase
                .from('chat_sessions')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setSessions(data || []);
        } catch (error) {
            console.error("Error fetching sessions:", error);
        }
    };

    const loadSession = async (sessionId: string) => {
        if (isGenerating) return;
        setIsLoadingHistory(true);
        setCurrentSessionId(sessionId);
        setIsSidebarOpen(false); // Close sidebar on mobile

        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const formattedMessages: ChatMessage[] = (data || []).map(msg => ({
                id: msg.id,
                role: msg.role as "user" | "assistant",
                content: msg.content,
                references: msg.reference_data ? (msg.reference_data as SearchResult[]) : undefined,
                timestamp: new Date(msg.created_at).getTime(),
                isStreaming: false
            }));

            setMessages(formattedMessages);
        } catch (error) {
            console.error("Error loading session:", error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const createNewSession = async (initialTitle: string) => {
        try {
            const { data, error } = await supabase
                .from('chat_sessions')
                .insert({
                    user_id: user?.id,
                    title: initialTitle,
                })
                .select()
                .single();

            if (error) throw error;
            setSessions(prev => [data, ...prev]);
            return data.id;
        } catch (error) {
            console.error("Error creating session:", error);
            return null;
        }
    };

    const saveMessageToDb = async (sessionId: string, role: 'user' | 'assistant', content: string, references?: SearchResult[]) => {
        try {
            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    session_id: sessionId,
                    role,
                    content,
                    reference_data: references || null
                });

            if (error) throw error;

            // Update session list order locally (DB updates updated_at via trigger)
            setSessions(prev => {
                const sessionIndex = prev.findIndex(s => s.id === sessionId);
                if (sessionIndex === -1) return prev;

                const updatedSessions = [...prev];
                const [session] = updatedSessions.splice(sessionIndex, 1);
                session.updated_at = new Date().toISOString();
                return [session, ...updatedSessions];
            });

        } catch (error) {
            console.error("Error saving message:", error);
        }
    };

    const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
        e?.preventDefault();
        const searchQuery = customQuery || query;
        if (!searchQuery.trim() || isGenerating) return;
        if (!isAuthenticated) return;

        setQuery("");
        setIsGenerating(true);

        // 1. Determine Session ID
        let sessionId = currentSessionId;
        if (!sessionId) {
            // Create new session title from first 5 words
            const title = searchQuery.split(' ').slice(0, 5).join(' ') + (searchQuery.split(' ').length > 5 ? '...' : '');
            sessionId = await createNewSession(title);
            if (sessionId) {
                setCurrentSessionId(sessionId);
            } else {
                // Fallback for offline/error: just show local state but won't persist
                console.error("Failed to create session, running in ephemeral mode");
            }
        }

        // 2. Add User Message to State
        const userMsgId = Date.now().toString();
        const newUserMsg: ChatMessage = {
            id: userMsgId,
            role: "user",
            content: searchQuery,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, newUserMsg]);

        // 3. Save User Message to DB
        if (sessionId) {
            saveMessageToDb(sessionId, 'user', searchQuery);
        }

        // 4. Add Placeholder Assistant Message
        const assistantMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            isStreaming: true,
            timestamp: Date.now()
        }]);

        try {
            // 5. RAG Pipeline
            const searchResponse = await fetch("https://equran.id/api/vector", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cari: searchQuery,
                    query: searchQuery, // Send both to be safe
                    limit: 5,
                    types: ["ayat", "tafsir", "doa"],
                    minScore: 0.40
                }),
            });

            console.log("Vector Search Request:", { cari: searchQuery, query: searchQuery, types: ["ayat", "tafsir", "doa"], minScore: 0.40 });
            console.log("Vector Search Response Status:", searchResponse.status);

            if (!searchResponse.ok) throw new Error("Gagal mencari ayat");
            const searchData = await searchResponse.json() as SearchResponse;
            console.log("Vector Search Data:", searchData);
            const topResults = searchData.hasil.slice(0, 5);

            const aiResponse = await generateGeminiResponse(
                searchQuery,
                topResults,
                messages.slice(-4).map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: m.content
                }))
            );

            // 6. Update Assistant Message State
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMsgId
                    ? { ...msg, content: aiResponse, references: topResults, isStreaming: false }
                    : msg
            ));

            // 7. Save Assistant Message to DB
            if (sessionId) {
                await saveMessageToDb(sessionId, 'assistant', aiResponse, topResults);
            }

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
        setCurrentSessionId(null);
        setIsSidebarOpen(false);
    };

    const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (!confirm("Hapus percakapan ini?")) return;

        try {
            const { error } = await supabase
                .from('chat_sessions')
                .delete()
                .eq('id', sessionId);

            if (error) throw error;

            setSessions(prev => prev.filter(s => s.id !== sessionId));
            if (currentSessionId === sessionId) {
                handleNewChat();
            }
        } catch (error) {
            console.error("Error deleting session:", error);
        }
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-background text-foreground/70 border-r border-border">
            <div className="p-4 border-b border-border flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold text-foreground">Percakapan</span>
            </div>

            <div className="p-3">
                <Button onClick={handleNewChat} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 justify-start h-10 text-sm font-medium shadow-md shadow-emerald-900/10">
                    <PlusCircle className="w-4 h-4" />
                    Percakapan Baru
                </Button>
            </div>

            <div className="flex-1 overflow-auto px-3 py-2 scrollbar-thin scrollbar-thumb-muted">
                <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider px-2">Riwayat</div>
                <div className="space-y-1">
                    {sessions.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-2 italic">Belum ada riwayat</p>
                    ) : (
                        sessions.map(session => (
                            <div
                                key={session.id}
                                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${currentSessionId === session.id
                                    ? "bg-muted text-foreground"
                                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground/80"
                                    }`}
                                onClick={() => loadSession(session.id)}
                            >
                                <MessageSquare className={`w-4 h-4 shrink-0 ${currentSessionId === session.id ? 'text-emerald-500' : 'text-muted-foreground group-hover:text-emerald-500/70'}`} />
                                <span className="truncate flex-1 text-left">{session.title}</span>
                                <button
                                    onClick={(e) => handleDeleteSession(e, session.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-border">
                {isAuthenticated ? (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                            <p className="text-xs text-emerald-500 truncate">Free Plan</p>
                        </div>
                    </div>
                ) : (
                    <Link to="/login">
                        <Button variant="outline" className="w-full border-border hover:bg-muted text-muted-foreground">
                            <LogIn className="w-4 h-4 mr-2" />
                            Masuk Akun
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-72 shrink-0">
                <SidebarContent />
            </aside>

            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Mobile Header & Nav */}
                <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm absolute top-0 left-0 right-0 z-10 transition-all">
                    <div className="flex items-center gap-3">
                        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-foreground hover:bg-muted">
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-72 border-r-border bg-background">
                                <SidebarContent />
                            </SheetContent>
                        </Sheet>
                        <Bot className="w-6 h-6 text-emerald-500 md:hidden" />
                        <span className="font-semibold text-lg hidden sm:block md:hidden">Percakapan</span>
                        {/* Only show title on desktop if needed, currently hidden in sidebar */}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="md:hidden flex items-center gap-2 mr-2">
                            {/* Mobile Title if needed */}
                        </div>
                        <Button onClick={handleNewChat} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted gap-2">
                            <RotateCcw className="w-4 h-4" />
                            <span className="hidden sm:inline">Baru</span>
                        </Button>
                    </div>
                </header>

                <ScrollArea className="flex-1 pt-16 pb-4">
                    <div className="max-w-3xl mx-auto px-4 py-6">
                        {messages.length === 0 && !currentSessionId && !isLoadingHistory ? (
                            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in duration-500">
                                <div className="relative">
                                    <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
                                        <Bot className="w-10 h-10 text-white" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-yellow-500 p-1.5 rounded-full border-4 border-background">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                        EQuran AI (Beta)
                                    </h1>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        Asisten AI Islami cerdas yang menjawab pertanyaan Anda dengan referensi tafsir dan Al-Quran yang valid.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSearch(undefined, suggestion.text)}
                                            disabled={!isAuthenticated}
                                            className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-emerald-500/50 hover:bg-muted transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{suggestion.icon}</span>
                                            <span className="text-sm text-foreground/70 group-hover:text-emerald-300">{suggestion.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 pb-20">
                                {isLoadingHistory ? (
                                    <div className="flex justify-center py-10">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                                    </div>
                                ) : (
                                    messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${message.role === "user" ? "justify-end" : "justify-start"
                                                }`}
                                        >
                                            {message.role === "assistant" && (
                                                <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center mt-1">
                                                    <Bot className="w-5 h-5 text-white" />
                                                </div>
                                            )}

                                            <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[75%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                                                <div className="flex items-center gap-2 px-1">
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        {message.role === 'assistant' ? 'EQuran AI' : 'Anda'}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground/50">
                                                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                <div className={`rounded-2xl p-4 shadow-sm ${message.role === "user"
                                                    ? "bg-emerald-600 text-white rounded-tr-sm"
                                                    : "bg-card border border-border text-foreground/80 rounded-tl-sm"
                                                    }`}>
                                                    {message.isStreaming && !message.content ? (
                                                        <div className="flex space-x-1 h-6 items-center">
                                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                                                        </div>
                                                    ) : (
                                                        <div className="prose prose-invert max-w-none text-sm leading-relaxed space-y-4">
                                                            <ReactMarkdown
                                                                components={{
                                                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                                    blockquote: ({ node, ...props }) => (
                                                                        <div className="bg-background/50 border-l-4 border-emerald-500 rounded-r-lg py-3 px-4 my-4 shadow-sm backdrop-blur-sm">
                                                                            <blockquote {...props} className="not-italic text-foreground/70 space-y-2 border-0 p-0 m-0" />
                                                                        </div>
                                                                    ),
                                                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                                    h3: ({ node, ...props }) => (
                                                                        <h3 {...props} className="text-lg font-bold text-emerald-400 mb-2 mt-4 flex items-center gap-2">
                                                                            <Sparkles className="w-4 h-4 text-emerald-500" />
                                                                            {props.children}
                                                                        </h3>
                                                                    ),
                                                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                                    strong: ({ node, ...props }) => (
                                                                        <span {...props} className="font-semibold text-emerald-300" />
                                                                    ),
                                                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                                    p: ({ node, ...props }) => (
                                                                        <p {...props} className="mb-3 last:mb-0 text-foreground/70 leading-7" />
                                                                    ),
                                                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                                    ul: ({ node, ...props }) => (
                                                                        <ul {...props} className="my-3 space-y-1 list-disc list-outside ml-4 marker:text-emerald-500/70" />
                                                                    ),
                                                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                                    ol: ({ node, ...props }) => (
                                                                        <ol {...props} className="my-3 space-y-1 list-decimal list-outside ml-4 marker:text-emerald-500/70" />
                                                                    ),
                                                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                                    li: ({ node, ...props }) => (
                                                                        <li {...props} className="pl-1" />
                                                                    )
                                                                }}
                                                            >
                                                                {message.content}
                                                            </ReactMarkdown>
                                                        </div>
                                                    )}

                                                    {/* References Section - Only for assistant */}
                                                    {message.role === "assistant" && message.references && message.references.length > 0 && (
                                                        <div className="mt-4 pt-4 border-t border-border/50">
                                                            <div className="flex items-center text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">
                                                                <History className="w-3 h-3 mr-1.5" />
                                                                Referensi Ayat:
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {message.references.map((ref, idx) => (
                                                                    <Badge
                                                                        key={idx}
                                                                        variant="outline"
                                                                        className="bg-background/50 text-emerald-400 border-emerald-500/20 hover:bg-emerald-950/30 cursor-pointer text-[10px]"
                                                                    >
                                                                        {ref.tipe === 'doa'
                                                                            ? ref.data.judul
                                                                            : `${ref.data.nama_surat} : ${ref.data.nomor_ayat}`
                                                                        }
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {message.role === "user" && (
                                                <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center mt-1 text-white font-bold text-xs ring-2 ring-background">
                                                    {user?.email?.charAt(0).toUpperCase() || "U"}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                                <div ref={scrollRef} />
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 bg-background border-t border-border/50">
                    <div className="max-w-3xl mx-auto">
                        {!isAuthenticated ? (
                            <div className="relative rounded-xl overflow-hidden border border-border bg-card p-1">
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                    <Link to="/login">
                                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2 h-auto rounded-full shadow-lg shadow-emerald-900/20 animate-in fade-in zoom-in duration-300">
                                            <LogIn className="w-4 h-4 mr-2" />
                                            Login untuk bertanya
                                        </Button>
                                    </Link>
                                </div>
                                <div className="flex gap-2 p-2 opacity-50 pointer-events-none">
                                    <Input disabled placeholder="Tanyakan tentang Al-Quran..." className="bg-transparent border-none" />
                                    <Button disabled size="icon"><Send className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSearch} className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                                <div className="relative flex items-center gap-2 bg-card border border-border rounded-xl p-2 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
                                    <Input
                                        ref={inputRef}
                                        placeholder="Tanyakan tentang Al-Quran..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        disabled={isGenerating}
                                        className="flex-1 bg-transparent border-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/50 h-10 px-3"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={isGenerating || !query.trim()}
                                        className={`h-10 w-10 p-0 rounded-lg transition-all duration-300 ${query.trim()
                                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                                            : "bg-muted text-muted-foreground "
                                            }`}
                                    >
                                        {isGenerating ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                        <span className="sr-only">Kirim</span>
                                    </Button>
                                </div>
                            </form>
                        )}
                        <p className="text-center text-[10px] text-muted-foreground/50 mt-3 font-medium">
                            Powered by Gemini AI & EQuran Vector Search • Mohon verifikasi kembali dengan Al-Quran fisik
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AIChat;
