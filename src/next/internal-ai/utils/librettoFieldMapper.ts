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
      return joinValues(getFieldValue("marca"), getFieldValue("modello"));
    case "proprietario":
      return (
        getFieldValue("proprietario") ||
        getFieldValue("intestatario") ||
        getFieldValue("detentoreDenominazione")
      );
    case "indirizzo":
      return joinValues(getFieldValue("detentoreIndirizzo"), getFieldValue("detentoreComune"));
    case "nAvs":
      return getFieldValue("detentoreAfsAvs");
    case "statoOrigine":
      return getFieldValue("detentoreStatoOrigine");
    case "numeroMatricola":
      return getFieldValue("numeroMatricolaTipo");
    case "caricoUtileSella":
      return getFieldValue("caricoUtile");
    case "pesoRimorchiabile":
      return getFieldValue("caricoRimorchiabile");
    case "luogoDataRilascio":
      return [getFieldValue("luogoImmatricolazione"), getFieldValue("immatricolato")]
        .map((value) => value.trim())
        .filter(Boolean)
        .join(" / ");
    case "ultimoCollaudo":
      return getFieldValue("dataUltimoCollaudo");
    case "prossimoCollaudoRevisione":
      return getFieldValue("dataScadenzaRevisione");
    case "annotazioni":
      return getFieldValue("note");
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
      return;
    case "nAvs":
      onFieldChange("detentoreAfsAvs", value);
      return;
    case "statoOrigine":
      onFieldChange("detentoreStatoOrigine", value);
      return;
    case "numeroMatricola":
      onFieldChange("numeroMatricolaTipo", value);
      return;
    case "caricoUtileSella":
      onFieldChange("caricoUtile", value);
      return;
    case "pesoRimorchiabile":
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
      onFieldChange("dataUltimoCollaudo", normalizeDateValue(value));
      return;
    case "prossimoCollaudoRevisione":
      onFieldChange("dataScadenzaRevisione", normalizeDateValue(value));
      return;
    case "annotazioni":
      onFieldChange("note", value);
      return;
    default:
      onFieldChange(key, value);
  }
}
