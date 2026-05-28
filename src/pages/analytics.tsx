import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Flame, BookOpen, Target, Mic, Brain, PenTool, TrendingUp, Calendar } from "lucide-react";
import { useGetProgressStats, useGetQuizResults, useGetRecitationSessions, useGetReadingHistory, useGetAllSurahProgress } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { SURAHS } from "@/lib/quran-data";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(160 94% 30% / 0.7)", "hsl(42 93% 50% / 0.7)"];

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useGetProgressStats();
  const { data: quizResults } = useGetQuizResults();
  const { data: sessions } = useGetRecitationSessions();
  const { data: surahProgress } = useGetAllSurahProgress();

  const defaultWeekly = [
    { day: "Mon", verses: 12, minutes: 15 },
    { day: "Tue", verses: 20, minutes: 25 },
    { day: "Wed", verses: 8, minutes: 10 },
    { day: "Thu", verses: 35, minutes: 40 },
    { day: "Fri", verses: 50, minutes: 60 },
    { day: "Sat", verses: 25, minutes: 30 },
    { day: "Sun", verses: 18, minutes: 22 },
  ];

  const weeklyData = stats?.weeklyData?.length ? stats.weeklyData : defaultWeekly;

  const quizChartData = quizResults?.slice(-10).map((r, i) => ({
    quiz: i + 1,
    score: r.score,
    xp: r.xpEarned,
  })) ?? [];

  const recitationChartData = sessions?.slice(-10).map((s, i) => ({
    session: i + 1,
    score: Math.round(s.score),
    tajweed: Math.round(s.tajweedScore),
  })) ?? [];

  const completedSurahs = surahProgress?.filter(p => p.completed) ?? [];
  const favoritedSurahs = surahProgress?.filter(p => p.favorited) ?? [];

  const surahTypeData = [
    { name: "Completed", value: completedSurahs.length },
    { name: "In Progress", value: (surahProgress?.length ?? 0) - completedSurahs.length },
    { name: "Not Started", value: 114 - (surahProgress?.length ?? 0) },
  ];

  const statCards = [
    { icon: Flame, label: "Reading Streak", value: `${stats?.readingStreak ?? 0} days`, color: "text-orange-500 bg-orange-500/20" },
    { icon: BookOpen, label: "Total Verses Read", value: stats?.totalVersesRead ?? 0, color: "text-primary bg-primary/20" },
    { icon: BookOpen, label: "Minutes Read", value: `${stats?.totalMinutesRead ?? 0}`, color: "text-blue-500 bg-blue-500/20" },
    { icon: Target, label: "Surahs Completed", value: stats?.completedSurahs ?? 0, color: "text-green-500 bg-green-500/20" },
    { icon: Brain, label: "Avg Quiz Score", value: quizResults?.length ? `${Math.round(quizResults.reduce((a, r) => a + r.score, 0) / quizResults.length)}%` : "N/A", color: "text-purple-500 bg-purple-500/20" },
    { icon: Mic, label: "Recitation Avg", value: `${Math.round(stats?.recitationAvgScore ?? 0)}%`, color: "text-secondary bg-secondary/20" },
    { icon: PenTool, label: "Journal Streak", value: `${stats?.journalStreak ?? 0} days`, color: "text-pink-500 bg-pink-500/20" },
    { icon: Brain, label: "Total Quiz XP", value: stats?.quizXp ?? 0, color: "text-amber-500 bg-amber-500/20" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your personalized progress and learning insights</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border/50 bg-card/80" data-testid={`stat-${card.label.toLowerCase().replace(/ /g, "-")}`}>
              <CardContent className="p-4">
                {statsLoading ? <Skeleton className="h-12 w-full" /> : (
                  <>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${card.color}`}>
                      <card.icon className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">{card.value}</div>
                    <div className="text-xs text-muted-foreground">{card.label}</div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Reading */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Weekly Reading (Verses)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="verses" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reading Time */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-secondary" /> Daily Minutes Read</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={weeklyData}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="minutes" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary) / 0.2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quiz Progress */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Brain className="w-4 h-4 text-purple-500" /> Quiz Score Trend</CardTitle></CardHeader>
          <CardContent>
            {quizChartData.length < 2 ? (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">Complete more quizzes to see trend</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={quizChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                  <XAxis dataKey="quiz" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Score %" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Surah Progress Donut */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Surah Completion</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={surahTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={3}>
                  {surahTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {surahTypeData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <div className="text-xs text-muted-foreground flex-1">{item.name}</div>
                  <div className="text-xs font-medium text-foreground">{item.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recitation Progress */}
      {recitationChartData.length >= 2 && (
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Mic className="w-4 h-4 text-primary" /> Recitation Score History</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={recitationChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="session" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Overall" />
                <Line type="monotone" dataKey="tajweed" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ r: 3 }} name="Tajweed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Favorited Surahs */}
      {favoritedSurahs.length > 0 && (
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Favorite Surahs</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {favoritedSurahs.map(p => {
                const surah = SURAHS.find(s => s.id === p.surahId);
                return surah ? (
                  <div key={p.surahId} className="px-3 py-1.5 bg-red-500/10 text-red-600 rounded-full text-xs font-medium">{surah.englishName}</div>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
