import { useEffect, useRef, type ReactNode, type RefObject } from "react";

type NextMotherPageId =
  | "home"
  | "gestione-operativa"
  | "inventario"
  | "materiali-consegnati"
  | "attrezzature-cantieri"
  | "manutenzioni"
  | "acquisti"
  | "materiali-da-ordinare"
  | "ordini-in-attesa"
  | "ordini-arrivati"
  | "dettaglio-ordine"
  | "dettaglio-lavoro"
  | "autisti-admin"
  | "ia-apikey"
  | "ia-libretto"
  | "ia-documenti"
  | "ia-copertura-libretti"
  | "cisterna"
  | "mezzi"
  | "dossier-lista"
  | "dossier-mezzo"
  | "analisi-economica";

type TextMatcher = string | RegExp;

type NextCloneRule = {
  selector: string;
  title?: string;
  matchText?: TextMatcher | TextMatcher[];
};

type NextCloneKeydownRule = {
  selector: string;
  keys: string[];
};

type NextMotherPageConfig = {
  blockFormSubmit?: boolean;
  keydownRules?: NextCloneKeydownRule[];
  rules?: NextCloneRule[];
};

type NextMotherPageProps = {
  pageId: NextMotherPageId;
  children: ReactNode;
};

const DEFAULT_BLOCK_TITLE = "Clone read-only: azione disponibile solo nella madre";
const FUTURE_AREA_TITLE = "Area fuori perimetro clone: disponibile solo dopo la rifondazione";

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function readElementText(element: Element): string {
  if (element instanceof HTMLInputElement) {
    if (element.type === "file") {
      return normalizeText(element.closest("label")?.textContent ?? element.getAttribute("aria-label"));
    }

    return normalizeText(
      element.value || element.getAttribute("aria-label") || element.placeholder || element.textContent,
    );
  }

  if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    const placeholder = element instanceof HTMLTextAreaElement ? element.placeholder : "";
    return normalizeText(
      element.value || element.getAttribute("aria-label") || placeholder || element.textContent,
    );
  }

  return normalizeText(
    element.getAttribute("aria-label") ||
      element.getAttribute("title") ||
      element.textContent,
  );
}

function matchesRuleText(element: Element, matchText?: TextMatcher | TextMatcher[]): boolean {
  if (!matchText) {
    return true;
  }

  const text = readElementText(element);
  const patterns = Array.isArray(matchText) ? matchText : [matchText];

  return patterns.some((pattern) => {
    if (typeof pattern === "string") {
      return text === normalizeText(pattern);
    }

    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}

function markBlocked(element: HTMLElement, title: string) {
  element.setAttribute("data-next-clone-blocked", "true");
  element.setAttribute("aria-disabled", "true");
  element.setAttribute("title", title);
  element.classList.add("next-clone-button-disabled");

  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) {
    element.disabled = true;
  }

  if (element instanceof HTMLInputElement && element.type === "file") {
    const label = element.closest("label");
    if (label instanceof HTMLElement) {
      label.setAttribute("data-next-clone-blocked", "true");
      label.setAttribute("aria-disabled", "true");
      label.setAttribute("title", title);
      label.classList.add("next-clone-button-disabled");
    }
  }
}

function applyConfig(root: HTMLElement, config: NextMotherPageConfig | undefined) {
  if (!config?.rules?.length) {
    return;
  }

  config.rules.forEach((rule) => {
    root.querySelectorAll<HTMLElement>(rule.selector).forEach((element) => {
      if (!matchesRuleText(element, rule.matchText)) {
        return;
      }

      markBlocked(element, rule.title ?? DEFAULT_BLOCK_TITLE);
    });
  });
}

const PAGE_CONFIGS: Record<NextMotherPageId, NextMotherPageConfig> = {
  home: {
    keydownRules: [
      {
        selector: ".badge-search-input",
        keys: ["Enter"],
      },
    ],
    rules: [
      { selector: ".home-modal-btn.primary" },
      { selector: ".rimorchi-edit-btn.primary" },
      { selector: ".booking-action.danger" },
      { selector: ".panel-alerts .alert-row .alert-action" },
      { selector: ".panel-alerts .alert-missing .alert-action" },
      {
        selector: "a[href^=\"/mezzo-360/\"]",
        title: FUTURE_AREA_TITLE,
      },
      {
        selector: ".session-profile-link, .badge-search-button",
        title: FUTURE_AREA_TITLE,
      },
    ],
  },
  "gestione-operativa": {},
  inventario: {
    rules: [
      { selector: ".inventario-add-button, .inventario-delete-button, .inventario-edit-save, .inventario-qty-btn, .inventario-qty-input" },
      { selector: ".inventario-edit-box input[type=\"file\"]" },
    ],
  },
  "materiali-consegnati": {
    rules: [
      {
        selector: ".mc-add-btn",
        matchText: /^REGISTRA CONSEGNA$/,
      },
      { selector: ".mc-delete-btn" },
    ],
  },
  "attrezzature-cantieri": {
    rules: [
      {
        selector: ".ac-primary-btn",
        matchText: [/^SALVA MOVIMENTO$/, /^SALVA MODIFICHE$/],
      },
      { selector: ".ac-danger-btn" },
      { selector: "input[type=\"file\"]" },
    ],
  },
  manutenzioni: {
    rules: [
      {
        selector: "button",
        matchText: [/^SALVA MANUTENZIONE$/, /^ELIMINA$/],
      },
      {
        selector: ".mg-calibra-btn",
        matchText: /^SALVA POSIZIONI$/,
      },
      {
        selector: ".mg-btn",
        matchText: /^CONFERMA CAMBIO GOMME$/,
      },
    ],
  },
  acquisti: {
    rules: [
      { selector: "input[type=\"file\"]" },
      {
        selector: "button, label",
        matchText: [
          /^CONFERMA ORDINE$/,
          /^SALVA$/,
          /^SALVA MODIFICA$/,
          /^SALVA PREVENTIVO$/,
          /^ELIMINA$/,
          /^ELIMINA SELEZIONATI$/,
          /^CARICA PREVENTIVO$/,
          /^AGGIUNGI RIGA$/,
          /^IMPORTA$/,
          /^RIMUOVI$/,
          /^SEGNA(?: COME)?(?: NON)? ARRIVATO$/,
        ],
      },
    ],
  },
  "materiali-da-ordinare": {
    rules: [
      { selector: "input[type=\"file\"]" },
      {
        selector: "button, label",
        matchText: [/^CONFERMA ORDINE$/, /^CARICA PREVENTIVO$/, /^ELIMINA$/, /^RIMUOVI FOTO$/],
      },
    ],
  },
  "ordini-in-attesa": {},
  "ordini-arrivati": {},
  "dettaglio-ordine": {
    rules: [
      { selector: "input[type=\"file\"]" },
      { selector: ".btn-toggle" },
      {
        selector: "button",
        matchText: [/^SALVA$/, /^ELIMINA$/, /^RIMUOVI$/],
      },
    ],
  },
  "dettaglio-lavoro": {
    rules: [
      {
        selector: "button",
        matchText: /^ELIMINA$/,
      },
      {
        selector: ".modal-overlay button",
        matchText: /^SALVA$/,
      },
    ],
  },
  "autisti-admin": {
    rules: [
      {
        selector: "button",
        matchText: [
          /^FORZA LIBERO(?: MOTRICE| RIMORCHIO| TUTTO)?$/,
          /^ELIMINA(?: SESSIONE| EVENTO)?$/,
          /^CREA LAVORO$/,
          /^SALVA$/,
          /^CONFERMA$/,
          /^LETTO$/,
          /^PRESO IN CARICO$/,
          /^IMPORTA$/,
          /^RIMUOVI$/,
        ],
      },
    ],
  },
  "ia-apikey": {
    blockFormSubmit: true,
    rules: [{ selector: ".ia-apikey-save" }],
  },
  "ia-libretto": {
    rules: [
      { selector: "input[type=\"file\"]" },
      {
        selector: "button",
        matchText: [/^ANALIZZA CON IA$/, /^SALVA NEI DOCUMENTI DEL MEZZO$/],
      },
    ],
  },
  "ia-documenti": {
    rules: [
      { selector: "input[type=\"file\"]" },
      {
        selector: "button",
        matchText: [/^ANALIZZA CON IA$/, /^SALVA DOCUMENTO$/, /^IMPORTA MATERIALI IN INVENTARIO$/],
      },
    ],
  },
  "ia-copertura-libretti": {
    rules: [
      { selector: "input[type=\"file\"]" },
      {
        selector: "button",
        matchText: [/^CARICA LIBRETTO$/, /^RIPARA LIBRETTO$/, /^ESEGUI RIPARAZIONE$/],
      },
    ],
  },
  cisterna: {
    rules: [
      {
        selector: "button",
        matchText: [/^SALVA$/, /^CONFERMA SCELTA$/],
      },
    ],
  },
  mezzi: {
    rules: [
      { selector: "input[type=\"file\"]" },
      {
        selector: "button",
        matchText: [/^ANALIZZA LIBRETTO CON IA$/, /^SALVA MEZZO$/, /^SALVA MODIFICHE$/, /^ELIMINA$/],
      },
    ],
  },
  "dossier-lista": {},
  "dossier-mezzo": {
    rules: [
      {
        selector: "button",
        matchText: /^ELIMINA$/,
      },
    ],
  },
  "analisi-economica": {
    rules: [
      {
        selector: "button",
        matchText: /^RIGENERA ANALISI IA$/,
      },
    ],
  },
};

function useNextMotherPageGuards(pageId: NextMotherPageId, rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const config = PAGE_CONFIGS[pageId];
    const apply = () => applyConfig(root, config);
    apply();

    const observer = new MutationObserver(() => {
      apply();
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const handleBlockedClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const blocked = target.closest<HTMLElement>("[data-next-clone-blocked=\"true\"]");
      if (!blocked || !root.contains(blocked)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      if ("stopImmediatePropagation" in event && typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
    };

    const handleBlockedKeydown = (event: KeyboardEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const matchingRule = config?.keydownRules?.find(
        (rule) => target.closest(rule.selector) && rule.keys.includes(event.key),
      );
      if (!matchingRule) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    const handleBlockedSubmit = (event: Event) => {
      if (!config?.blockFormSubmit) {
        return;
      }

      if (!(event.target instanceof HTMLFormElement) || !root.contains(event.target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    root.addEventListener("click", handleBlockedClick, true);
    root.addEventListener("keydown", handleBlockedKeydown, true);
    root.addEventListener("submit", handleBlockedSubmit, true);

    return () => {
      observer.disconnect();
      root.removeEventListener("click", handleBlockedClick, true);
      root.removeEventListener("keydown", handleBlockedKeydown, true);
      root.removeEventListener("submit", handleBlockedSubmit, true);
    };
  }, [pageId, rootRef]);
}

export default function NextMotherPage({ pageId, children }: NextMotherPageProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  useNextMotherPageGuards(pageId, rootRef);

  return (
    <div ref={rootRef} data-next-mother-page={pageId} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
