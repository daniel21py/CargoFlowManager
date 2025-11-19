import { randomUUID } from "crypto";
import type {
  User,
  InsertUser,
  Committente,
  InsertCommittente,
  Destinatario,
  InsertDestinatario,
  Autista,
  InsertAutista,
  Mezzo,
  InsertMezzo,
  Giro,
  InsertGiro,
  Spedizione,
  InsertSpedizione,
  SpedizioneWithDetails,
  GiroWithDetails,
} from "@shared/schema";

export interface IStorage {
  // User
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Committenti
  getAllCommittenti(): Promise<Committente[]>;
  getCommittente(id: string): Promise<Committente | undefined>;
  createCommittente(committente: InsertCommittente): Promise<Committente>;
  updateCommittente(id: string, committente: InsertCommittente): Promise<Committente>;
  deleteCommittente(id: string): Promise<void>;

  // Destinatari
  getAllDestinatari(): Promise<Destinatario[]>;
  getDestinatario(id: string): Promise<Destinatario | undefined>;
  createDestinatario(destinatario: InsertDestinatario): Promise<Destinatario>;
  updateDestinatario(id: string, destinatario: InsertDestinatario): Promise<Destinatario>;
  deleteDestinatario(id: string): Promise<void>;

  // Autisti
  getAllAutisti(): Promise<Autista[]>;
  getAutista(id: string): Promise<Autista | undefined>;
  createAutista(autista: InsertAutista): Promise<Autista>;
  updateAutista(id: string, autista: InsertAutista): Promise<Autista>;
  deleteAutista(id: string): Promise<void>;

  // Mezzi
  getAllMezzi(): Promise<Mezzo[]>;
  getMezzo(id: string): Promise<Mezzo | undefined>;
  createMezzo(mezzo: InsertMezzo): Promise<Mezzo>;
  updateMezzo(id: string, mezzo: InsertMezzo): Promise<Mezzo>;
  deleteMezzo(id: string): Promise<void>;

  // Giri
  getAllGiri(): Promise<Giro[]>;
  getGiriByData(data: string): Promise<GiroWithDetails[]>;
  getGiro(id: string): Promise<GiroWithDetails | undefined>;
  createGiro(giro: InsertGiro): Promise<Giro>;
  deleteGiro(id: string): Promise<void>;

  // Spedizioni
  getAllSpedizioni(): Promise<SpedizioneWithDetails[]>;
  getSpedizione(id: string): Promise<Spedizione | undefined>;
  createSpedizione(spedizione: InsertSpedizione): Promise<Spedizione>;
  assignSpedizione(id: string, giroId: string | null): Promise<Spedizione>;
  updateSpedizioneStato(id: string, stato: string): Promise<Spedizione>;
  getNextNumeroSpedizione(): Promise<number>;

  // Stats
  getStats(): Promise<{
    spedizioniDaAssegnare: number;
    giriOggi: number;
    inConsegna: number;
    consegnateOggi: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private committenti: Map<string, Committente>;
  private destinatari: Map<string, Destinatario>;
  private autisti: Map<string, Autista>;
  private mezzi: Map<string, Mezzo>;
  private giri: Map<string, Giro>;
  private spedizioni: Map<string, Spedizione>;
  private numeroSpedizioneCounter: number;

  constructor() {
    this.users = new Map();
    this.committenti = new Map();
    this.destinatari = new Map();
    this.autisti = new Map();
    this.mezzi = new Map();
    this.giri = new Map();
    this.spedizioni = new Map();
    this.numeroSpedizioneCounter = 1;

    // Create default user
    const DEFAULT_USER = {
      id: randomUUID(),
      username: "ufficio",
      password: "password123", // In production, this would be hashed
    };
    this.users.set(DEFAULT_USER.id, DEFAULT_USER);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Committenti methods
  async getAllCommittenti(): Promise<Committente[]> {
    return Array.from(this.committenti.values());
  }

  async getCommittente(id: string): Promise<Committente | undefined> {
    return this.committenti.get(id);
  }

  async createCommittente(insertCommittente: InsertCommittente): Promise<Committente> {
    const id = randomUUID();
    const committente: Committente = { 
      ...insertCommittente, 
      id, 
      tipo: insertCommittente.tipo ?? null,
      note: insertCommittente.note ?? null 
    };
    this.committenti.set(id, committente);
    return committente;
  }

  async updateCommittente(id: string, insertCommittente: InsertCommittente): Promise<Committente> {
    const committente: Committente = { 
      ...insertCommittente, 
      id, 
      tipo: insertCommittente.tipo ?? null,
      note: insertCommittente.note ?? null 
    };
    this.committenti.set(id, committente);
    return committente;
  }

  async deleteCommittente(id: string): Promise<void> {
    this.committenti.delete(id);
  }

  // Destinatari methods
  async getAllDestinatari(): Promise<Destinatario[]> {
    return Array.from(this.destinatari.values());
  }

  async getDestinatario(id: string): Promise<Destinatario | undefined> {
    return this.destinatari.get(id);
  }

  async createDestinatario(insertDestinatario: InsertDestinatario): Promise<Destinatario> {
    const id = randomUUID();
    const destinatario: Destinatario = { 
      ...insertDestinatario, 
      id,
      zona: insertDestinatario.zona ?? null,
      note: insertDestinatario.note ?? null 
    };
    this.destinatari.set(id, destinatario);
    return destinatario;
  }

  async updateDestinatario(id: string, insertDestinatario: InsertDestinatario): Promise<Destinatario> {
    const destinatario: Destinatario = { 
      ...insertDestinatario, 
      id,
      zona: insertDestinatario.zona ?? null,
      note: insertDestinatario.note ?? null 
    };
    this.destinatari.set(id, destinatario);
    return destinatario;
  }

  async deleteDestinatario(id: string): Promise<void> {
    this.destinatari.delete(id);
  }

  // Autisti methods
  async getAllAutisti(): Promise<Autista[]> {
    return Array.from(this.autisti.values());
  }

  async getAutista(id: string): Promise<Autista | undefined> {
    return this.autisti.get(id);
  }

  async createAutista(insertAutista: InsertAutista): Promise<Autista> {
    const id = randomUUID();
    const autista: Autista = { ...insertAutista, id, attivo: insertAutista.attivo ?? true };
    this.autisti.set(id, autista);
    return autista;
  }

  async updateAutista(id: string, insertAutista: InsertAutista): Promise<Autista> {
    const autista: Autista = { ...insertAutista, id, attivo: insertAutista.attivo ?? true };
    this.autisti.set(id, autista);
    return autista;
  }

  async deleteAutista(id: string): Promise<void> {
    this.autisti.delete(id);
  }

  // Mezzi methods
  async getAllMezzi(): Promise<Mezzo[]> {
    return Array.from(this.mezzi.values());
  }

  async getMezzo(id: string): Promise<Mezzo | undefined> {
    return this.mezzi.get(id);
  }

  async createMezzo(insertMezzo: InsertMezzo): Promise<Mezzo> {
    const id = randomUUID();
    const mezzo: Mezzo = { ...insertMezzo, id, note: insertMezzo.note ?? null };
    this.mezzi.set(id, mezzo);
    return mezzo;
  }

  async updateMezzo(id: string, insertMezzo: InsertMezzo): Promise<Mezzo> {
    const mezzo: Mezzo = { ...insertMezzo, id, note: insertMezzo.note ?? null };
    this.mezzi.set(id, mezzo);
    return mezzo;
  }

  async deleteMezzo(id: string): Promise<void> {
    this.mezzi.delete(id);
  }

  // Giri methods
  async getAllGiri(): Promise<Giro[]> {
    return Array.from(this.giri.values());
  }

  async getGiriByData(data: string): Promise<GiroWithDetails[]> {
    const giriArray = Array.from(this.giri.values()).filter((g) => g.data === data);
    
    return giriArray.map((giro) => {
      const autista = this.autisti.get(giro.autistaId);
      const mezzo = this.mezzi.get(giro.mezzoId);
      
      if (!autista || !mezzo) {
        throw new Error("Autista or Mezzo not found for giro");
      }
      
      return {
        ...giro,
        autista,
        mezzo,
      };
    });
  }

  async getGiro(id: string): Promise<GiroWithDetails | undefined> {
    const giro = this.giri.get(id);
    if (!giro) return undefined;
    
    const autista = this.autisti.get(giro.autistaId);
    const mezzo = this.mezzi.get(giro.mezzoId);
    
    if (!autista || !mezzo) {
      throw new Error("Autista or Mezzo not found for giro");
    }
    
    const spedizioniArray = Array.from(this.spedizioni.values()).filter(s => s.giroId === id);
    
    const spedizioni: SpedizioneWithDetails[] = spedizioniArray.map(spedizione => {
      const committente = this.committenti.get(spedizione.committenteId);
      const destinatario = this.destinatari.get(spedizione.destinatarioId);
      
      if (!committente || !destinatario) {
        throw new Error("Committente or Destinatario not found for spedizione");
      }
      
      return {
        ...spedizione,
        committente,
        destinatario,
      };
    });
    
    return {
      ...giro,
      autista,
      mezzo,
      spedizioni,
    };
  }

  async createGiro(insertGiro: InsertGiro): Promise<Giro> {
    const id = randomUUID();
    const giro: Giro = { ...insertGiro, id, zona: insertGiro.zona ?? null, note: insertGiro.note ?? null };
    this.giri.set(id, giro);
    return giro;
  }

  async deleteGiro(id: string): Promise<void> {
    // Unassign all spedizioni from this giro
    Array.from(this.spedizioni.values())
      .filter((s) => s.giroId === id)
      .forEach((s) => {
        this.spedizioni.set(s.id, { ...s, giroId: null, stato: "INSERITA" });
      });
    
    this.giri.delete(id);
  }

  // Spedizioni methods
  async getAllSpedizioni(): Promise<SpedizioneWithDetails[]> {
    const spedizioniArray = Array.from(this.spedizioni.values());
    
    return spedizioniArray.map((spedizione) => {
      const committente = this.committenti.get(spedizione.committenteId);
      const destinatario = this.destinatari.get(spedizione.destinatarioId);
      
      if (!committente || !destinatario) {
        throw new Error("Committente or Destinatario not found for spedizione");
      }
      
      return {
        ...spedizione,
        committente,
        destinatario,
      };
    });
  }

  async getSpedizione(id: string): Promise<Spedizione | undefined> {
    return this.spedizioni.get(id);
  }

  async getNextNumeroSpedizione(): Promise<number> {
    return this.numeroSpedizioneCounter++;
  }

  async createSpedizione(insertSpedizione: InsertSpedizione): Promise<Spedizione> {
    const id = randomUUID();
    const numeroSpedizione = await this.getNextNumeroSpedizione();
    const spedizione: Spedizione = {
      ...insertSpedizione,
      id,
      numeroSpedizione,
      contrassegno: insertSpedizione.contrassegno ?? null,
      filePath: insertSpedizione.filePath ?? null,
      note: insertSpedizione.note ?? null,
      giroId: insertSpedizione.giroId ?? null,
      stato: insertSpedizione.stato ?? "INSERITA",
    };
    this.spedizioni.set(id, spedizione);
    return spedizione;
  }

  async assignSpedizione(id: string, giroId: string | null): Promise<Spedizione> {
    const spedizione = this.spedizioni.get(id);
    if (!spedizione) {
      throw new Error("Spedizione not found");
    }

    const updatedSpedizione: Spedizione = {
      ...spedizione,
      giroId,
      stato: giroId ? "ASSEGNATA" : "INSERITA",
    };

    this.spedizioni.set(id, updatedSpedizione);
    return updatedSpedizione;
  }

  async updateSpedizioneStato(id: string, stato: string): Promise<Spedizione> {
    const spedizione = this.spedizioni.get(id);
    if (!spedizione) {
      throw new Error("Spedizione not found");
    }

    const updatedSpedizione: Spedizione = {
      ...spedizione,
      stato,
    };

    this.spedizioni.set(id, updatedSpedizione);
    return updatedSpedizione;
  }

  // Stats
  async getStats(): Promise<{
    spedizioniDaAssegnare: number;
    giriOggi: number;
    inConsegna: number;
    consegnateOggi: number;
  }> {
    const today = new Date().toISOString().split("T")[0];
    const spedizioniArray = Array.from(this.spedizioni.values());
    const giriArray = Array.from(this.giri.values());

    return {
      spedizioniDaAssegnare: spedizioniArray.filter((s) => !s.giroId).length,
      giriOggi: giriArray.filter((g) => g.data === today).length,
      inConsegna: spedizioniArray.filter((s) => s.stato === "IN_CONSEGNA").length,
      consegnateOggi: spedizioniArray.filter(
        (s) => s.stato === "CONSEGNATA" && s.giroId && 
        giriArray.find((g) => g.id === s.giroId && g.data === today)
      ).length,
    };
  }
}

// Use DbStorage when DATABASE_URL is available, otherwise MemStorage
async function createStorage(): Promise<IStorage> {
  if (process.env.DATABASE_URL) {
    const { DbStorage } = await import("./db-storage");
    return new DbStorage();
  }
  return new MemStorage();
}

let storageInstance: IStorage | null = null;

export async function getStorage(): Promise<IStorage> {
  if (!storageInstance) {
    storageInstance = await createStorage();
  }
  return storageInstance;
}

// For backwards compatibility with existing code
export const storage = new MemStorage();
