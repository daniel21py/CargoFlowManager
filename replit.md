# TMS Bergamo - Sistema di Gestione Trasporto Merci

## Panoramica Progetto
Sistema gestionale completo per azienda di trasporto merci nella provincia di Bergamo. Include gestione anagrafiche, spedizioni, giri giornalieri e pianificazione con drag & drop.

## Tecnologie
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI, Wouter (routing)
- **Backend**: Express.js, Node.js
- **Database**: In-memory storage (MemStorage)
- **Drag & Drop**: @dnd-kit

## Struttura Database

### Users
- Login semplice con username/password
- Un solo utente "ufficio"

### Clienti
- Ragione sociale, indirizzo completo (CAP, città, provincia)
- Note opzionali

### Autisti
- Nome, cognome, telefono
- Zona principale di competenza
- Stato attivo/non attivo

### Mezzi
- Targa (univoca), modello
- Portata in kg
- Note opzionali

### Giri
- Data, turno (MATTINO/POMERIGGIO)
- Riferimenti a autista e mezzo
- Zona e note

### Spedizioni
- Numero progressivo auto-generato
- Cliente e dati DDT (data, numero)
- Destinatario completo
- Colli, peso in kg, contrassegno opzionale
- Stati: INSERITA, ASSEGNATA, IN_CONSEGNA, CONSEGNATA, PROBLEMA
- Collegamento al giro assegnato
- Note ufficio

## Funzionalità Principali

### Login
- Pagina di login semplice
- Credenziali: username "ufficio", password "password123"
- Protezione delle route autenticate

### Dashboard
- Statistiche giornaliere (spedizioni da assegnare, giri attivi, consegnate)
- Azioni rapide per accesso veloce alle funzioni principali

### Anagrafiche (Clienti, Autisti, Mezzi)
- Liste con ricerca
- Form di creazione/modifica in dialog
- Eliminazione con conferma

### Spedizioni
- Tabella con filtri per stato e ricerca
- Form di creazione da DDT con auto-compilazione destinatario dal cliente
- Numero spedizione auto-generato
- Badge colorati per gli stati

### Giri
- Gestione giri giornalieri per data
- Creazione giro con selezione autista, mezzo, turno
- Tabella riepilogativa con filtro data

### Pianificazione (Drag & Drop)
- Vista giornaliera per data e turno
- Colonna "Non Assegnate" + colonne per ogni giro
- Drag & drop nativo per assegnare spedizioni ai giri
- Aggiornamento automatico dello stato della spedizione

## Credenziali di Default
- **Username**: ufficio
- **Password**: password123

## Come Modificare le Credenziali
Le credenziali sono configurate nel file `server/storage.ts`:
1. Aprire `server/storage.ts`
2. Modificare i valori in `DEFAULT_USER` nel costruttore `MemStorage`
3. Riavviare l'applicazione

## Avvio Applicazione
1. Cliccare sul pulsante "Run" in Replit
2. Aprire il browser all'URL fornito da Replit
3. Login con le credenziali di default

## Note Tecniche
- Tutti i dati sono memorizzati in memoria (persi al riavvio)
- L'autenticazione è molto semplice (solo per uso ufficio interno)
- Due turni giornalieri: MATTINO e POMERIGGIO
- Numero spedizione generato automaticamente in modo incrementale
- Design responsive ottimizzato per desktop

## Struttura File
```
client/
  src/
    components/
      app-sidebar.tsx         # Navigazione laterale
      ui/                     # Componenti Shadcn
    pages/
      login.tsx              # Pagina login
      dashboard.tsx          # Dashboard principale
      clienti.tsx            # Gestione clienti
      autisti.tsx            # Gestione autisti
      mezzi.tsx              # Gestione mezzi
      spedizioni.tsx         # Gestione spedizioni
      giri.tsx               # Gestione giri
      pianificazione.tsx     # Drag & drop pianificazione
    App.tsx                  # Router e autenticazione
    index.css               # Stili globali
server/
  routes.ts                 # API endpoints
  storage.ts                # Storage in memoria
shared/
  schema.ts                 # Schemi dati e tipi TypeScript
```

## API Endpoints
- `POST /api/auth/login` - Login utente
- `GET /api/stats` - Statistiche dashboard
- CRUD `/api/clienti` - Gestione clienti
- CRUD `/api/autisti` - Gestione autisti
- CRUD `/api/mezzi` - Gestione mezzi
- CRUD `/api/giri` - Gestione giri
- CRUD `/api/spedizioni` - Gestione spedizioni
- `PUT /api/spedizioni/:id/assign` - Assegna spedizione a giro
