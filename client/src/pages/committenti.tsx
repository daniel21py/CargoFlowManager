import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Plus, Pencil, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Committente, InsertCommittente } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function Committenti() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCommittente, setEditingCommittente] = useState<Committente | null>(null);
  const [formData, setFormData] = useState<InsertCommittente>({
    nome: "",
    tipo: "",
    note: "",
  });

  const { data: committenti, isLoading } = useQuery<Committente[]>({
    queryKey: ["/api/committenti"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertCommittente) => apiRequest("POST", "/api/committenti", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/committenti"] });
      toast({ title: "Committente creato con successo" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertCommittente }) =>
      apiRequest("PUT", `/api/committenti/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/committenti"] });
      toast({ title: "Committente aggiornato con successo" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/committenti/${id}`, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/committenti"] });
      toast({ title: "Committente eliminato con successo" });
    },
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      tipo: "",
      note: "",
    });
    setEditingCommittente(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCommittente) {
      updateMutation.mutate({ id: editingCommittente.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (committente: Committente) => {
    setEditingCommittente(committente);
    setFormData({
      nome: committente.nome,
      tipo: committente.tipo || "",
      note: committente.note || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo committente?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredCommittenti = committenti?.filter((c) =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.tipo && c.tipo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Committenti</h1>
          <p className="text-muted-foreground mt-1">Gestione anagrafica committenti</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-new-committente">
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Committente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca committenti per nome o tipo..."
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
      ) : filteredCommittenti && filteredCommittenti.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCommittenti.map((committente) => (
            <Card key={committente.id} className="hover-elevate" data-testid={`card-committente-${committente.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{committente.nome}</CardTitle>
                      {committente.tipo && (
                        <Badge variant="secondary" className="mt-1">{committente.tipo}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(committente)}
                      data-testid={`button-edit-${committente.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(committente.id)}
                      data-testid={`button-delete-${committente.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {committente.note && (
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <p className="text-muted-foreground">Note</p>
                    <p className="text-sm line-clamp-2">{committente.note}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nessun committente trovato</p>
            <p className="text-sm text-muted-foreground mt-1">
              Inizia aggiungendo il primo committente
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCommittente ? "Modifica Committente" : "Nuovo Committente"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="tipo">Tipo</Label>
              <Input
                id="tipo"
                value={formData.tipo || ""}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                placeholder="Es: Azienda, Spedizioniere, Privato..."
                data-testid="input-tipo"
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
                {editingCommittente ? "Aggiorna" : "Crea"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
