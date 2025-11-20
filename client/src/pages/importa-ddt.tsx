import { useState } from "react";
import { useLocation } from "wouter";
import { Upload, FileText, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InsertSpedizione } from "@shared/schema";

interface DDTData {
  committente?: string;
  destinatario?: {
    ragioneSociale?: string;
    indirizzo?: string;
    cap?: string;
    citta?: string;
    provincia?: string;
  };
  dataDDT?: string;
  numeroDDT?: string;
  colli?: number;
  peso?: number;
  contrassegno?: number;
}

interface CandidateResult {
  pageNumber: number;
  data?: (DDTData & { committenteId?: string; destinatarioId?: string }) | null;
  metadata?: {
    committenteMapped?: boolean;
    destinatarioMapped?: boolean;
    destinatarioCreated?: boolean;
    destinatarioError?: string;
  };
  committenteId?: string | null;
  destinatarioId?: string | null;
  error?: string;
  status?: "pending" | "saved" | "error";
}

interface ImportResponse {
  success: boolean;
  candidates: CandidateResult[];
  summary?: {
    totalPages: number;
    processedPages: number;
    pagesWithErrors: number;
  };
}

export default function ImportaDDT() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [savingPages, setSavingPages] = useState<number[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setError("Tipo di file non supportato. Usa PDF, JPG o PNG");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
      setCandidates([]);
      setSavingPages([]);
      setBulkSaving(false);
    }
  };

  const handleProcessFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/import-ddt", {
        method: "POST",
        body: formData,
      });

      const result: ImportResponse = await response.json();

      if (!response.ok) {
        throw new Error((result as any).error || "Errore durante il processamento");
      }

      const normalized = (result.candidates || []).map((candidate) => ({
        ...candidate,
        status: candidate.error ? "error" : "pending",
      }));

      setCandidates(normalized);

      const readyCount = normalized.filter((candidate) => !candidate.error).length;
      const errorCount = normalized.length - readyCount;
      toast({
        title: "File elaborato",
        description:
          normalized.length === 0
            ? "Nessun DDT riconosciuto. Prova con un file differente."
            : `${readyCount} candidato/i pronto/i, ${errorCount} con avvisi`,
      });
    } catch (err: any) {
      console.error("Errore import DDT:", err);
      setError(err.message || "Errore durante il processamento del file");
      toast({
        title: "Errore",
        description: err.message || "Impossibile processare il DDT",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getCommittenteId = (candidate: CandidateResult) =>
    candidate.committenteId || candidate.data?.committenteId || "";

  const getDestinatarioId = (candidate: CandidateResult) =>
    candidate.destinatarioId || candidate.data?.destinatarioId || "";

  const canAutoSaveCandidate = (candidate: CandidateResult) =>
    !!candidate.data &&
    !candidate.error &&
    candidate.status !== "saved" &&
    !!getCommittenteId(candidate) &&
    !!getDestinatarioId(candidate);

  const setPageSaving = (pageNumber: number, saving: boolean) => {
    setSavingPages((prev) =>
      saving ? [...prev, pageNumber] : prev.filter((num) => num !== pageNumber),
    );
  };

  const handleEditCandidate = (candidate: CandidateResult) => {
    if (!candidate.data) {
      toast({
        title: "Dati mancanti",
        description: "Questa pagina non contiene informazioni sufficienti da modificare.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      committenteId: getCommittenteId(candidate),
      destinatarioId: getDestinatarioId(candidate),
      dataDDT: candidate.data.dataDDT || new Date().toISOString().split("T")[0],
      numeroDDT: candidate.data.numeroDDT || "",
      colli: candidate.data.colli || 1,
      pesoKg: candidate.data.peso ? candidate.data.peso.toString() : "0",
      contrassegno: candidate.data.contrassegno ? candidate.data.contrassegno.toFixed(2) : null,
      note: `Importato da PDF - Pagina ${candidate.pageNumber}`,
    };

    localStorage.setItem("ddtImportData", JSON.stringify(payload));
    navigate("/spedizioni");
  };

  const handleDiscardCandidate = (pageNumber: number) => {
    setCandidates((prev) => prev.filter((candidate) => candidate.pageNumber !== pageNumber));
  };

  const handleConfirmCandidate = async (
    candidate: CandidateResult,
    options?: { silent?: boolean },
  ): Promise<boolean> => {
    if (!candidate.data) {
      toast({
        title: "Dati incompleti",
        description: "Impossibile creare la spedizione senza i dati minimi.",
        variant: "destructive",
      });
      return false;
    }

    const committenteId = getCommittenteId(candidate);
    const destinatarioId = getDestinatarioId(candidate);
    if (!committenteId || !destinatarioId) {
      toast({
        title: "Mappature mancanti",
        description: "Associa manualmente committente e destinatario prima di salvare.",
        variant: "destructive",
      });
      return false;
    }

    const page = candidate.pageNumber;
    setPageSaving(page, true);

    try {
      const payload: InsertSpedizione = {
        committenteId,
        destinatarioId,
        dataDDT: candidate.data.dataDDT || new Date().toISOString().split("T")[0],
        numeroDDT: candidate.data.numeroDDT || `PDF-${page}-${Date.now()}`,
        colli: candidate.data.colli || 1,
        pesoKg: candidate.data.peso ? candidate.data.peso.toString() : "0",
        contrassegno: candidate.data.contrassegno
          ? candidate.data.contrassegno.toFixed(2)
          : null,
        filePath: null,
        note: `Importato automaticamente (Pagina ${page})`,
        stato: "INSERITA",
        giroId: null,
      };

      await apiRequest("POST", "/api/spedizioni", payload);
      queryClient.invalidateQueries({ queryKey: ["/api/spedizioni"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      setCandidates((prev) =>
        prev.map((c) => (c.pageNumber === page ? { ...c, status: "saved" } : c)),
      );

      if (!options?.silent) {
        toast({
          title: "Spedizione creata",
          description: `Pagina ${page} salvata correttamente`,
        });
      }
      return true;
    } catch (err: any) {
      setCandidates((prev) =>
        prev.map((c) =>
          c.pageNumber === page
            ? {
                ...c,
                status: "error",
                error: err.message || "Errore durante il salvataggio",
              }
            : c,
        ),
      );
      if (!options?.silent) {
        toast({
          title: "Errore",
          description: err.message || "Impossibile salvare la spedizione",
          variant: "destructive",
        });
      }
      return false;
    } finally {
      setPageSaving(page, false);
    }
  };

  const handleConfirmAll = async () => {
    setBulkSaving(true);
    let successCount = 0;

    for (const candidate of candidates) {
      if (!canAutoSaveCandidate(candidate)) continue;
      const success = await handleConfirmCandidate(candidate, { silent: true });
      if (success) successCount++;
    }

    setBulkSaving(false);
    toast({
      title: successCount > 0 ? "Conferma completata" : "Nessuna spedizione creata",
      description:
        successCount > 0
          ? `${successCount} spedizioni generate automaticamente`
          : "Verifica i dati estratti e riprova.",
      variant: successCount > 0 ? "default" : "destructive",
    });
  };

  const readyCount = candidates.filter((candidate) => !candidate.error).length;
  const errorCount = candidates.filter((candidate) => candidate.error).length;
  const hasConfirmableCandidates = candidates.some(canAutoSaveCandidate);
  const isSavingPage = (pageNumber: number) => savingPages.includes(pageNumber);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Importa DDT</h1>
        <p className="text-muted-foreground mt-2">
          Carica un file PDF o immagine di un DDT per estrarre automaticamente i dati della spedizione
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Carica Documento DDT</CardTitle>
          <CardDescription>
            Formati supportati: PDF, JPG, PNG (max 25 MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File upload area */}
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              data-testid="input-file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              <div className="p-4 rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              {selectedFile ? (
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ) : (
                <div>
                  <p className="font-medium">Clicca per selezionare un file</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    o trascina un file PDF/JPG/PNG qui
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Error message */}
          {error && (
            <Alert variant="destructive" data-testid="alert-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

            {/* Process button */}
            {selectedFile && (
              <Button
                onClick={handleProcessFile}
                disabled={isProcessing}
                className="w-full"
                size="lg"
                data-testid="button-process-ddt"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Elaborazione in corso...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Elabora DDT con OCR + AI
                  </>
                )}
              </Button>
            )}

            {candidates.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-semibold">{candidates.length} pagine analizzate</p>
                    <p className="text-sm text-muted-foreground">
                      {readyCount} con dati utili · {errorCount} con avvisi
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCandidates([]);
                        setSavingPages([]);
                      }}
                      data-testid="button-reset-candidates"
                    >
                      Svuota elenco
                    </Button>
                    <Button
                      onClick={handleConfirmAll}
                      disabled={bulkSaving || !hasConfirmableCandidates}
                      data-testid="button-confirm-all"
                    >
                      {bulkSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Conferma tutti
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pagina</TableHead>
                          <TableHead>Committente</TableHead>
                          <TableHead>Destinatario</TableHead>
                          <TableHead>Data DDT</TableHead>
                          <TableHead>Numero DDT</TableHead>
                          <TableHead>Colli</TableHead>
                          <TableHead>Peso (kg)</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {candidates.map((candidate) => {
                          const canAutoSave = canAutoSaveCandidate(candidate);
                          const saving = isSavingPage(candidate.pageNumber);
                          return (
                            <TableRow
                              key={candidate.pageNumber}
                              className={candidate.status === "saved" ? "bg-muted/50" : undefined}
                              data-testid={`row-candidate-${candidate.pageNumber}`}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span>Pagina {candidate.pageNumber}</span>
                                  {candidate.status === "saved" && (
                                    <Badge variant="secondary">Salvato</Badge>
                                  )}
                                  {candidate.error && <Badge variant="destructive">Errore</Badge>}
                                </div>
                                {candidate.error && (
                                  <p className="text-xs text-destructive mt-1">{candidate.error}</p>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-medium">{candidate.data?.committente || "—"}</p>
                                  {candidate.metadata?.committenteMapped && (
                                    <Badge variant="outline" className="text-xs">
                                      Mappato
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-medium">
                                    {candidate.data?.destinatario?.ragioneSociale || "—"}
                                  </p>
                                  {candidate.data?.destinatario?.citta && (
                                    <p className="text-xs text-muted-foreground">
                                      {candidate.data.destinatario.citta} (
                                      {candidate.data.destinatario.provincia})
                                    </p>
                                  )}
                                  {candidate.metadata?.destinatarioMapped && (
                                    <Badge variant="outline" className="text-xs">
                                      Mappato
                                    </Badge>
                                  )}
                                  {candidate.metadata?.destinatarioCreated && (
                                    <Badge variant="outline" className="text-xs">
                                      Creato automaticamente
                                    </Badge>
                                  )}
                                  {candidate.metadata?.destinatarioError && (
                                    <p className="text-xs text-amber-600">
                                      {candidate.metadata.destinatarioError}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{candidate.data?.dataDDT || "—"}</TableCell>
                              <TableCell>{candidate.data?.numeroDDT || "—"}</TableCell>
                              <TableCell>{candidate.data?.colli ?? "—"}</TableCell>
                              <TableCell>{candidate.data?.peso ?? "—"}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2 flex-wrap">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditCandidate(candidate)}
                                    data-testid={`button-edit-candidate-${candidate.pageNumber}`}
                                  >
                                    Modifica
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleConfirmCandidate(candidate)}
                                    disabled={!canAutoSave || saving}
                                    data-testid={`button-save-candidate-${candidate.pageNumber}`}
                                  >
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Conferma e salva
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDiscardCandidate(candidate.pageNumber)}
                                    data-testid={`button-discard-candidate-${candidate.pageNumber}`}
                                  >
                                    Scarta
                                  </Button>
                                </div>
                                {!canAutoSave && !candidate.error && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Completa le anagrafiche tramite Modifica prima di salvare.
                                  </p>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Help section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Come funziona?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. <strong>Carica il file</strong>: Seleziona un PDF o un'immagine (JPG/PNG) del DDT</p>
          <p>2. <strong>Elaborazione automatica</strong>: Il sistema usa OCR per estrarre il testo e AI per identificare i dati</p>
          <p>3. <strong>Verifica e correzione</strong>: Controlla i dati estratti e modifica eventuali errori</p>
          <p>4. <strong>Crea spedizione</strong>: I dati vengono precompilati nel form di creazione spedizione</p>
          <p className="text-muted-foreground mt-4">
            <strong>Nota</strong>: Se alcuni campi non vengono estratti automaticamente, potrai compilarli manualmente nel passaggio successivo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
