import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, date, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for login
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Committenti (Shippers/Customers who assign shipments)
export const committenti = pgTable("committenti", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  tipo: text("tipo"), // es: "Azienda Trasporto", "Cliente Diretto", etc.
  note: text("note"),
});

export const insertCommittenteSchema = createInsertSchema(committenti).omit({
  id: true,
});

export type InsertCommittente = z.infer<typeof insertCommittenteSchema>;
export type Committente = typeof committenti.$inferSelect;

// Destinatari (Final delivery destinations)
export const destinatari = pgTable("destinatari", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ragioneSociale: text("ragione_sociale").notNull(),
  indirizzo: text("indirizzo").notNull(),
  cap: text("cap").notNull(),
  citta: text("citta").notNull(),
  provincia: text("provincia").notNull(),
  zona: text("zona"), // Area geografica (es: "Bergamo Centro", "Bergamo Sud")
  note: text("note"),
});

export const insertDestinatarioSchema = createInsertSchema(destinatari).omit({
  id: true,
});

export type InsertDestinatario = z.infer<typeof insertDestinatarioSchema>;
export type Destinatario = typeof destinatari.$inferSelect;

// Mezzi (Vehicles)
export const mezzi = pgTable("mezzi", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  targa: text("targa").notNull().unique(),
  modello: text("modello").notNull(),
  portataKg: integer("portata_kg").notNull(),
  note: text("note"),
});

export const insertMezzoSchema = createInsertSchema(mezzi).omit({
  id: true,
});

export type InsertMezzo = z.infer<typeof insertMezzoSchema>;
export type Mezzo = typeof mezzi.$inferSelect;

// Autisti (Drivers)
export const autisti = pgTable("autisti", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  cognome: text("cognome").notNull(),
  telefono: text("telefono").notNull(),
  zonaPrincipale: text("zona_principale").notNull(),
  attivo: boolean("attivo").notNull().default(true),
  mezzoPreferitoId: varchar("mezzo_preferito_id").references(() => mezzi.id),
});

export const insertAutistaSchema = createInsertSchema(autisti).omit({
  id: true,
});

export type InsertAutista = z.infer<typeof insertAutistaSchema>;
export type Autista = typeof autisti.$inferSelect;

// Giri (Delivery Rounds)
export const giri = pgTable("giri", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  data: date("data").notNull(),
  turno: text("turno").notNull(), // MATTINO or POMERIGGIO
  autistaId: varchar("autista_id").notNull().references(() => autisti.id),
  mezzoId: varchar("mezzo_id").references(() => mezzi.id),
  zona: text("zona"),
  note: text("note"),
});

export const insertGiroSchema = createInsertSchema(giri).omit({
  id: true,
});

export type InsertGiro = z.infer<typeof insertGiroSchema>;
export type Giro = typeof giri.$inferSelect;

// Spedizioni (Shipments)
export const spedizioni = pgTable("spedizioni", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numeroSpedizione: integer("numero_spedizione").notNull().unique(),
  committenteId: varchar("committente_id").notNull().references(() => committenti.id),
  destinatarioId: varchar("destinatario_id").notNull().references(() => destinatari.id),
  dataDDT: date("data_ddt").notNull(),
  numeroDDT: text("numero_ddt").notNull(),
  colli: integer("colli").notNull(),
  pesoKg: decimal("peso_kg", { precision: 10, scale: 2 }).notNull(),
  contrassegno: decimal("contrassegno", { precision: 10, scale: 2 }),
  filePath: text("file_path"), // Path to uploaded DDT file (PDF/JPG)
  note: text("note"), // Note sulla spedizione
  stato: text("stato").notNull().default("INSERITA"), // INSERITA, ASSEGNATA, IN_CONSEGNA, CONSEGNATA, PROBLEMA
  giroId: varchar("giro_id").references(() => giri.id),
});

export const insertSpedizioneSchema = createInsertSchema(spedizioni).omit({
  id: true,
  numeroSpedizione: true, // Auto-generated
});

export const updateSpedizioneStatoSchema = z.object({
  stato: z.enum(["INSERITA", "ASSEGNATA", "IN_CONSEGNA", "CONSEGNATA", "PROBLEMA"]),
});

export type InsertSpedizione = z.infer<typeof insertSpedizioneSchema>;
export type Spedizione = typeof spedizioni.$inferSelect;
export type UpdateSpedizioneStato = z.infer<typeof updateSpedizioneStatoSchema>;

// Extended types with relations for frontend
export type SpedizioneWithDetails = Spedizione & {
  committente: Committente;
  destinatario: Destinatario;
};

export type GiroWithDetails = Giro & {
  autista: Autista;
  mezzo?: Mezzo | null;
  spedizioni?: SpedizioneWithDetails[];
};
