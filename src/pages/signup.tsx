import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, UserPlus, Check } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const FEATURES = [
  "Track your reading progress across all 114 Surahs",
  "AI Tafseer in 12+ languages",
  "Hifz planner with spaced repetition",
  "Quiz system with XP and badges",
  "Daily Quranic reflection journal",
];

export default function Signup() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ displayName: "", username: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.displayName);
      toast({ title: "Account created!", description: "Welcome to QuranVerse AI." });
      setLocation("/");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-arabesque bg-background px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-start"
      >
        {/* Left: Features */}
        <div className="hidden md:flex flex-col gap-8 pt-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-arabic text-3xl shadow-lg">
                ق
              </div>
              <h1 className="font-bold text-2xl text-foreground">QuranVerse <span className="text-primary">AI</span></h1>
            </div>
            <h2 className="text-3xl font-bold text-foreground leading-snug">
              Start your Quranic<br />journey today
            </h2>
            <p className="text-muted-foreground mt-3">Join thousands of Muslims learning and connecting with the Quran through AI-powered insights.</p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map(f => (
              <li key={f} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm text-foreground">{f}</span>
              </li>
            ))}
          </ul>

          <div className="glass-card rounded-2xl p-5 border border-border/40">
            <p className="font-arabic text-xl text-primary leading-relaxed text-right">إِنَّمَا يَخْشَى ٱللَّهَ مِنْ عِبَادِهِ ٱلْعُلَمَٰٓؤُا۟</p>
            <p className="text-sm text-muted-foreground mt-2">Indeed, those who fear Allah among His servants are the scholars — Quran 35:28</p>
          </div>
        </div>

        {/* Right: Form */}
        <Card className="glass-card shadow-2xl border-border/50">
          <CardHeader className="pb-4">
            <div className="md:hidden flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-arabic text-2xl">ق</div>
              <span className="font-bold text-xl">QuranVerse <span className="text-primary">AI</span></span>
            </div>
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>Free forever. No credit card needed.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" placeholder="Abdullah" value={form.displayName} onChange={set("displayName")} autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
                  <Input id="username" placeholder="abdullah_123" value={form.username} onChange={set("username")} required autoComplete="username" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email address <span className="text-destructive">*</span></Label>
                <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={set("password")}
                    required
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPw(v => !v)}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {[8, 12, 16].map(len => (
                      <div key={len} className={`h-1 flex-1 rounded-full transition-colors ${form.password.length >= len ? "bg-primary" : "bg-border"}`} />
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
                Create Account
              </Button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login">
                  <span className="text-primary font-semibold hover:underline cursor-pointer">Sign in</span>
                </Link>
              </p>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Continue as{" "}
              <Link href="/">
                <span className="text-primary hover:underline cursor-pointer">guest</span>
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
