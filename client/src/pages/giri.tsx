import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Plus, Calendar as CalendarIcon, Clock, Printer } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { GiroWithDetails, InsertGiro, Autista, Mezzo } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function Giri() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterData, setFilterData] = useState(new Date().toISOString().split("T")[0]);
  const [formData, setFormData] = useState<InsertGiro>({
    data: new Date().toISOString().split("T")[0],
    turno: "MATTINO",
    autistaId: "",
    mezzoId: "",
    zona: "",
    note: "",
  });

  const { data: giri, isLoading } = useQuery<GiroWithDetails[]>({
    queryKey: ["/api/giri/by-date", filterData],
  });

  const { data: autisti } = useQuery<Autista[]>({
    queryKey: ["/api/autisti"],
  });

  const { data: mezzi } = useQuery<Mezzo[]>({
    queryKey: ["/api/mezzi"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertGiro) => apiRequest("POST", "/api/giri", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/giri/by-date"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Giro creato con successo" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/giri/${id}`, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/giri/by-date"] });
      toast({ title: "Giro eliminato con successo" });
    },
  });

  const resetForm = () => {
    setFormData({
      data: new Date().toISOString().split("T")[0],
      turno: "MATTINO",
      autistaId: "",
      mezzoId: "",
      zona: "",
      note: "",
    });
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo giro?")) {
      deleteMutation.mutate(id);
    }
  };

  const autistiAttivi = autisti?.filter((a) => a.attivo);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Giri</h1>
          <p className="text-muted-foreground mt-1">Gestione giri giornalieri</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-new-giro">
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Giro
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="filterData">Filtra per data</Label>
            </div>
            <Input
              id="filterData"
              type="date"
              value={filterData}
              onChange={(e) => setFilterData(e.target.value)}
              className="w-auto"
              data-testid="input-filter-data"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      ) : giri && giri.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Autista</TableHead>
                    <TableHead>Mezzo</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {giri.map((giro) => (
                    <TableRow key={giro.id} className="hover-elevate" data-testid={`row-giro-${giro.id}`}>
                      <TableCell>
                        {format(new Date(giro.data), "dd/MM/yyyy", { locale: it })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={giro.turno === "MATTINO" ? "default" : "secondary"}>
                          <Clock className="mr-1 h-3 w-3" />
                          {giro.turno}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{giro.autista.nome} {giro.autista.cognome}</p>
                          <p className="text-xs text-muted-foreground">{giro.autista.telefono}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{giro.mezzo.targa}</p>
                          <p className="text-xs text-muted-foreground">{giro.mezzo.modello}</p>
                        </div>
                      </TableCell>
                      <TableCell>{giro.zona || "-"}</TableCell>
                      <TableCell>
                        <p className="text-sm line-clamp-1">{giro.note || "-"}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/stampa-ddt/${giro.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`button-print-${giro.id}`}
                            >
                              <Printer className="mr-1 h-3 w-3" />
                              Distinta Giornaliera
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(giro.id)}
                            data-testid={`button-delete-${giro.id}`}
                          >
                            Elimina
                          </Button>
                        </div>
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
            <Truck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nessun giro trovato</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filterData === new Date().toISOString().split("T")[0]
                ? "Crea il primo giro per oggi"
                : "Nessun giro programmato per questa data"}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Giro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  required
                  data-testid="input-data"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="turno">Turno *</Label>
                <Select value={formData.turno} onValueChange={(value) => setFormData({ ...formData, turno: value })}>
                  <SelectTrigger data-testid="select-turno">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MATTINO">Mattino</SelectItem>
                    <SelectItem value="POMERIGGIO">Pomeriggio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="autistaId">Autista *</Label>
              <Select value={formData.autistaId} onValueChange={(value) => setFormData({ ...formData, autistaId: value })} required>
                <SelectTrigger data-testid="select-autista">
                  <SelectValue placeholder="Seleziona autista" />
                </SelectTrigger>
                <SelectContent>
                  {autistiAttivi?.map((autista) => (
                    <SelectItem key={autista.id} value={autista.id}>
                      {autista.nome} {autista.cognome} - {autista.zonaPrincipale}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mezzoId">Mezzo *</Label>
              <Select value={formData.mezzoId} onValueChange={(value) => setFormData({ ...formData, mezzoId: value })} required>
                <SelectTrigger data-testid="select-mezzo">
                  <SelectValue placeholder="Seleziona mezzo" />
                </SelectTrigger>
                <SelectContent>
                  {mezzi?.map((mezzo) => (
                    <SelectItem key={mezzo.id} value={mezzo.id}>
                      {mezzo.targa} - {mezzo.modello} (Portata: {mezzo.portataKg} kg)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zona">Zona</Label>
              <Input
                id="zona"
                value={formData.zona || ""}
                onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                placeholder="es. Bergamo Centro"
                data-testid="input-zona"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={formData.note || ""}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={2}
                data-testid="input-note"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm} data-testid="button-cancel">
                Annulla
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save">
                Crea Giro
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
