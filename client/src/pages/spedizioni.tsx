import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Search, Filter, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SpedizioneWithDetails, InsertSpedizione, Committente, Destinatario } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const STATI_COLORS = {
  INSERITA: "bg-blue-100 text-blue-800 border-blue-200",
  ASSEGNATA: "bg-yellow-100 text-yellow-800 border-yellow-200",
  IN_CONSEGNA: "bg-purple-100 text-purple-800 border-purple-200",
  CONSEGNATA: "bg-green-100 text-green-800 border-green-200",
  PROBLEMA: "bg-red-100 text-red-800 border-red-200",
};

export default function Spedizioni() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStato, setFilterStato] = useState<string>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<InsertSpedizione>({
    committenteId: "",
    destinatarioId: "",
    dataDDT: new Date().toISOString().split("T")[0],
    numeroDDT: "",
    colli: 1,
    pesoKg: "0",
    contrassegno: null,
    filePath: null,
    stato: "INSERITA",
    giroId: null,
    note: "",
  });

  // Check for prefilled data from import DDT via localStorage (more reliable than history state)
  useEffect(() => {
    const prefilledData = localStorage.getItem('ddtImportData');
    if (prefilledData) {
      try {
        const data = JSON.parse(prefilledData);
        
        // Auto-populate form with imported DDT data
        setFormData(prev => ({
          ...prev,
          // Smart mapping: usa gli ID se disponibili dal backend
          committenteId: data.committenteId || prev.committenteId,
          destinatarioId: data.destinatarioId || prev.destinatarioId,
          dataDDT: data.dataDDT || prev.dataDDT,
          numeroDDT: data.numeroDDT || prev.numeroDDT,
          colli: data.colli || prev.colli,
          pesoKg: data.peso?.toString() || prev.pesoKg,
          contrassegno: data.contrassegno || prev.contrassegno,
        }));
        
        setIsDialogOpen(true);
        
        // Clear the localStorage data after using it
        localStorage.removeItem('ddtImportData');
        
        // Messaggio personalizzato in base al mapping
        let message = "I dati del DDT sono stati precompilati.";
        if (data.committenteId) {
          message += " Committente mappato automaticamente.";
        }
        if (data.destinatarioId) {
          message += " Destinatario collegato o creato.";
        }
        
        toast({
          title: "Dati importati",
          description: message,
        });
      } catch (error) {
        console.error('Errore parsing dati importati:', error);
        localStorage.removeItem('ddtImportData');
      }
    }
  }, [toast]);

  const { data: spedizioni, isLoading } = useQuery<SpedizioneWithDetails[]>({
    queryKey: ["/api/spedizioni"],
  });

  const { data: committenti } = useQuery<Committente[]>({
    queryKey: ["/api/committenti"],
  });

  const { data: destinatari } = useQuery<Destinatario[]>({
    queryKey: ["/api/destinatari"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertSpedizione) => apiRequest("POST", "/api/spedizioni", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spedizioni"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Spedizione creata con successo" });
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      committenteId: "",
      destinatarioId: "",
      dataDDT: new Date().toISOString().split("T")[0],
      numeroDDT: "",
      colli: 1,
      pesoKg: "0",
      contrassegno: null,
      filePath: null,
      stato: "INSERITA",
      giroId: null,
      note: "",
    });
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };


  const filteredSpedizioni = spedizioni?.filter((s) => {
    const matchesSearch =
      s.numeroSpedizione.toString().includes(searchTerm) ||
      s.committente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destinatario.citta.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStato = filterStato === "ALL" || s.stato === filterStato;
    return matchesSearch && matchesStato;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Spedizioni</h1>
          <p className="text-muted-foreground mt-1">Gestione spedizioni e DDT</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-new-spedizione">
          <Plus className="mr-2 h-4 w-4" />
          Nuova Spedizione
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per numero, committente o città..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={filterStato} onValueChange={setFilterStato}>
          <SelectTrigger className="w-48" data-testid="select-filter-stato">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tutti gli stati</SelectItem>
            <SelectItem value="INSERITA">Inserita</SelectItem>
            <SelectItem value="ASSEGNATA">Assegnata</SelectItem>
            <SelectItem value="IN_CONSEGNA">In Consegna</SelectItem>
            <SelectItem value="CONSEGNATA">Consegnata</SelectItem>
            <SelectItem value="PROBLEMA">Problema</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      ) : filteredSpedizioni && filteredSpedizioni.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Data DDT</TableHead>
                    <TableHead>Committente</TableHead>
                    <TableHead>Destinazione</TableHead>
                    <TableHead className="text-right">Colli</TableHead>
                    <TableHead className="text-right">Peso (kg)</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="text-right">Contrassegno</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSpedizioni.map((spedizione) => (
                    <TableRow key={spedizione.id} className="hover-elevate" data-testid={`row-spedizione-${spedizione.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          #{spedizione.numeroSpedizione}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(spedizione.dataDDT), "dd/MM/yyyy", { locale: it })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{spedizione.committente.nome}</p>
                          <p className="text-xs text-muted-foreground">DDT {spedizione.numeroDDT}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{spedizione.destinatario.ragioneSociale}</p>
                          <p className="text-xs text-muted-foreground">
                            {spedizione.destinatario.citta} ({spedizione.destinatario.provincia})
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{spedizione.colli}</TableCell>
                      <TableCell className="text-right">{parseFloat(spedizione.pesoKg).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATI_COLORS[spedizione.stato as keyof typeof STATI_COLORS]}>
                          {spedizione.stato}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {spedizione.contrassegno ? `€ ${parseFloat(spedizione.contrassegno).toFixed(2)}` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nessuna spedizione trovata</p>
            <p className="text-sm text-muted-foreground mt-1">
              Inizia aggiungendo la prima spedizione
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuova Spedizione da DDT</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 p-4 rounded-md border">
              <h3 className="font-semibold">Dati Committente e DDT</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="committenteId">Committente *</Label>
                  <Select value={formData.committenteId} onValueChange={(value) => setFormData({ ...formData, committenteId: value })} required>
                    <SelectTrigger data-testid="select-committente">
                      <SelectValue placeholder="Seleziona committente" />
                    </SelectTrigger>
                    <SelectContent>
                      {committenti?.map((committente) => (
                        <SelectItem key={committente.id} value={committente.id}>
                          {committente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataDDT">Data DDT *</Label>
                  <Input
                    id="dataDDT"
                    type="date"
                    value={formData.dataDDT}
                    onChange={(e) => setFormData({ ...formData, dataDDT: e.target.value })}
                    required
                    data-testid="input-data-ddt"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numeroDDT">Numero DDT *</Label>
                <Input
                  id="numeroDDT"
                  value={formData.numeroDDT}
                  onChange={(e) => setFormData({ ...formData, numeroDDT: e.target.value })}
                  required
                  data-testid="input-numero-ddt"
                />
              </div>
            </div>

            <div className="space-y-4 p-4 rounded-md border">
              <h3 className="font-semibold">Destinatario</h3>
              <div className="space-y-2">
                <Label htmlFor="destinatarioId">Destinatario *</Label>
                <Select value={formData.destinatarioId} onValueChange={(value) => setFormData({ ...formData, destinatarioId: value })} required>
                  <SelectTrigger data-testid="select-destinatario">
                    <SelectValue placeholder="Seleziona destinatario" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinatari?.map((destinatario) => (
                      <SelectItem key={destinatario.id} value={destinatario.id}>
                        {destinatario.ragioneSociale} - {destinatario.citta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 p-4 rounded-md border">
              <h3 className="font-semibold">Dettagli Spedizione</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="colli">Colli *</Label>
                  <Input
                    id="colli"
                    type="number"
                    value={formData.colli}
                    onChange={(e) => setFormData({ ...formData, colli: parseInt(e.target.value) || 0 })}
                    required
                    min="1"
                    data-testid="input-colli"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pesoKg">Peso (kg) *</Label>
                  <Input
                    id="pesoKg"
                    type="number"
                    step="0.01"
                    value={formData.pesoKg}
                    onChange={(e) => setFormData({ ...formData, pesoKg: e.target.value })}
                    required
                    min="0"
                    data-testid="input-peso-kg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contrassegno">Contrassegno (€)</Label>
                  <Input
                    id="contrassegno"
                    type="number"
                    step="0.01"
                    value={formData.contrassegno || ""}
                    onChange={(e) => setFormData({ ...formData, contrassegno: e.target.value || null })}
                    min="0"
                    placeholder="Opzionale"
                    data-testid="input-contrassegno"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  value={formData.note || ""}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={3}
                  data-testid="input-note"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm} data-testid="button-cancel">
                Annulla
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save">
                Crea Spedizione
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
