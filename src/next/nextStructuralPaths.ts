export const NEXT_HOME_PATH = "/next";
export const NEXT_CENTRO_CONTROLLO_PATH = "/next/centro-controllo";
export const NEXT_GESTIONE_OPERATIVA_PATH = "/next/gestione-operativa";
export const NEXT_OPERATIVITA_LEGACY_PATH = "/next/operativita-globale";
export const NEXT_MAGAZZINO_PATH = "/next/magazzino";
export const NEXT_INVENTARIO_PATH = "/next/inventario";
export const NEXT_MATERIALI_CONSEGNATI_PATH = "/next/materiali-consegnati";
export const NEXT_ATTREZZATURE_CANTIERI_PATH = "/next/attrezzature-cantieri";
export const NEXT_MANUTENZIONI_PATH = "/next/manutenzioni";
export const NEXT_ACQUISTI_PATH = "/next/acquisti";
export const NEXT_ACQUISTI_DETTAGLIO_PREFIX = "/next/acquisti/dettaglio";
export const NEXT_MATERIALI_DA_ORDINARE_PATH = "/next/materiali-da-ordinare";
export const NEXT_EUROMECC_PATH = "/next/euromecc";
export const NEXT_ORDINI_IN_ATTESA_PATH = "/next/ordini-in-attesa";
export const NEXT_ORDINI_ARRIVATI_PATH = "/next/ordini-arrivati";
export const NEXT_DETTAGLIO_ORDINE_PREFIX = "/next/dettaglio-ordine";
export const NEXT_LAVORI_DA_ESEGUIRE_PATH = "/next/lavori-da-eseguire";
export const NEXT_LAVORI_IN_ATTESA_PATH = "/next/lavori-in-attesa";
export const NEXT_LAVORI_ESEGUITI_PATH = "/next/lavori-eseguiti";
export const NEXT_DETTAGLIO_LAVORI_PATH = "/next/dettagliolavori";
export const NEXT_MEZZI_PATH = "/next/mezzi";
export const NEXT_DOSSIER_LISTA_PATH = "/next/dossiermezzi";
export const NEXT_DOSSIER_PREFIX = "/next/dossier";
export const NEXT_MEZZI_DOSSIER_LEGACY_PATH = "/next/mezzi-dossier";
export const NEXT_ANALISI_ECONOMICA_PREFIX = "/next/analisi-economica";
export const NEXT_IA_PATH = "/next/ia";
export const NEXT_INTERNAL_AI_PATH = "/next/ia/interna";
export const NEXT_INTERNAL_AI_SESSIONS_PATH = "/next/ia/interna/sessioni";
export const NEXT_INTERNAL_AI_REQUESTS_PATH = "/next/ia/interna/richieste";
export const NEXT_INTERNAL_AI_ARTIFACTS_PATH = "/next/ia/interna/artifacts";
export const NEXT_INTERNAL_AI_AUDIT_PATH = "/next/ia/interna/audit";
export const NEXT_IA_APIKEY_PATH = "/next/ia/apikey";
export const NEXT_IA_LIBRETTO_PATH = "/next/ia/libretto";
export const NEXT_IA_DOCUMENTI_PATH = "/next/ia/documenti";
export const NEXT_IA_COPERTURA_LIBRETTI_PATH = "/next/ia/copertura-libretti";
export const NEXT_LIBRETTI_EXPORT_PATH = "/next/libretti-export";
export const NEXT_CISTERNA_PATH = "/next/cisterna";
export const NEXT_CISTERNA_IA_PATH = "/next/cisterna/ia";
export const NEXT_CISTERNA_SCHEDE_TEST_PATH = "/next/cisterna/schede-test";
export const NEXT_AUTISTI_INBOX_PATH = "/next/autisti-inbox";
export const NEXT_AUTISTI_ADMIN_PATH = "/next/autisti-admin";
export const NEXT_AUTISTI_APP_PATH = "/next/autisti";

export type NextMagazzinoTab =
  | "inventario"
  | "materiali-consegnati"
  | "cisterne-adblue"
  | "documenti-costi";

export function buildNextMagazzinoPath(tab?: NextMagazzinoTab) {
  if (!tab) return NEXT_MAGAZZINO_PATH;
  return `${NEXT_MAGAZZINO_PATH}?tab=${encodeURIComponent(tab)}`;
}

export function buildNextManutenzioniPath(targa?: string) {
  if (!targa) return NEXT_MANUTENZIONI_PATH;
  return `${NEXT_MANUTENZIONI_PATH}?targa=${encodeURIComponent(targa)}`;
}

export function buildNextDossierPath(targa: string) {
  return `${NEXT_DOSSIER_PREFIX}/${encodeURIComponent(targa)}`;
}

export function buildNextDossierPreventiviPath(targa: string) {
  return `${buildNextDossierPath(targa)}#preventivi`;
}

export function buildNextDossierListaDetailPath(targa: string) {
  return `${NEXT_DOSSIER_LISTA_PATH}/${encodeURIComponent(targa)}`;
}

export function buildNextDossierGommePath(targa: string) {
  return `${buildNextDossierPath(targa)}/gomme`;
}

export function buildNextDossierRifornimentiPath(targa: string) {
  return `${buildNextDossierPath(targa)}/rifornimenti`;
}

export function buildNextAnalisiEconomicaPath(targa: string) {
  return `${NEXT_ANALISI_ECONOMICA_PREFIX}/${encodeURIComponent(targa)}`;
}

export function buildNextDettaglioOrdinePath(ordineId: string) {
  return `${NEXT_DETTAGLIO_ORDINE_PREFIX}/${encodeURIComponent(ordineId)}`;
}

export function buildNextAcquistiDettaglioPath(ordineId: string) {
  return `${NEXT_ACQUISTI_DETTAGLIO_PREFIX}/${encodeURIComponent(ordineId)}`;
}

export function resolveNextOperativitaLegacyPath(
  search: string,
): string {
  const params = new URLSearchParams(search);
  const section = params.get("section");
  const tab = params.get("tab");
  const orderId = params.get("orderId");
  const backTab = params.get("from");

  if (section === "inventario") return buildNextMagazzinoPath("inventario");
  if (section === "materiali") return buildNextMagazzinoPath("materiali-consegnati");
  if (section === "attrezzature") return NEXT_ATTREZZATURE_CANTIERI_PATH;
  if (section === "manutenzioni") return NEXT_MANUTENZIONI_PATH;

  if (section === "procurement" || section === "ordini" || tab || orderId) {
    if (orderId) {
      const detailPath = buildNextDettaglioOrdinePath(orderId);
      const next = new URLSearchParams();
      if (backTab === "ordini" || backTab === "arrivi") {
        next.set("from", backTab);
      }
      const serialized = next.toString();
      return serialized ? `${detailPath}?${serialized}` : detailPath;
    }
    if (tab === "ordine-materiali") return NEXT_MATERIALI_DA_ORDINARE_PATH;
    if (tab === "arrivi") return NEXT_ORDINI_ARRIVATI_PATH;
    return NEXT_ORDINI_IN_ATTESA_PATH;
  }

  return NEXT_GESTIONE_OPERATIVA_PATH;
}
