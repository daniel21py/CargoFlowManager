import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserCircle, Plus, Pencil, Trash2, Search, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { Autista, InsertAutista } from "@shared/schema";

export default function Autisti() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAutista, setEditingAutista] = useState<Autista | null>(null);
  const [formData, setFormData] = useState<InsertAutista>({
    nome: "",
    cognome: "",
    telefono: "",
    zonaPrincipale: "",
    attivo: true,
  });

  const { data: autisti, isLoading } = useQuery<Autista[]>({
    queryKey: ["/api/autisti"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertAutista) => apiRequest("POST", "/api/autisti", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autisti"] });
      toast({ title: "Autista creato con successo" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertAutista }) =>
      apiRequest("PUT", `/api/autisti/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autisti"] });
      toast({ title: "Autista aggiornato con successo" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/autisti/${id}`, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autisti"] });
      toast({ title: "Autista eliminato con successo" });
    },
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      cognome: "",
      telefono: "",
      zonaPrincipale: "",
      attivo: true,
    });
    setEditingAutista(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAutista) {
      updateMutation.mutate({ id: editingAutista.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (autista: Autista) => {
    setEditingAutista(autista);
    setFormData({
      nome: autista.nome,
      cognome: autista.cognome,
      telefono: autista.telefono,
      zonaPrincipale: autista.zonaPrincipale,
      attivo: autista.attivo,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo autista?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredAutisti = autisti?.filter((a) =>
    `${a.nome} ${a.cognome}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.zonaPrincipale.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Autisti</h1>
          <p className="text-muted-foreground mt-1">Gestione anagrafica autisti</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-new-autista">
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Autista
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca autisti per nome o zona..."
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
      ) : filteredAutisti && filteredAutisti.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAutisti.map((autista) => (
            <Card key={autista.id} className="hover-elevate" data-testid={`card-autista-${autista.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <UserCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">
                        {autista.nome} {autista.cognome}
                      </CardTitle>
                      <Badge variant={autista.attivo ? "default" : "secondary"} className="mt-1">
                        {autista.attivo ? "Attivo" : "Non Attivo"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(autista)}
                      data-testid={`button-edit-${autista.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(autista.id)}
                      data-testid={`button-delete-${autista.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{autista.telefono}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{autista.zonaPrincipale}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nessun autista trovato</p>
            <p className="text-sm text-muted-foreground mt-1">
              Inizia aggiungendo il primo autista
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAutista ? "Modifica Autista" : "Nuovo Autista"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  data-testid="input-nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cognome">Cognome *</Label>
                <Input
                  id="cognome"
                  value={formData.cognome}
                  onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                  required
                  data-testid="input-cognome"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Telefono *</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                required
                data-testid="input-telefono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zonaPrincipale">Zona Principale *</Label>
              <Input
                id="zonaPrincipale"
                value={formData.zonaPrincipale}
                onChange={(e) => setFormData({ ...formData, zonaPrincipale: e.target.value })}
                required
                placeholder="es. Bergamo Centro, Valle Seriana"
                data-testid="input-zona-principale"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-md border">
              <div className="space-y-0.5">
                <Label htmlFor="attivo">Autista Attivo</Label>
                <div className="text-sm text-muted-foreground">
                  Gli autisti non attivi non appariranno nella pianificazione
                </div>
              </div>
              <Switch
                id="attivo"
                checked={formData.attivo}
                onCheckedChange={(checked) => setFormData({ ...formData, attivo: checked })}
                data-testid="switch-attivo"
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
                {editingAutista ? "Aggiorna" : "Crea"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
