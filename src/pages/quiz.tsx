import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Clock, Check, X, Brain, Zap } from "lucide-react";
import { useGetQuizResults, useGetQuizStats, useSaveQuizResult, getGetQuizResultsQueryKey, getGetQuizStatsQueryKey } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SURAHS } from "@/lib/quran-data";

type QuizMode = "mcq" | "meaning";
type QuizState = "setup" | "active" | "result";

interface Question { question: string; options: string[]; correct: number; }

const MEANING_QUESTIONS: Question[] = [
  { question: "What does 'Alhamdulillah' mean?", options: ["God is great", "All praise is for Allah", "Peace be upon you", "In the name of Allah"], correct: 1 },
  { question: "What does 'Subhanallah' mean?", options: ["Glory be to Allah", "Allah is the greatest", "May Allah bless you", "There is no god but Allah"], correct: 0 },
  { question: "What does 'Allahu Akbar' mean?", options: ["Allah is merciful", "Allah is the greatest", "Allah is one", "Allah is eternal"], correct: 1 },
  { question: "What does 'Bismillah' mean?", options: ["Praise be to Allah", "In the name of Allah", "Allah is sufficient", "Peace from Allah"], correct: 1 },
  { question: "What does 'Inshallah' mean?", options: ["Thanks to Allah", "If Allah wills", "Allah is watching", "By Allah's grace"], correct: 1 },
  { question: "What does 'Mashallah' mean?", options: ["Allah has willed it", "Glory to Allah", "Allah is with us", "In Allah's name"], correct: 0 },
  { question: "What is 'Tawbah'?", options: ["Prayer", "Fasting", "Repentance", "Charity"], correct: 2 },
  { question: "What is 'Sabr'?", options: ["Gratitude", "Patience", "Humility", "Justice"], correct: 1 },
  { question: "What is 'Iman'?", options: ["Prayer", "Faith", "Charity", "Pilgrimage"], correct: 1 },
  { question: "What is 'Taqwa'?", options: ["Prayer", "Fasting", "God-consciousness", "Pilgrimage"], correct: 2 },
];

function generateMCQs(): Question[] {
  return MEANING_QUESTIONS.sort(() => Math.random() - 0.5).slice(0, 5);
}

const BADGES = [
  { id: "first_quiz", name: "First Step", description: "Complete your first quiz", xp: 100 },
  { id: "perfect_score", name: "Perfectionist", description: "Score 100% on a quiz", xp: 500 },
  { id: "consistency_star", name: "Consistency Star", description: "Complete 5 quizzes", xp: 300 },
  { id: "tajweed_champion", name: "Tajweed Champion", description: "Score above 80% three times", xp: 400 },
  { id: "hifz_master", name: "Hifz Master", description: "Complete Hifz quiz mode", xp: 600 },
];

export default function Quiz() {
  const queryClient = useQueryClient();
  const [quizState, setQuizState] = useState<QuizState>("setup");
  const [mode, setMode] = useState<QuizMode>("mcq");
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);

  const { data: stats, isLoading: statsLoading } = useGetQuizStats();
  const { data: results } = useGetQuizResults();
  const saveResult = useSaveQuizResult();

  useEffect(() => {
    if (!timerActive) return;
    if (timeLeft === 0) { handleAnswer(-1); return; }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, timerActive]);

  const startQuiz = () => {
    const qs = generateMCQs();
    setQuestions(qs);
    setCurrentQ(0);
    setScore(0);
    setAnswers([]);
    setSelected(null);
    setTimeLeft(30);
    setTimerActive(true);
    setQuizState("active");
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setTimerActive(false);
    const correct = idx === questions[currentQ].correct;
    const newAnswers = [...answers, correct];
    setAnswers(newAnswers);
    if (correct) setScore(s => s + 1);

    setTimeout(() => {
      if (currentQ + 1 >= questions.length) {
        const finalScore = newAnswers.filter(Boolean).length;
        const pct = Math.round((finalScore / questions.length) * 100);
        const xp = finalScore * 10 + (pct === 100 ? 50 : 0);
        saveResult.mutate({ data: { surahId: selectedSurah, score: pct, totalQuestions: questions.length, xpEarned: xp, mode } }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetQuizResultsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetQuizStatsQueryKey() });
          }
        });
        setQuizState("result");
      } else {
        setCurrentQ(q => q + 1);
        setSelected(null);
        setTimeLeft(30);
        setTimerActive(true);
      }
    }, 1000);
  };

  const finalScore = Math.round((score / Math.max(questions.length, 1)) * 100);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Quiz Zone</h1>
        <p className="text-muted-foreground mt-1">Test your Quranic knowledge and earn XP</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {statsLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Card key={i} className="border-border/50"><CardContent className="p-4"><Skeleton className="h-10 w-full" /></CardContent></Card>)
        ) : (
          <>
            <Card className="border-border/50 bg-card/80">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-secondary">{stats?.totalXp ?? 0}</div>
                <div className="text-xs text-muted-foreground">Total XP</div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/80">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats?.totalQuizzes ?? 0}</div>
                <div className="text-xs text-muted-foreground">Quizzes Done</div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/80">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{Math.round(stats?.avgScore ?? 0)}%</div>
                <div className="text-xs text-muted-foreground">Avg Score</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <AnimatePresence mode="wait">
        {quizState === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <Card className="border-border/50 bg-card/80">
              <CardHeader className="pb-3"><CardTitle className="text-base">Configure Your Quiz</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Quiz Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([["mcq", "Meaning MCQ", "Test Quran vocabulary and meanings"], ["meaning", "Knowledge Quiz", "General Islamic knowledge"]] as const).map(([m, label, desc]) => (
                      <button key={m} onClick={() => setMode(m)} className={`p-3 rounded-xl border-2 text-left transition-all ${mode === m ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"}`} data-testid={`button-mode-${m}`}>
                        <div className="text-sm font-medium text-foreground">{label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Surah (for context)</label>
                  <Select value={String(selectedSurah)} onValueChange={v => setSelectedSurah(Number(v))}>
                    <SelectTrigger data-testid="select-quiz-surah"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SURAHS.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.englishName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <button onClick={startQuiz} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2" data-testid="button-start-quiz">
                  <Zap className="w-5 h-5" /> Start Quiz
                </button>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card className="border-border/50 bg-card/80">
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Trophy className="w-4 h-4 text-secondary" /> Badges</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {BADGES.map(badge => {
                    const earned = (stats?.badges ?? []).includes(badge.id);
                    return (
                      <div key={badge.id} className={`p-3 rounded-xl border ${earned ? "border-secondary/50 bg-secondary/10" : "border-border/30 bg-muted/30 opacity-50"}`} data-testid={`badge-${badge.id}`}>
                        <div className="text-lg mb-1">{earned ? "★" : "○"}</div>
                        <div className="text-xs font-medium text-foreground">{badge.name}</div>
                        <div className="text-[10px] text-muted-foreground">{badge.description}</div>
                        <div className="text-[10px] text-secondary font-medium mt-1">+{badge.xp} XP</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Results */}
            {(results?.length ?? 0) > 0 && (
              <Card className="border-border/50 bg-card/80">
                <CardHeader className="pb-3"><CardTitle className="text-base">Recent Quiz Results</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results?.slice(0, 5).map(r => (
                      <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                        <div className="text-sm text-foreground">{SURAHS.find(s => s.id === r.surahId)?.englishName ?? `Surah ${r.surahId}`}</div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-[10px]">{r.mode}</Badge>
                          <span className={`text-sm font-bold ${r.score >= 80 ? "text-primary" : r.score >= 60 ? "text-secondary" : "text-destructive"}`}>{r.score}%</span>
                          <span className="text-xs text-secondary">+{r.xpEarned} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {quizState === "active" && questions[currentQ] && (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="border-border/50 bg-card/80">
              <CardContent className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Question {currentQ + 1} of {questions.length}</div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${timeLeft <= 10 ? "text-red-500" : "text-muted-foreground"}`}>
                    <Clock className="w-4 h-4" /> {timeLeft}s
                  </div>
                </div>
                <Progress value={((currentQ + 1) / questions.length) * 100} className="h-1" />

                <div className={`h-1.5 rounded-full bg-gradient-to-r from-primary to-secondary transition-all`} style={{ width: `${(timeLeft / 30) * 100}%` }} />

                <h3 className="text-lg font-semibold text-foreground">{questions[currentQ].question}</h3>

                <div className="space-y-3">
                  {questions[currentQ].options.map((opt, i) => {
                    let cls = "border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5";
                    if (selected !== null) {
                      if (i === questions[currentQ].correct) cls = "border-primary bg-primary/10";
                      else if (i === selected && selected !== questions[currentQ].correct) cls = "border-red-500 bg-red-500/10";
                      else cls = "border-border/30 opacity-50";
                    }
                    return (
                      <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null} className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${cls}`} data-testid={`button-option-${i}`}>
                        <span className="text-sm font-medium text-foreground">{opt}</span>
                        {selected !== null && i === questions[currentQ].correct && <Check className="w-5 h-5 text-primary" />}
                        {selected !== null && i === selected && selected !== questions[currentQ].correct && <X className="w-5 h-5 text-red-500" />}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {quizState === "result" && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <Card className="border-border/50 bg-card/80">
              <CardContent className="p-8 text-center space-y-6">
                <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-3xl font-bold ${finalScore >= 80 ? "bg-primary/20 text-primary" : finalScore >= 60 ? "bg-secondary/20 text-secondary" : "bg-red-500/20 text-red-500"}`}>
                  {finalScore}%
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{finalScore >= 80 ? "Excellent!" : finalScore >= 60 ? "Good Job!" : "Keep Practicing!"}</h2>
                  <p className="text-muted-foreground mt-1">{score} out of {questions.length} correct</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-secondary font-bold text-lg">
                  <Star className="w-5 h-5 fill-current" /> +{score * 10} XP earned
                </div>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setQuizState("setup")} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors" data-testid="button-new-quiz">New Quiz</button>
                  <button onClick={startQuiz} className="px-6 py-3 bg-card border border-border/50 text-foreground rounded-xl font-medium hover:bg-muted transition-colors" data-testid="button-retry-quiz">Retry</button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
