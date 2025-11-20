import { createWorker } from "tesseract.js";
import { PDFParse } from "pdf-parse";
import { Buffer } from "node:buffer";

/**
 * Estrae testo da un file PDF usando pdf-parse V2 API e restituisce un array per pagina
 */
export async function extractTextFromPDF(fileBuffer: Buffer): Promise<string[]> {
  try {
    const parser = new PDFParse({ data: fileBuffer });
    const result = await parser.getText();
    await parser.destroy();

    const rawText = result.text || "";
    const pages = rawText
      .split("\f")
      .map((page) => page.trim())
      .filter((page) => page.length > 0);

    return pages.length > 0 ? pages : [rawText];
  } catch (error) {
    console.error("Errore durante estrazione testo da PDF:", error);
    throw new Error("Impossibile estrarre testo dal PDF");
  }
}

/**
 * Estrae testo da un'immagine usando Tesseract.js OCR
 */
export async function extractTextFromImage(fileBuffer: Buffer): Promise<string[]> {
  const worker = await createWorker("ita");
  
  try {
    const { data: { text } } = await worker.recognize(fileBuffer);
    return [text];
  } catch (error) {
    console.error("Errore durante OCR immagine:", error);
    throw new Error("Impossibile estrarre testo dall'immagine");
  } finally {
    await worker.terminate();
  }
}

/**
 * Estrae testo da un file DDT (PDF o immagine)
 */
export async function extractTextFromDDT(
  fileBuffer: Buffer, 
  mimeType: string
): Promise<string[]> {
  if (mimeType === "application/pdf") {
    return extractTextFromPDF(fileBuffer);
  } else if (mimeType.startsWith("image/")) {
    return extractTextFromImage(fileBuffer);
  } else {
    throw new Error("Tipo di file non supportato. Usa PDF, JPG o PNG");
  }
}
