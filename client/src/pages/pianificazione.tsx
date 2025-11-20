import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Package, MapPin, Weight, Hash, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { SpedizioneWithDetails, GiroWithDetails } from "@shared/schema";

const STATI_COLORS = {
  INSERITA: "bg-blue-100 text-blue-800 border-blue-200",
  ASSEGNATA: "bg-yellow-100 text-yellow-800 border-yellow-200",
  IN_CONSEGNA: "bg-purple-100 text-purple-800 border-purple-200",
  CONSEGNATA: "bg-green-100 text-green-800 border-green-200",
  PROBLEMA: "bg-red-100 text-red-800 border-red-200",
};

type ColumnSummary = {
  colli: number;
  peso: number;
  capacity?: number;
  overCapacity: boolean;
};

const calculateSummary = (
  spedizioni: SpedizioneWithDetails[],
  mezzo?: GiroWithDetails["mezzo"],
): ColumnSummary => {
  const totals = spedizioni.reduce(
    (acc, spedizione) => {
      acc.colli += spedizione.colli || 0;
      acc.peso += Number(spedizione.pesoKg) || 0;
      return acc;
    },
    { colli: 0, peso: 0 },
  );

  const capacity = mezzo?.portataKg;
  const overCapacity = typeof capacity === "number" ? totals.peso > capacity : false;

  return {
    colli: totals.colli,
    peso: totals.peso,
    capacity,
    overCapacity,
  };
};

const getTodayDateString = () => new Date().toISOString().split("T")[0];
const getDefaultTurno = (): "MATTINO" | "POMERIGGIO" =>
  new Date().getHours() < 12 ? "MATTINO" : "POMERIGGIO";

function SpedizioneCard({ spedizione, isDragging = false }: { spedizione: SpedizioneWithDetails; isDragging?: boolean }) {
  return (
    <Card className={`hover-elevate cursor-move ${isDragging ? "opacity-50" : ""}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-semibold">{spedizione.numeroSpedizione}</span>
          </div>
          <Badge variant="outline" className={`text-xs ${STATI_COLORS[spedizione.stato as keyof typeof STATI_COLORS]}`}>
            {spedizione.stato}
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="font-medium text-sm truncate">{spedizione.committente.nome}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{spedizione.destinatario.citta} ({spedizione.destinatario.provincia})</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              <span>{spedizione.colli} colli</span>
            </div>
            <div className="flex items-center gap-1">
              <Weight className="h-3 w-3" />
              <span>{parseFloat(spedizione.pesoKg).toFixed(0)} kg</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DroppableColumn({
  id,
  title,
  spedizioni,
  giro,
  summary,
}: {
  id: string;
  title: string;
  spedizioni: SpedizioneWithDetails[];
  giro?: GiroWithDetails;
  summary?: ColumnSummary;
}) {
  const cardClasses = `flex-shrink-0 w-80 ${summary?.overCapacity ? "border border-destructive/60" : ""}`;

  return (
    <Card className={cardClasses}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {id === "unassigned" ? (
            <>
              <Package className="h-5 w-5" />
              {title}
            </>
          ) : (
            <>
              <Truck className="h-5 w-5" />
              {title}
            </>
          )}
        </CardTitle>
        {giro && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              {giro.autista.nome} {giro.autista.cognome}
            </p>
            <p>{giro.mezzo ? `${giro.mezzo.targa} - ${giro.mezzo.modello}` : "Mezzo non assegnato"}</p>
          </div>
        )}
        <div className="text-sm font-medium pt-1 space-y-0.5">
          <div>{spedizioni.length} spedizioni</div>
          {summary && (
            <div className="text-xs text-muted-foreground">
              {summary.colli} colli · {summary.peso.toFixed(0)} kg
            </div>
          )}
          {summary?.capacity && (
            <div className={`text-xs ${summary.overCapacity ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
              Peso vs portata: {summary.peso.toFixed(0)} / {summary.capacity} kg
            </div>
          )}
          {summary?.overCapacity && (
            <p className="text-xs text-destructive font-semibold flex items-center gap-1">
              Superata portata del mezzo
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
        {spedizioni.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-md">
            Trascina spedizioni qui
          </div>
        ) : (
          spedizioni.map((spedizione) => (
            <div
              key={spedizione.id}
              id={spedizione.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("spedizioneId", spedizione.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              data-testid={`draggable-spedizione-${spedizione.id}`}
            >
              <SpedizioneCard spedizione={spedizione} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function Pianificazione() {
  const { toast } = useToast();
  const [selectedData, setSelectedData] = useState(getTodayDateString);
  const [selectedTurno, setSelectedTurno] = useState<"MATTINO" | "POMERIGGIO">(getDefaultTurno);

  const { data: spedizioni, isLoading: isLoadingSpedizioni } = useQuery<SpedizioneWithDetails[]>({
    queryKey: ["/api/spedizioni"],
  });

  const { data: giri, isLoading: isLoadingGiri } = useQuery<GiroWithDetails[]>({
    queryKey: ["/api/giri/by-date", selectedData],
  });

  const assignMutation = useMutation({
    mutationFn: ({ spedizioneId, giroId }: { spedizioneId: string; giroId: string | null }) =>
      apiRequest("PUT", `/api/spedizioni/${spedizioneId}/assign`, { giroId }),
    onMutate: async ({ spedizioneId, giroId }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/spedizioni"] });
      const previous = queryClient.getQueryData<SpedizioneWithDetails[]>(["/api/spedizioni"]);

      if (previous) {
        const optimistic = previous.map((spedizione) =>
          spedizione.id === spedizioneId
            ? {
                ...spedizione,
                giroId,
                stato: giroId ? "ASSEGNATA" : "INSERITA",
              }
            : spedizione,
        );
        queryClient.setQueryData(["/api/spedizioni"], optimistic);
      }

      return { previous };
    },
    onSuccess: () => {
      toast({ title: "Spedizione assegnata con successo" });
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["/api/spedizioni"], context.previous);
      }
      toast({
        title: "Errore",
        description: "Impossibile assegnare la spedizione",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spedizioni"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, giroId: string | null) => {
    e.preventDefault();
    const spedizioneId = e.dataTransfer.getData("spedizioneId");
    if (spedizioneId) {
      assignMutation.mutate({ spedizioneId, giroId });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const giriFiltered = giri?.filter((g) => g.turno === selectedTurno) || [];

  const spedizioniNonAssegnate = useMemo(
    () => spedizioni?.filter((s) => !s.giroId) || [],
    [spedizioni],
  );

  const spedizioniByGiro = useMemo(() => {
    const map: Record<string, SpedizioneWithDetails[]> = {};
    (spedizioni || []).forEach((spedizione) => {
      if (!spedizione.giroId) return;
      if (!map[spedizione.giroId]) {
        map[spedizione.giroId] = [];
      }
      map[spedizione.giroId].push(spedizione);
    });
    return map;
  }, [spedizioni]);

  const columnSummaries = useMemo(() => {
    const summaries: Record<string, ColumnSummary> = {};
    (giri || []).forEach((giroItem) => {
      summaries[giroItem.id] = calculateSummary(spedizioniByGiro[giroItem.id] || [], giroItem.mezzo);
    });
    return summaries;
  }, [giri, spedizioniByGiro]);

  const unassignedSummary = useMemo(
    () => calculateSummary(spedizioniNonAssegnate),
    [spedizioniNonAssegnate],
  );

  const getSpedizioniForGiro = (giroId: string) => {
    return spedizioniByGiro[giroId] || [];
  };

  const isLoading = isLoadingSpedizioni || isLoadingGiri;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pianificazione Giornaliera</h1>
        <p className="text-muted-foreground mt-1">Assegna spedizioni ai giri degli autisti</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={selectedData}
                onChange={(e) => setSelectedData(e.target.value)}
                className="w-auto"
                data-testid="input-data"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="turno">Turno</Label>
              <Select value={selectedTurno} onValueChange={(value: "MATTINO" | "POMERIGGIO") => setSelectedTurno(value)}>
                <SelectTrigger className="w-40" data-testid="select-turno">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MATTINO">Mattino</SelectItem>
                  <SelectItem value="POMERIGGIO">Pomeriggio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="flex-shrink-0 w-80">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-96 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            <div
              onDrop={(e) => handleDrop(e, null)}
              onDragOver={handleDragOver}
              data-testid="column-unassigned"
            >
              <DroppableColumn
                id="unassigned"
                title="Non Assegnate"
                spedizioni={spedizioniNonAssegnate}
                summary={unassignedSummary}
              />
            </div>

            {giriFiltered.length === 0 ? (
              <Card className="flex-shrink-0 w-80">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground text-center">
                    Nessun giro creato per {selectedTurno.toLowerCase()} del{" "}
                    {new Date(selectedData).toLocaleDateString("it-IT")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              giriFiltered.map((giro) => (
                <div
                  key={giro.id}
                  onDrop={(e) => handleDrop(e, giro.id)}
                  onDragOver={handleDragOver}
                  data-testid={`column-giro-${giro.id}`}
                >
                  <DroppableColumn
                    id={giro.id}
                    title={`${giro.autista.nome} ${giro.autista.cognome}`}
                    spedizioni={getSpedizioniForGiro(giro.id)}
                    giro={giro}
                    summary={columnSummaries[giro.id]}
                  />
                </div>
              ))
            )}
          </div>
        )}
    </div>
  );
}
