import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, Clock, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  spedizioniDaAssegnare: number;
  giriOggi: number;
  inConsegna: number;
  consegnateOggi: number;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const statsCards = [
    {
      title: "Spedizioni da Assegnare",
      value: stats?.spedizioniDaAssegnare || 0,
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Giri Attivi Oggi",
      value: stats?.giriOggi || 0,
      icon: Truck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "In Consegna",
      value: stats?.inConsegna || 0,
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      title: "Consegnate Oggi",
      value: stats?.consegnateOggi || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Panoramica generale delle attività di oggi
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`h-10 w-10 rounded-md ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Azioni Rapide</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/spedizioni"
            className="p-4 rounded-md border hover-elevate active-elevate-2 transition-colors"
            data-testid="link-quick-spedizioni"
          >
            <Package className="h-6 w-6 mb-2 text-primary" />
            <h3 className="font-medium">Nuova Spedizione</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Inserisci una nuova spedizione da DDT
            </p>
          </a>
          <a
            href="/pianificazione"
            className="p-4 rounded-md border hover-elevate active-elevate-2 transition-colors"
            data-testid="link-quick-pianificazione"
          >
            <Truck className="h-6 w-6 mb-2 text-primary" />
            <h3 className="font-medium">Pianifica Giri</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Assegna spedizioni agli autisti
            </p>
          </a>
          <a
            href="/giri"
            className="p-4 rounded-md border hover-elevate active-elevate-2 transition-colors"
            data-testid="link-quick-giri"
          >
            <Clock className="h-6 w-6 mb-2 text-primary" />
            <h3 className="font-medium">Gestisci Giri</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Crea e modifica i giri giornalieri
            </p>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
