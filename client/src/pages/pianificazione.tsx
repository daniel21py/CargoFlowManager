import { useState } from "react";
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
import type { SpedizioneWithCliente, GiroWithDetails } from "@shared/schema";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";

const STATI_COLORS = {
  INSERITA: "bg-blue-100 text-blue-800 border-blue-200",
  ASSEGNATA: "bg-yellow-100 text-yellow-800 border-yellow-200",
  IN_CONSEGNA: "bg-purple-100 text-purple-800 border-purple-200",
  CONSEGNATA: "bg-green-100 text-green-800 border-green-200",
  PROBLEMA: "bg-red-100 text-red-800 border-red-200",
};

function SpedizioneCard({ spedizione, isDragging = false }: { spedizione: SpedizioneWithCliente; isDragging?: boolean }) {
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
          <p className="font-medium text-sm truncate">{spedizione.cliente.ragioneSociale}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{spedizione.destinatarioCitta} ({spedizione.destinatarioProvincia})</span>
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
  giro 
}: { 
  id: string; 
  title: string; 
  spedizioni: SpedizioneWithCliente[]; 
  giro?: GiroWithDetails;
}) {
  return (
    <Card className="flex-shrink-0 w-80">
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
            <p>{giro.autista.nome} {giro.autista.cognome}</p>
            <p>{giro.mezzo.targa} - {giro.mezzo.modello}</p>
          </div>
        )}
        <div className="text-sm font-medium pt-1">
          {spedizioni.length} spedizioni
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
  const [selectedData, setSelectedData] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTurno, setSelectedTurno] = useState<"MATTINO" | "POMERIGGIO">("MATTINO");

  const { data: spedizioni, isLoading: isLoadingSpedizioni } = useQuery<SpedizioneWithCliente[]>({
    queryKey: ["/api/spedizioni"],
  });

  const { data: giri, isLoading: isLoadingGiri } = useQuery<GiroWithDetails[]>({
    queryKey: ["/api/giri/by-date", selectedData],
  });

  const assignMutation = useMutation({
    mutationFn: ({ spedizioneId, giroId }: { spedizioneId: string; giroId: string | null }) =>
      apiRequest("PUT", `/api/spedizioni/${spedizioneId}/assign`, { giroId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spedizioni"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Spedizione assegnata con successo" });
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile assegnare la spedizione",
        variant: "destructive" 
      });
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
  
  const spedizioniNonAssegnate = spedizioni?.filter((s) => !s.giroId) || [];
  
  const getSpedizioniForGiro = (giroId: string) => {
    return spedizioni?.filter((s) => s.giroId === giroId) || [];
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
            />
          </div>

          {giriFiltered.length === 0 ? (
            <Card className="flex-shrink-0 w-80">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground text-center">
                  Nessun giro creato per {selectedTurno.toLowerCase()} del {new Date(selectedData).toLocaleDateString("it-IT")}
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
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
