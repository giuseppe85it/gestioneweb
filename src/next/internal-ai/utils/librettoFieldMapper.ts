type LibrettoGetFieldValue = (field: string) => string;
type LibrettoOnFieldChange = (field: string, value: string) => void;

function normalizeDateValue(value: string) {
  const text = value.trim();
  if (!text) {
    return "";
  }

  const match = text.match(/(\d{1,2})[.\-/ ](\d{1,2})[.\-/ ](\d{4})/);
  if (!match) {
    return text;
  }

  const [, day, month, year] = match;
  return `${day.padStart(2, "0")} ${month.padStart(2, "0")} ${year}`;
}

function joinValues(...values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean).join(" ");
}

function splitOnKnownSeparator(value: string) {
  if (value.includes("·")) {
    return value.split("·");
  }
  if (value.includes("Â·")) {
    return value.split("Â·");
  }
  if (value.includes("/")) {
    return value.split("/");
  }
  if (value.includes(",")) {
    return value.split(",");
  }
  return null;
}

export function getLibrettoTemplateFieldValue(
  getFieldValue: LibrettoGetFieldValue,
  key: string,
) {
  switch (key) {
    case "marcaTipo":
      return getFieldValue("marcaTipo") || joinValues(getFieldValue("marca"), getFieldValue("modello"));
    case "proprietario":
      return (
        getFieldValue("proprietario") ||
        getFieldValue("intestatario") ||
        getFieldValue("detentoreDenominazione")
      );
    case "indirizzo":
      return getFieldValue("indirizzo") || getFieldValue("detentoreIndirizzo");
    case "localita":
      return (
        getFieldValue("localita") ||
        getFieldValue("detentoreComune") ||
        getFieldValue("comune")
      );
    case "nAvs":
      return getFieldValue("nAvs") || getFieldValue("detentoreAfsAvs") || getFieldValue("numeroAvs");
    case "statoOrigine":
      return getFieldValue("statoOrigine") || getFieldValue("detentoreStatoOrigine");
    case "numeroMatricola":
      return getFieldValue("numeroMatricola") || getFieldValue("numeroMatricolaTipo");
    case "carrozzeria":
      return getFieldValue("carrozzeria") || getFieldValue("tipoCarrozzeria");
    case "approvazioneTipo":
      return getFieldValue("approvazioneTipo") || getFieldValue("numeroApprovazioneTipo");
    case "caricoUtileSella":
      return getFieldValue("caricoUtileSella") || getFieldValue("caricoUtile");
    case "pesoVuoto":
      return getFieldValue("pesoVuoto") || getFieldValue("tara");
    case "pesoTotaleRimorchio":
      return getFieldValue("pesoTotaleRimorchio") || getFieldValue("pesoConvoglio");
    case "caricoSulLetto":
      return getFieldValue("caricoSulLetto") || getFieldValue("caricoTetto");
    case "pesoRimorchiabile":
      return getFieldValue("pesoRimorchiabile") || getFieldValue("caricoRimorchiabile");
    case "luogoDataRilascio":
      return (
        getFieldValue("luogoDataRilascio") ||
        [
          getFieldValue("luogoImmatricolazione") || getFieldValue("luogoRilascio"),
          getFieldValue("immatricolato") || getFieldValue("dataRilascio"),
        ]
          .map((value) => value.trim())
          .filter(Boolean)
          .join(" / ")
      );
    case "ultimoCollaudo":
      return getFieldValue("ultimoCollaudo") || getFieldValue("dataUltimoCollaudo");
    case "prossimoCollaudoRevisione":
      return getFieldValue("prossimoCollaudoRevisione") || getFieldValue("dataScadenzaRevisione");
    case "annotazioni":
      return (
        getFieldValue("annotazioni") ||
        getFieldValue("note") ||
        getFieldValue("testo") ||
        getFieldValue("riassuntoBreve")
      );
    default:
      return getFieldValue(key);
  }
}

export function applyLibrettoTemplateFieldChange(args: {
  key: string;
  value: string;
  getFieldValue: LibrettoGetFieldValue;
  onFieldChange: LibrettoOnFieldChange;
}) {
  const { getFieldValue, key, onFieldChange, value } = args;

  switch (key) {
    case "marcaTipo": {
      const currentMarca = getFieldValue("marca").trim();
      if (currentMarca && value.trim().toUpperCase().startsWith(currentMarca.toUpperCase())) {
        const nextModello = value.trim().slice(currentMarca.length).trim();
        onFieldChange("modello", nextModello || value);
        return;
      }
      onFieldChange("modello", value);
      return;
    }
    case "proprietario":
      onFieldChange("proprietario", value);
      onFieldChange("intestatario", value);
      onFieldChange("detentoreDenominazione", value);
      return;
    case "indirizzo":
      onFieldChange("detentoreIndirizzo", value);
      onFieldChange("indirizzo", value);
      return;
    case "localita":
      onFieldChange("detentoreComune", value);
      onFieldChange("comune", value);
      onFieldChange("localita", value);
      return;
    case "nAvs":
      onFieldChange("detentoreAfsAvs", value);
      return;
    case "statoOrigine":
      onFieldChange("detentoreStatoOrigine", value);
      return;
    case "numeroMatricola":
      onFieldChange("numeroMatricolaTipo", value);
      onFieldChange("numeroMatricola", value);
      return;
    case "carrozzeria":
      onFieldChange("carrozzeria", value);
      onFieldChange("tipoCarrozzeria", value);
      return;
    case "approvazioneTipo":
      onFieldChange("approvazioneTipo", value);
      onFieldChange("numeroApprovazioneTipo", value);
      return;
    case "caricoUtileSella":
      onFieldChange("caricoUtile", value);
      onFieldChange("caricoUtileSella", value);
      return;
    case "pesoVuoto":
      onFieldChange("pesoVuoto", value);
      onFieldChange("tara", value);
      return;
    case "pesoTotaleRimorchio":
      onFieldChange("pesoTotaleRimorchio", value);
      onFieldChange("pesoConvoglio", value);
      return;
    case "caricoSulLetto":
      onFieldChange("caricoSulLetto", value);
      onFieldChange("caricoTetto", value);
      return;
    case "pesoRimorchiabile":
      onFieldChange("pesoRimorchiabile", value);
      onFieldChange("caricoRimorchiabile", value);
      return;
    case "luogoDataRilascio": {
      const parts = splitOnKnownSeparator(value);
      if (parts) {
        onFieldChange("luogoImmatricolazione", parts[0]?.trim() ?? "");
        onFieldChange("immatricolato", normalizeDateValue(parts.slice(1).join(" ").trim()));
        return;
      }
      onFieldChange("immatricolato", normalizeDateValue(value));
      return;
    }
    case "ultimoCollaudo":
      onFieldChange("dataUltimoCollaudo", value);
      return;
    case "prossimoCollaudoRevisione":
      onFieldChange("dataScadenzaRevisione", value);
      return;
    case "annotazioni":
      onFieldChange("note", value);
      onFieldChange("testo", value);
      return;
    default:
      onFieldChange(key, value);
  }
}
