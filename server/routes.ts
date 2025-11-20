import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { insertCommittenteSchema, insertDestinatarioSchema, insertAutistaSchema, insertMezzoSchema, insertGiroSchema, insertSpedizioneSchema, updateSpedizioneStatoSchema, type InsertDestinatario } from "@shared/schema";
import multer from "multer";
import { extractTextFromDDT } from "./ocr-service";
import { parseDDTWithAI } from "./ai-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const storage = await getStorage();
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Credenziali non valide" });
      }

      res.json({ success: true, user: { id: user.id, username: user.username } });
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  // Stats route
  app.get("/api/stats", async (_req, res) => {
    try {
      const storage = await getStorage();
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero statistiche" });
    }
  });

  // Committenti routes
  app.get("/api/committenti", async (_req, res) => {
    try {
      const storage = await getStorage();
      const committenti = await storage.getAllCommittenti();
      res.json(committenti);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero committenti" });
    }
  });

  app.post("/api/committenti", async (req, res) => {
    try {
      const storage = await getStorage();
      const data = insertCommittenteSchema.parse(req.body);
      const committente = await storage.createCommittente(data);
      res.json(committente);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.put("/api/committenti/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      const data = insertCommittenteSchema.parse(req.body);
      const committente = await storage.updateCommittente(id, data);
      res.json(committente);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.delete("/api/committenti/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      await storage.deleteCommittente(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione" });
    }
  });

  // Destinatari routes
  app.get("/api/destinatari", async (_req, res) => {
    try {
      const storage = await getStorage();
      const destinatari = await storage.getAllDestinatari();
      res.json(destinatari);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero destinatari" });
    }
  });

  app.post("/api/destinatari", async (req, res) => {
    try {
      const storage = await getStorage();
      const data = insertDestinatarioSchema.parse(req.body);
      const destinatario = await storage.createDestinatario(data);
      res.json(destinatario);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.put("/api/destinatari/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      const data = insertDestinatarioSchema.parse(req.body);
      const destinatario = await storage.updateDestinatario(id, data);
      res.json(destinatario);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.delete("/api/destinatari/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      await storage.deleteDestinatario(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione" });
    }
  });

  // Autisti routes
  app.get("/api/autisti", async (_req, res) => {
    try {
      const storage = await getStorage();
      const autisti = await storage.getAllAutisti();
      res.json(autisti);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero autisti" });
    }
  });

  app.post("/api/autisti", async (req, res) => {
    try {
      const storage = await getStorage();
      const data = insertAutistaSchema.parse(req.body);
      const autista = await storage.createAutista(data);
      res.json(autista);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.put("/api/autisti/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      const data = insertAutistaSchema.parse(req.body);
      const autista = await storage.updateAutista(id, data);
      res.json(autista);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.delete("/api/autisti/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      await storage.deleteAutista(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione" });
    }
  });

  // Mezzi routes
  app.get("/api/mezzi", async (_req, res) => {
    try {
      const storage = await getStorage();
      const mezzi = await storage.getAllMezzi();
      res.json(mezzi);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero mezzi" });
    }
  });

  app.post("/api/mezzi", async (req, res) => {
    try {
      const storage = await getStorage();
      const data = insertMezzoSchema.parse(req.body);
      const mezzo = await storage.createMezzo(data);
      res.json(mezzo);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.put("/api/mezzi/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      const data = insertMezzoSchema.parse(req.body);
      const mezzo = await storage.updateMezzo(id, data);
      res.json(mezzo);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.delete("/api/mezzi/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      await storage.deleteMezzo(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione" });
    }
  });

  // Giri routes
  app.get("/api/giri/by-date/:data", async (req, res) => {
    try {
      const storage = await getStorage();
      const { data } = req.params;
      const giri = await storage.getGiriByData(data);
      res.json(giri);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero giri" });
    }
  });

  app.get("/api/giri/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      const giro = await storage.getGiro(id);
      if (!giro) {
        return res.status(404).json({ error: "Giro non trovato" });
      }
      res.json(giro);
    } catch (error) {
      console.error("Error fetching giro:", error);
      res.status(500).json({ error: "Errore nel recupero giro" });
    }
  });

  app.post("/api/giri", async (req, res) => {
    try {
      const storage = await getStorage();
      const data = insertGiroSchema.parse(req.body);
      const giro = await storage.createGiro(data);
      res.json(giro);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.delete("/api/giri/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      await storage.deleteGiro(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione" });
    }
  });

  // Spedizioni routes
  app.get("/api/spedizioni", async (_req, res) => {
    try {
      const storage = await getStorage();
      const spedizioni = await storage.getAllSpedizioni();
      res.json(spedizioni);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero spedizioni" });
    }
  });

  app.post("/api/spedizioni", async (req, res) => {
    try {
      const storage = await getStorage();
      const data = insertSpedizioneSchema.parse(req.body);
      const spedizione = await storage.createSpedizione(data);
      res.json(spedizione);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.put("/api/spedizioni/:id/assign", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      const { giroId } = req.body;
      const spedizione = await storage.assignSpedizione(id, giroId);
      res.json(spedizione);
    } catch (error) {
      res.status(400).json({ error: "Errore nell'assegnazione" });
    }
  });

  app.patch("/api/spedizioni/:id/stato", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      const { stato } = updateSpedizioneStatoSchema.parse(req.body);
      const spedizione = await storage.updateSpedizioneStato(id, stato);
      res.json(spedizione);
    } catch (error) {
      res.status(400).json({ error: "Errore nell'aggiornamento stato" });
    }
  });

  // Import DDT route - OCR + AI processing
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 25 * 1024 * 1024, // Max 25MB (aumentato da 10MB)
    },
    fileFilter: (_req, file, cb) => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Tipo di file non supportato. Solo PDF, JPG e PNG sono accettati.'));
      }
    }
  });
  
  app.post("/api/import-ddt", (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        // Handle multer-specific errors
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ 
            error: "File troppo grande", 
            details: "La dimensione massima consentita è 25MB",
            allowManualEntry: true 
          });
        }
        if (err.message.includes('Tipo di file non supportato')) {
          return res.status(415).json({ 
            error: "Tipo di file non supportato", 
            details: err.message,
            allowManualEntry: true 
          });
        }
        return res.status(400).json({ 
          error: "Errore durante l'upload", 
          details: err.message,
          allowManualEntry: true 
        });
      }
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nessun file caricato" });
      }

      const fileBuffer = req.file.buffer;
      const mimeType = req.file.mimetype;

      // Server-side validation of MIME type (double-check)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(mimeType)) {
        return res.status(415).json({ 
          error: "Tipo di file non valido", 
          details: "Solo file PDF, JPG e PNG sono supportati",
          allowManualEntry: true 
        });
      }

      // Step 1: Extract text from file (OCR for images, text extraction for PDF)
      let extractedText: string;
      try {
        extractedText = await extractTextFromDDT(fileBuffer, mimeType);
        console.log("Testo estratto dal DDT:", extractedText.substring(0, 200));
      } catch (ocrError: any) {
        console.error("Errore OCR:", ocrError);
        return res.status(500).json({ 
          error: "Errore durante l'estrazione del testo", 
          details: ocrError.message,
          allowManualEntry: true 
        });
      }

      // Step 2: Parse DDT data with AI
      let ddtData;
      try {
        ddtData = await parseDDTWithAI(extractedText);
        console.log("Dati estratti con AI:", ddtData);
      } catch (aiError: any) {
        console.error("Errore AI parsing:", aiError);
        return res.status(500).json({ 
          error: "Errore durante l'analisi dei dati", 
          details: aiError.message,
          extractedText,
          allowManualEntry: true 
        });
      }

      // Step 3: Smart mapping committente
      const storage = await getStorage();
      let committenteId: string | undefined;
      
      if (ddtData.committente) {
        // Cerca committente per nome con matching flessibile (case-insensitive, contains)
        const committenti = await storage.getAllCommittenti();
        const committenteNome = ddtData.committente.toLowerCase().trim();
        
        // Prova prima match esatto, poi contains
        let committenteMatch = committenti.find(c => 
          c.nome.toLowerCase().trim() === committenteNome
        );
        
        // Se non trova match esatto, prova con contains (per gestire "Cati S.p.A." → "Cati")
        if (!committenteMatch) {
          committenteMatch = committenti.find(c => {
            const nome = c.nome.toLowerCase().trim();
            return committenteNome.includes(nome) || nome.includes(committenteNome);
          });
        }
        
        if (committenteMatch) {
          committenteId = committenteMatch.id;
          console.log(`Committente mappato: ${committenteMatch.nome} (ID: ${committenteId})`);
        } else {
          console.log(`Committente non trovato per: ${ddtData.committente}`);
        }
      }

      // Step 4: Smart mapping/creation destinatario
      let destinatarioId: string | undefined;
      let destinatarioCreated = false;
      let destinatarioError: string | undefined;
      
      if (ddtData.destinatario?.ragioneSociale && ddtData.destinatario?.citta) {
        // Cerca destinatario per ragione sociale + città (case-insensitive)
        const destinatari = await storage.getAllDestinatari();
        const ragioneSocialeNorm = ddtData.destinatario.ragioneSociale.toLowerCase().trim();
        const cittaNorm = ddtData.destinatario.citta.toLowerCase().trim();
        
        const destinatarioMatch = destinatari.find(d => 
          d.ragioneSociale.toLowerCase().trim() === ragioneSocialeNorm &&
          d.citta.toLowerCase().trim() === cittaNorm
        );
        
        if (destinatarioMatch) {
          // Destinatario esistente trovato
          destinatarioId = destinatarioMatch.id;
          console.log(`Destinatario trovato: ${destinatarioMatch.ragioneSociale} (ID: ${destinatarioId})`);
        } else {
          // Crea nuovo destinatario con validazione schema
          try {
            // Validazione dati prima di creare
            const insertData: InsertDestinatario = {
              ragioneSociale: ddtData.destinatario.ragioneSociale.trim(),
              indirizzo: ddtData.destinatario.indirizzo?.trim() || 'Da verificare',
              cap: ddtData.destinatario.cap?.trim() || '00000',
              citta: ddtData.destinatario.citta.trim(),
              provincia: ddtData.destinatario.provincia?.trim() || 'XX',
              zona: null, // Zona da assegnare manualmente dopo
              note: 'Creato automaticamente da import DDT - verificare dati',
            };
            
            // Validazione schema
            const validated = insertDestinatarioSchema.parse(insertData);
            const nuovoDestinatario = await storage.createDestinatario(validated);
            
            destinatarioId = nuovoDestinatario.id;
            destinatarioCreated = true;
            console.log(`Nuovo destinatario creato: ${nuovoDestinatario.ragioneSociale} (ID: ${destinatarioId})`);
          } catch (createError: any) {
            console.error('Errore creazione destinatario:', createError);
            destinatarioError = createError.message || 'Impossibile creare il destinatario';
            // Non bloccare l'import se fallisce la creazione
          }
        }
      }

      // Return parsed data with mapped IDs and metadata
      // Costruisci oggetto response esplicito per garantire presenza di tutti i campi
      const responseData = {
        // Dati estratti dall'AI
        committente: ddtData.committente,
        destinatario: ddtData.destinatario,
        dataDDT: ddtData.dataDDT,
        numeroDDT: ddtData.numeroDDT,
        colli: ddtData.colli,
        peso: ddtData.peso,
        contrassegno: ddtData.contrassegno,
        // ID mappati/creati
        committenteId: committenteId || undefined,
        destinatarioId: destinatarioId || undefined,
      };
      
      res.json({
        success: true,
        data: responseData,
        metadata: {
          committenteMapped: !!committenteId,
          destinatarioMapped: !!destinatarioId && !destinatarioCreated,
          destinatarioCreated,
          destinatarioError,
        },
        extractedText
      });
    } catch (error: any) {
      console.error("Errore generale import DDT:", error);
      res.status(500).json({ 
        error: "Errore durante l'importazione del DDT",
        details: error.message,
        allowManualEntry: true 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
