import { eq, and, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  committenti,
  destinatari,
  autisti,
  mezzi,
  giri,
  spedizioni,
  type User,
  type InsertUser,
  type Committente,
  type InsertCommittente,
  type Destinatario,
  type InsertDestinatario,
  type Autista,
  type InsertAutista,
  type Mezzo,
  type InsertMezzo,
  type Giro,
  type InsertGiro,
  type Spedizione,
  type InsertSpedizione,
  type SpedizioneWithDetails,
  type GiroWithDetails,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DbStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Committenti methods
  async getAllCommittenti(): Promise<Committente[]> {
    return await db.select().from(committenti).orderBy(committenti.nome);
  }

  async getCommittente(id: string): Promise<Committente | undefined> {
    const result = await db.select().from(committenti).where(eq(committenti.id, id)).limit(1);
    return result[0];
  }

  async createCommittente(insertCommittente: InsertCommittente): Promise<Committente> {
    const result = await db.insert(committenti).values(insertCommittente).returning();
    return result[0];
  }

  async updateCommittente(id: string, insertCommittente: InsertCommittente): Promise<Committente> {
    const result = await db
      .update(committenti)
      .set(insertCommittente)
      .where(eq(committenti.id, id))
      .returning();
    return result[0];
  }

  async deleteCommittente(id: string): Promise<void> {
    await db.delete(committenti).where(eq(committenti.id, id));
  }

  // Destinatari methods
  async getAllDestinatari(): Promise<Destinatario[]> {
    return await db.select().from(destinatari).orderBy(destinatari.ragioneSociale);
  }

  async getDestinatario(id: string): Promise<Destinatario | undefined> {
    const result = await db.select().from(destinatari).where(eq(destinatari.id, id)).limit(1);
    return result[0];
  }

  async createDestinatario(insertDestinatario: InsertDestinatario): Promise<Destinatario> {
    const result = await db.insert(destinatari).values(insertDestinatario).returning();
    return result[0];
  }

  async updateDestinatario(id: string, insertDestinatario: InsertDestinatario): Promise<Destinatario> {
    const result = await db
      .update(destinatari)
      .set(insertDestinatario)
      .where(eq(destinatari.id, id))
      .returning();
    return result[0];
  }

  async deleteDestinatario(id: string): Promise<void> {
    await db.delete(destinatari).where(eq(destinatari.id, id));
  }

  // Autisti methods
  async getAllAutisti(): Promise<Autista[]> {
    return await db.select().from(autisti).orderBy(autisti.cognome, autisti.nome);
  }

  async getAutista(id: string): Promise<Autista | undefined> {
    const result = await db.select().from(autisti).where(eq(autisti.id, id)).limit(1);
    return result[0];
  }

  async createAutista(insertAutista: InsertAutista): Promise<Autista> {
    const result = await db.insert(autisti).values(insertAutista).returning();
    return result[0];
  }

  async updateAutista(id: string, insertAutista: InsertAutista): Promise<Autista> {
    const result = await db
      .update(autisti)
      .set(insertAutista)
      .where(eq(autisti.id, id))
      .returning();
    return result[0];
  }

  async deleteAutista(id: string): Promise<void> {
    await db.delete(autisti).where(eq(autisti.id, id));
  }

  // Mezzi methods
  async getAllMezzi(): Promise<Mezzo[]> {
    return await db.select().from(mezzi).orderBy(mezzi.targa);
  }

  async getMezzo(id: string): Promise<Mezzo | undefined> {
    const result = await db.select().from(mezzi).where(eq(mezzi.id, id)).limit(1);
    return result[0];
  }

  async createMezzo(insertMezzo: InsertMezzo): Promise<Mezzo> {
    const result = await db.insert(mezzi).values(insertMezzo).returning();
    return result[0];
  }

  async updateMezzo(id: string, insertMezzo: InsertMezzo): Promise<Mezzo> {
    const result = await db
      .update(mezzi)
      .set(insertMezzo)
      .where(eq(mezzi.id, id))
      .returning();
    return result[0];
  }

  async deleteMezzo(id: string): Promise<void> {
    await db.delete(mezzi).where(eq(mezzi.id, id));
  }

  // Giri methods
  async getAllGiri(): Promise<Giro[]> {
    return await db.select().from(giri).orderBy(giri.data);
  }

  async getGiriByData(data: string): Promise<GiroWithDetails[]> {
    const result = await db
      .select({
        giro: giri,
        autista: autisti,
        mezzo: mezzi,
      })
      .from(giri)
      .leftJoin(autisti, eq(giri.autistaId, autisti.id))
      .leftJoin(mezzi, eq(giri.mezzoId, mezzi.id))
      .where(eq(giri.data, data))
      .orderBy(giri.turno);

      return result.map((row) => ({
        ...row.giro,
        autista: row.autista!,
        mezzo: row.mezzo ?? null,
      }));
  }

  async getGiro(id: string): Promise<GiroWithDetails | undefined> {
    const result = await db
      .select({
        giro: giri,
        autista: autisti,
        mezzo: mezzi,
      })
      .from(giri)
      .leftJoin(autisti, eq(giri.autistaId, autisti.id))
      .leftJoin(mezzi, eq(giri.mezzoId, mezzi.id))
      .where(eq(giri.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    
    // Fetch spedizioni for this giro with details
    const spedizioniResult = await db
      .select({
        spedizione: spedizioni,
        committente: committenti,
        destinatario: destinatari,
      })
      .from(spedizioni)
      .leftJoin(committenti, eq(spedizioni.committenteId, committenti.id))
      .leftJoin(destinatari, eq(spedizioni.destinatarioId, destinatari.id))
      .where(eq(spedizioni.giroId, id));

    const spedizioniWithDetails: SpedizioneWithDetails[] = spedizioniResult.map(s => ({
      ...s.spedizione,
      committente: s.committente!,
      destinatario: s.destinatario!,
    }));
    
      return {
        ...row.giro,
        autista: row.autista!,
        mezzo: row.mezzo ?? null,
        spedizioni: spedizioniWithDetails,
      };
  }

  async createGiro(insertGiro: InsertGiro): Promise<Giro> {
    const result = await db.insert(giri).values(insertGiro).returning();
    return result[0];
  }

  async deleteGiro(id: string): Promise<void> {
    await db
      .update(spedizioni)
      .set({ giroId: null, stato: "INSERITA" })
      .where(eq(spedizioni.giroId, id));
    
    await db.delete(giri).where(eq(giri.id, id));
  }

  // Spedizioni methods
  async getAllSpedizioni(): Promise<SpedizioneWithDetails[]> {
    const result = await db
      .select({
        spedizione: spedizioni,
        committente: committenti,
        destinatario: destinatari,
      })
      .from(spedizioni)
      .leftJoin(committenti, eq(spedizioni.committenteId, committenti.id))
      .leftJoin(destinatari, eq(spedizioni.destinatarioId, destinatari.id))
      .orderBy(spedizioni.numeroSpedizione);

    return result.map((row) => ({
      ...row.spedizione,
      committente: row.committente!,
      destinatario: row.destinatario!,
    }));
  }

  async getSpedizione(id: string): Promise<Spedizione | undefined> {
    const result = await db.select().from(spedizioni).where(eq(spedizioni.id, id)).limit(1);
    return result[0];
  }

  async getNextNumeroSpedizione(): Promise<number> {
    const result = await db
      .select({ max: sql<number>`COALESCE(MAX(${spedizioni.numeroSpedizione}), 0) + 1` })
      .from(spedizioni);
    return result[0].max;
  }

  async createSpedizione(insertSpedizione: InsertSpedizione): Promise<Spedizione> {
    const numeroSpedizione = await this.getNextNumeroSpedizione();
    const result = await db
      .insert(spedizioni)
      .values({
        ...insertSpedizione,
        numeroSpedizione,
      })
      .returning();
    return result[0];
  }

  async assignSpedizione(id: string, giroId: string | null): Promise<Spedizione> {
    const newStato = giroId ? "ASSEGNATA" : "INSERITA";
    const result = await db
      .update(spedizioni)
      .set({ giroId, stato: newStato })
      .where(eq(spedizioni.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Spedizione not found");
    }
    return result[0];
  }

  async updateSpedizioneStato(id: string, stato: string): Promise<Spedizione> {
    const result = await db
      .update(spedizioni)
      .set({ stato })
      .where(eq(spedizioni.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Spedizione not found");
    }
    return result[0];
  }

  // Stats
  async getStats(): Promise<{
    spedizioniDaAssegnare: number;
    giriOggi: number;
    inConsegna: number;
    consegnateOggi: number;
  }> {
    const today = new Date().toISOString().split("T")[0];

    const [daAssegnare] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(spedizioni)
      .where(eq(spedizioni.stato, "INSERITA"));

    const [giriOggi] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(giri)
      .where(eq(giri.data, today));

    const [inConsegna] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(spedizioni)
      .where(eq(spedizioni.stato, "IN_CONSEGNA"));

    const [consegnateOggi] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(spedizioni)
      .leftJoin(giri, eq(spedizioni.giroId, giri.id))
      .where(and(eq(spedizioni.stato, "CONSEGNATA"), eq(giri.data, today)));

    return {
      spedizioniDaAssegnare: daAssegnare.count,
      giriOggi: giriOggi.count,
      inConsegna: inConsegna.count,
      consegnateOggi: consegnateOggi.count,
    };
  }
}
