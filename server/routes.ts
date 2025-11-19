import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClienteSchema, insertAutistaSchema, insertMezzoSchema, insertGiroSchema, insertSpedizioneSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
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
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero statistiche" });
    }
  });

  // Clienti routes
  app.get("/api/clienti", async (_req, res) => {
    try {
      const clienti = await storage.getAllClienti();
      res.json(clienti);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero clienti" });
    }
  });

  app.post("/api/clienti", async (req, res) => {
    try {
      const data = insertClienteSchema.parse(req.body);
      const cliente = await storage.createCliente(data);
      res.json(cliente);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.put("/api/clienti/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertClienteSchema.parse(req.body);
      const cliente = await storage.updateCliente(id, data);
      res.json(cliente);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.delete("/api/clienti/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCliente(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione" });
    }
  });

  // Autisti routes
  app.get("/api/autisti", async (_req, res) => {
    try {
      const autisti = await storage.getAllAutisti();
      res.json(autisti);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero autisti" });
    }
  });

  app.post("/api/autisti", async (req, res) => {
    try {
      const data = insertAutistaSchema.parse(req.body);
      const autista = await storage.createAutista(data);
      res.json(autista);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.put("/api/autisti/:id", async (req, res) => {
    try {
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
      const mezzi = await storage.getAllMezzi();
      res.json(mezzi);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero mezzi" });
    }
  });

  app.post("/api/mezzi", async (req, res) => {
    try {
      const data = insertMezzoSchema.parse(req.body);
      const mezzo = await storage.createMezzo(data);
      res.json(mezzo);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.put("/api/mezzi/:id", async (req, res) => {
    try {
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
      const { id } = req.params;
      await storage.deleteMezzo(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nell'eliminazione" });
    }
  });

  // Giri routes
  app.get("/api/giri/:data", async (req, res) => {
    try {
      const { data } = req.params;
      const giri = await storage.getGiriByData(data);
      res.json(giri);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero giri" });
    }
  });

  app.post("/api/giri", async (req, res) => {
    try {
      const data = insertGiroSchema.parse(req.body);
      const giro = await storage.createGiro(data);
      res.json(giro);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.delete("/api/giri/:id", async (req, res) => {
    try {
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
      const spedizioni = await storage.getAllSpedizioni();
      res.json(spedizioni);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero spedizioni" });
    }
  });

  app.post("/api/spedizioni", async (req, res) => {
    try {
      const data = insertSpedizioneSchema.parse(req.body);
      const spedizione = await storage.createSpedizione(data);
      res.json(spedizione);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.put("/api/spedizioni/:id/assign", async (req, res) => {
    try {
      const { id } = req.params;
      const { giroId } = req.body;
      const spedizione = await storage.assignSpedizione(id, giroId);
      res.json(spedizione);
    } catch (error) {
      res.status(400).json({ error: "Errore nell'assegnazione" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
