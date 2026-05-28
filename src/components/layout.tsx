import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AiAssistant } from "./ai-assistant";
import { 
  Home, 
  BookOpen, 
  Layers, 
  List, 
  BookMarked, 
  Target, 
  BrainCircuit, 
  Mic, 
  BarChart2, 
  PenTool, 
  Settings,
  Moon,
  Sun,
  Menu,
  X,
  Globe,
  LogIn,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "./theme-provider";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/surahs", label: "Surahs", icon: BookOpen },
  { href: "/juz", label: "Juz", icon: Layers },
  { href: "/manzil", label: "Manzil", icon: List },
  { href: "/read/1", label: "Quran Reader", icon: BookMarked },
  { href: "/hadith", label: "Hadith", icon: BookOpen },
  { href: "/hifz", label: "Hifz", icon: Target },
  { href: "/quiz", label: "Quiz", icon: BrainCircuit },
  { href: "/recitation", label: "Recitation", icon: Mic },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/journal", label: "Journal", icon: PenTool },
  { href: "/language", label: "Language", icon: Globe },
  { href: "/settings", label: "Settings", icon: Settings },
];

function UserWidget() {
  const { user, logout, loading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    toast({ title: "Signed out", description: "You have been signed out successfully." });
    setLocation("/");
  };

  if (loading) return null;

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm" className="w-full justify-start gap-2">
          <LogIn className="w-4 h-4" />
          Sign In
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-primary/10 transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
            {user.avatarInitials ?? user.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground truncate">{user.displayName ?? user.username}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <div className="flex items-center gap-2 cursor-pointer w-full">
              <User className="w-4 h-4" />
              Profile & Settings
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-arabesque bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/50 glass-card z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-arabic text-xl shadow-lg">
            ق
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">QuranVerse <span className="text-primary">AI</span></span>
        </div>

        <ScrollArea className="flex-1 px-4 py-2">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"}`}>
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-border/50 space-y-2">
          <UserWidget />
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 glass-card border-b border-border/50 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-arabic text-xl shadow-lg">
            ق
          </div>
          <span className="font-bold text-lg text-foreground">QuranVerse</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 top-16 bg-background/95 backdrop-blur-sm z-40 overflow-y-auto"
          >
            <nav className="p-4 space-y-2 pb-24">
              {NAV_ITEMS.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`flex items-center gap-4 px-4 py-4 rounded-xl ${isActive ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border/50"}`}>
                      <item.icon className="w-6 h-6" />
                      <span className="font-medium text-lg">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
              {/* Mobile auth button */}
              <div className="pt-2">
                <MobileAuthSection />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Assistant */}
      <AiAssistant />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full pt-16 md:pt-0 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full p-4 md:p-8 max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass-card border-t border-border/50 z-50 flex items-center justify-around px-2">
        {[NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[4], NAV_ITEMS[6], NAV_ITEMS[11]].map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-full ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                <item.icon className="w-6 h-6" />
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MobileAuthSection() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  if (!user) {
    return (
      <Link href="/login">
        <div className="flex items-center gap-4 px-4 py-4 rounded-xl bg-primary text-primary-foreground">
          <LogIn className="w-6 h-6" />
          <span className="font-medium text-lg">Sign In</span>
        </div>
      </Link>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border/50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
          {user.avatarInitials ?? user.username.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-foreground">{user.displayName ?? user.username}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={async () => {
        await logout();
        toast({ title: "Signed out" });
        setLocation("/");
      }}>
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
}
