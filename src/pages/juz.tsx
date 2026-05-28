import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetAllSurahProgress } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { SURAHS, JUZ_DATA } from "@/lib/quran-data";

function CircularProgress({ value, size = 56 }: { value: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const stroke = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="4" stroke="hsl(var(--muted))" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="4" stroke="hsl(var(--primary))" fill="none" strokeDasharray={circ} strokeDashoffset={stroke} strokeLinecap="round" className="transition-all duration-700" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="rotate-90 origin-center fill-foreground text-[11px] font-bold" transform={`rotate(90, ${size / 2}, ${size / 2})`}>{value}%</text>
    </svg>
  );
}

export default function Juz() {
  const { data: progressData } = useGetAllSurahProgress();
  const progressMap = new Map(progressData?.map(p => [p.surahId, p]) ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">30 Juz of the Quran</h1>
        <p className="text-muted-foreground mt-1">Navigate and track your progress through each Juz</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {JUZ_DATA.map((juz, idx) => {
          const surahsInJuz = SURAHS.filter(s => s.juz === juz.id);
          const completedSurahs = surahsInJuz.filter(s => progressMap.get(s.id)?.completed).length;
          const pct = surahsInJuz.length > 0 ? Math.round((completedSurahs / surahsInJuz.length) * 100) : 0;
          const firstSurahId = surahsInJuz[0]?.id ?? 1;

          return (
            <motion.div key={juz.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/40 transition-all hover:shadow-md" data-testid={`card-juz-${juz.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Juz</div>
                      <div className="text-3xl font-bold text-foreground">{juz.id}</div>
                    </div>
                    <CircularProgress value={pct} />
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="text-sm font-medium text-foreground">{surahsInJuz.length} Surahs</div>
                    <div className="flex flex-wrap gap-1">
                      {surahsInJuz.slice(0, 4).map(s => (
                        <span key={s.id} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s.englishName}</span>
                      ))}
                      {surahsInJuz.length > 4 && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">+{surahsInJuz.length - 4} more</span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mb-3">{completedSurahs}/{surahsInJuz.length} surahs completed</div>

                  <Link href={`/read/${firstSurahId}`}>
                    <button className="w-full py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors" data-testid={`button-start-juz-${juz.id}`}>
                      {pct > 0 ? "Continue Juz" : "Start Juz"}
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
