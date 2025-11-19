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

// Clienti (Customers)
export const clienti = pgTable("clienti", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ragioneSociale: text("ragione_sociale").notNull(),
  indirizzo: text("indirizzo").notNull(),
  cap: text("cap").notNull(),
  citta: text("citta").notNull(),
  provincia: text("provincia").notNull(),
  note: text("note"),
});

export const insertClienteSchema = createInsertSchema(clienti).omit({
  id: true,
});

export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Cliente = typeof clienti.$inferSelect;

// Autisti (Drivers)
export const autisti = pgTable("autisti", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  cognome: text("cognome").notNull(),
  telefono: text("telefono").notNull(),
  zonaPrincipale: text("zona_principale").notNull(),
  attivo: boolean("attivo").notNull().default(true),
});

export const insertAutistaSchema = createInsertSchema(autisti).omit({
  id: true,
});

export type InsertAutista = z.infer<typeof insertAutistaSchema>;
export type Autista = typeof autisti.$inferSelect;

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

// Giri (Delivery Rounds)
export const giri = pgTable("giri", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  data: date("data").notNull(),
  turno: text("turno").notNull(), // MATTINO or POMERIGGIO
  autistaId: varchar("autista_id").notNull().references(() => autisti.id),
  mezzoId: varchar("mezzo_id").notNull().references(() => mezzi.id),
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
  clienteId: varchar("cliente_id").notNull().references(() => clienti.id),
  dataDDT: date("data_ddt").notNull(),
  numeroDDT: text("numero_ddt").notNull(),
  destinatarioNome: text("destinatario_nome").notNull(),
  destinatarioIndirizzo: text("destinatario_indirizzo").notNull(),
  destinatarioCap: text("destinatario_cap").notNull(),
  destinatarioCitta: text("destinatario_citta").notNull(),
  destinatarioProvincia: text("destinatario_provincia").notNull(),
  colli: integer("colli").notNull(),
  pesoKg: decimal("peso_kg", { precision: 10, scale: 2 }).notNull(),
  contrassegno: decimal("contrassegno", { precision: 10, scale: 2 }),
  stato: text("stato").notNull().default("INSERITA"), // INSERITA, ASSEGNATA, IN_CONSEGNA, CONSEGNATA, PROBLEMA
  giroId: varchar("giro_id").references(() => giri.id),
  noteUfficio: text("note_ufficio"),
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
export type SpedizioneWithCliente = Spedizione & {
  cliente: Cliente;
};

export type GiroWithDetails = Giro & {
  autista: Autista;
  mezzo: Mezzo;
  spedizioni?: Spedizione[];
};
