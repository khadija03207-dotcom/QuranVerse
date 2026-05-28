import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { BookOpen, Flame, Target, Mic, Brain, PenTool, Star, ChevronRight, Trophy, Calendar } from "lucide-react";
import { useGetProgressStats, useGetHifzPlans, useGetJournalEntries } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { SURAHS } from "@/lib/quran-data";

const DAILY_AYAHS = [
  { arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", surah: "Ash-Sharh", verse: 6, translation: "Indeed, with hardship will be ease." },
  { arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", surah: "Ash-Sharh", verse: 5, translation: "For indeed, with hardship will be ease." },
  { arabic: "وَبَشِّرِ الصَّابِرِينَ", surah: "Al-Baqarah", verse: 155, translation: "And give good tidings to the patient." },
  { arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", surah: "Ali 'Imran", verse: 173, translation: "Allah is sufficient for us, and He is the best disposer of affairs." },
  { arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً", surah: "Al-Baqarah", verse: 201, translation: "Our Lord, give us in this world that which is good." },
];

const todaysAyah = DAILY_AYAHS[new Date().getDay() % DAILY_AYAHS.length];

function StatCard({ title, value, icon: Icon, subtitle, color }: { title: string; value: string | number; icon: typeof BookOpen; subtitle?: string; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">{value}</div>
          {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useGetProgressStats();
  const { data: hifzPlans } = useGetHifzPlans();
  const { data: journalEntries } = useGetJournalEntries();

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
  const activeHifzPlan = hifzPlans?.[0];

  return (
    <div className="space-y-8">
      {/* Daily Ayah */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent backdrop-blur-sm">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-secondary" />
              <span className="text-sm font-semibold text-secondary uppercase tracking-wider">Ayah of the Day</span>
            </div>
            <p className="text-2xl md:text-3xl font-arabic text-right text-foreground leading-relaxed mb-4" dir="rtl">
              {todaysAyah.arabic}
            </p>
            <p className="text-base text-muted-foreground italic mb-2">{todaysAyah.translation}</p>
            <p className="text-sm text-primary font-medium">— {todaysAyah.surah} : {todaysAyah.verse}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border/50"><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <StatCard title="Reading Streak" value={`${stats?.readingStreak ?? 0} days`} icon={Flame} color="bg-orange-500/20 text-orange-500" subtitle="Keep it going!" />
            <StatCard title="Verses Read" value={stats?.totalVersesRead ?? 0} icon={BookOpen} color="bg-primary/20 text-primary" subtitle="Total lifetime" />
            <StatCard title="Recitation Score" value={`${Math.round(stats?.recitationAvgScore ?? 0)}%`} icon={Mic} color="bg-blue-500/20 text-blue-500" subtitle="Average accuracy" />
            <StatCard title="Quiz XP" value={stats?.quizXp ?? 0} icon={Trophy} color="bg-secondary/20 text-secondary" subtitle="Experience points" />
          </>
        )}
      </div>

      {/* Weekly Reading Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Weekly Reading</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="verses" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Minutes Read This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={weeklyData}>
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="minutes" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary) / 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Hifz Plan */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Active Hifz Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeHifzPlan ? (
              <div className="space-y-3">
                <div className="font-medium text-sm">{activeHifzPlan.title}</div>
                <Progress value={(activeHifzPlan.memorizedVerses / activeHifzPlan.totalVerses) * 100} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {activeHifzPlan.memorizedVerses} / {activeHifzPlan.totalVerses} verses memorized
                </div>
                <Link href="/hifz">
                  <div className="flex items-center gap-1 text-xs text-primary font-medium cursor-pointer hover:gap-2 transition-all">
                    Continue Plan <ChevronRight className="w-3 h-3" />
                  </div>
                </Link>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground space-y-3">
                <p>No active memorization plan.</p>
                <Link href="/hifz">
                  <div className="text-xs text-primary font-medium cursor-pointer hover:underline">Create a Plan →</div>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { href: "/read/1", label: "Read Quran", icon: BookOpen, color: "bg-primary/10 text-primary hover:bg-primary/20" },
                { href: "/hifz", label: "Hifz Planner", icon: Target, color: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20" },
                { href: "/recitation", label: "Recitation", icon: Mic, color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" },
                { href: "/quiz", label: "Quiz Zone", icon: Brain, color: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20" },
                { href: "/journal", label: "Journal", icon: PenTool, color: "bg-green-500/10 text-green-500 hover:bg-green-500/20" },
                { href: "/hadith", label: "Hadith", icon: BookOpen, color: "bg-secondary/10 text-secondary hover:bg-secondary/20" },
              ].map(item => (
                <Link key={item.href} href={item.href}>
                  <div className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl cursor-pointer transition-all ${item.color}`} data-testid={`quick-access-${item.label.toLowerCase().replace(" ", "-")}`}>
                    <item.icon className="w-5 h-5" />
                    <span className="text-xs font-medium text-center">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.completedSurahs ?? 0}</div>
              <div className="text-sm text-muted-foreground">Surahs Completed</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.completedJuz ?? 0}</div>
              <div className="text-sm text-muted-foreground">Juz Completed</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <PenTool className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.journalStreak ?? 0}</div>
              <div className="text-sm text-muted-foreground">Journal Streak</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
