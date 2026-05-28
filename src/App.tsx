import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Surahs from "@/pages/surahs";
import Juz from "@/pages/juz";
import Manzil from "@/pages/manzil";
import Reader from "@/pages/reader";
import Hadith from "@/pages/hadith";
import Hifz from "@/pages/hifz";
import Quiz from "@/pages/quiz";
import Recitation from "@/pages/recitation";
import Analytics from "@/pages/analytics";
import Journal from "@/pages/journal";
import Settings from "@/pages/settings";
import Language from "@/pages/language";
import Login from "@/pages/login";
import Signup from "@/pages/signup";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const AUTH_ROUTES = ["/login", "/signup"];

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route>
        {() => (
          <Layout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/surahs" component={Surahs} />
              <Route path="/juz" component={Juz} />
              <Route path="/manzil" component={Manzil} />
              <Route path="/read/:surahId" component={Reader} />
              <Route path="/hadith" component={Hadith} />
              <Route path="/hifz" component={Hifz} />
              <Route path="/quiz" component={Quiz} />
              <Route path="/recitation" component={Recitation} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/journal" component={Journal} />
              <Route path="/settings" component={Settings} />
              <Route path="/language" component={Language} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
