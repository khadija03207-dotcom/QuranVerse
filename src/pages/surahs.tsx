import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Search, Filter, BookOpen, Heart, ChevronRight } from "lucide-react";
import { useGetAllSurahProgress, useUpdateSurahProgress, getGetAllSurahProgressQueryKey } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SURAHS } from "@/lib/quran-data";

type FilterType = "all" | "Meccan" | "Medinan";

export default function Surahs() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const { data: progressData, isLoading } = useGetAllSurahProgress();
  const queryClient = useQueryClient();
  const favoriteMutation = useUpdateSurahProgress();

  const progressMap = new Map(progressData?.map(p => [p.surahId, p]) ?? []);

  const filtered = SURAHS.filter(s => {
    const matchSearch = s.englishName.toLowerCase().includes(search.toLowerCase()) ||
      s.arabicName.includes(search) ||
      s.urduName.includes(search) ||
      String(s.id).includes(search);
    const matchFilter = filter === "all" || s.type === filter;
    return matchSearch && matchFilter;
  });

  const toggleFavorite = (surahId: number, currentlyFav: boolean, totalVerses: number) => {
    favoriteMutation.mutate(
      { data: { favorited: !currentlyFav, totalVerses }, surahId },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAllSurahProgressQueryKey() }) }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">The Holy Quran</h1>
        <p className="text-muted-foreground mt-1">114 Surahs — Select one to begin reading</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search surahs..."
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-surah-search"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "Meccan", "Medinan"] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-primary/10 border border-border/50"}`}
              data-testid={`filter-${f}`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} surahs</p>

      {/* Surah Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((surah, idx) => {
          const progress = progressMap.get(surah.id);
          const pct = progress ? Math.round((progress.lastReadVerse / surah.verses) * 100) : 0;

          return (
            <motion.div
              key={surah.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.01, duration: 0.3 }}
            >
              <Card className="group border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/40 transition-all duration-200 hover:shadow-md" data-testid={`card-surah-${surah.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {surah.id}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-sm">{surah.englishName}</div>
                        <div className="text-xs text-muted-foreground">{surah.urduName}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-lg font-arabic text-foreground">{surah.arabicName}</span>
                      <button
                        onClick={() => toggleFavorite(surah.id, progress?.favorited ?? false, surah.verses)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                        data-testid={`button-favorite-${surah.id}`}
                      >
                        <Heart className={`w-4 h-4 ${progress?.favorited ? "fill-red-500 text-red-500" : ""}`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{surah.verses} verses</span>
                    <Badge variant="outline" className={`text-[10px] px-2 py-0 ${surah.type === "Meccan" ? "border-amber-500/50 text-amber-600" : "border-blue-500/50 text-blue-600"}`}>
                      {surah.type}
                    </Badge>
                  </div>

                  {pct > 0 && (
                    <div className="mb-2">
                      <Progress value={pct} className="h-1" />
                      <div className="text-[10px] text-muted-foreground mt-1">{pct}% read</div>
                    </div>
                  )}

                  <Link href={`/read/${surah.id}`}>
                    <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors mt-2" data-testid={`button-read-${surah.id}`}>
                      <BookOpen className="w-3 h-3" />
                      {progress && progress.lastReadVerse > 0 ? "Continue Reading" : "Start Reading"}
                      <ChevronRight className="w-3 h-3" />
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
