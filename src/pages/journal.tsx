import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenTool, Plus, Star, Flame, X } from "lucide-react";
import { useGetJournalEntries, useCreateJournalEntry, useUpdateJournalEntry, getGetJournalEntriesQueryKey } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SURAHS } from "@/lib/quran-data";

const PROMPTS = [
  "What lesson from this ayah can you apply in your life today?",
  "How does this verse make you feel closer to Allah?",
  "What does this ayah teach you about gratitude?",
  "How can you share the message of this verse with others?",
  "What do you learn about patience from this ayah?",
  "How does this verse inspire you to be a better person?",
  "What blessing are you most grateful for today?",
];

const DAILY_AYAH = { arabic: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ", surah: "Ar-Rahman", verse: 13, translation: "So which of the favors of your Lord would you deny?" };

export default function Journal() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ surahId: 55, verseId: 13, reflection: "", gratitude: "" });
  const prompt = PROMPTS[new Date().getDate() % PROMPTS.length];

  const { data: entries, isLoading } = useGetJournalEntries();
  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();

  const streak = entries?.length ?? 0;

  const handleSave = () => {
    if (!form.reflection.trim()) return;
    createEntry.mutate({
      data: { ...form, date: new Date().toISOString().split("T")[0] }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetJournalEntriesQueryKey() });
        setShowNew(false);
        setForm({ surahId: 55, verseId: 13, reflection: "", gratitude: "" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reflection Journal</h1>
          <p className="text-muted-foreground mt-1">Daily Quranic reflection and gratitude practice</p>
        </div>
        <div className="flex items-center gap-2 bg-orange-500/10 text-orange-500 px-3 py-2 rounded-xl">
          <Flame className="w-4 h-4 fill-current" />
          <span className="text-sm font-semibold">{streak} entries</span>
        </div>
      </div>

      {/* Today's Ayah */}
      <Card className="border-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-secondary fill-current" />
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Today's Reflection Ayah</span>
          </div>
          <p className="text-2xl font-arabic text-right text-foreground leading-relaxed mb-3" dir="rtl">{DAILY_AYAH.arabic}</p>
          <p className="text-sm text-muted-foreground italic mb-1">{DAILY_AYAH.translation}</p>
          <p className="text-xs text-primary">{DAILY_AYAH.surah} : {DAILY_AYAH.verse}</p>

          <div className="mt-4 p-3 bg-background/50 rounded-xl">
            <p className="text-sm text-muted-foreground italic">Today's prompt: <span className="text-foreground not-italic">{prompt}</span></p>
          </div>
        </CardContent>
      </Card>

      {/* New Entry Button */}
      {!showNew && (
        <button onClick={() => setShowNew(true)} className="w-full py-3 rounded-xl border-2 border-dashed border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary flex items-center justify-center gap-2 transition-all" data-testid="button-new-entry">
          <Plus className="w-5 h-5" /> Write Today's Reflection
        </button>
      )}

      {/* New Entry Form */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="border-primary/30 bg-card/90">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">New Reflection</CardTitle>
                  <button onClick={() => setShowNew(false)} className="p-1 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Surah</label>
                    <Select value={String(form.surahId)} onValueChange={v => setForm(f => ({ ...f, surahId: Number(v) }))}>
                      <SelectTrigger data-testid="select-journal-surah"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SURAHS.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.englishName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Verse</label>
                    <Select value={String(form.verseId)} onValueChange={v => setForm(f => ({ ...f, verseId: Number(v) }))}>
                      <SelectTrigger data-testid="select-journal-verse"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: SURAHS.find(s => s.id === form.surahId)?.verses ?? 7 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>Verse {i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Your Reflection</label>
                  <Textarea
                    placeholder={prompt}
                    value={form.reflection}
                    onChange={e => setForm(f => ({ ...f, reflection: e.target.value }))}
                    className="min-h-[120px] text-sm resize-none"
                    data-testid="textarea-reflection"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Gratitude (What are you grateful for today?)</label>
                  <Textarea
                    placeholder="I am grateful for..."
                    value={form.gratitude}
                    onChange={e => setForm(f => ({ ...f, gratitude: e.target.value }))}
                    className="min-h-[80px] text-sm resize-none"
                    data-testid="textarea-gratitude"
                  />
                </div>

                <button onClick={handleSave} disabled={!form.reflection.trim() || createEntry.isPending} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50" data-testid="button-save-entry">
                  {createEntry.isPending ? "Saving..." : "Save Reflection"}
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past Entries */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Past Reflections</h2>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Card key={i} className="border-border/50"><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>)
        ) : !entries?.length ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <PenTool className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No journal entries yet. Write your first reflection above.</p>
            </CardContent>
          </Card>
        ) : (
          entries.slice().reverse().map(entry => {
            const surah = SURAHS.find(s => s.id === entry.surahId);
            return (
              <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-border/50 bg-card/80 hover:border-primary/30 transition-all" data-testid={`journal-entry-${entry.id}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs text-primary font-medium">{surah?.englishName ?? `Surah ${entry.surahId}`} : {entry.verseId}</div>
                      <div className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed mb-3">{entry.reflection}</p>
                    {entry.gratitude && (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-xs text-muted-foreground mb-1">Gratitude:</p>
                        <p className="text-sm text-foreground">{entry.gratitude}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
