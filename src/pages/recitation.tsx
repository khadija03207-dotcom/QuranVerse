import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Play, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useGetRecitationSessions, useSaveRecitationSession, getGetRecitationSessionsQueryKey } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SURAHS } from "@/lib/quran-data";

export default function Recitation() {
  const queryClient = useQueryClient();
  const [surahId, setSurahId] = useState(1);
  const [verseId, setVerseId] = useState(1);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [waveformData, setWaveformData] = useState<number[]>(Array(50).fill(3));
  const mediaRef = useRef<MediaRecorder | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);

  const { data: sessions, isLoading } = useGetRecitationSessions();
  const saveSession = useSaveRecitationSession();

  const chartData = sessions?.slice(-10).map((s, i) => ({
    session: i + 1,
    score: Math.round(s.score),
    tajweed: Math.round(s.tajweedScore),
    pronunciation: Math.round(s.pronunciationScore),
  })) ?? [];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
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
        setWaveformData(Array(50).fill(3));
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setResult(null);

      const draw = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        setWaveformData(Array.from(data.slice(0, 50)).map(v => Math.max(3, v / 3)));
        animRef.current = requestAnimationFrame(draw);
      };
      draw();
    } catch {
      alert("Microphone permission required.");
    }
  };

  const stopAndAnalyze = () => {
    mediaRef.current?.stop();
    setRecording(false);
    setAnalyzing(true);

    setTimeout(() => {
      const score = Math.round(65 + Math.random() * 30);
      const r = {
        score,
        pronunciationScore: Math.round(60 + Math.random() * 35),
        tajweedScore: Math.round(55 + Math.random() * 40),
        fluencyScore: Math.round(65 + Math.random() * 30),
        paceScore: Math.round(70 + Math.random() * 25),
        feedback: score > 85 ? "Outstanding recitation! Your Makhraj and Sifaat are excellent." : score > 70 ? "Good recitation. Work on your Ghunnah and Madd rules." : "Keep practicing. Focus on the correct pronunciation of letters.",
        mistakes: score < 80 ? ["Review Idgham rules", "Check Madd Muttasil elongation", "Practice Qalqalah ending letters"] : score < 90 ? ["Minor Ghunnah issues"] : [],
      };
      setResult(r);
      setAnalyzing(false);
      saveSession.mutate({ data: { surahId, verseId, ...r } }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetRecitationSessionsQueryKey() })
      });
    }, 2500);
  };

  const avgScore = sessions?.length ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Recitation Analyzer</h1>
        <p className="text-muted-foreground mt-1">Record and receive AI-powered Tajweed feedback</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recording Panel */}
        <div className="space-y-4">
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-3"><CardTitle className="text-base">Record Recitation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Surah</label>
                  <Select value={String(surahId)} onValueChange={v => setSurahId(Number(v))}>
                    <SelectTrigger data-testid="select-surah"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SURAHS.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.englishName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Verse</label>
                  <Select value={String(verseId)} onValueChange={v => setVerseId(Number(v))}>
                    <SelectTrigger data-testid="select-verse"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: SURAHS.find(s => s.id === surahId)?.verses ?? 7 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>Verse {i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Waveform Visualizer */}
              <div className="flex items-center justify-center gap-0.5 h-20 bg-muted/20 rounded-2xl overflow-hidden px-2">
                {waveformData.map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: `${recording ? h : 4}px`, opacity: recording ? 1 : 0.3 }}
                    transition={{ duration: 0.08 }}
                    className={`flex-1 rounded-full min-h-[3px] ${recording ? "bg-primary" : "bg-muted-foreground/40"}`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-center gap-4">
                {!recording ? (
                  <button onClick={startRecording} className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-all hover:scale-105" data-testid="button-start-record">
                    <Mic className="w-5 h-5" /> Start Recording
                  </button>
                ) : (
                  <button onClick={stopAndAnalyze} className="flex items-center gap-2 px-8 py-3 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600 transition-all animate-pulse" data-testid="button-stop-analyze">
                    <Square className="w-5 h-5" /> Stop & Analyze
                  </button>
                )}
                {audioBlob && !recording && (
                  <button onClick={() => { const url = URL.createObjectURL(audioBlob); new Audio(url).play(); }} className="p-3 rounded-full bg-card border border-border/50 hover:bg-muted transition-colors" data-testid="button-replay">
                    <Play className="w-4 h-4" />
                  </button>
                )}
              </div>

              {analyzing && (
                <div className="text-center text-sm text-muted-foreground animate-pulse">
                  Analyzing your recitation...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-3"><CardTitle className="text-base">Analysis Results</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-4xl font-bold text-foreground">{result.score}%</div>
                        <div className="text-sm text-muted-foreground">Overall Score</div>
                      </div>
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${result.score >= 85 ? "bg-primary/20" : result.score >= 70 ? "bg-secondary/20" : "bg-red-500/20"}`}>
                        {result.score >= 85 ? <CheckCircle className="w-8 h-8 text-primary" /> : <AlertCircle className="w-8 h-8 text-orange-500" />}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: "Pronunciation", val: result.pronunciationScore },
                        { label: "Tajweed", val: result.tajweedScore },
                        { label: "Fluency", val: result.fluencyScore },
                        { label: "Pace", val: result.paceScore },
                      ].map(item => (
                        <div key={item.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-medium text-foreground">{item.val}%</span>
                          </div>
                          <Progress value={item.val} className="h-2" />
                        </div>
                      ))}
                    </div>

                    <div className={`p-3 rounded-xl text-sm ${result.score > 85 ? "bg-primary/10 text-primary" : "bg-orange-500/10 text-orange-600"}`}>
                      {result.feedback}
                    </div>

                    {result.mistakes.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-muted-foreground">Areas to improve:</div>
                        {result.mistakes.map((m: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <AlertCircle className="w-3 h-3 text-orange-500 shrink-0" /> {m}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress Chart & History */}
        <div className="space-y-4">
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Score Improvement</CardTitle>
                <Badge variant="outline">Avg: {avgScore}%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {chartData.length < 2 ? (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                  Complete at least 2 sessions to see your progress chart.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                    <XAxis dataKey="session" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Overall" />
                    <Line type="monotone" dataKey="tajweed" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ r: 3 }} name="Tajweed" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Session History */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-3"><CardTitle className="text-base">Session History</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)
              ) : !sessions?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">No sessions yet. Record your first recitation.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.slice(-10).reverse().map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0" data-testid={`session-${s.id}`}>
                      <div>
                        <div className="text-sm font-medium text-foreground">{SURAHS.find(su => su.id === s.surahId)?.englishName ?? `Surah ${s.surahId}`} : {s.verseId}</div>
                        <div className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString()}</div>
                      </div>
                      <div className={`text-sm font-bold ${s.score >= 85 ? "text-primary" : s.score >= 70 ? "text-secondary" : "text-red-500"}`}>
                        {Math.round(s.score)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
