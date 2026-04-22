import fs from "node:fs";
import path from "node:path";

const LIBRETTO_PATH = "C:\\progetti\\gestioneweb\\docs\\libretto282780.png";
const ENDPOINT = "http://127.0.0.1:4310/internal-ai-backend/documents/documento-mezzo-analyze";

const CAMPI_ATTESI = [
  "nAvs", "proprietario", "indirizzo", "localita", "statoOrigine",
  "assicurazione", "annotazioni", "targa", "colore", "genereVeicolo",
  "marcaTipo", "telaio", "carrozzeria", "numeroMatricola", "approvazioneTipo",
  "cilindrata", "potenza", "pesoVuoto", "caricoUtileSella", "pesoTotale",
  "pesoTotaleRimorchio", "caricoSulLetto", "pesoRimorchiabile",
  "primaImmatricolazione", "luogoDataRilascio", "ultimoCollaudo",
  "prossimoCollaudoRevisione"
];

async function main() {
  console.log("=".repeat(70));
  console.log("TEST BACKEND OPENAI - ESTRAZIONE LIBRETTO");
  console.log("=".repeat(70));

  // 1. Leggi il libretto
  console.log(`\n[1/4] Leggo il libretto da: ${LIBRETTO_PATH}`);
  if (!fs.existsSync(LIBRETTO_PATH)) {
    console.error(`ERRORE: file non trovato a ${LIBRETTO_PATH}`);
    process.exit(1);
  }
  const fileBuffer = fs.readFileSync(LIBRETTO_PATH);
  const base64 = fileBuffer.toString("base64");
  console.log(`    File letto: ${(fileBuffer.length / 1024).toFixed(1)} KB`);

  // 2. Prepara payload
  console.log(`\n[2/4] Preparo POST verso: ${ENDPOINT}`);
  const payload = {
    fileName: path.basename(LIBRETTO_PATH),
    mimeType: "image/png",
    contentBase64: base64,
    documentSubtypeHint: "libretto"
  };

  // 3. Invia richiesta
  console.log(`\n[3/4] Invio richiesta al backend...`);
  const t0 = Date.now();
  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error(`\nERRORE di rete: ${err.message}`);
    console.error(`\nIl backend è avviato? Controlla il terminale dove hai lanciato npm run internal-ai-backend:start`);
    process.exit(1);
  }
  const ms = Date.now() - t0;
  console.log(`    Risposta ricevuta in ${ms} ms, status HTTP: ${response.status}`);

  const json = await response.json();

  // 4. Stampa risposta completa
  console.log(`\n[4/4] Risposta completa (envelope):`);
  console.log("-".repeat(70));
  console.log(JSON.stringify(json, null, 2));
  console.log("-".repeat(70));

  // 5. Analisi dei 27 campi
  console.log(`\n${"=".repeat(70)}`);
  console.log("ANALISI DEI 27 CAMPI CANONICI");
  console.log("=".repeat(70));

  const analysis = json?.data?.analysis;
  if (!analysis) {
    console.error("\nERRORE: data.analysis NON trovato nella risposta");
    process.exit(1);
  }

  let valorizzati = 0;
  let vuoti = 0;
  let mancanti = 0;

  for (const campo of CAMPI_ATTESI) {
    const valore = analysis[campo];
    let stato, display;
    if (valore === undefined) {
      stato = "[ASSENTE]";
      display = "(chiave non presente)";
      mancanti++;
    } else if (valore === null) {
      stato = "[NULL!]";
      display = "null (non dovrebbe succedere)";
      mancanti++;
    } else if (valore === "") {
      stato = "[vuoto]";
      display = "\"\"";
      vuoti++;
    } else {
      stato = "[OK]   ";
      display = JSON.stringify(valore);
      valorizzati++;
    }
    console.log(`${stato} ${campo.padEnd(28)} ${display}`);
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log("RIEPILOGO");
  console.log("=".repeat(70));
  console.log(`Campi valorizzati:  ${valorizzati} / 27`);
  console.log(`Campi vuoti (""):   ${vuoti} / 27`);
  console.log(`Campi mancanti:     ${mancanti} / 27  <- DEVE ESSERE 0`);

  if (mancanti > 0) {
    console.log(`\n!!! ATTENZIONE: ${mancanti} campi mancanti o null. Il backend NON rispetta il contratto.`);
  } else {
    console.log(`\nOK: tutte le 27 chiavi sono presenti come stringhe.`);
  }

  console.log("=".repeat(70));
}

main().catch((err) => {
  console.error("Errore imprevisto:", err);
  process.exit(1);
});