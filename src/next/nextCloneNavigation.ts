import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { NEXT_ROLE_QUERY_PARAM } from "./nextAccess";
import {
  NEXT_ACQUISTI_PATH,
  buildNextAcquistiDettaglioPath,
  buildNextAnalisiEconomicaPath,
  buildNextDettaglioOrdinePath,
  buildNextDossierPath,
  NEXT_ATTREZZATURE_CANTIERI_PATH,
  NEXT_AUTISTI_ADMIN_PATH,
  NEXT_AUTISTI_APP_PATH,
  NEXT_AUTISTI_INBOX_PATH,
  NEXT_CENTRO_CONTROLLO_PATH,
  NEXT_CISTERNA_IA_PATH,
  NEXT_CISTERNA_PATH,
  NEXT_CISTERNA_SCHEDE_TEST_PATH,
  NEXT_DOSSIER_LISTA_PATH,
  NEXT_GESTIONE_OPERATIVA_PATH,
  NEXT_HOME_PATH,
  NEXT_IA_APIKEY_PATH,
  NEXT_IA_COPERTURA_LIBRETTI_PATH,
  NEXT_IA_DOCUMENTI_PATH,
  NEXT_IA_LIBRETTO_PATH,
  NEXT_IA_PATH,
  NEXT_INVENTARIO_PATH,
  NEXT_LIBRETTI_EXPORT_PATH,
  NEXT_LAVORI_DA_ESEGUIRE_PATH,
  NEXT_LAVORI_ESEGUITI_PATH,
  NEXT_LAVORI_IN_ATTESA_PATH,
  NEXT_MATERIALI_CONSEGNATI_PATH,
  NEXT_MATERIALI_DA_ORDINARE_PATH,
  NEXT_MANUTENZIONI_PATH,
  NEXT_MEZZI_PATH,
  NEXT_ORDINI_ARRIVATI_PATH,
  NEXT_ORDINI_IN_ATTESA_PATH,
} from "./nextStructuralPaths";

type PatchedHistory = History & {
  pushState: History["pushState"];
  replaceState: History["replaceState"];
};

declare global {
  interface Window {
    __nextCloneNavPatch__?: boolean;
  }
}

function normalizePathname(pathname: string): string {
  const trimmed = String(pathname || "").trim();
  if (!trimmed) return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function buildSearchWithRole(targetSearch: string, currentSearch: string): string {
  const nextParams = new URLSearchParams(targetSearch);
  const currentParams = new URLSearchParams(currentSearch);
  const currentRole = currentParams.get(NEXT_ROLE_QUERY_PARAM);

  if (currentRole && !nextParams.has(NEXT_ROLE_QUERY_PARAM)) {
    nextParams.set(NEXT_ROLE_QUERY_PARAM, currentRole);
  }

  const serialized = nextParams.toString();
  return serialized ? `?${serialized}` : "";
}

function rewriteLegacySameOriginPath(pathname: string, search: string): string | null {
  const normalizedPath = normalizePathname(pathname);

  if (normalizedPath.startsWith("/next")) {
    return null;
  }

  if (normalizedPath === "/") return NEXT_HOME_PATH;
  if (normalizedPath === "/centro-controllo") return NEXT_CENTRO_CONTROLLO_PATH;
  if (normalizedPath === "/gestione-operativa") return NEXT_GESTIONE_OPERATIVA_PATH;
  if (normalizedPath === "/operativita-globale") return NEXT_GESTIONE_OPERATIVA_PATH;
  if (normalizedPath === "/inventario") return NEXT_INVENTARIO_PATH;
  if (normalizedPath === "/materiali-consegnati") return NEXT_MATERIALI_CONSEGNATI_PATH;
  if (normalizedPath === "/attrezzature-cantieri") return NEXT_ATTREZZATURE_CANTIERI_PATH;
  if (normalizedPath === "/manutenzioni") return NEXT_MANUTENZIONI_PATH;
  if (normalizedPath === "/acquisti") return NEXT_ACQUISTI_PATH;
  if (normalizedPath === "/materiali-da-ordinare") return NEXT_MATERIALI_DA_ORDINARE_PATH;
  if (normalizedPath === "/ordini-in-attesa") return NEXT_ORDINI_IN_ATTESA_PATH;
  if (normalizedPath === "/ordini-arrivati") return NEXT_ORDINI_ARRIVATI_PATH;
  if (normalizedPath === "/lavori-da-eseguire") return NEXT_LAVORI_DA_ESEGUIRE_PATH;
  if (normalizedPath === "/lavori-in-attesa") return NEXT_LAVORI_IN_ATTESA_PATH;
  if (normalizedPath === "/lavori-eseguiti") return NEXT_LAVORI_ESEGUITI_PATH;
  if (normalizedPath === "/mezzi") return NEXT_MEZZI_PATH;
  if (normalizedPath === "/dossiermezzi") return NEXT_DOSSIER_LISTA_PATH;
  if (normalizedPath === "/ia") return NEXT_IA_PATH;
  if (normalizedPath === "/ia/apikey") return NEXT_IA_APIKEY_PATH;
  if (normalizedPath === "/ia/libretto") return NEXT_IA_LIBRETTO_PATH;
  if (normalizedPath === "/ia/documenti") return NEXT_IA_DOCUMENTI_PATH;
  if (normalizedPath === "/ia/copertura-libretti") return NEXT_IA_COPERTURA_LIBRETTI_PATH;
  if (normalizedPath === "/ia-gestionale") return NEXT_IA_PATH;
  if (normalizedPath === "/libretti-export") return NEXT_LIBRETTI_EXPORT_PATH;
  if (normalizedPath === "/cisterna") return NEXT_CISTERNA_PATH;
  if (normalizedPath === "/cisterna/ia") return NEXT_CISTERNA_IA_PATH;
  if (normalizedPath === "/cisterna/schede-test") return NEXT_CISTERNA_SCHEDE_TEST_PATH;
  if (normalizedPath === "/autisti-inbox") return NEXT_AUTISTI_INBOX_PATH;
  if (normalizedPath === "/autisti-admin") return NEXT_AUTISTI_ADMIN_PATH;
  if (normalizedPath === "/autisti") return NEXT_AUTISTI_APP_PATH;
  if (normalizedPath === "/autisti/login") return `${NEXT_AUTISTI_APP_PATH}/login`;
  if (normalizedPath === "/autisti/home") return `${NEXT_AUTISTI_APP_PATH}/home`;
  if (normalizedPath === "/autisti/setup-mezzo") return `${NEXT_AUTISTI_APP_PATH}/setup-mezzo`;
  if (normalizedPath === "/autisti/cambio-mezzo") return `${NEXT_AUTISTI_APP_PATH}/cambio-mezzo`;
  if (normalizedPath === "/autisti/controllo") return `${NEXT_AUTISTI_APP_PATH}/controllo`;
  if (normalizedPath === "/autisti/rifornimento") return `${NEXT_AUTISTI_APP_PATH}/rifornimento`;
  if (normalizedPath === "/autisti/segnalazioni") return `${NEXT_AUTISTI_APP_PATH}/segnalazioni`;
  if (normalizedPath === "/autisti/richiesta-attrezzature") {
    return `${NEXT_AUTISTI_APP_PATH}/richiesta-attrezzature`;
  }
  if (normalizedPath === "/autisti-inbox/cambio-mezzo") {
    return `${NEXT_AUTISTI_INBOX_PATH}/cambio-mezzo`;
  }
  if (normalizedPath === "/autisti-inbox/controlli") {
    return `${NEXT_AUTISTI_INBOX_PATH}/controlli`;
  }
  if (normalizedPath === "/autisti-inbox/segnalazioni") {
    return `${NEXT_AUTISTI_INBOX_PATH}/segnalazioni`;
  }
  if (normalizedPath === "/autisti-inbox/log-accessi") {
    return `${NEXT_AUTISTI_INBOX_PATH}/log-accessi`;
  }
  if (normalizedPath === "/autisti-inbox/gomme") {
    return `${NEXT_AUTISTI_INBOX_PATH}/gomme`;
  }
  if (normalizedPath === "/autisti-inbox/richiesta-attrezzature") {
    return `${NEXT_AUTISTI_INBOX_PATH}/richiesta-attrezzature`;
  }
  if (normalizedPath === "/colleghi") return "/next/colleghi";
  if (normalizedPath === "/fornitori") return "/next/fornitori";
  if (normalizedPath === "/capo/mezzi") return "/next/capo/mezzi";

  if (normalizedPath === "/dettagliolavori") {
    const params = new URLSearchParams(search);
    const lavoroId = params.get("lavoroId");
    if (!lavoroId) {
      return NEXT_LAVORI_IN_ATTESA_PATH;
    }
    params.delete("lavoroId");
    const serialized = params.toString();
    const nextPath = `/next/dettagliolavori/${encodeURIComponent(lavoroId)}`;
    return serialized ? `${nextPath}?${serialized}` : nextPath;
  }

  if (normalizedPath.startsWith("/capo/costi/")) {
    const targa = normalizedPath.slice("/capo/costi/".length);
    return targa ? `/next/capo/costi/${encodeURIComponent(decodeURIComponent(targa))}` : null;
  }

  if (normalizedPath.startsWith("/acquisti/dettaglio/")) {
    const ordineId = normalizedPath.slice("/acquisti/dettaglio/".length);
    return ordineId ? buildNextAcquistiDettaglioPath(decodeURIComponent(ordineId)) : null;
  }

  if (normalizedPath.startsWith("/dettaglio-ordine/")) {
    const ordineId = normalizedPath.slice("/dettaglio-ordine/".length);
    return ordineId ? buildNextDettaglioOrdinePath(decodeURIComponent(ordineId)) : null;
  }

  if (normalizedPath.startsWith("/dossiermezzi/")) {
    const targa = normalizedPath.slice("/dossiermezzi/".length);
    return targa ? buildNextDossierPath(decodeURIComponent(targa)) : null;
  }

  if (normalizedPath.startsWith("/dossier/")) {
    const remainder = normalizedPath.slice("/dossier/".length);
    const [rawTarga, child] = remainder.split("/");
    if (!rawTarga) return null;
    const targa = decodeURIComponent(rawTarga);

    if (!child) {
      return buildNextDossierPath(targa);
    }

    if (child === "gomme") {
      return `${buildNextDossierPath(targa)}/gomme`;
    }

    if (child === "rifornimenti") {
      return `${buildNextDossierPath(targa)}/rifornimenti`;
    }
  }

  if (normalizedPath.startsWith("/analisi-economica/")) {
    const targa = normalizedPath.slice("/analisi-economica/".length);
    return targa ? buildNextAnalisiEconomicaPath(decodeURIComponent(targa)) : null;
  }

  return null;
}

export function rewriteNextCloneUrl(
  urlLike: string | URL | null | undefined,
  currentSearch: string,
): string | null {
  if (typeof window === "undefined" || !urlLike) {
    return null;
  }

  try {
    const resolved = new URL(urlLike instanceof URL ? urlLike.toString() : String(urlLike), window.location.origin);
    if (resolved.origin !== window.location.origin) {
      return null;
    }

    const nextPath = rewriteLegacySameOriginPath(resolved.pathname, resolved.search);
    if (!nextPath) {
      return null;
    }

    const target = new URL(nextPath, window.location.origin);
    const nextSearch = buildSearchWithRole(target.search, currentSearch);
    return `${target.pathname}${nextSearch}${target.hash}`;
  } catch {
    return null;
  }
}

export function useNextCloneNavigation() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const historyObject = window.history as PatchedHistory;
    const originalPushState = historyObject.pushState.bind(historyObject);
    const originalReplaceState = historyObject.replaceState.bind(historyObject);

    historyObject.pushState = function patchedPushState(data, unused, url) {
      const rewritten = rewriteNextCloneUrl(
        typeof url === "string" || url instanceof URL ? url : null,
        location.search,
      );
      return originalPushState(data, unused, rewritten ?? url);
    };

    historyObject.replaceState = function patchedReplaceState(data, unused, url) {
      const rewritten = rewriteNextCloneUrl(
        typeof url === "string" || url instanceof URL ? url : null,
        location.search,
      );
      return originalReplaceState(data, unused, rewritten ?? url);
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (anchor.target && anchor.target !== "_self") {
        return;
      }

      const rewritten = rewriteNextCloneUrl(anchor.getAttribute("href"), location.search);
      if (!rewritten) {
        return;
      }

      event.preventDefault();
      originalPushState({}, "", rewritten);
      window.dispatchEvent(new PopStateEvent("popstate"));
    };

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      historyObject.pushState = originalPushState;
      historyObject.replaceState = originalReplaceState;
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [location.search]);
}
