import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Sparkles, RotateCcw, Globe, ChevronDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTION_CHIPS = [
  "What is the importance of Surah Al-Fatihah?",
  "Explain the 5 pillars of Islam",
  "What does the Quran say about patience?",
  "What is the ruling on daily prayers?",
  "Tell me about the life of Prophet Muhammad ﷺ",
  "What is Tawhid?",
  "How to improve my Quran recitation?",
  "Explain Laylatul Qadr",
];

const MODES = [
  { id: "beginner", label: "Beginner", color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30" },
  { id: "student", label: "Student", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  { id: "scholar", label: "Scholar", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30" },
];

const LANGUAGES = [
  { code: "english", label: "English", flag: "🇬🇧" },
  { code: "urdu", label: "اردو", flag: "🇵🇰" },
  { code: "arabic", label: "العربية", flag: "🇸🇦" },
  { code: "french", label: "Français", flag: "🇫🇷" },
  { code: "turkish", label: "Türkçe", flag: "🇹🇷" },
  { code: "hindi", label: "हिन्दी", flag: "🇮🇳" },
];

async function sendChat(message: string, history: Message[], mode: string, language: string): Promise<string> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, mode, language }),
  });
  if (!res.ok) throw new Error("Chat failed");
  const data = await res.json() as { reply: string };
  return data.reply;
}

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("beginner");
  const [language, setLanguage] = useState("english");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [hasBadge, setHasBadge] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setHasBadge(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    const userMessage: Message = { role: "user", content: msg };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    try {
      const reply = await sendChat(msg, messages, mode, language);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't connect. Please check your internet connection and try again." }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => setMessages([]);
  const currentLang = LANGUAGES.find(l => l.code === language) ?? LANGUAGES[0];

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center"
            aria-label="Open AI Islamic Assistant"
          >
            <Sparkles className="w-6 h-6" />
            {hasBadge && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop (mobile) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="md:hidden fixed inset-0 bg-black/40 z-50"
            />

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 right-0 md:bottom-6 md:right-6 z-50 w-full md:w-[420px] h-[85vh] md:h-[600px] bg-card border border-border/50 md:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Islamic AI Assistant</p>
                    <p className="text-xs text-muted-foreground">Powered by QuranVerse AI</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button onClick={clearChat} title="Clear chat" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mode + Language Bar */}
              <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {MODES.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${mode === m.id ? m.color : "border-transparent text-muted-foreground hover:bg-muted"}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowLangPicker(!showLangPicker)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                    <span>{currentLang.flag}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <AnimatePresence>
                    {showLangPicker && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        className="absolute right-0 top-8 bg-card border border-border/50 rounded-lg shadow-lg p-1 z-10 min-w-32"
                      >
                        {LANGUAGES.map(lang => (
                          <button
                            key={lang.code}
                            onClick={() => { setLanguage(lang.code); setShowLangPicker(false); }}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-left transition-colors ${language === lang.code ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}
                          >
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Islamic AI Assistant</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Ask me anything about the Quran, Hadith, Islamic rulings, or your learning journey.
                    </p>
                    <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                      {SUGGESTION_CHIPS.slice(0, 4).map((chip, i) => (
                        <button
                          key={i}
                          onClick={() => send(chip)}
                          className="text-left text-xs px-3 py-2 rounded-lg border border-border/50 bg-card hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-1 shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                          </div>
                        )}
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted text-foreground rounded-tl-sm"
                        }`}>
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                    {loading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-1 shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </motion.div>
                    )}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Suggestion chips (show after first message) */}
              {messages.length > 0 && messages.length < 3 && (
                <div className="px-3 pb-1 flex gap-1.5 overflow-x-auto scrollbar-none">
                  {SUGGESTION_CHIPS.slice(4).map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => send(chip)}
                      disabled={loading}
                      className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-border/50 bg-card hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-border/50">
                <div className="flex items-end gap-2 bg-muted rounded-xl px-3 py-2">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about Quran, Hadith, Islamic rulings..."
                    className="flex-1 resize-none border-0 bg-transparent p-0 min-h-[24px] max-h-24 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                    rows={1}
                    disabled={loading}
                  />
                  <button
                    onClick={() => send()}
                    disabled={loading || !input.trim()}
                    className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0 hover:bg-primary/90"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-center text-[10px] text-muted-foreground mt-1.5">
                  Mode: <span className="font-medium capitalize">{mode}</span> · {currentLang.flag} {currentLang.label} · Enter to send
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
