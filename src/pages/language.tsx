import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Globe, Languages, BookOpen, Mic2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TRANSLATION_EDITIONS } from "@/lib/quran-data";
import { useToast } from "@/hooks/use-toast";

const TAFSEER_LANGUAGES = [
  { code: "english", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "urdu", label: "Urdu", nativeLabel: "اردو", flag: "🇵🇰", rtl: true },
  { code: "arabic", label: "Arabic", nativeLabel: "العربية", flag: "🇸🇦", rtl: true },
  { code: "french", label: "French", nativeLabel: "Français", flag: "🇫🇷" },
  { code: "german", label: "German", nativeLabel: "Deutsch", flag: "🇩🇪" },
  { code: "spanish", label: "Spanish", nativeLabel: "Español", flag: "🇪🇸" },
  { code: "turkish", label: "Turkish", nativeLabel: "Türkçe", flag: "🇹🇷" },
  { code: "hindi", label: "Hindi", nativeLabel: "हिन्दी", flag: "🇮🇳" },
  { code: "bengali", label: "Bengali", nativeLabel: "বাংলা", flag: "🇧🇩" },
  { code: "indonesian", label: "Indonesian", nativeLabel: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "russian", label: "Russian", nativeLabel: "Русский", flag: "🇷🇺" },
  { code: "chinese", label: "Chinese", nativeLabel: "中文", flag: "🇨🇳" },
  { code: "persian", label: "Persian", nativeLabel: "فارسی", flag: "🇮🇷", rtl: true },
  { code: "malay", label: "Malay", nativeLabel: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "swahili", label: "Swahili", nativeLabel: "Kiswahili", flag: "🇰🇪" },
];

const STORAGE_KEY_TRANSLATION = "qv_translation_lang";
const STORAGE_KEY_TAFSEER = "qv_tafseer_lang";

export default function Language() {
  const { toast } = useToast();
  const [translationLang, setTranslationLang] = useState(
    () => localStorage.getItem(STORAGE_KEY_TRANSLATION) ?? "english"
  );
  const [tafseerLang, setTafseerLang] = useState(
    () => localStorage.getItem(STORAGE_KEY_TAFSEER) ?? "english"
  );

  const saveTranslation = (code: string) => {
    setTranslationLang(code);
    localStorage.setItem(STORAGE_KEY_TRANSLATION, code);
    toast({ title: "Translation language updated", description: `Now showing ${TRANSLATION_EDITIONS[code]?.label ?? code} translations.` });
  };

  const saveTafseer = (code: string) => {
    setTafseerLang(code);
    localStorage.setItem(STORAGE_KEY_TAFSEER, code);
    const lang = TAFSEER_LANGUAGES.find(l => l.code === code);
    toast({ title: "Tafseer language updated", description: `AI Tafseer will now respond in ${lang?.label ?? code}.` });
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Language Settings</h1>
            <p className="text-muted-foreground">Choose your preferred languages for translations and AI Tafseer</p>
          </div>
        </div>
      </motion.div>

      {/* Translation Language */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Quran Translation Language
            </CardTitle>
            <p className="text-sm text-muted-foreground">Select the language for Quranic verse translations in the reader</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(TRANSLATION_EDITIONS).map(([code, info]) => {
                const isSelected = translationLang === code;
                return (
                  <button
                    key={code}
                    onClick={() => saveTranslation(code)}
                    className={`relative flex flex-col gap-1 p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border/50 hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    <span className="font-medium text-sm text-foreground">{info.label}</span>
                    {info.rtl && <Badge variant="outline" className="w-fit text-[10px] px-1.5">RTL</Badge>}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Tafseer Language */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-primary" />
              AI Tafseer Language
            </CardTitle>
            <p className="text-sm text-muted-foreground">The AI Tafseer panel will explain verses in your chosen language</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {TAFSEER_LANGUAGES.map(lang => {
                const isSelected = tafseerLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => saveTafseer(lang.code)}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border/50 hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-medium text-sm text-foreground leading-tight">{lang.label}</span>
                    <span className={`text-xs text-muted-foreground ${lang.rtl ? "font-arabic" : ""}`}>{lang.nativeLabel}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <Mic2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">How multi-language Tafseer works</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    When you tap "AI Tafseer" on any verse in the Quran Reader, the explanation, historical context, lessons,
                    and practical guidance will be generated in your selected language. This uses GPT-4o-mini to produce
                    scholarly Islamic content directly in your native tongue.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Selections Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="glass-card border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Translation</p>
                <p className="font-semibold text-foreground">{TRANSLATION_EDITIONS[translationLang]?.label ?? translationLang}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">AI Tafseer</p>
                <p className="font-semibold text-foreground">
                  {TAFSEER_LANGUAGES.find(l => l.code === tafseerLang)?.flag ?? ""}{" "}
                  {TAFSEER_LANGUAGES.find(l => l.code === tafseerLang)?.label ?? tafseerLang}
                </p>
              </div>
              <div className="flex items-center">
                <Button variant="outline" className="text-sm" onClick={() => {
                  toast({ title: "Settings saved", description: "Your language preferences are active." });
                }}>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
