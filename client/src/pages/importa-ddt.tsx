import { useState } from "react";
import { useLocation } from "wouter";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

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

export default function ImportaDDT() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<DDTData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setError('Tipo di file non supportato. Usa PDF, JPG o PNG');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
      setExtractedData(null);
    }
  };

  const handleProcessFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/import-ddt', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Errore durante il processamento');
      }

      setExtractedData(result.data);
      toast({
        title: "DDT processato con successo",
        description: "I dati sono stati estratti. Controlla e salva la spedizione.",
      });
    } catch (err: any) {
      console.error('Errore import DDT:', err);
      setError(err.message || 'Errore durante il processamento del file');
      toast({
        title: "Errore",
        description: err.message || "Impossibile processare il DDT",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateSpedizione = () => {
    if (!extractedData) return;
    
    // Store prefilled data in localStorage for more reliable transfer
    localStorage.setItem('ddtImportData', JSON.stringify(extractedData));
    
    // Navigate to spedizioni page
    navigate('/spedizioni');
  };

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
            Formati supportati: PDF, JPG, PNG
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
          {selectedFile && !extractedData && (
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

          {/* Extracted data preview */}
          {extractedData && (
            <div className="space-y-4">
              <Alert data-testid="alert-success">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Dati estratti con successo! Controlla i campi e procedi con la creazione della spedizione.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dati Estratti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {extractedData.committente && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Committente:</span>
                      <p className="font-medium" data-testid="text-committente">{extractedData.committente}</p>
                    </div>
                  )}
                  
                  {extractedData.destinatario && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Destinatario:</span>
                      <div className="mt-1 space-y-1">
                        {extractedData.destinatario.ragioneSociale && (
                          <p className="font-medium" data-testid="text-destinatario-ragione">
                            {extractedData.destinatario.ragioneSociale}
                          </p>
                        )}
                        {extractedData.destinatario.indirizzo && (
                          <p className="text-sm">{extractedData.destinatario.indirizzo}</p>
                        )}
                        {(extractedData.destinatario.cap || extractedData.destinatario.citta || extractedData.destinatario.provincia) && (
                          <p className="text-sm">
                            {extractedData.destinatario.cap} {extractedData.destinatario.citta} ({extractedData.destinatario.provincia})
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {extractedData.dataDDT && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Data DDT:</span>
                        <p className="font-medium" data-testid="text-data-ddt">{extractedData.dataDDT}</p>
                      </div>
                    )}
                    {extractedData.numeroDDT && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Numero DDT:</span>
                        <p className="font-medium" data-testid="text-numero-ddt">{extractedData.numeroDDT}</p>
                      </div>
                    )}
                    {extractedData.colli !== undefined && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Colli:</span>
                        <p className="font-medium" data-testid="text-colli">{extractedData.colli}</p>
                      </div>
                    )}
                    {extractedData.peso !== undefined && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Peso:</span>
                        <p className="font-medium" data-testid="text-peso">{extractedData.peso} kg</p>
                      </div>
                    )}
                    {extractedData.contrassegno !== undefined && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Contrassegno:</span>
                        <p className="font-medium" data-testid="text-contrassegno">€ {extractedData.contrassegno.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  onClick={handleCreateSpedizione}
                  className="flex-1"
                  size="lg"
                  data-testid="button-create-spedizione"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Crea Spedizione
                </Button>
                <Button
                  onClick={() => {
                    setExtractedData(null);
                    setSelectedFile(null);
                  }}
                  variant="outline"
                  size="lg"
                  data-testid="button-reset"
                >
                  Annulla
                </Button>
              </div>
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
