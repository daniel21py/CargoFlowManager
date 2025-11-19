import { db } from "./db";
import { users, clienti, autisti, mezzi } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  // Seed default user
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.username, "ufficio"))
    .limit(1);

  if (existingUser.length === 0) {
    await db.insert(users).values({
      username: "ufficio",
      password: "password123",
    });
    console.log("✅ Default user created (username: ufficio, password: password123)");
  } else {
    console.log("ℹ️  Default user already exists");
  }

  // Seed sample customers
  const existingClienti = await db.select().from(clienti).limit(1);
  if (existingClienti.length === 0) {
    console.log("📦 Seeding sample customers...");
    await db.insert(clienti).values([
      {
        ragioneSociale: "Acme Srl",
        indirizzo: "Via Roma 123",
        cap: "24100",
        citta: "Bergamo",
        provincia: "BG",
        note: null,
      },
      {
        ragioneSociale: "Beta Spa",
        indirizzo: "Corso Italia 45",
        cap: "24047",
        citta: "Treviglio",
        provincia: "BG",
        note: null,
      },
      {
        ragioneSociale: "Gamma Logistics",
        indirizzo: "Via Milano 67",
        cap: "24050",
        citta: "Zanica",
        provincia: "BG",
        note: "Cliente preferenziale",
      },
    ]);
    console.log("✅ Sample customers created");
  } else {
    console.log("ℹ️  Sample customers already exist");
  }

  // Seed sample drivers
  const existingAutisti = await db.select().from(autisti).limit(1);
  if (existingAutisti.length === 0) {
    console.log("🚛 Seeding sample drivers...");
    await db.insert(autisti).values([
      {
        nome: "Mario",
        cognome: "Rossi",
        telefono: "333-1234567",
        zonaPrincipale: "Bergamo Centro",
        attivo: true,
      },
      {
        nome: "Luigi",
        cognome: "Verdi",
        telefono: "333-7654321",
        zonaPrincipale: "Treviglio",
        attivo: true,
      },
      {
        nome: "Giuseppe",
        cognome: "Bianchi",
        telefono: "333-9876543",
        zonaPrincipale: "Val Seriana",
        attivo: true,
      },
    ]);
    console.log("✅ Sample drivers created");
  } else {
    console.log("ℹ️  Sample drivers already exist");
  }

  // Seed sample vehicles
  const existingMezzi = await db.select().from(mezzi).limit(1);
  if (existingMezzi.length === 0) {
    console.log("🚚 Seeding sample vehicles...");
    await db.insert(mezzi).values([
      {
        targa: "AB123CD",
        modello: "Fiat Ducato",
        portataKg: 1500,
        note: null,
      },
      {
        targa: "EF456GH",
        modello: "Iveco Daily",
        portataKg: 2000,
        note: null,
      },
      {
        targa: "IJ789KL",
        modello: "Mercedes Sprinter",
        portataKg: 1800,
        note: "Refrigerato",
      },
    ]);
    console.log("✅ Sample vehicles created");
  } else {
    console.log("ℹ️  Sample vehicles already exist");
  }

  console.log("✅ Database seeded successfully!");
}

seed().catch((error) => {
  console.error("❌ Error seeding database:", error);
  process.exit(1);
});
