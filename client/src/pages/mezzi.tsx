import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Truck, Plus, Pencil, Trash2, Search, Weight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Mezzo, InsertMezzo } from "@shared/schema";

export default function Mezzi() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMezzo, setEditingMezzo] = useState<Mezzo | null>(null);
  const [formData, setFormData] = useState<InsertMezzo>({
    targa: "",
    modello: "",
    portataKg: 0,
    note: "",
  });

  const { data: mezzi, isLoading } = useQuery<Mezzo[]>({
    queryKey: ["/api/mezzi"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertMezzo) => apiRequest("POST", "/api/mezzi", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mezzi"] });
      toast({ title: "Mezzo creato con successo" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertMezzo }) =>
      apiRequest("PUT", `/api/mezzi/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mezzi"] });
      toast({ title: "Mezzo aggiornato con successo" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/mezzi/${id}`, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mezzi"] });
      toast({ title: "Mezzo eliminato con successo" });
    },
  });

  const resetForm = () => {
    setFormData({
      targa: "",
      modello: "",
      portataKg: 0,
      note: "",
    });
    setEditingMezzo(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMezzo) {
      updateMutation.mutate({ id: editingMezzo.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (mezzo: Mezzo) => {
    setEditingMezzo(mezzo);
    setFormData({
      targa: mezzo.targa,
      modello: mezzo.modello,
      portataKg: mezzo.portataKg,
      note: mezzo.note || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo mezzo?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredMezzi = mezzi?.filter((m) =>
    m.targa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.modello.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mezzi</h1>
          <p className="text-muted-foreground mt-1">Gestione anagrafica mezzi</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-new-mezzo">
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Mezzo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca mezzi per targa o modello..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="input-search"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredMezzi && filteredMezzi.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMezzi.map((mezzo) => (
            <Card key={mezzo.id} className="hover-elevate" data-testid={`card-mezzo-${mezzo.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{mezzo.targa}</CardTitle>
                      <p className="text-sm text-muted-foreground">{mezzo.modello}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(mezzo)}
                      data-testid={`button-edit-${mezzo.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(mezzo.id)}
                      data-testid={`button-delete-${mezzo.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Weight className="h-4 w-4 text-muted-foreground" />
                  <span>Portata: {mezzo.portataKg} kg</span>
                </div>
                {mezzo.note && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Note</p>
                    <p className="text-sm line-clamp-2">{mezzo.note}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nessun mezzo trovato</p>
            <p className="text-sm text-muted-foreground mt-1">
              Inizia aggiungendo il primo mezzo
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMezzo ? "Modifica Mezzo" : "Nuovo Mezzo"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targa">Targa *</Label>
                <Input
                  id="targa"
                  value={formData.targa}
                  onChange={(e) => setFormData({ ...formData, targa: e.target.value.toUpperCase() })}
                  required
                  placeholder="AA123BB"
                  data-testid="input-targa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modello">Modello *</Label>
                <Input
                  id="modello"
                  value={formData.modello}
                  onChange={(e) => setFormData({ ...formData, modello: e.target.value })}
                  required
                  placeholder="es. Fiat Ducato"
                  data-testid="input-modello"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="portataKg">Portata (kg) *</Label>
              <Input
                id="portataKg"
                type="number"
                value={formData.portataKg || ""}
                onChange={(e) => setFormData({ ...formData, portataKg: parseInt(e.target.value) || 0 })}
                required
                min="0"
                data-testid="input-portata-kg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
                data-testid="input-note"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm} data-testid="button-cancel">
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save"
              >
                {editingMezzo ? "Aggiorna" : "Crea"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
