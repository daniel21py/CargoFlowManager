import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { lazy, Suspense, useEffect } from "react";

const Login = lazy(() => import("@/pages/login"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Committenti = lazy(() => import("@/pages/committenti"));
const Destinatari = lazy(() => import("@/pages/destinatari"));
const Autisti = lazy(() => import("@/pages/autisti"));
const Mezzi = lazy(() => import("@/pages/mezzi"));
const Spedizioni = lazy(() => import("@/pages/spedizioni"));
const Giri = lazy(() => import("@/pages/giri"));
const Pianificazione = lazy(() => import("@/pages/pianificazione"));
const StampaDDT = lazy(() => import("@/pages/stampa-ddt"));
const ImportaDDT = lazy(() => import("@/pages/importa-ddt"));
const RiepilogoCommittenti = lazy(() => import("@/pages/riepilogo-committenti"));
const NotFound = lazy(() => import("@/pages/not-found"));

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
      <Route path="/committenti">
        <ProtectedRoute component={Committenti} />
      </Route>
      <Route path="/destinatari">
        <ProtectedRoute component={Destinatari} />
      </Route>
      <Route path="/autisti">
        <ProtectedRoute component={Autisti} />
      </Route>
      <Route path="/mezzi">
        <ProtectedRoute component={Mezzi} />
      </Route>
      <Route path="/stampa-ddt/:id">
        <ProtectedRoute component={StampaDDT} />
      </Route>
      <Route path="/importa-ddt">
        <ProtectedRoute component={ImportaDDT} />
      </Route>
      <Route path="/riepilogo-committenti">
        <ProtectedRoute component={RiepilogoCommittenti} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function RouterFallback() {
  return (
    <div className="flex min-h-[200px] w-full items-center justify-center p-6 text-muted-foreground">
      Caricamento in corso...
    </div>
  );
}

function SuspendedRouter() {
  return (
    <Suspense fallback={<RouterFallback />}>
      <Router />
    </Suspense>
  );
}

function AppContent() {
  const [location] = useLocation();
  const isLoginPage = location === "/login";

  if (isLoginPage) {
    return <SuspendedRouter />;
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
            <SuspendedRouter />
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
