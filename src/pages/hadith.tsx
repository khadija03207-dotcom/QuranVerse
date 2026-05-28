import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Heart, Loader2, ChevronLeft, ChevronRight,
  Globe, Copy, BookOpen, CheckCircle2, ChevronDown, ChevronUp
} from "lucide-react";
import { useGetHadithFavorites, useAddHadithFavorite, useRemoveHadithFavorite, getGetHadithFavoritesQueryKey } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { HADITH_BOOKS, HADITH_LANGUAGES, type HadithBook } from "@/lib/quran-data";
import { useToast } from "@/hooks/use-toast";

const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

interface HadithEntry {
  number: number;
  arabic: string;
  translation: string;
}

interface ChapterInfo {
  id: number;
  arabic?: string;
  english?: string;
}

function parseSections(data: any): ChapterInfo[] {
  const sections = data?.metadata?.sections ?? data?.sections ?? {};
  return Object.entries(sections).map(([id, info]: [string, any]) => ({
    id: parseInt(id),
    arabic: typeof info === "object" ? (info.arabic ?? "") : "",
    english: typeof info === "object" ? (info.english ?? `Chapter ${id}`) : String(info),
  })).sort((a, b) => a.id - b.id);
}

function parseHadiths(data: any): HadithEntry[] {
  const list = data?.hadiths ?? data?.chapter ?? [];
  return list.map((h: any) => ({
    number: h.hadithnumber ?? h.number ?? 0,
    arabic: h.arab ?? h.text ?? "",
    translation: h.text ?? "",
  }));
}

export default function Hadith() {
  const [selectedBook, setSelectedBook] = useState<HadithBook>(HADITH_BOOKS[0]);
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [hadiths, setHadiths] = useState<HadithEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("english");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showChapterList, setShowChapterList] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: favorites } = useGetHadithFavorites();
  const addFav = useAddHadithFavorite();
  const removeFav = useRemoveHadithFavorite();

  const langInfo = HADITH_LANGUAGES.find(l => l.code === language) ?? HADITH_LANGUAGES[0];

  // Load chapters list when book changes
  useEffect(() => {
    setChapters([]);
    setSelectedChapter(1);
    setChaptersLoading(true);
    fetch(`${CDN}/eng-${selectedBook.fawazBook}.json`)
      .then(r => r.json())
      .then(data => {
        const parsed = parseSections(data);
        setChapters(parsed);
        setChaptersLoading(false);
      })
      .catch(() => setChaptersLoading(false));
  }, [selectedBook]);

  // Load hadiths when book, chapter, or language changes
  const loadHadiths = useCallback(async () => {
    setLoading(true);
    setHadiths([]);

    const arabicLang = "ara";
    const transLang = langInfo.fawazLang;

    try {
      if (language === "arabic") {
        const r = await fetch(`${CDN}/${arabicLang}-${selectedBook.fawazBook}/${selectedChapter}.json`);
        const data = await r.json();
        const items = parseHadiths(data);
        setHadiths(items.map(h => ({ number: h.number, arabic: h.translation || h.arabic, translation: "" })));
      } else {
        // Fetch Arabic + translation in parallel
        const [arabicData, transData] = await Promise.all([
          fetch(`${CDN}/${arabicLang}-${selectedBook.fawazBook}/${selectedChapter}.json`).then(r => r.json()).catch(() => ({})),
          fetch(`${CDN}/${transLang}-${selectedBook.fawazBook}/${selectedChapter}.json`).then(r => r.json()).catch(() => ({})),
        ]);

        const arabicItems = parseHadiths(arabicData);
        const transItems = parseHadiths(transData);

        // Merge by index (chapter hadiths are ordered)
        const merged: HadithEntry[] = arabicItems.map((h, i) => ({
          number: h.number,
          arabic: h.translation || h.arabic,
          translation: transItems[i]?.translation || transItems[i]?.arabic || "Translation not available.",
        }));
        setHadiths(merged);
      }
    } catch {
      setHadiths([]);
    }
    setLoading(false);
  }, [selectedBook, selectedChapter, language, langInfo]);

  useEffect(() => { loadHadiths(); }, [loadHadiths]);

  const isFavorited = (n: number) => favorites?.some(f => f.bookSlug === selectedBook.slug && f.hadithId === n);

  const toggleFavorite = (h: HadithEntry) => {
    const existing = favorites?.find(f => f.bookSlug === selectedBook.slug && f.hadithId === h.number);
    if (existing) {
      removeFav.mutate({ id: existing.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetHadithFavoritesQueryKey() }) });
    } else {
      addFav.mutate(
        { data: { bookSlug: selectedBook.slug, hadithId: h.number, arabicText: h.arabic, englishText: h.translation, chapter: selectedBook.name } },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetHadithFavoritesQueryKey() }) }
      );
    }
  };

  const copyHadith = async (h: HadithEntry) => {
    const parts = [`${selectedBook.name} #${h.number}`];
    if (h.arabic) parts.push(`\n${h.arabic}`);
    if (h.translation) parts.push(`\n${h.translation}`);
    await navigator.clipboard.writeText(parts.join("\n"));
    setCopiedId(h.number);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied", description: "Hadith copied to clipboard." });
  };

  const currentChapter = chapters.find(c => c.id === selectedChapter);
  const prevChapter = chapters.find(c => c.id === selectedChapter - 1);
  const nextChapter = chapters.find(c => c.id === selectedChapter + 1);

  const filtered = hadiths.filter(h => {
    if (!search) return true;
    const q = search.toLowerCase();
    return h.arabic.includes(search) || h.translation.toLowerCase().includes(q) || String(h.number).includes(search);
  });

  const isRtlTrans = langInfo.rtl;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Hadith Library</h1>
        <p className="text-muted-foreground mt-1">10 major collections · Multi-language · Chapter-by-chapter navigation</p>
      </div>

      {/* Book Selector */}
      <div className="flex gap-2 flex-wrap">
        {HADITH_BOOKS.map(book => (
          <button
            key={book.slug}
            onClick={() => { setSelectedBook(book); setSearch(""); }}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border whitespace-nowrap ${
              selectedBook.slug === book.slug
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border/50 text-muted-foreground hover:border-primary/40 hover:bg-primary/5"
            }`}
          >
            {book.name}
          </button>
        ))}
      </div>

      {/* Book Info */}
      <Card className="border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-lg text-foreground">{selectedBook.name}</h2>
                <Badge variant="outline" className="text-primary border-primary/40 shrink-0">{selectedBook.totalHadith.toLocaleString()} Hadiths</Badge>
              </div>
              <p className="text-sm font-arabic text-muted-foreground mt-0.5" dir="rtl">{selectedBook.arabicName}</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">{selectedBook.description}</p>
            </div>
            {chapters.length > 0 && (
              <Badge className="bg-primary/10 text-primary border border-primary/20 shrink-0">
                {chapters.length} Chapters
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search hadiths..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {/* Language Selector */}
        <div className="flex items-center gap-1 bg-card border border-border/50 rounded-lg p-1 overflow-x-auto">
          <Globe className="w-4 h-4 text-muted-foreground ml-1 shrink-0" />
          {HADITH_LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              title={lang.label}
              className={`px-2.5 py-1.5 rounded-md text-sm transition-all shrink-0 ${
                language === lang.code
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-primary/10"
              }`}
            >
              {lang.flag}
            </button>
          ))}
        </div>
      </div>

      {/* Chapter Navigator */}
      {chapters.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowChapterList(!showChapterList)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-card border border-border/50 rounded-lg text-sm hover:border-primary/30 transition-colors"
          >
            <span className="text-foreground font-medium">
              {chaptersLoading ? "Loading chapters..." : currentChapter
                ? `Chapter ${selectedChapter}: ${currentChapter.english ?? currentChapter.arabic ?? ""}`
                : `Chapter ${selectedChapter}`}
            </span>
            {showChapterList ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {showChapterList && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-64 overflow-y-auto border border-border/50 rounded-lg p-2 bg-card">
                  {chapters.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => { setSelectedChapter(ch.id); setShowChapterList(false); setSearch(""); }}
                      className={`text-left px-3 py-2 rounded-md text-xs transition-colors ${
                        selectedChapter === ch.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-primary/10 text-muted-foreground"
                      }`}
                    >
                      <span className="font-medium mr-1">{ch.id}.</span>
                      {ch.english ?? ch.arabic ?? `Chapter ${ch.id}`}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Language banner */}
      {language !== "english" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">
          <span>{langInfo.flag}</span>
          <span>Showing <strong className="text-foreground">{langInfo.label}</strong> translation — Arabic original shown above each hadith</span>
        </div>
      )}

      {/* Favorites counter */}
      {(favorites?.length ?? 0) > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          <span>{favorites?.length} hadiths saved</span>
        </div>
      )}

      {/* Hadith List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-10 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {search ? "No hadith matching your search." : "No hadiths found for this chapter. Try the next chapter."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((h, idx) => {
            const faved = isFavorited(h.number);
            return (
              <motion.div key={`${selectedBook.slug}-ch${selectedChapter}-${h.number}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}>
                <Card className={`border-border/50 bg-card/80 hover:border-primary/30 transition-all ${faved ? "border-red-500/20 bg-red-500/5" : ""}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          {h.number}
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{selectedBook.name}</Badge>
                          {currentChapter?.english && <Badge variant="outline" className="text-[10px] max-w-32 truncate">{currentChapter.english}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => copyHadith(h)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          {copiedId === h.number ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button onClick={() => toggleFavorite(h)} className={`p-1.5 rounded-md transition-colors ${faved ? "text-red-500" : "text-muted-foreground hover:text-red-500 hover:bg-muted"}`}>
                          <Heart className={`w-4 h-4 ${faved ? "fill-current" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Arabic */}
                    {h.arabic && (
                      <div className="mb-4 pb-4 border-b border-border/30">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Arabic</p>
                        <p className="text-base font-arabic text-right text-foreground leading-loose" dir="rtl">{h.arabic}</p>
                      </div>
                    )}

                    {/* Translation */}
                    {language !== "arabic" && h.translation && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{langInfo.label}</span>
                          <span className="text-sm">{langInfo.flag}</span>
                        </div>
                        <p className={`text-sm text-muted-foreground leading-relaxed ${isRtlTrans ? "text-right font-arabic" : ""}`} dir={isRtlTrans ? "rtl" : "ltr"}>
                          {h.translation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Chapter Navigation */}
      {!loading && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => { if (prevChapter) { setSelectedChapter(prevChapter.id); setSearch(""); } }}
            disabled={!prevChapter}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 text-sm disabled:opacity-40 hover:bg-primary/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {prevChapter ? `Ch. ${prevChapter.id}` : "Previous"}
          </button>
          <span className="text-sm text-muted-foreground text-center">
            Chapter {selectedChapter} {chapters.length > 0 ? `of ${chapters.length}` : ""}
            {filtered.length > 0 && ` · ${filtered.length} hadiths`}
          </span>
          <button
            onClick={() => { if (nextChapter) { setSelectedChapter(nextChapter.id); setSearch(""); } }}
            disabled={!nextChapter}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 text-sm disabled:opacity-40 hover:bg-primary/10 transition-colors"
          >
            {nextChapter ? `Ch. ${nextChapter.id}` : "Next"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
