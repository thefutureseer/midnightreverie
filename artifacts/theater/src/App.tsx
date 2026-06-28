import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavBar } from "@/components/NavBar";
import NotFound from "@/pages/not-found";
import LobbyPage from "@/pages/LobbyPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import CheckoutPage from "@/pages/CheckoutPage";
import TheaterPage from "@/pages/TheaterPage";
import HostDashboardPage from "@/pages/HostDashboardPage";
import VenuePage from "@/pages/VenuePage";
import { useEffect } from "react";

const queryClient = new QueryClient();

function AppShell() {
  const [location] = useLocation();
  const hideNav = location === "/theater";

  return (
    <>
      {!hideNav && <NavBar />}
      <Switch>
        <Route path="/" component={LobbyPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/theater" component={TheaterPage} />
        <Route path="/dashboard" component={HostDashboardPage} />
        <Route path="/venue/:venueId" component={VenuePage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppShell />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
