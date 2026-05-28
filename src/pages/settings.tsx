import { useState } from "react";
import { motion } from "framer-motion";
import { Moon, Sun, Globe, Bell, BookOpen, Mic, User, ChevronRight } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { TRANSLATION_EDITIONS, RECITERS } from "@/lib/quran-data";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [defaultLanguage, setDefaultLanguage] = useState("english");
  const [defaultReciter, setDefaultReciter] = useState(RECITERS[0].id);
  const [fontSize, setFontSize] = useState(22);
  const [notifications, setNotifications] = useState({ dailyAyah: true, streakReminder: true, revisionDue: false, quizReminder: false });

  const settingSections = [
    {
      title: "Appearance",
      icon: Sun,
      items: [
        {
          label: "Theme",
          description: "Switch between light and dark mode",
          control: (
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-muted-foreground" />
              <Switch checked={theme === "dark"} onCheckedChange={v => setTheme(v ? "dark" : "light")} data-testid="switch-dark-mode" />
              <Moon className="w-4 h-4 text-muted-foreground" />
            </div>
          )
        },
        {
          label: "Arabic Font Size",
          description: `Current: ${fontSize}px`,
          control: (
            <div className="w-32">
              <Slider value={[fontSize]} onValueChange={([v]) => setFontSize(v)} min={16} max={36} step={2} data-testid="slider-font-size" />
            </div>
          )
        },
      ]
    },
    {
      title: "Quran Reading",
      icon: BookOpen,
      items: [
        {
          label: "Default Translation",
          description: "Language for Quran translations",
          control: (
            <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
              <SelectTrigger className="w-44" data-testid="select-default-language"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TRANSLATION_EDITIONS).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        },
      ]
    },
    {
      title: "Audio & Recitation",
      icon: Mic,
      items: [
        {
          label: "Default Reciter",
          description: "Preferred reciter for audio playback",
          control: (
            <Select value={defaultReciter} onValueChange={setDefaultReciter}>
              <SelectTrigger className="w-52" data-testid="select-default-reciter"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RECITERS.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )
        },
      ]
    },
    {
      title: "Notifications",
      icon: Bell,
      items: [
        { label: "Daily Ayah Reminder", description: "Receive a daily verse notification", key: "dailyAyah" as const },
        { label: "Streak Reminder", description: "Get reminded to maintain your reading streak", key: "streakReminder" as const },
        { label: "Revision Due", description: "Spaced repetition reminders for Hifz", key: "revisionDue" as const },
        { label: "Quiz Challenge", description: "Weekly quiz challenge notifications", key: "quizReminder" as const },
      ]
    }
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Customize your QuranVerse AI experience</p>
      </div>

      {/* Profile Card */}
      <Card className="border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-foreground">Guest User</div>
            <div className="text-sm text-muted-foreground">Learning Quran with QuranVerse AI</div>
          </div>
        </CardContent>
      </Card>

      {settingSections.map((section, si) => (
        <motion.div key={section.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.1 }}>
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <section.icon className="w-4 h-4 text-primary" /> {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {section.items.map((item, ii) => (
                <div key={ii} className="flex items-center justify-between py-3 border-b border-border/20 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                  </div>
                  {"control" in item ? item.control : (
                    <Switch
                      checked={notifications[item.key]}
                      onCheckedChange={v => setNotifications(n => ({ ...n, [item.key]: v }))}
                      data-testid={`switch-notif-${item.key}`}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* App Info */}
      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Version</span>
            <span className="text-foreground font-medium">1.0.0</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Quran Data</span>
            <span className="text-foreground font-medium">AlQuran Cloud API</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Hadith Data</span>
            <span className="text-foreground font-medium">Hadith API</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
