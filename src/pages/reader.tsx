import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, Volume2, Bookmark, PenLine, ChevronLeft, ChevronRight, X, Loader2, Settings, Languages, ZoomIn, ZoomOut, Moon, Sun, Globe, RefreshCw, Copy, CheckCircle2 } from "lucide-react";
import { useGetBookmarks, useCreateBookmark, useDeleteBookmark, getGetBookmarksQueryKey, useGetNotes, useCreateNote, getGetNotesQueryKey, useGetAiTafseer, useUpdateSurahProgress, getGetAllSurahProgressQueryKey, useRecordReadingSession } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SURAHS, TRANSLATION_EDITIONS, RECITERS } from "@/lib/quran-data";

interface Verse {
  number: number;
  numberInSurah: number;
  text: string;
  translation?: string;
}

const fetchSurahData = async (surahId: number, edition: string): Promise<Verse[]> => {
  const [arabicRes, translationRes] = await Promise.all([
    fetch(`https://api.alquran.cloud/v1/surah/${surahId}/ar.alafasy`),
    fetch(`https://api.alquran.cloud/v1/surah/${surahId}/${edition}`),
  ]);
  const [arabic, translation] = await Promise.all([arabicRes.json(), translationRes.json()]);
  const arabicVerses = arabic.data?.ayahs ?? [];
  const translationVerses = translation.data?.ayahs ?? [];
  return arabicVerses.map((v: any, i: number) => ({
    number: v.number,
    numberInSurah: v.numberInSurah,
    text: v.text,
    translation: translationVerses[i]?.text ?? "",
  }));
};

export default function Reader() {
  const params = useParams<{ surahId: string }>();
  const surahId = parseInt(params.surahId ?? "1");
  const [, setLocation] = useLocation();
  const surah = SURAHS.find(s => s.id === surahId);
  const queryClient = useQueryClient();

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("english");
  const [fontSize, setFontSize] = useState(22);
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentVerse, setCurrentVerse] = useState(1);
  const [reciter, setReciter] = useState(RECITERS[0].id);
  const [showSettings, setShowSettings] = useState(false);
  const [showTafseer, setShowTafseer] = useState(false);
  const [tafseerMode, setTafseerMode] = useState("beginner");
  const [noteText, setNoteText] = useState("");
  const [showNotePanel, setShowNotePanel] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionStart = useRef(Date.now());

  const { data: bookmarks } = useGetBookmarks();
  const { data: notes } = useGetNotes();
  const createBookmark = useCreateBookmark();
  const deleteBookmark = useDeleteBookmark();
  const createNote = useCreateNote();
  const aiTafseer = useGetAiTafseer();
  const updateProgress = useUpdateSurahProgress();
  const recordSession = useRecordReadingSession();

  useEffect(() => {
    setLoading(true);
    setVerses([]);
    const edition = TRANSLATION_EDITIONS[language]?.code ?? "en.sahih";
    fetchSurahData(surahId, edition).then(v => { setVerses(v); setLoading(false); }).catch(() => setLoading(false));
  }, [surahId, language]);

  // Record progress on unmount
  useEffect(() => {
    return () => {
      const minutes = Math.round((Date.now() - sessionStart.current) / 60000);
      if (minutes > 0) {
        recordSession.mutate({ data: { surahId, verseStart: 1, verseEnd: currentVerse, durationMinutes: minutes } });
        updateProgress.mutate({ data: { lastReadVerse: currentVerse, totalVerses: surah?.verses ?? 0 }, surahId }, {
          onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAllSurahProgressQueryKey() }),
        });
      }
    };
  }, [surahId, currentVerse]);

  const getAudioUrl = (s: number, v: number) => {
    const sp = String(s).padStart(3, "0");
    const vp = String(v).padStart(3, "0");
    return `https://everyayah.com/data/${reciter}/${sp}${vp}.mp3`;
  };

  const playVerse = (verseNum: number) => {
    setCurrentVerse(verseNum);
    setActiveVerse(verseNum);
    if (audioRef.current) {
      audioRef.current.src = getAudioUrl(surahId, verseNum);
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  const handleAudioEnd = useCallback(() => {
    const next = currentVerse + 1;
    if (next <= (surah?.verses ?? 0)) {
      playVerse(next);
    } else {
      setPlaying(false);
    }
  }, [currentVerse, surahId, surah]);

  const isBookmarked = (verseId: number) => bookmarks?.some(b => b.surahId === surahId && b.verseId === verseId);

  const toggleBookmark = (verse: Verse) => {
    const existing = bookmarks?.find(b => b.surahId === surahId && b.verseId === verse.numberInSurah);
    if (existing) {
      deleteBookmark.mutate({ id: existing.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetBookmarksQueryKey() }) });
    } else {
      createBookmark.mutate(
        { data: { surahId, verseId: verse.numberInSurah, surahName: surah?.englishName ?? "", verseText: verse.text } },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetBookmarksQueryKey() }) }
      );
    }
  };

  const [tafseerResult, setTafseerResult] = useState<any>(null);
  const [loadingTafseer, setLoadingTafseer] = useState(false);
  const [tafseerLang, setTafseerLang] = useState(() => localStorage.getItem("qv_tafseer_lang") ?? "english");
  const [tafseerNeedsRefresh, setTafseerNeedsRefresh] = useState(false);
  const [activeVerseObj, setActiveVerseObj] = useState<Verse | null>(null);
  const [copiedTafseer, setCopiedTafseer] = useState(false);

  const TAFSEER_LANGUAGES = [
    { code: "english", label: "English", flag: "🇬🇧" },
    { code: "urdu", label: "اردو", flag: "🇵🇰" },
    { code: "arabic", label: "العربية", flag: "🇸🇦" },
    { code: "french", label: "Français", flag: "🇫🇷" },
    { code: "german", label: "Deutsch", flag: "🇩🇪" },
    { code: "turkish", label: "Türkçe", flag: "🇹🇷" },
    { code: "hindi", label: "हिन्दी", flag: "🇮🇳" },
    { code: "spanish", label: "Español", flag: "🇪🇸" },
  ];

  const doFetchTafseer = (verse: Verse, mode: string, lang: string) => {
    setLoadingTafseer(true);
    setTafseerNeedsRefresh(false);
    localStorage.setItem("qv_tafseer_lang", lang);
    aiTafseer.mutate(
      { data: { surahId, verseId: verse.numberInSurah, arabicText: verse.text, translation: verse.translation ?? "", mode, language: lang } },
      {
        onSuccess: (data) => { setTafseerResult(data); setLoadingTafseer(false); },
        onError: () => setLoadingTafseer(false),
      }
    );
  };

  const fetchTafseer = (verse: Verse) => {
    setShowTafseer(true);
    setActiveVerse(verse.numberInSurah);
    setActiveVerseObj(verse);
    setTafseerResult(null);
    doFetchTafseer(verse, tafseerMode, tafseerLang);
  };

  const changeTafseerMode = (mode: string) => {
    setTafseerMode(mode);
    if (tafseerResult && activeVerseObj) setTafseerNeedsRefresh(true);
  };

  const changeTafseerLang = (lang: string) => {
    setTafseerLang(lang);
    if (activeVerseObj) doFetchTafseer(activeVerseObj, tafseerMode, lang);
  };

  const copyTafseer = async () => {
    if (!tafseerResult) return;
    const text = `AI Tafseer — Surah ${surah?.englishName} : ${activeVerse}\n\n${tafseerResult.explanation ?? ""}\n\nHistorical Context:\n${tafseerResult.historicalContext ?? ""}\n\nPractical Application:\n${tafseerResult.practicalApplication ?? ""}`;
    await navigator.clipboard.writeText(text);
    setCopiedTafseer(true);
    setTimeout(() => setCopiedTafseer(false), 2000);
  };

  const saveNote = (verse: Verse) => {
    if (!noteText.trim()) return;
    createNote.mutate(
      { data: { surahId, verseId: verse.numberInSurah, content: noteText } },
      { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetNotesQueryKey() }); setNoteText(""); setShowNotePanel(false); } }
    );
  };

  const rtl = TRANSLATION_EDITIONS[language]?.rtl;
  const isRtl = rtl || language === "arabic" || language === "urdu" || language === "persian";

  return (
    <div className={`space-y-4 ${nightMode ? "night-mode" : ""}`}>
      <audio ref={audioRef} onEnded={handleAudioEnd} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/surahs")} className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center hover:bg-primary/10 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{surah?.englishName ?? `Surah ${surahId}`}</h1>
            <p className="text-sm text-muted-foreground">{surah?.arabicName} · {surah?.verses} verses · {surah?.type}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setNightMode(!nightMode)} className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center hover:bg-primary/10">
            {nightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center hover:bg-primary/10">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="border-border/50 bg-card/90">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Translation Language</label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger data-testid="select-language"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TRANSLATION_EDITIONS).map(([key, val]) => (
                          <SelectItem key={key} value={key}>{val.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Reciter</label>
                    <Select value={reciter} onValueChange={setReciter}>
                      <SelectTrigger data-testid="select-reciter"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RECITERS.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Font Size: {fontSize}px</label>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => setFontSize(f => Math.max(16, f - 2))} className="p-1 rounded hover:bg-primary/10"><ZoomOut className="w-4 h-4" /></button>
                      <Slider value={[fontSize]} onValueChange={([v]) => setFontSize(v)} min={16} max={36} step={2} className="flex-1" />
                      <button onClick={() => setFontSize(f => Math.min(36, f + 2))} className="p-1 rounded hover:bg-primary/10"><ZoomIn className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>

                {/* Audio Controls */}
                <div className="flex items-center gap-3 pt-2 border-t border-border/30">
                  <button onClick={() => currentVerse > 1 && playVerse(currentVerse - 1)} className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary"><SkipBack className="w-4 h-4" /></button>
                  <button
                    onClick={() => {
                      if (playing) { audioRef.current?.pause(); setPlaying(false); }
                      else { playVerse(currentVerse); }
                    }}
                    className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-play-pause"
                  >
                    {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button onClick={() => currentVerse < (surah?.verses ?? 0) && playVerse(currentVerse + 1)} className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary"><SkipForward className="w-4 h-4" /></button>
                  <span className="text-xs text-muted-foreground ml-2">Verse {currentVerse} of {surah?.verses}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Surah Navigation */}
      <div className="flex items-center gap-2">
        {surahId > 1 && (
          <button onClick={() => setLocation(`/read/${surahId - 1}`)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/50 text-xs text-muted-foreground hover:bg-primary/10 transition-colors">
            <ChevronLeft className="w-3 h-3" /> Prev Surah
          </button>
        )}
        {surahId < 114 && (
          <button onClick={() => setLocation(`/read/${surahId + 1}`)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/50 text-xs text-muted-foreground hover:bg-primary/10 transition-colors ml-auto">
            Next Surah <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Bismillah */}
      {surahId !== 1 && surahId !== 9 && (
        <div className="text-center py-4">
          <p className="text-2xl font-arabic text-foreground" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          <p className="text-sm text-muted-foreground mt-1">In the name of Allah, the Entirely Merciful, the Especially Merciful</p>
        </div>
      )}

      {/* Verses */}
      <div className="space-y-1">
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <Card key={i} className="border-border/50"><CardContent className="p-5"><Skeleton className="h-16 w-full mb-2" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
          ))
        ) : (
          verses.map(verse => {
            const verseNotes = notes?.filter(n => n.surahId === surahId && n.verseId === verse.numberInSurah) ?? [];
            const bookmarked = isBookmarked(verse.numberInSurah);
            const isActive = activeVerse === verse.numberInSurah;

            return (
              <motion.div
                key={verse.number}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                id={`verse-${verse.numberInSurah}`}
              >
                <Card className={`border-border/50 transition-all ${isActive ? "border-primary/50 bg-primary/5 shadow-sm" : "bg-card/80 hover:bg-card"}`} data-testid={`card-verse-${verse.numberInSurah}`}>
                  <CardContent className="p-4 md:p-6">
                    {/* Arabic */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{verse.numberInSurah}</div>
                      </div>
                      <p className="text-right flex-1 leading-loose text-foreground font-arabic" style={{ fontSize: `${fontSize}px` }} dir="rtl">
                        {verse.text}
                      </p>
                    </div>

                    {/* Translation */}
                    <p className={`text-sm text-muted-foreground leading-relaxed mb-4 ${isRtl ? "text-right" : ""}`} dir={isRtl ? "rtl" : "ltr"}>
                      {verse.translation}
                    </p>

                    {/* Verse Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => playVerse(verse.numberInSurah)} className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${playing && activeVerse === verse.numberInSurah ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"}`} data-testid={`button-play-${verse.numberInSurah}`}>
                        {playing && activeVerse === verse.numberInSurah ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        {playing && activeVerse === verse.numberInSurah ? "Playing" : "Play"}
                      </button>
                      <button onClick={() => toggleBookmark(verse)} className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${bookmarked ? "bg-secondary/20 text-secondary" : "bg-muted text-muted-foreground hover:bg-secondary/10 hover:text-secondary"}`} data-testid={`button-bookmark-${verse.numberInSurah}`}>
                        <Bookmark className={`w-3 h-3 ${bookmarked ? "fill-current" : ""}`} />
                        {bookmarked ? "Saved" : "Bookmark"}
                      </button>
                      <button onClick={() => fetchTafseer(verse)} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" data-testid={`button-tafseer-${verse.numberInSurah}`}>
                        AI Tafseer
                      </button>
                      <button onClick={() => { setActiveVerse(verse.numberInSurah); setShowNotePanel(!showNotePanel); }} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-muted text-muted-foreground hover:bg-green-500/10 hover:text-green-600 transition-colors" data-testid={`button-note-${verse.numberInSurah}`}>
                        <PenLine className="w-3 h-3" /> Note {verseNotes.length > 0 && `(${verseNotes.length})`}
                      </button>
                    </div>

                    {/* Note Panel */}
                    {showNotePanel && activeVerse === verse.numberInSurah && (
                      <div className="mt-3 space-y-2">
                        {verseNotes.map(n => (
                          <div key={n.id} className="text-xs p-2 rounded-lg bg-green-500/10 text-foreground border border-green-500/20">{n.content}</div>
                        ))}
                        <Textarea
                          placeholder="Add a note about this verse..."
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                          className="text-sm min-h-[70px]"
                          data-testid={`textarea-note-${verse.numberInSurah}`}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => saveNote(verse)} className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-md hover:bg-primary/90" data-testid={`button-save-note-${verse.numberInSurah}`}>Save Note</button>
                          <button onClick={() => setShowNotePanel(false)} className="px-3 py-1.5 bg-muted text-muted-foreground text-xs rounded-md">Cancel</button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* AI Tafseer Side Panel */}
      <AnimatePresence>
        {showTafseer && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-card border-l border-border/50 z-50 shadow-2xl overflow-y-auto"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-foreground">AI Tafseer</h3>
                  <p className="text-xs text-muted-foreground">Verse {activeVerse} explanation</p>
                </div>
                <button onClick={() => setShowTafseer(false)} className="p-2 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>

              {/* Mode Selector */}
              <div className="flex gap-1.5 mb-3">
                {["beginner", "student", "advanced"].map(mode => (
                  <button key={mode} onClick={() => changeTafseerMode(mode)} className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${tafseerMode === mode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10"}`}>{mode}</button>
                ))}
              </div>

              {/* Language Selector */}
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Globe className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Tafseer Language</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {TAFSEER_LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => changeTafseerLang(lang.code)}
                      title={lang.label}
                      className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${tafseerLang === lang.code ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/20"}`}
                    >
                      {lang.flag} <span className="hidden sm:inline">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Refresh Banner */}
              {tafseerNeedsRefresh && activeVerseObj && (
                <div className="mb-4 flex items-center justify-between gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                  <p className="text-xs text-primary">Mode changed — re-explain with new depth?</p>
                  <button
                    onClick={() => doFetchTafseer(activeVerseObj, tafseerMode, tafseerLang)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Re-explain
                  </button>
                </div>
              )}

              {loadingTafseer ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating {tafseerMode}-level explanation in {TAFSEER_LANGUAGES.find(l => l.code === tafseerLang)?.flag}...
                  </div>
                </div>
              ) : tafseerResult ? (
                <div className="space-y-4">
                  {/* Copy button */}
                  <div className="flex justify-end">
                    <button onClick={copyTafseer} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {copiedTafseer ? <><CheckCircle2 className="w-3 h-3 text-green-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Explanation</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tafseerResult.explanation}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Historical Context</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tafseerResult.historicalContext}</p>
                  </div>
                  {tafseerResult.lessons?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Key Lessons</h4>
                      <ul className="space-y-1.5">
                        {tafseerResult.lessons.map((l: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex gap-2 items-start">
                            <span className="text-primary shrink-0 mt-0.5">•</span>{l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Practical Application</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tafseerResult.practicalApplication}</p>
                  </div>
                  {/* Re-explain button at bottom */}
                  {activeVerseObj && (
                    <button
                      onClick={() => doFetchTafseer(activeVerseObj, tafseerMode, tafseerLang)}
                      disabled={loadingTafseer}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-primary/10 text-sm text-muted-foreground hover:text-primary transition-colors mt-2"
                    >
                      <RefreshCw className="w-4 h-4" /> Re-generate Explanation
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
