import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useEffect } from "react";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Clienti from "@/pages/clienti";
import Autisti from "@/pages/autisti";
import Mezzi from "@/pages/mezzi";
import Spedizioni from "@/pages/spedizioni";
import Giri from "@/pages/giri";
import Pianificazione from "@/pages/pianificazione";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, navigate] = useLocation();
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/spedizioni">
        <ProtectedRoute component={Spedizioni} />
      </Route>
      <Route path="/pianificazione">
        <ProtectedRoute component={Pianificazione} />
      </Route>
      <Route path="/giri">
        <ProtectedRoute component={Giri} />
      </Route>
      <Route path="/clienti">
        <ProtectedRoute component={Clienti} />
      </Route>
      <Route path="/autisti">
        <ProtectedRoute component={Autisti} />
      </Route>
      <Route path="/mezzi">
        <ProtectedRoute component={Mezzi} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const isLoginPage = location === "/login";

  if (isLoginPage) {
    return <Router />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-2 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
