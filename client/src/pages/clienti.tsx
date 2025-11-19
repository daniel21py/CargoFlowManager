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
import type { Cliente, InsertCliente } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function Clienti() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<InsertCliente>({
    ragioneSociale: "",
    indirizzo: "",
    cap: "",
    citta: "",
    provincia: "",
    note: "",
  });

  const { data: clienti, isLoading } = useQuery<Cliente[]>({
    queryKey: ["/api/clienti"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertCliente) => apiRequest("POST", "/api/clienti", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clienti"] });
      toast({ title: "Cliente creato con successo" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertCliente }) =>
      apiRequest("PUT", `/api/clienti/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clienti"] });
      toast({ title: "Cliente aggiornato con successo" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/clienti/${id}`, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clienti"] });
      toast({ title: "Cliente eliminato con successo" });
    },
  });

  const resetForm = () => {
    setFormData({
      ragioneSociale: "",
      indirizzo: "",
      cap: "",
      citta: "",
      provincia: "",
      note: "",
    });
    setEditingCliente(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCliente) {
      updateMutation.mutate({ id: editingCliente.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      ragioneSociale: cliente.ragioneSociale,
      indirizzo: cliente.indirizzo,
      cap: cliente.cap,
      citta: cliente.citta,
      provincia: cliente.provincia,
      note: cliente.note || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo cliente?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredClienti = clienti?.filter((c) =>
    c.ragioneSociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.citta.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clienti</h1>
          <p className="text-muted-foreground mt-1">Gestione anagrafica clienti</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-new-cliente">
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Cliente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca clienti per ragione sociale o città..."
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
      ) : filteredClienti && filteredClienti.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClienti.map((cliente) => (
            <Card key={cliente.id} className="hover-elevate" data-testid={`card-cliente-${cliente.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{cliente.ragioneSociale}</CardTitle>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(cliente)}
                      data-testid={`button-edit-${cliente.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(cliente.id)}
                      data-testid={`button-delete-${cliente.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <p className="text-muted-foreground">Indirizzo</p>
                  <p className="font-medium">{cliente.indirizzo}</p>
                  <p>{cliente.cap} {cliente.citta} ({cliente.provincia})</p>
                </div>
                {cliente.note && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Note</p>
                    <p className="text-sm line-clamp-2">{cliente.note}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nessun cliente trovato</p>
            <p className="text-sm text-muted-foreground mt-1">
              Inizia aggiungendo il primo cliente
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCliente ? "Modifica Cliente" : "Nuovo Cliente"}
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
                {editingCliente ? "Aggiorna" : "Crea"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
