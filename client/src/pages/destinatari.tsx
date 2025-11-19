import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Plus, Pencil, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Destinatario, InsertDestinatario } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function Destinatari() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDestinatario, setEditingDestinatario] = useState<Destinatario | null>(null);
  const [formData, setFormData] = useState<InsertDestinatario>({
    ragioneSociale: "",
    indirizzo: "",
    cap: "",
    citta: "",
    provincia: "",
    zona: "",
    note: "",
  });

  const { data: destinatari, isLoading } = useQuery<Destinatario[]>({
    queryKey: ["/api/destinatari"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertDestinatario) => apiRequest("POST", "/api/destinatari", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/destinatari"] });
      toast({ title: "Destinatario creato con successo" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertDestinatario }) =>
      apiRequest("PUT", `/api/destinatari/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/destinatari"] });
      toast({ title: "Destinatario aggiornato con successo" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/destinatari/${id}`, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/destinatari"] });
      toast({ title: "Destinatario eliminato con successo" });
    },
  });

  const resetForm = () => {
    setFormData({
      ragioneSociale: "",
      indirizzo: "",
      cap: "",
      citta: "",
      provincia: "",
      zona: "",
      note: "",
    });
    setEditingDestinatario(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDestinatario) {
      updateMutation.mutate({ id: editingDestinatario.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (destinatario: Destinatario) => {
    setEditingDestinatario(destinatario);
    setFormData({
      ragioneSociale: destinatario.ragioneSociale,
      indirizzo: destinatario.indirizzo,
      cap: destinatario.cap,
      citta: destinatario.citta,
      provincia: destinatario.provincia,
      zona: destinatario.zona || "",
      note: destinatario.note || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo destinatario?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredDestinatari = destinatari?.filter((d) =>
    d.ragioneSociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.citta.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.zona && d.zona.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Destinatari</h1>
          <p className="text-muted-foreground mt-1">Gestione anagrafica destinatari</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-new-destinatario">
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Destinatario
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca destinatari per ragione sociale, città o zona..."
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
      ) : filteredDestinatari && filteredDestinatari.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDestinatari.map((destinatario) => (
            <Card key={destinatario.id} className="hover-elevate" data-testid={`card-destinatario-${destinatario.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{destinatario.ragioneSociale}</CardTitle>
                      {destinatario.zona && (
                        <Badge variant="secondary" className="mt-1">{destinatario.zona}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(destinatario)}
                      data-testid={`button-edit-${destinatario.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(destinatario.id)}
                      data-testid={`button-delete-${destinatario.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <p className="text-muted-foreground">Indirizzo</p>
                  <p className="font-medium">{destinatario.indirizzo}</p>
                  <p>{destinatario.cap} {destinatario.citta} ({destinatario.provincia})</p>
                </div>
                {destinatario.note && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Note</p>
                    <p className="text-sm line-clamp-2">{destinatario.note}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nessun destinatario trovato</p>
            <p className="text-sm text-muted-foreground mt-1">
              Inizia aggiungendo il primo destinatario
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDestinatario ? "Modifica Destinatario" : "Nuovo Destinatario"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ragioneSociale">Ragione Sociale *</Label>
              <Input
                id="ragioneSociale"
                value={formData.ragioneSociale}
                onChange={(e) => setFormData({ ...formData, ragioneSociale: e.target.value })}
                required
                data-testid="input-ragione-sociale"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="indirizzo">Indirizzo *</Label>
                <Input
                  id="indirizzo"
                  value={formData.indirizzo}
                  onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                  required
                  data-testid="input-indirizzo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cap">CAP *</Label>
                <Input
                  id="cap"
                  value={formData.cap}
                  onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                  required
                  data-testid="input-cap"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="citta">Città *</Label>
                <Input
                  id="citta"
                  value={formData.citta}
                  onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                  required
                  data-testid="input-citta"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia *</Label>
                <Input
                  id="provincia"
                  value={formData.provincia}
                  onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                  required
                  maxLength={2}
                  placeholder="BG"
                  data-testid="input-provincia"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zona">Zona</Label>
              <Input
                id="zona"
                value={formData.zona || ""}
                onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                placeholder="Es: Bergamo Centro, Treviglio..."
                data-testid="input-zona"
              />
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

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm} data-testid="button-cancel">
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save"
              >
                {editingDestinatario ? "Aggiorna" : "Crea"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
