import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, X, Mic, Square, Play, Trash2, ChevronDown, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useGetHifzPlans, useCreateHifzPlan, useUpdateHifzPlan, useDeleteHifzPlan, getGetHifzPlansQueryKey, useGetHifzVerseProgress, useRecordHifzVerseProgress, getGetHifzVerseProgressQueryKey, useSaveRecitationSession, getGetRecitationSessionsQueryKey } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SURAHS } from "@/lib/quran-data";

function CircularProgress({ value, size = 64 }: { value: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="5" stroke="hsl(var(--muted))" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="5" stroke="hsl(var(--primary))" fill="none" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} className="transition-all duration-700" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-[12px] font-bold">{value}%</text>
    </svg>
  );
}

export default function Hifz() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<number | null>(null);
  const [newPlan, setNewPlan] = useState({ title: "", targetSurahIds: [] as number[], dailyVerseGoal: 5, targetDate: "" });
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<any>(null);
  const [waveformData, setWaveformData] = useState<number[]>(Array(40).fill(5));
  const mediaRef = useRef<MediaRecorder | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);
  const [recitingSurahId, setRecitingSurahId] = useState(1);
  const [recitingVerseId, setRecitingVerseId] = useState(1);

  const { data: plans, isLoading } = useGetHifzPlans();
  const { data: verseProgress } = useGetHifzVerseProgress();
  const createPlan = useCreateHifzPlan();
  const updatePlan = useUpdateHifzPlan();
  const deletePlan = useDeleteHifzPlan();
  const recordProgress = useRecordHifzVerseProgress();
  const saveRecitation = useSaveRecitationSession();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
        cancelAnimationFrame(animRef.current);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setAnalyzeResult(null);

      const draw = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        setWaveformData(Array.from(data).map(v => Math.max(3, v / 4)));
        animRef.current = requestAnimationFrame(draw);
      };
      draw();
    } catch {
      alert("Microphone access required for recitation.");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
    // Simulate AI analysis
    setTimeout(() => {
      const score = Math.round(70 + Math.random() * 25);
      const result = {
        score,
        pronunciationScore: Math.round(65 + Math.random() * 30),
        tajweedScore: Math.round(60 + Math.random() * 35),
        fluencyScore: Math.round(70 + Math.random() * 25),
        paceScore: Math.round(75 + Math.random() * 20),
        feedback: score > 85 ? "Excellent recitation! Your Tajweed is very accurate." : score > 70 ? "Good recitation. Focus on elongating the Madd letters." : "Keep practicing. Pay attention to the pronunciation of Qalqalah letters.",
        mistakes: score < 85 ? ["Slight elongation error on Madd Tabii'i", "Review Idgham rule at verse boundary"] : [],
      };
      setAnalyzeResult(result);
      saveRecitation.mutate({ data: { surahId: recitingSurahId, verseId: recitingVerseId, ...result } }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetRecitationSessionsQueryKey() })
      });
    }, 2000);
  };

  const handleCreatePlan = () => {
    if (!newPlan.title || !newPlan.targetDate || newPlan.targetSurahIds.length === 0) return;
    const totalVerses = SURAHS.filter(s => newPlan.targetSurahIds.includes(s.id)).reduce((a, s) => a + s.verses, 0);
    createPlan.mutate({
      data: {
        title: newPlan.title,
        targetSurahs: newPlan.targetSurahIds,
        dailyVerseGoal: newPlan.dailyVerseGoal,
        startDate: new Date().toISOString().split("T")[0],
        targetDate: newPlan.targetDate,
        totalVerses,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetHifzPlansQueryKey() });
        setShowCreate(false);
        setNewPlan({ title: "", targetSurahIds: [], dailyVerseGoal: 5, targetDate: "" });
      }
    });
  };

  const markVerseStatus = (surahId: number, verseId: number, status: string) => {
    recordProgress.mutate({ data: { surahId, verseId, status } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetHifzVerseProgressQueryKey() })
    });
  };

  const verseProgressMap = new Map(verseProgress?.map(v => [`${v.surahId}-${v.verseId}`, v]) ?? []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hifz Planner</h1>
          <p className="text-muted-foreground mt-1">Memorize the Quran with spaced repetition</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors" data-testid="button-create-plan">
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </div>

      {/* Create Plan */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="border-primary/30 bg-card/90">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Create Memorization Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Plan Name</label>
                    <Input placeholder="e.g. Juz Amma Memorization" value={newPlan.title} onChange={e => setNewPlan(p => ({ ...p, title: e.target.value }))} data-testid="input-plan-name" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Target Completion Date</label>
                    <Input type="date" value={newPlan.targetDate} onChange={e => setNewPlan(p => ({ ...p, targetDate: e.target.value }))} data-testid="input-plan-date" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Daily Verse Goal</label>
                    <Input type="number" min={1} max={20} value={newPlan.dailyVerseGoal} onChange={e => setNewPlan(p => ({ ...p, dailyVerseGoal: parseInt(e.target.value) }))} data-testid="input-daily-goal" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Target Surahs (click to select)</label>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {SURAHS.filter(s => s.id >= 78).map(s => (
                        <button key={s.id} onClick={() => setNewPlan(p => ({ ...p, targetSurahIds: p.targetSurahIds.includes(s.id) ? p.targetSurahIds.filter(id => id !== s.id) : [...p.targetSurahIds, s.id] }))} className={`text-[10px] px-2 py-1 rounded-full transition-colors ${newPlan.targetSurahIds.includes(s.id) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/20"}`} data-testid={`button-select-surah-${s.id}`}>
                          {s.englishName}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleCreatePlan} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90" data-testid="button-save-plan">Create Plan</button>
                  <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-muted text-muted-foreground text-sm rounded-lg">Cancel</button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plans */}
      {isLoading ? (
        Array.from({ length: 2 }).map((_, i) => <Card key={i} className="border-border/50"><CardContent className="p-5"><Skeleton className="h-32 w-full" /></CardContent></Card>)
      ) : plans?.length === 0 ? (
        <Card className="border-border/50"><CardContent className="p-10 text-center">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No memorization plans yet. Create your first plan to get started.</p>
        </CardContent></Card>
      ) : (
        plans?.map(plan => {
          const pct = plan.totalVerses > 0 ? Math.round((plan.memorizedVerses / plan.totalVerses) * 100) : 0;
          const targetSurahIds = typeof plan.targetSurahs === "string" ? JSON.parse(plan.targetSurahs) : plan.targetSurahs;
          const targetSurahs = SURAHS.filter(s => targetSurahIds.includes(s.id));
          const daysLeft = Math.max(0, Math.ceil((new Date(plan.targetDate).getTime() - Date.now()) / 86400000));

          return (
            <motion.div key={plan.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-border/50 bg-card/80" data-testid={`card-plan-${plan.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <CircularProgress value={pct} />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{plan.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{plan.memorizedVerses}/{plan.totalVerses} verses · {daysLeft} days left</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {targetSurahs.slice(0, 4).map(s => <Badge key={s.id} variant="outline" className="text-[10px] px-1.5">{s.englishName}</Badge>)}
                          {targetSurahs.length > 4 && <Badge variant="outline" className="text-[10px] px-1.5">+{targetSurahs.length - 4}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)} className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground transition-colors">
                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedPlan === plan.id ? "rotate-180" : ""}`} />
                      </button>
                      <button onClick={() => deletePlan.mutate({ id: plan.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetHifzPlansQueryKey() }) })} className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors" data-testid={`button-delete-plan-${plan.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedPlan === plan.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="mt-4 pt-4 border-t border-border/30">
                          <h4 className="text-sm font-medium mb-3 text-foreground">Verse Progress Tracker</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {targetSurahs.map(surah => (
                              <div key={surah.id} className="space-y-1">
                                <div className="text-xs font-medium text-muted-foreground">{surah.englishName}</div>
                                <div className="flex flex-wrap gap-1">
                                  {Array.from({ length: Math.min(surah.verses, 30) }, (_, i) => {
                                    const vp = verseProgressMap.get(`${surah.id}-${i + 1}`);
                                    return (
                                      <button
                                        key={i}
                                        onClick={() => markVerseStatus(surah.id, i + 1, vp?.status === "memorized" ? "weak" : vp?.status === "weak" ? "not_started" : "memorized")}
                                        title={`Verse ${i + 1}: ${vp?.status ?? "not started"}`}
                                        className={`w-6 h-6 rounded text-[9px] font-bold transition-all ${vp?.status === "memorized" ? "bg-primary text-primary-foreground" : vp?.status === "weak" ? "bg-orange-400 text-white" : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"}`}
                                        data-testid={`button-verse-${surah.id}-${i + 1}`}
                                      >
                                        {i + 1}
                                      </button>
                                    );
                                  })}
                                  {surah.verses > 30 && <span className="text-[10px] text-muted-foreground self-center">+{surah.verses - 30} more</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-4 mt-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary inline-block"></span> Memorized</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400 inline-block"></span> Weak</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted inline-block"></span> Not Started</span>
                          </div>
                          <button
                            onClick={() => updatePlan.mutate({ data: { memorizedVerses: Math.min(plan.totalVerses, plan.memorizedVerses + plan.dailyVerseGoal) }, id: plan.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetHifzPlansQueryKey() }) })}
                            className="mt-3 px-4 py-2 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors"
                            data-testid={`button-mark-progress-${plan.id}`}
                          >
                            + Mark {plan.dailyVerseGoal} verses as memorized today
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })
      )}

      {/* Recitation Practice Section */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary" /> Recitation Practice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Surah</label>
              <Select value={String(recitingSurahId)} onValueChange={v => setRecitingSurahId(Number(v))}>
                <SelectTrigger data-testid="select-reciting-surah"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SURAHS.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.englishName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Verse</label>
              <Input type="number" min={1} max={SURAHS.find(s => s.id === recitingSurahId)?.verses ?? 1} value={recitingVerseId} onChange={e => setRecitingVerseId(Number(e.target.value))} data-testid="input-reciting-verse" />
            </div>
          </div>

          {/* Waveform */}
          <div className="flex items-center justify-center gap-0.5 h-16 bg-muted/30 rounded-xl overflow-hidden">
            {waveformData.map((h, i) => (
              <motion.div key={i} animate={{ height: `${recording ? h : 4}px` }} transition={{ duration: 0.1 }} className={`w-1.5 rounded-full ${recording ? "bg-primary" : "bg-muted-foreground/30"}`} />
            ))}
          </div>

          <div className="flex items-center justify-center gap-4">
            {!recording ? (
              <button onClick={startRecording} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors" data-testid="button-start-recording">
                <Mic className="w-5 h-5" /> Start Recording
              </button>
            ) : (
              <button onClick={stopRecording} className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors" data-testid="button-stop-recording">
                <Square className="w-5 h-5" /> Stop & Analyze
              </button>
            )}
            {audioBlob && !recording && (
              <button onClick={() => { const url = URL.createObjectURL(audioBlob); const a = new Audio(url); a.play(); }} className="flex items-center gap-2 px-4 py-2 bg-card border border-border/50 text-sm rounded-full hover:bg-muted transition-colors" data-testid="button-play-recording">
                <Play className="w-4 h-4" /> Replay
              </button>
            )}
          </div>

          {/* Analysis Results */}
          <AnimatePresence>
            {analyzeResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">{analyzeResult.score}%</div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Pronunciation", value: analyzeResult.pronunciationScore },
                    { label: "Tajweed", value: analyzeResult.tajweedScore },
                    { label: "Fluency", value: analyzeResult.fluencyScore },
                    { label: "Pace", value: analyzeResult.paceScore },
                  ].map(item => (
                    <div key={item.label} className="bg-muted/30 rounded-xl p-3">
                      <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                      <Progress value={item.value} className="h-2 mb-1" />
                      <div className="text-sm font-medium text-foreground">{item.value}%</div>
                    </div>
                  ))}
                </div>
                <div className={`p-3 rounded-xl text-sm ${analyzeResult.score > 85 ? "bg-primary/10 text-primary" : analyzeResult.score > 70 ? "bg-orange-500/10 text-orange-600" : "bg-red-500/10 text-red-600"}`}>
                  {analyzeResult.feedback}
                </div>
                {analyzeResult.mistakes.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Points to improve:</div>
                    {analyzeResult.mistakes.map((m: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground"><AlertCircle className="w-3 h-3 text-orange-500 shrink-0 mt-0.5" />{m}</div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
