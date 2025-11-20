import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GiroWithDetails } from "@shared/schema";

const STATI_LABELS = {
  INSERITA: "Inserita",
  ASSEGNATA: "Assegnata",
  IN_CONSEGNA: "In Consegna",
  CONSEGNATA: "Consegnata",
  PROBLEMA: "Problema",
} as const;

export default function StampaDDT() {
  const [, params] = useRoute("/stampa-ddt/:id");
  const giroId = params?.id;
  const { toast } = useToast();

  const { data: giro, isLoading } = useQuery<GiroWithDetails>({
    queryKey: ["/api/giri", giroId],
    enabled: !!giroId,
  });

  const updateStatoMutation = useMutation({
    mutationFn: async ({ spedizioneId, stato }: { spedizioneId: string; stato: string }) => {
      const res = await apiRequest("PATCH", `/api/spedizioni/${spedizioneId}/stato`, { stato });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/giri", giroId] });
      toast({
        title: "Stato aggiornato",
        description: "Lo stato della spedizione è stato aggiornato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento dello stato",
        variant: "destructive",
      });
    },
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!giro || !giro.autista) {
    return (
      <div className="p-8">
        <p className="text-center text-muted-foreground">
          {!giro ? "Giro non trovato" : "Dati del giro incompleti"}
        </p>
      </div>
    );
  }

  const spedizioniCount = giro.spedizioni?.length || 0;
  const pesoTotale = giro.spedizioni?.reduce((sum, s) => sum + (Number(s.pesoKg) || 0), 0) || 0;
  const colliTotali = giro.spedizioni?.reduce((sum, s) => sum + s.colli, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Print Button - hidden when printing */}
      <div className="print:hidden p-4 border-b">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">Distinta Giornaliera</h1>
          <Button onClick={handlePrint} data-testid="button-print">
            <Printer className="mr-2 h-4 w-4" />
            Stampa
          </Button>
        </div>
      </div>

      {/* Printable Content */}
      <div className="max-w-4xl mx-auto p-8 print:p-12">
        {/* Header */}
        <div className="mb-8 border-b-2 border-foreground pb-4">
          <h1 className="text-3xl font-bold mb-2">DISTINTA GIORNALIERA</h1>
          <div className="flex justify-between text-sm">
            <div>
              <p className="font-semibold">TMS Bergamo</p>
              <p className="text-muted-foreground">Sistema di Gestione Trasporti</p>
            </div>
            <div className="text-right">
              <p>
                <span className="font-semibold">Data:</span>{" "}
                {format(new Date(giro.data), "dd MMMM yyyy", { locale: it })}
              </p>
              <p>
                <span className="font-semibold">Turno:</span> {giro.turno}
              </p>
            </div>
          </div>
        </div>

        {/* Giro Info */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="space-y-3">
            <h2 className="font-semibold text-lg border-b pb-1">Autista</h2>
            <div className="space-y-1">
              <p>
                <span className="font-medium">Nome:</span> {giro.autista?.nome} {giro.autista?.cognome}
              </p>
              <p>
                <span className="font-medium">Telefono:</span> {giro.autista?.telefono}
              </p>
              <p>
                <span className="font-medium">Zona:</span> {giro.autista?.zonaPrincipale}
              </p>
            </div>
          </div>

            <div className="space-y-3">
              <h2 className="font-semibold text-lg border-b pb-1">Mezzo</h2>
              <div className="space-y-1">
                <p>
                  <span className="font-medium">Targa:</span> {giro.mezzo?.targa ?? "Non assegnato"}
                </p>
                <p>
                  <span className="font-medium">Modello:</span> {giro.mezzo?.modello ?? "—"}
                </p>
                <p>
                  <span className="font-medium">Portata:</span>{" "}
                  {giro.mezzo?.portataKg ? `${giro.mezzo?.portataKg} kg` : "—"}
                </p>
              </div>
            </div>
        </div>

        {giro.zona && (
          <div className="mb-6">
            <p>
              <span className="font-medium">Zona Assegnata:</span> {giro.zona}
            </p>
          </div>
        )}

        {/* Spedizioni Table */}
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4 border-b pb-2">
            Spedizioni ({spedizioniCount})
          </h2>
          {spedizioniCount === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nessuna spedizione assegnata</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-foreground">
                  <th className="text-left py-2 px-2 font-semibold">N.</th>
                  <th className="text-left py-2 px-2 font-semibold">Destinatario</th>
                  <th className="text-left py-2 px-2 font-semibold">Indirizzo</th>
                  <th className="text-right py-2 px-2 font-semibold">Colli</th>
                  <th className="text-right py-2 px-2 font-semibold">Peso (kg)</th>
                  <th className="text-right py-2 px-2 font-semibold">Contrassegno</th>
                  <th className="text-left py-2 px-2 font-semibold print:hidden">Stato</th>
                  <th className="text-center py-2 px-2 font-semibold">Firma</th>
                </tr>
              </thead>
              <tbody>
                {giro.spedizioni?.map((spedizione) => (
                  <tr key={spedizione.id} className="border-b">
                    <td className="py-3 px-2">{spedizione.numeroSpedizione}</td>
                    <td className="py-3 px-2">{spedizione.destinatario.ragioneSociale}</td>
                    <td className="py-3 px-2 text-sm">
                      {spedizione.destinatario.indirizzo}
                      <br />
                      <span className="text-muted-foreground">
                        {spedizione.destinatario.cap} {spedizione.destinatario.citta} (
                        {spedizione.destinatario.provincia})
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">{spedizione.colli}</td>
                    <td className="py-3 px-2 text-right">{spedizione.pesoKg}</td>
                    <td className="py-3 px-2 text-right">
                      {spedizione.contrassegno ? `€ ${Number(spedizione.contrassegno).toFixed(2)}` : "-"}
                    </td>
                    <td className="py-3 px-2">
                      <div className="print:hidden">
                        <Select
                          value={spedizione.stato}
                          onValueChange={(newStato) =>
                            updateStatoMutation.mutate({ spedizioneId: spedizione.id, stato: newStato })
                          }
                          disabled={updateStatoMutation.isPending}
                          data-testid={`select-stato-${spedizione.id}`}
                        >
                          <SelectTrigger className="w-full" data-testid={`trigger-stato-${spedizione.id}`}>
                            <SelectValue>
                              {STATI_LABELS[spedizione.stato as keyof typeof STATI_LABELS]}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATI_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value} data-testid={`option-stato-${value}`}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="hidden print:block">
                        {STATI_LABELS[spedizione.stato as keyof typeof STATI_LABELS]}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="border border-muted h-8 w-24 mx-auto"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-foreground font-semibold">
                  <td className="py-3 px-2" colSpan={3}>
                    TOTALI
                  </td>
                  <td className="py-3 px-2 text-right">{colliTotali}</td>
                  <td className="py-3 px-2 text-right">{pesoTotale}</td>
                  <td className="py-3 px-2" colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Notes */}
        {giro.note && (
          <div className="mb-8">
            <h2 className="font-semibold text-lg mb-2 border-b pb-1">Note</h2>
            <p className="whitespace-pre-wrap">{giro.note}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="font-medium mb-4">Firma Autista</p>
              <div className="border-b border-muted w-full h-12"></div>
            </div>
            <div>
              <p className="font-medium mb-4">Timbro e Firma Azienda</p>
              <div className="border-b border-muted w-full h-12"></div>
            </div>
          </div>
        </div>

        {/* Print footer */}
        <div className="text-center text-xs text-muted-foreground mt-12 print:block hidden">
          <p>
            Stampato il {format(new Date(), "dd/MM/yyyy 'alle' HH:mm", { locale: it })} - TMS Bergamo
          </p>
        </div>
      </div>
    </div>
  );
}
