import OpenAI from 'openai';

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface DDTData {
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

/**
 * Usa GPT per estrarre dati strutturati da un testo OCR di un DDT
 */
export async function parseDDTWithAI(ocrText: string): Promise<DDTData> {
  const prompt = `Sei un assistente che estrae dati da documenti di trasporto (DDT).
Analizza il seguente testo estratto da un DDT e restituisci SOLO un oggetto JSON con i seguenti campi (se presenti nel testo, altrimenti omettili):

{
  "committente": "nome del mittente/committente che affida la spedizione",
  "destinatario": {
    "ragioneSociale": "nome destinatario",
    "indirizzo": "via e numero civico",
    "cap": "codice postale (5 cifre)",
    "citta": "città",
    "provincia": "sigla provincia (2 lettere maiuscole)"
  },
  "dataDDT": "data DDT in formato YYYY-MM-DD",
  "numeroDDT": "numero documento",
  "colli": numero_colli (numero intero),
  "peso": peso_kg (numero decimale),
  "contrassegno": importo_contrassegno (numero decimale, se presente)
}

Regole importanti:
- Restituisci SOLO il JSON, senza testo aggiuntivo
- Se un campo non è presente nel testo, omettilo dal JSON
- Per le date, converti sempre in formato YYYY-MM-DD
- Per CAP, estrai solo le 5 cifre
- Per provincia, estrai solo la sigla di 2 lettere (es: BG, MI, CO)

Testo del DDT:
${ocrText}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Nessuna risposta dal modello AI');
    }

    const parsedData = JSON.parse(content) as DDTData;
    return parsedData;
  } catch (error) {
    console.error('Errore durante parsing AI del DDT:', error);
    throw new Error('Impossibile analizzare il DDT con AI');
  }
}
