import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { SpedizioneWithDetails, Committente } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const STATI_COLORS: Record<string, string> = {
  INSERITA: "bg-blue-100 text-blue-800 border-blue-200",
  ASSEGNATA: "bg-yellow-100 text-yellow-800 border-yellow-200",
  IN_CONSEGNA: "bg-purple-100 text-purple-800 border-purple-200",
  CONSEGNATA: "bg-green-100 text-green-800 border-green-200",
  PROBLEMA: "bg-red-100 text-red-800 border-red-200",
};

const today = new Date();
const todayStr = today.toISOString().split("T")[0];
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];

export default function RiepilogoCommittenti() {
  const { data: spedizioni } = useQuery<SpedizioneWithDetails[]>({
    queryKey: ["/api/spedizioni"],
  });
  const { data: committenti } = useQuery<Committente[]>({
    queryKey: ["/api/committenti"],
  });

  const [selectedCommittente, setSelectedCommittente] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo] = useState(todayStr);

  const filteredSpedizioni = useMemo(() => {
    if (!spedizioni) return [];
    return spedizioni
      .filter((spedizione) => {
        const matchesCommittente =
          selectedCommittente === "ALL" || spedizione.committenteId === selectedCommittente;
        const shipmentDate = spedizione.dataDDT;
        const inRange =
          (!dateFrom || shipmentDate >= dateFrom) && (!dateTo || shipmentDate <= dateTo);
        return matchesCommittente && inRange;
      })
      .sort((a, b) => b.dataDDT.localeCompare(a.dataDDT));
  }, [spedizioni, selectedCommittente, dateFrom, dateTo]);

  const summary = useMemo(() => {
    return filteredSpedizioni.reduce(
      (acc, spedizione) => {
        acc.count += 1;
        acc.colli += spedizione.colli;
        acc.peso += Number(spedizione.pesoKg) || 0;
        return acc;
      },
      { count: 0, colli: 0, peso: 0 },
    );
  }, [filteredSpedizioni]);

  const handleExport = () => {
    if (filteredSpedizioni.length === 0) return;
    const header = [
      "Data DDT",
      "Numero DDT",
      "Committente",
      "Destinatario",
      "Colli",
      "Peso (kg)",
      "Stato",
    ];
    const rows = filteredSpedizioni.map((spedizione) => [
      format(new Date(spedizione.dataDDT), "dd/MM/yyyy", { locale: it }),
      spedizione.numeroDDT,
      spedizione.committente.nome,
      `${spedizione.destinatario.ragioneSociale} - ${spedizione.destinatario.citta}`,
      spedizione.colli,
      Number(spedizione.pesoKg).toFixed(2),
      spedizione.stato,
    ]);
    const csvContent = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "riepilogo-committenti.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Riepilogo Committenti</h1>
          <p className="text-muted-foreground mt-1">
            Filtra le spedizioni e scarica i dati per la fatturazione
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={!filteredSpedizioni.length}
          data-testid="button-export-riepilogo"
        >
          Esporta Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-64 space-y-2">
              <Label>Committente</Label>
              <Select value={selectedCommittente} onValueChange={setSelectedCommittente}>
                <SelectTrigger data-testid="select-riepilogo-committente">
                  <SelectValue placeholder="Tutti i committenti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tutti i committenti</SelectItem>
                  {committenti?.map((committente) => (
                    <SelectItem key={committente.id} value={committente.id}>
                      {committente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dal</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                data-testid="input-date-from"
              />
            </div>
            <div className="space-y-2">
              <Label>Al</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                data-testid="input-date-to"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riepilogo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Spedizioni</p>
            <p className="text-2xl font-semibold">{summary.count}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Colli totali</p>
            <p className="text-2xl font-semibold">{summary.colli}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Peso totale</p>
            <p className="text-2xl font-semibold">{summary.peso.toFixed(2)} kg</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Numero DDT</TableHead>
                <TableHead>Destinatario</TableHead>
                <TableHead>Colli</TableHead>
                <TableHead>Peso (kg)</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSpedizioni.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Nessuna spedizione trovata per i filtri selezionati
                  </TableCell>
                </TableRow>
              ) : (
                filteredSpedizioni.map((spedizione) => (
                  <TableRow key={spedizione.id}>
                    <TableCell>
                      {format(new Date(spedizione.dataDDT), "dd/MM/yyyy", { locale: it })}
                    </TableCell>
                    <TableCell>{spedizione.numeroDDT}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{spedizione.destinatario.ragioneSociale}</p>
                        <p className="text-xs text-muted-foreground">
                          {spedizione.destinatario.citta} ({spedizione.destinatario.provincia})
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{spedizione.colli}</TableCell>
                    <TableCell>{Number(spedizione.pesoKg).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATI_COLORS[spedizione.stato] || "bg-muted text-foreground"}
                      >
                        {spedizione.stato}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
