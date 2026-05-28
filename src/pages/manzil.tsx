import { Link } from "wouter";
import { motion } from "framer-motion";
import { Clock, BookOpen } from "lucide-react";
import { useGetAllSurahProgress } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SURAHS, MANZIL_DATA } from "@/lib/quran-data";

export default function Manzil() {
  const { data: progressData } = useGetAllSurahProgress();
  const progressMap = new Map(progressData?.map(p => [p.surahId, p]) ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">7 Manzil Divisions</h1>
        <p className="text-muted-foreground mt-1">Complete the Quran in one week by reading one Manzil per day</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {MANZIL_DATA.map((manzil, idx) => {
          const surahsInManzil = SURAHS.filter(s => s.manzil === manzil.id);
          const completedSurahs = surahsInManzil.filter(s => progressMap.get(s.id)?.completed).length;
          const pct = surahsInManzil.length > 0 ? Math.round((completedSurahs / surahsInManzil.length) * 100) : 0;
          const firstSurahId = surahsInManzil[0]?.id ?? 1;
          const gradients = [
            "from-emerald-500/20 to-teal-500/10",
            "from-blue-500/20 to-indigo-500/10",
            "from-purple-500/20 to-violet-500/10",
            "from-amber-500/20 to-orange-500/10",
            "from-rose-500/20 to-pink-500/10",
            "from-cyan-500/20 to-sky-500/10",
            "from-lime-500/20 to-green-500/10",
          ];

          return (
            <motion.div key={manzil.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08, duration: 0.4 }}>
              <Card className={`relative overflow-hidden border-border/50 bg-gradient-to-br ${gradients[idx]} hover:shadow-md transition-all`} data-testid={`card-manzil-${manzil.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Manzil</div>
                      <div className="text-4xl font-bold text-foreground">{manzil.id}</div>
                      <div className="text-sm font-medium text-foreground mt-1">{manzil.name}</div>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-background/50 backdrop-blur-sm flex items-center justify-center">
                      <BookOpen className="w-7 h-7 text-primary" />
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{manzil.description}</p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Clock className="w-3 h-3" />
                    <span>~{manzil.estimatedMinutes} min to read</span>
                    <span>•</span>
                    <span>{surahsInManzil.length} surahs</span>
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>

                  <div className="text-xs text-muted-foreground mb-4">{completedSurahs}/{surahsInManzil.length} surahs completed</div>

                  <Link href={`/read/${firstSurahId}`}>
                    <button className="w-full py-2.5 rounded-xl bg-background/60 backdrop-blur-sm text-foreground text-sm font-medium hover:bg-background/80 transition-colors border border-border/30" data-testid={`button-start-manzil-${manzil.id}`}>
                      {pct > 0 ? "Continue Manzil" : "Begin Manzil"}
                    </button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
