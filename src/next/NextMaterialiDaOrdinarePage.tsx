import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { MaterialeOrdine, UnitaMisura } from "../types/ordini";
import "../pages/MaterialiDaOrdinare.css";
import "../pages/Acquisti.css";
import "./next-procurement-route.css";
import { readNextFornitoriSnapshot } from "./domain/nextFornitoriDomain";
import {
  type NextProcurementListinoItem,
  readNextProcurementSnapshot,
  type NextProcurementListTab,
  type NextProcurementSnapshot,
} from "./domain/nextProcurementDomain";
import { useInternalAiUniversalHandoffConsumer } from "./internal-ai/internalAiUniversalHandoffConsumer";
import NextProcurementConvergedSection from "./NextProcurementConvergedSection";
import {
  NEXT_HOME_PATH,
  NEXT_MATERIALI_DA_ORDINARE_PATH,
} from "./nextStructuralPaths";

interface Fornitore {
  id: string;
  nome: string;
}

type ProcurementDraftMaterial = MaterialeOrdine & {
  fornitoreScelto?: string;
  fornitore?: string;
  nomeFornitore?: string;
  note?: string;
  prezzoUnitario?: number | null;
  valuta?: string | null;
  unitaPrezzo?: string | null;
  fonteNumeroPreventivo?: string | null;
  fonteDataPreventivo?: string | null;
  pdfUrl?: string | null;
  pdfStoragePath?: string | null;
  imageUrls?: string[];
  imageStoragePaths?: string[];
  codiceArticolo?: string | null;
};

type ProcurementDraftState = {
  fornitoreId: string;
  fornitoreNome: string;
  isNuovoFornitore: boolean;
  nomeFornitorePersonalizzato: string;
  descrizione: string;
  quantita: string;
  unita: UnitaMisura;
  fotoPreview: string | null;
  materiali: ProcurementDraftMaterial[];
  searchText: string;
  noteByMaterialeId: Record<string, string>;
  ordineNote: string;
  newMaterialeNota: string;
  conversionFactorInput: string;
};

type FabbisogniTab =
  | "Fabbisogni"
  | "Ordini"
  | "Arrivi"
  | "Prezzi & Preventivi";

type CanonicalProcurementTab =
  | "fabbisogni"
  | "ordini"
  | "arrivi"
  | "preventivi"
  | "listino";

const TABS: FabbisogniTab[] = [
  "Fabbisogni",
  "Ordini",
  "Arrivi",
  "Prezzi & Preventivi",
];

const READ_ONLY_SAVE_MESSAGE =
  "Clone read-only: conferma ordine non disponibile.";
const READ_ONLY_PREVENTIVO_MESSAGE =
  "Clone read-only: caricamento preventivo non disponibile.";
const READ_ONLY_PDF_MESSAGE =
  "Clone read-only: esportazione PDF non disponibile.";
const PROCUREMENT_DRAFT_KEY = "next.procurement.materiali-da-ordinare.draft";

const generaId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const immaginiAutomatiche: { pattern: RegExp; url: string }[] = [
  { pattern: /cemento/i, url: "/materiali/cemento.png" },
  { pattern: /pvc|tubo/i, url: "/materiali/tubo-pvc.png" },
  { pattern: /piastrella/i, url: "/materiali/piastrelle.png" },
  { pattern: /legno|assi/i, url: "/materiali/legno.png" },
];

function trovaImmagineAutomatica(desc: string): string | null {
  for (const matcher of immaginiAutomatiche) {
    if (matcher.pattern.test(desc)) return matcher.url;
  }
  return null;
}

function readErrorMessage(error: unknown) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : "Errore durante il caricamento dei fornitori.";
}

function normalizeSearchToken(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeStoredPreview(value: unknown) {
  if (typeof value !== "string") return null;
  if (!value.trim() || value.startsWith("blob:")) return null;
  return value;
}

function normalizeDescrizione(value: string) {
  return String(value || "")
    .toUpperCase()
    .trim()
    .replace(/[.\-_/]/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeUnita(value: string) {
  return String(value || "").toUpperCase().trim();
}

function normalizeUom(value: string): "PZ" | "NR" | "MT" | "LT" | "KG" | "M" {
  const normalized = normalizeUnita(value);
  if (normalized === "PZ" || normalized === "PEZZO" || normalized === "PEZZI") {
    return "PZ";
  }
  if (normalized === "NR" || normalized === "N" || normalized === "NUMERO") {
    return "NR";
  }
  if (normalized === "MT" || normalized === "METRO" || normalized === "METRI") {
    return "MT";
  }
  if (normalized === "M") {
    return "M";
  }
  if (normalized === "LT" || normalized === "L" || normalized === "LITRO" || normalized === "LITRI") {
    return "LT";
  }
  if (normalized === "KG" || normalized === "KILO" || normalized === "KILOGRAMMO" || normalized === "KILOGRAMMI") {
    return "KG";
  }
  return "PZ";
}

function normalizeArticoloCanonico(value: string) {
  return normalizeDescrizione(value);
}

function parseConversionFactor(note: string | null | undefined): number | null {
  const raw = String(note || "");
  if (!raw.trim()) return null;
  const match = raw.match(/(?:^|[\s|;,])conv\s*:\s*([0-9]+(?:[.,][0-9]+)?)/i);
  if (!match) return null;
  const parsed = Number(String(match[1]).replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function upsertConversionFactorInNote(note: string | null | undefined, factorRaw: string) {
  const cleanNote = String(note || "").trim();
  const cleanFactor = String(factorRaw || "").trim();
  const withoutToken = cleanNote
    .replace(/(?:^|[\s|;,])conv\s*:\s*[0-9]+(?:[.,][0-9]+)?/gi, " ")
    .replace(/\s+\|\s+\|/g, " | ")
    .replace(/\s+/g, " ")
    .replace(/(^[|;,]\s*|\s*[|;,]$)/g, "")
    .trim();

  const factor = Number(cleanFactor.replace(",", "."));
  if (!Number.isFinite(factor) || factor <= 0) {
    return withoutToken;
  }
  const token = `conv:${factor.toString().replace(".", ",")}`;
  if (!withoutToken) return token;
  return `${withoutToken} | ${token}`.trim();
}

function computeLineTotal(params: {
  qty: number;
  unitPrice: number;
  selectedUom: string | null | undefined;
  priceUom: string | null | undefined;
  note?: string | null;
}) {
  const qty = Number(params.qty);
  const unitPrice = Number(params.unitPrice);
  if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
    return { total: null as number | null, status: "ok" as const, factor: null as number | null };
  }

  const selected = normalizeUnita(String(params.selectedUom || ""));
  const source = normalizeUnita(String(params.priceUom || selected));
  if (!selected || !source || selected === source) {
    return { total: qty * unitPrice, status: "ok" as const, factor: null as number | null };
  }

  const factor = parseConversionFactor(params.note);
  if (!factor) {
    return { total: null as number | null, status: "needs_factor" as const, factor: null as number | null };
  }

  return { total: qty * factor * unitPrice, status: "ok" as const, factor };
}

function coerceDraftMaterial(value: unknown): ProcurementDraftMaterial | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const descrizione = String(raw.descrizione ?? "").trim();
  const quantita = Number(raw.quantita);
  const unita = String(raw.unita ?? "").trim();
  if (!descrizione || !Number.isFinite(quantita) || !unita) {
    return null;
  }

  return {
    id: String(raw.id ?? generaId()),
    descrizione,
    quantita,
    unita,
    arrivato: Boolean(raw.arrivato),
    dataArrivo:
      typeof raw.dataArrivo === "string" && raw.dataArrivo.trim()
        ? raw.dataArrivo
        : undefined,
    fotoUrl: normalizeStoredPreview(raw.fotoUrl),
    fotoStoragePath:
      typeof raw.fotoStoragePath === "string" && raw.fotoStoragePath.trim()
        ? raw.fotoStoragePath
        : null,
    fornitoreScelto:
      typeof raw.fornitoreScelto === "string" && raw.fornitoreScelto.trim()
        ? raw.fornitoreScelto
        : undefined,
    fornitore:
      typeof raw.fornitore === "string" && raw.fornitore.trim()
        ? raw.fornitore
        : undefined,
    nomeFornitore:
      typeof raw.nomeFornitore === "string" && raw.nomeFornitore.trim()
        ? raw.nomeFornitore
        : undefined,
    note:
      typeof raw.note === "string" && raw.note.trim()
        ? raw.note
        : undefined,
    prezzoUnitario:
      typeof raw.prezzoUnitario === "number" ? raw.prezzoUnitario : null,
    valuta:
      typeof raw.valuta === "string" && raw.valuta.trim()
        ? raw.valuta
        : null,
    unitaPrezzo:
      typeof raw.unitaPrezzo === "string" && raw.unitaPrezzo.trim()
        ? raw.unitaPrezzo
        : null,
    fonteNumeroPreventivo:
      typeof raw.fonteNumeroPreventivo === "string" && raw.fonteNumeroPreventivo.trim()
        ? raw.fonteNumeroPreventivo
        : null,
    fonteDataPreventivo:
      typeof raw.fonteDataPreventivo === "string" && raw.fonteDataPreventivo.trim()
        ? raw.fonteDataPreventivo
        : null,
    pdfUrl:
      typeof raw.pdfUrl === "string" && raw.pdfUrl.trim()
        ? raw.pdfUrl
        : null,
    pdfStoragePath:
      typeof raw.pdfStoragePath === "string" && raw.pdfStoragePath.trim()
        ? raw.pdfStoragePath
        : null,
    imageUrls: Array.isArray(raw.imageUrls)
      ? raw.imageUrls.filter(
          (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
        )
      : [],
    imageStoragePaths: Array.isArray(raw.imageStoragePaths)
      ? raw.imageStoragePaths.filter(
          (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
        )
      : [],
    codiceArticolo:
      typeof raw.codiceArticolo === "string" && raw.codiceArticolo.trim()
        ? raw.codiceArticolo
        : null,
  };
}

function readProcurementDraftState(): ProcurementDraftState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(PROCUREMENT_DRAFT_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ProcurementDraftState>;
    return {
      fornitoreId: String(parsed.fornitoreId ?? ""),
      fornitoreNome: String(parsed.fornitoreNome ?? ""),
      isNuovoFornitore: Boolean(parsed.isNuovoFornitore),
      nomeFornitorePersonalizzato: String(parsed.nomeFornitorePersonalizzato ?? ""),
      descrizione: String(parsed.descrizione ?? ""),
      quantita: String(parsed.quantita ?? ""),
      unita: String(parsed.unita ?? "pz"),
      fotoPreview: normalizeStoredPreview(parsed.fotoPreview),
      materiali: Array.isArray(parsed.materiali)
        ? parsed.materiali
            .map((entry) => coerceDraftMaterial(entry))
            .filter((entry): entry is ProcurementDraftMaterial => entry !== null)
        : [],
      searchText: String(parsed.searchText ?? ""),
      noteByMaterialeId:
        parsed.noteByMaterialeId && typeof parsed.noteByMaterialeId === "object"
          ? Object.entries(parsed.noteByMaterialeId).reduce<Record<string, string>>(
              (accumulator, [key, value]) => {
                const normalizedKey = String(key || "").trim();
                const normalizedValue = String(value ?? "").trim();
                if (!normalizedKey || !normalizedValue) {
                  return accumulator;
                }
                accumulator[normalizedKey] = normalizedValue;
                return accumulator;
              },
              {},
            )
          : {},
      ordineNote: String(parsed.ordineNote ?? ""),
      newMaterialeNota: String(parsed.newMaterialeNota ?? ""),
      conversionFactorInput: String(parsed.conversionFactorInput ?? ""),
    };
  } catch {
    return null;
  }
}

function resolveHandoffTab(args: {
  orderId: string | null;
  routeSecondaria: string | null;
  vistaTarget: string | null;
  flusso: string | null;
}): CanonicalProcurementTab {
  const hints = [args.routeSecondaria, args.vistaTarget, args.flusso]
    .map((value) => normalizeSearchToken(value))
    .filter(Boolean)
    .join(" ");

  if (normalizeSearchToken(args.vistaTarget).includes("listino")) {
    return "listino";
  }
  if (hints.includes("preventiv") || hints.includes("prezz")) {
    return "preventivi";
  }
  if (hints.includes("arriv")) {
    return "arrivi";
  }
  if (args.orderId || hints.includes("ordin")) {
    return "ordini";
  }

  return "fabbisogni";
}

function normalizeCanonicalTab(search: URLSearchParams): CanonicalProcurementTab {
  const rawTab = search.get("tab");
  if (rawTab === "ordini") return "ordini";
  if (rawTab === "arrivi") return "arrivi";
  if (rawTab === "preventivi") return "preventivi";
  if (rawTab === "listino") return "listino";
  if (rawTab === "ordine-materiali") return "fabbisogni";
  return "fabbisogni";
}

function mapVisibleTab(tab: CanonicalProcurementTab): FabbisogniTab {
  if (tab === "ordini") return "Ordini";
  if (tab === "arrivi") return "Arrivi";
  if (tab === "preventivi" || tab === "listino") return "Prezzi & Preventivi";
  return "Fabbisogni";
}

function buildCanonicalSearch(args: {
  currentSearch: URLSearchParams;
  tab: CanonicalProcurementTab;
  orderId?: string | null;
  from?: NextProcurementListTab | null;
}) {
  const nextSearch = new URLSearchParams();
  const iaHandoff = args.currentSearch.get("iaHandoff");

  if (iaHandoff) {
    nextSearch.set("iaHandoff", iaHandoff);
  }

  if (args.tab !== "fabbisogni") {
    nextSearch.set("tab", args.tab);
  }
  if (args.orderId) {
    nextSearch.set("orderId", args.orderId);
  }
  if (args.from) {
    nextSearch.set("from", args.from);
  }

  return nextSearch;
}

export default function NextMaterialiDaOrdinarePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const canonicalTab = useMemo(
    () => normalizeCanonicalTab(searchParams),
    [searchParams],
  );
  const activeTab = useMemo(() => mapVisibleTab(canonicalTab), [canonicalTab]);
  const selectedOrderId = searchParams.get("orderId");
  const detailBackTab = (searchParams.get("from") === "arrivi"
    ? "arrivi"
    : canonicalTab === "arrivi"
      ? "arrivi"
      : "ordini") as NextProcurementListTab;

  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [fornitoreId, setFornitoreId] = useState("");
  const [fornitoreNome, setFornitoreNome] = useState("");
  const [isNuovoFornitore, setIsNuovoFornitore] = useState(false);
  const [nomeFornitorePersonalizzato, setNomeFornitorePersonalizzato] =
    useState("");
  const [descrizione, setDescrizione] = useState("");
  const [quantita, setQuantita] = useState("");
  const [unita, setUnita] = useState<UnitaMisura>("pz");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [materiali, setMateriali] = useState<ProcurementDraftMaterial[]>([]);
  const [loadingFornitori, setLoadingFornitori] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [procurementSnapshot, setProcurementSnapshot] =
    useState<NextProcurementSnapshot | null>(null);
  const [loadingProcurement, setLoadingProcurement] = useState(true);
  const [procurementError, setProcurementError] = useState<string | null>(null);
  const [noteByMaterialeId, setNoteByMaterialeId] = useState<Record<string, string>>({});
  const [ordineNote, setOrdineNote] = useState("");
  const [newMaterialeNota, setNewMaterialeNota] = useState("");
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [selectedListinoVoce, setSelectedListinoVoce] =
    useState<NextProcurementListinoItem | null>(null);
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  const [conversionFactorInput, setConversionFactorInput] = useState("");
  const procurementHandoff = useInternalAiUniversalHandoffConsumer({
    moduleId: "next.procurement",
  });
  const procurementLifecycleRef = useRef<string | null>(null);
  const openCanonicalProcurementView = useCallback(
    (args: {
      tab: CanonicalProcurementTab;
      orderId?: string | null;
      from?: NextProcurementListTab | null;
    }) => {
      const nextSearch = buildCanonicalSearch({
        currentSearch: searchParams,
        tab: args.tab,
        orderId: args.orderId,
        from: args.from,
      });
      navigate(
        `${NEXT_MATERIALI_DA_ORDINARE_PATH}${
          nextSearch.toString() ? `?${nextSearch.toString()}` : ""
        }`,
      );
    },
    [navigate, searchParams],
  );
  const clearProcurementDraftState = useCallback(() => {
    setFornitoreId("");
    setFornitoreNome("");
    setIsNuovoFornitore(false);
    setNomeFornitorePersonalizzato("");
    setDescrizione("");
    setQuantita("");
    setUnita("pz");
    setFotoFile(null);
    setFotoPreview(null);
    setMateriali([]);
    setNoteByMaterialeId({});
    setOrdineNote("");
    setNewMaterialeNota("");
    setDraftSavedAt(null);
    setShowSuggest(false);
    setSelectedListinoVoce(null);
    setShowEntryDetails(false);
    setConversionFactorInput("");
    setSearchText("");
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(PROCUREMENT_DRAFT_KEY);
    }
  }, []);

  const handoffOrderId = useMemo(() => {
    if (procurementHandoff.state.status !== "ready") {
      return null;
    }

    return procurementHandoff.state.payload.entityRef?.entityKind === "ordine"
      ? procurementHandoff.state.payload.entityRef.matchedId ??
          procurementHandoff.state.payload.entityRef.normalizedValue
      : null;
  }, [procurementHandoff.state]);

  const iaPrefill = useMemo(() => {
    if (procurementHandoff.state.status !== "ready") {
      return null;
    }

    return {
      handoffId: procurementHandoff.state.payload.handoffId,
      fornitore: procurementHandoff.state.prefill.fornitore,
      materiale: procurementHandoff.state.prefill.materiale,
      documentoNome: procurementHandoff.state.prefill.documentoNome,
      note: procurementHandoff.state.payload.motivoInstradamento,
      statusLabel: procurementHandoff.state.payload.statoConsumo,
      missingFields: procurementHandoff.state.payload.campiMancanti,
      verifyFields: procurementHandoff.state.payload.campiDaVerificare,
    };
  }, [procurementHandoff.state]);

  useEffect(() => {
    const draft = readProcurementDraftState();
    if (!draft) {
      return;
    }

    setFornitoreId(draft.fornitoreId);
    setFornitoreNome(draft.fornitoreNome);
    setIsNuovoFornitore(draft.isNuovoFornitore);
    setNomeFornitorePersonalizzato(draft.nomeFornitorePersonalizzato);
    setDescrizione(draft.descrizione);
    setQuantita(draft.quantita);
    setUnita(draft.unita);
    setFotoPreview(draft.fotoPreview);
    setMateriali(draft.materiali);
    setSearchText(draft.searchText);
    setNoteByMaterialeId(draft.noteByMaterialeId);
    setOrdineNote(draft.ordineNote);
    setNewMaterialeNota(draft.newMaterialeNota);
    setConversionFactorInput(draft.conversionFactorInput);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoadingFornitori(true);
        setError(null);
        const snapshot = await readNextFornitoriSnapshot({
          includeCloneOverlays: false,
        });
        if (cancelled) return;
        setFornitori(
          snapshot.items.map((item) => ({
            id: item.id || generaId(),
            nome: item.nome,
          })),
        );
      } catch (loadError) {
        if (cancelled) return;
        setFornitori([]);
        setError(readErrorMessage(loadError));
      } finally {
        if (!cancelled) {
          setLoadingFornitori(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProcurement = async () => {
      try {
        setLoadingProcurement(true);
        setProcurementError(null);
        const snapshot = await readNextProcurementSnapshot({
          includeCloneOverlays: false,
        });
        if (cancelled) return;
        setProcurementSnapshot(snapshot);
      } catch (loadError) {
        if (cancelled) return;
        setProcurementSnapshot(null);
        setProcurementError(
          loadError instanceof Error && loadError.message
            ? loadError.message
            : "Snapshot procurement clone non disponibile.",
        );
      } finally {
        if (!cancelled) {
          setLoadingProcurement(false);
        }
      }
    };

    void loadProcurement();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      const draft: ProcurementDraftState = {
        fornitoreId,
        fornitoreNome,
        isNuovoFornitore,
        nomeFornitorePersonalizzato,
        descrizione,
        quantita,
        unita,
        fotoPreview: fotoFile ? null : normalizeStoredPreview(fotoPreview),
        materiali,
        searchText,
        noteByMaterialeId,
        ordineNote,
        newMaterialeNota,
        conversionFactorInput,
      };

      const isEmpty =
        !draft.fornitoreId &&
        !draft.fornitoreNome &&
        !draft.isNuovoFornitore &&
        !draft.nomeFornitorePersonalizzato.trim() &&
        !draft.descrizione.trim() &&
        !draft.quantita.trim() &&
        draft.unita === "pz" &&
        !draft.fotoPreview &&
        !draft.searchText.trim() &&
        !draft.ordineNote.trim() &&
        !draft.newMaterialeNota.trim() &&
        !draft.conversionFactorInput.trim() &&
        Object.keys(draft.noteByMaterialeId).length === 0 &&
        draft.materiali.length === 0;

      if (isEmpty) {
        window.sessionStorage.removeItem(PROCUREMENT_DRAFT_KEY);
        setDraftSavedAt(null);
        return;
      }

      window.sessionStorage.setItem(PROCUREMENT_DRAFT_KEY, JSON.stringify(draft));
      setDraftSavedAt(Date.now());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [
    descrizione,
    fornitoreId,
    fornitoreNome,
    fotoFile,
    fotoPreview,
    isNuovoFornitore,
    materiali,
    newMaterialeNota,
    noteByMaterialeId,
    ordineNote,
    nomeFornitorePersonalizzato,
    quantita,
    searchText,
    unita,
    conversionFactorInput,
  ]);

  useEffect(() => {
    if (
      procurementHandoff.state.status !== "ready" ||
      loadingFornitori ||
      !procurementSnapshot ||
      procurementLifecycleRef.current === procurementHandoff.state.payload.handoffId
    ) {
      return;
    }

    const prefill = procurementHandoff.state.prefill;
    const materialePrefill = prefill.materiale ?? prefill.queryMateriale;
    const targetTab = resolveHandoffTab({
      orderId: handoffOrderId,
      routeSecondaria: prefill.routeSecondaria,
      vistaTarget: prefill.vistaTarget,
      flusso: prefill.flusso,
    });

    if (prefill.fornitore) {
      const normalizedSupplier = normalizeSearchToken(prefill.fornitore);
      const matchingSupplier = fornitori.find((entry) =>
        normalizeSearchToken(entry.nome).includes(normalizedSupplier),
      );
      if (matchingSupplier) {
        setIsNuovoFornitore(false);
        setFornitoreId(matchingSupplier.id);
        setFornitoreNome(matchingSupplier.nome);
        setNomeFornitorePersonalizzato("");
      } else if (!fornitoreNome.trim() && !nomeFornitorePersonalizzato.trim()) {
        setIsNuovoFornitore(true);
        setFornitoreId("nuovo");
        setFornitoreNome("");
        setNomeFornitorePersonalizzato(prefill.fornitore.toUpperCase());
      }
    }

    if (materialePrefill && !descrizione.trim()) {
      setDescrizione(materialePrefill.toUpperCase());
    }

    if (!searchText.trim()) {
      setSearchText(
        materialePrefill ??
          prefill.fornitore ??
          prefill.documentoNome ??
          "",
      );
    }

    if (
      targetTab !== canonicalTab ||
      (handoffOrderId && selectedOrderId !== handoffOrderId)
    ) {
      openCanonicalProcurementView({
        tab: targetTab,
        orderId: handoffOrderId,
        from:
          targetTab === "arrivi"
            ? "arrivi"
            : targetTab === "ordini"
              ? "ordini"
              : null,
      });
    }

    procurementHandoff.acknowledge(
      "prefill_applicato",
      "Il procurement convergente ha applicato il payload IA al modulo unico Materiali da ordinare.",
    );

    if (procurementHandoff.state.requiresVerification) {
      procurementHandoff.acknowledge(
        "da_verificare",
        "Il payload IA procurement richiede ancora verifica manuale nel modulo convergente.",
      );
    } else {
      procurementHandoff.acknowledge(
        "completato",
        "Il procurement convergente ha agganciato il payload standard nel modulo unico.",
      );
    }

    procurementLifecycleRef.current = procurementHandoff.state.payload.handoffId;
  }, [
    canonicalTab,
    descrizione,
    fornitori,
    fornitoreNome,
    handoffOrderId,
    loadingFornitori,
    nomeFornitorePersonalizzato,
    openCanonicalProcurementView,
    procurementHandoff,
    procurementSnapshot,
    searchText,
    selectedOrderId,
  ]);

  const handleSelectFornitore = (id: string) => {
    if (id === "nuovo") {
      setIsNuovoFornitore(true);
      setFornitoreId("nuovo");
      setFornitoreNome("");
      setSelectedListinoVoce(null);
      return;
    }

    setIsNuovoFornitore(false);
    setFornitoreId(id);

    const fornitore = fornitori.find((entry) => entry.id === id);
    setFornitoreNome(fornitore?.nome || "");
    setSelectedListinoVoce(null);
  };

  const fornitoreAttivoNome = isNuovoFornitore
    ? nomeFornitorePersonalizzato.trim().toUpperCase()
    : fornitoreNome.trim();
  const fornitoreAttivoId = !isNuovoFornitore ? fornitoreId : "";

  const suggestListino = useMemo(() => {
    if (!showSuggest || !procurementSnapshot || !fornitoreAttivoId) {
      return [];
    }

    const query = descrizione.trim().toLowerCase();
    if (!query) {
      return [];
    }

    return procurementSnapshot.listino
      .filter((entry) => entry.supplierId === fornitoreAttivoId)
      .filter((entry) => {
        const articolo = String(entry.articoloCanonico || "").toLowerCase();
        const codice = String(entry.codiceArticolo || "").toLowerCase();
        return articolo.includes(query) || codice.includes(query);
      })
      .sort(
        (left, right) =>
          (right.updatedAtTimestamp ?? 0) - (left.updatedAtTimestamp ?? 0),
      )
      .slice(0, 8);
  }, [descrizione, fornitoreAttivoId, procurementSnapshot, showSuggest]);

  const handleDescrizioneBlur = () => {
    window.setTimeout(() => {
      setShowSuggest(false);
    }, 120);
    if (fotoFile || fotoPreview) return;
    const auto = trovaImmagineAutomatica(descrizione);
    if (auto) setFotoPreview(auto);
  };

  const handleDescrizioneChange = (value: string) => {
    setDescrizione(value);
    setShowSuggest(true);
    if (
      selectedListinoVoce &&
      normalizeArticoloCanonico(value) !==
        normalizeArticoloCanonico(selectedListinoVoce.articoloCanonico)
    ) {
      setSelectedListinoVoce(null);
    }
  };

  const selectListinoSuggestion = (voce: NextProcurementListinoItem) => {
    setDescrizione(voce.articoloCanonico);
    const autoUnita = normalizeUom(String(voce.unita || ""));
    setUnita(autoUnita.toLowerCase() as UnitaMisura);
    setConversionFactorInput("");
    setSelectedListinoVoce(voce);
    setShowSuggest(false);
    setShowEntryDetails(true);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const resetMateriale = () => {
    setDescrizione("");
    setQuantita("");
    setUnita("pz");
    setFotoFile(null);
    setFotoPreview(null);
    setSelectedListinoVoce(null);
    setShowSuggest(false);
    setNewMaterialeNota("");
    setConversionFactorInput("");
    setShowEntryDetails(false);
  };

  const getMaterialNote = useCallback(
    (materiale: ProcurementDraftMaterial) =>
      noteByMaterialeId[materiale.id] || String(materiale.note || "").trim(),
    [noteByMaterialeId],
  );

  const selectedUomNorm = normalizeUom(String(unita || ""));
  const selectedPriceUom = selectedListinoVoce
    ? normalizeUom(String(selectedListinoVoce.unita || ""))
    : null;
  const needsConversionFactorInput =
    Boolean(selectedListinoVoce) &&
    Boolean(selectedPriceUom) &&
    selectedUomNorm !== selectedPriceUom;
  const parsedConversionFactorInput = Number(
    String(conversionFactorInput || "").replace(",", "."),
  );
  const hasValidConversionFactorInput =
    Number.isFinite(parsedConversionFactorInput) && parsedConversionFactorInput > 0;

  const aggiungiMateriale = () => {
    if (!descrizione.trim() || !quantita.trim()) return;

    if (!fornitoreAttivoNome) {
      window.alert("Seleziona un fornitore prima di aggiungere il materiale.");
      return;
    }

    const quantitaNumerica = Number.parseFloat(quantita);
    if (!Number.isFinite(quantitaNumerica) || quantitaNumerica <= 0) {
      window.alert("Inserisci una quantità valida.");
      return;
    }

    const noteConFattore = upsertConversionFactorInNote(
      newMaterialeNota,
      conversionFactorInput,
    );
    const id = generaId();
    const nuovo: ProcurementDraftMaterial = {
      id,
      descrizione: normalizeDescrizione(descrizione),
      quantita: quantitaNumerica,
      unita,
      arrivato: false,
      fotoUrl: fotoPreview,
      fotoStoragePath: null,
      fornitoreScelto: fornitoreAttivoNome,
      fornitore: fornitoreAttivoNome,
      nomeFornitore: fornitoreAttivoNome,
      note: noteConFattore || undefined,
      prezzoUnitario: selectedListinoVoce?.prezzoAttuale ?? null,
      valuta: selectedListinoVoce?.valuta ?? null,
      unitaPrezzo: selectedListinoVoce?.unita ?? null,
      fonteNumeroPreventivo: selectedListinoVoce?.fonteNumeroPreventivo ?? null,
      fonteDataPreventivo: selectedListinoVoce?.fonteDataPreventivo ?? null,
      pdfUrl: selectedListinoVoce?.pdfUrl ?? null,
      pdfStoragePath: selectedListinoVoce?.pdfStoragePath ?? null,
      imageUrls: selectedListinoVoce?.imageUrls ?? [],
      imageStoragePaths: selectedListinoVoce?.imageStoragePaths ?? [],
      codiceArticolo: selectedListinoVoce?.codiceArticolo ?? null,
    };

    setMateriali((current) => [...current, nuovo]);
    if (noteConFattore) {
      setNoteByMaterialeId((current) => ({
        ...current,
        [id]: noteConFattore,
      }));
    }
    resetMateriale();
  };

  const eliminaMateriale = (id: string) => {
    setMateriali((current) => current.filter((item) => item.id !== id));
    setNoteByMaterialeId((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const aggiornaFotoMateriale = (materialId: string, file: File) => {
    const preview = URL.createObjectURL(file);
    setMateriali((current) =>
      current.map((item) =>
        item.id === materialId
          ? {
              ...item,
              fotoUrl: preview,
              fotoStoragePath: null,
            }
          : item,
      ),
    );
  };

  const rimuoviFotoMateriale = (materialId: string) => {
    setMateriali((current) =>
      current.map((item) =>
        item.id === materialId
          ? {
              ...item,
              fotoUrl: null,
              fotoStoragePath: null,
            }
          : item,
      ),
    );
  };

  const openDocumentoMateriale = (materiale: ProcurementDraftMaterial) => {
    const documentCandidates = [
      materiale.pdfUrl,
      ...(materiale.imageUrls ?? []),
      materiale.fotoUrl,
    ].filter((entry): entry is string => Boolean(entry && entry.trim()));

    if (documentCandidates.length === 0) {
      window.alert("Nessun documento collegato alla riga.");
      return;
    }

    window.open(documentCandidates[0], "_blank", "noopener,noreferrer");
  };

  const openBozzaListinoManuale = (materiale: ProcurementDraftMaterial) => {
    setSearchText(materiale.descrizione);
    openCanonicalProcurementView({ tab: "listino" });
  };

  const salvaOrdine = () => {
    let nomeFinale = fornitoreNome.trim();

    if (isNuovoFornitore && nomeFornitorePersonalizzato.trim()) {
      nomeFinale = nomeFornitorePersonalizzato.trim().toUpperCase();
    }

    if (!nomeFinale) {
      window.alert("Seleziona o inserisci un fornitore prima di confermare.");
      return;
    }

    if (!materiali.length) return;
    window.alert(READ_ONLY_SAVE_MESSAGE);
    clearProcurementDraftState();
  };

  const materialiFiltrati = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return materiali;

    return materiali.filter((materiale) => {
      const materialeConFornitore = materiale as unknown as {
        fornitoreScelto?: string;
        fornitore?: string;
        nomeFornitore?: string;
      };
      const fornitoreRiga = String(
        materialeConFornitore.fornitoreScelto ??
          materialeConFornitore.fornitore ??
          materialeConFornitore.nomeFornitore ??
          "",
      ).toLowerCase();

      return (
        materiale.descrizione.toLowerCase().includes(query) ||
        fornitoreRiga.includes(query) ||
        String(materiale.id).toLowerCase().includes(query)
      );
    });
  }, [materiali, searchText]);

  const prezzoSourceByMaterialeId = useMemo(() => {
    const map = new Map<
      string,
      {
        prezzoUnitario: number;
        valuta: string | null;
        unita: string | null;
        codiceArticolo: string | null;
        numeroPreventivo: string | null;
        dataPreventivo: string | null;
      }
    >();

    materiali.forEach((materiale) => {
      if (typeof materiale.prezzoUnitario === "number" && Number.isFinite(materiale.prezzoUnitario)) {
        map.set(materiale.id, {
          prezzoUnitario: materiale.prezzoUnitario,
          valuta: materiale.valuta ?? null,
          unita: materiale.unitaPrezzo ?? null,
          codiceArticolo: materiale.codiceArticolo ?? null,
          numeroPreventivo: materiale.fonteNumeroPreventivo ?? null,
          dataPreventivo: materiale.fonteDataPreventivo ?? null,
        });
        return;
      }

      const supplierName = normalizeSearchToken(
        materiale.fornitoreScelto ?? materiale.fornitore ?? materiale.nomeFornitore,
      );
      const fallback = procurementSnapshot?.listino.find((entry) => {
        const sameSupplier = supplierName
          ? normalizeSearchToken(entry.supplierName) === supplierName
          : true;
        return (
          sameSupplier &&
          normalizeArticoloCanonico(entry.articoloCanonico) ===
            normalizeArticoloCanonico(materiale.descrizione)
        );
      });

      if (fallback && typeof fallback.prezzoAttuale === "number") {
        map.set(materiale.id, {
          prezzoUnitario: fallback.prezzoAttuale,
          valuta: fallback.valuta ?? null,
          unita: fallback.unita ?? null,
          codiceArticolo: fallback.codiceArticolo ?? null,
          numeroPreventivo: fallback.fonteNumeroPreventivo ?? null,
          dataPreventivo: fallback.fonteDataPreventivo ?? null,
        });
      }
    });

    return map;
  }, [materiali, procurementSnapshot]);

  const totalsSummary = useMemo(() => {
    const totalsByValuta = { CHF: 0, EUR: 0 };
    let totaleSenzaValuta = 0;
    let prezziMancanti = 0;
    let udmDaVerificare = 0;

    materiali.forEach((materiale) => {
      const prezzoInfo = prezzoSourceByMaterialeId.get(materiale.id);
      if (!prezzoInfo) {
        prezziMancanti += 1;
        return;
      }

      const note = getMaterialNote(materiale);
      const line = computeLineTotal({
        qty: Number(materiale.quantita || 0),
        unitPrice: prezzoInfo.prezzoUnitario,
        selectedUom: materiale.unita,
        priceUom: prezzoInfo.unita,
        note,
      });

      if (line.status === "needs_factor") {
        udmDaVerificare += 1;
        return;
      }

      if (line.total === null) {
        prezziMancanti += 1;
        return;
      }

      if (prezzoInfo.valuta === "CHF" || prezzoInfo.valuta === "EUR") {
        totalsByValuta[prezzoInfo.valuta] += line.total;
      } else {
        totaleSenzaValuta += line.total;
      }
    });

    const usedValute = (["CHF", "EUR"] as const).filter(
      (currency) => totalsByValuta[currency] > 0,
    );
    return {
      totalsByValuta,
      totaleSenzaValuta,
      prezziMancanti,
      udmDaVerificare,
      usedValute,
      mixedValute: usedValute.length > 1,
      totaleStimato: totalsByValuta.CHF + totalsByValuta.EUR + totaleSenzaValuta,
    };
  }, [getMaterialNote, materiali, prezzoSourceByMaterialeId]);

  const supplierPreview = useMemo(() => {
    if (!procurementSnapshot || !fornitoreAttivoNome.trim()) {
      return null;
    }

    const normalizedSupplier = normalizeSearchToken(fornitoreAttivoNome);
    const listinoMatches = procurementSnapshot.listino.filter(
      (entry) => normalizeSearchToken(entry.supplierName) === normalizedSupplier,
    );
    const preventiviMatches = procurementSnapshot.preventivi.filter(
      (entry) => normalizeSearchToken(entry.supplierName) === normalizedSupplier,
    );
    const latestListino = [...listinoMatches].sort(
      (left, right) => (right.updatedAtTimestamp ?? 0) - (left.updatedAtTimestamp ?? 0),
    )[0];

    return {
      listinoCount: listinoMatches.length,
      preventiviCount: preventiviMatches.length,
      lastArticle: latestListino?.articoloCanonico ?? null,
      lastUpdated: latestListino?.updatedAtLabel ?? null,
      lastPrice:
        latestListino && typeof latestListino.prezzoAttuale === "number"
          ? `${latestListino.prezzoAttuale.toFixed(2)} ${latestListino.valuta ?? ""}`.trim()
          : null,
    };
  }, [fornitoreAttivoNome, procurementSnapshot]);

  const canSaveOrdine =
    materiali.length > 0 &&
    (Boolean(fornitoreNome) || Boolean(nomeFornitorePersonalizzato.trim()));

  const pricingView = canonicalTab === "listino" ? "listino" : "preventivi";
  const resolvedOrderId = selectedOrderId ?? handoffOrderId;

  const showFabbisogni = activeTab === "Fabbisogni";
  const pageClassName = `mdo-page${showFabbisogni ? " mdo-page--embedded mdo-page--single" : ""}`;
  const cardClassName = `mdo-card${showFabbisogni ? " mdo-card--embedded mdo-card--single" : ""}`;

  return (
    <div className="next-mdo-route">
      <div className={pageClassName}>
        <div className={cardClassName}>
        <header className="mdo-shell-header">
          <div className="mdo-header-left">
            <img
              src="/logo.png"
              className="mdo-logo"
              alt="logo"
              onClick={() => navigate(NEXT_HOME_PATH)}
            />
            <div>
              <p className="mdo-eyebrow">Acquisti</p>
              <h1 className="mdo-header-title">Materiali da ordinare</h1>
            </div>
          </div>

          <div className="mdo-header-right">
            <label className="mdo-search">
              <span>Cerca</span>
              <input
                type="search"
                placeholder="Descrizione o fornitore"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </label>
            <div className="mdo-cta-row">
              <button
                type="button"
                className="mdo-cta-button"
                onClick={() => window.alert(READ_ONLY_PREVENTIVO_MESSAGE)}
              >
                Carica preventivo
              </button>
              <button
                type="button"
                className="mdo-cta-button"
                onClick={() => window.alert(READ_ONLY_PDF_MESSAGE)}
              >
                PDF Fornitori
              </button>
              <button
                type="button"
                className="mdo-cta-button mdo-cta-primary"
                onClick={() => window.alert(READ_ONLY_PDF_MESSAGE)}
              >
                PDF Direzione
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <section className="mdo-placeholder-panel" aria-live="polite">
            <h2>Fornitori</h2>
            <p>{error}</p>
          </section>
        ) : null}

        <div className="mdo-tabs" role="tablist" aria-label="Sezioni acquisti">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={`mdo-tab ${activeTab === tab ? "is-active" : ""}`}
              onClick={() =>
                openCanonicalProcurementView({
                  tab:
                    tab === "Ordini"
                      ? "ordini"
                      : tab === "Arrivi"
                        ? "arrivi"
                        : tab === "Prezzi & Preventivi"
                          ? "preventivi"
                          : "fabbisogni",
                })
              }
            >
              <span>{tab}</span>
            </button>
          ))}
        </div>

        {!showFabbisogni ? (
          <NextProcurementConvergedSection
            snapshot={procurementSnapshot}
            activeTab={activeTab}
            orderId={resolvedOrderId}
            detailBackTab={detailBackTab}
            pricingView={pricingView}
            searchQuery={searchText}
            iaPrefill={iaPrefill}
            procurementError={procurementError}
            procurementLoading={loadingProcurement}
            onGoOrdini={() => openCanonicalProcurementView({ tab: "ordini" })}
            onGoArrivi={() => openCanonicalProcurementView({ tab: "arrivi" })}
            onPricingViewChange={(view) =>
              openCanonicalProcurementView({ tab: view })
            }
            onOpenOrder={(orderId, fromTab) =>
              openCanonicalProcurementView({
                tab: fromTab,
                orderId,
                from: fromTab,
              })
            }
            onCloseOrder={(backTab) =>
              openCanonicalProcurementView({ tab: backTab, from: backTab })
            }
          />
        ) : (
          <section className="mdo-single-card acq-tab-panel--fabbisogni">
            <div className="mdo-single-toolbar om-filters">
              <div className="mdo-single-toolbar-main">
                <div className="mdo-field">
                  <label>Fornitore</label>
                  <select
                    value={fornitoreId}
                    onChange={(event) => handleSelectFornitore(event.target.value)}
                    disabled={loadingFornitori}
                  >
                    <option value="">
                      {loadingFornitori ? "Caricamento..." : "Seleziona"}
                    </option>
                    {fornitori.map((fornitore) => (
                      <option key={fornitore.id} value={fornitore.id}>
                        {fornitore.nome}
                      </option>
                    ))}
                    <option value="nuovo">+ Nuovo fornitore</option>
                  </select>
                </div>

                {isNuovoFornitore ? (
                  <div className="mdo-field">
                    <label>Nome nuovo fornitore</label>
                    <input
                      type="text"
                      value={nomeFornitorePersonalizzato}
                      onChange={(event) =>
                        setNomeFornitorePersonalizzato(event.target.value)
                      }
                    />
                  </div>
                ) : null}

                <label className="mdo-search mdo-search--embedded">
                  <span>Cerca</span>
                  <input
                    type="search"
                    placeholder="Descrizione o fornitore"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                  />
                </label>
              </div>

              <div className="mdo-single-toolbar-side">
                <div className="mdo-kpi-strip">
                  <div className="mdo-kpi">
                    <span>Righe</span>
                    <strong>{materiali.length}</strong>
                  </div>
                  <div className="mdo-kpi">
                    <span>Filtrate</span>
                    <strong>{materialiFiltrati.length}</strong>
                  </div>
                </div>
                <div className="om-entry-detail-ref">
                  <strong>
                    {fornitoreAttivoNome || "Nessun fornitore selezionato"}
                  </strong>
                  <span>
                    {supplierPreview
                      ? `${supplierPreview.listinoCount} voci listino • ${supplierPreview.preventiviCount} preventivi${
                          supplierPreview.lastArticle ? ` • ${supplierPreview.lastArticle}` : ""
                        }${supplierPreview.lastPrice ? ` • ${supplierPreview.lastPrice}` : ""}`
                      : "Seleziona un fornitore per vedere preview e storico prezzi"}
                  </span>
                </div>
                <div className="mdo-cta-row mdo-cta-row--embedded">
                  <button
                    type="button"
                    className="mdo-cta-button"
                    onClick={() => window.alert(READ_ONLY_PREVENTIVO_MESSAGE)}
                  >
                    Carica preventivo
                  </button>
                  <button
                    type="button"
                    className="mdo-cta-button"
                    onClick={() => window.alert(READ_ONLY_PDF_MESSAGE)}
                  >
                    PDF Fornitori
                  </button>
                  <button
                    type="button"
                    className="mdo-cta-button mdo-cta-primary"
                    onClick={() => window.alert(READ_ONLY_PDF_MESSAGE)}
                  >
                    PDF Direzione
                  </button>
                </div>
              </div>
            </div>

            <div className="mdo-table-wrap mdo-table-wrap--single om-list om-leftCard">
              <table className="om-material-table">
                <thead>
                  <tr>
                    <th>Descrizione</th>
                    <th>Q.ta</th>
                    <th>Prezzo</th>
                    <th>Totale</th>
                    <th className="om-material-actions-col">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="mdo-insert-row">
                    <td>
                      <div className="mdo-insert-desc om-entry-desc-wrap">
                        <div className="mdo-item-photo mdo-item-photo--insert">
                          {fotoPreview ? (
                            <img src={fotoPreview} alt="Anteprima materiale" />
                          ) : (
                            <div className="mdo-photo-placeholder small">Foto</div>
                          )}
                        </div>
                        <input
                          className="mdo-table-input"
                          type="text"
                          placeholder="Descrizione articolo"
                          value={descrizione}
                          onChange={(event) => handleDescrizioneChange(event.target.value)}
                          onFocus={() => setShowSuggest(true)}
                          onBlur={handleDescrizioneBlur}
                        />
                        {!fornitoreAttivoId && descrizione.trim() ? (
                          <div className="acq-suggest-empty">
                            Seleziona fornitore per vedere i suggerimenti listino.
                          </div>
                        ) : null}
                        {fornitoreAttivoId && showSuggest && suggestListino.length > 0 ? (
                          <div className="acq-suggest-panel om-suggest openDown">
                            {suggestListino.map((entry) => (
                              <button
                                key={entry.id}
                                type="button"
                                className="acq-suggest-item"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => selectListinoSuggestion(entry)}
                              >
                                <span className="acq-suggest-main">
                                  {entry.articoloCanonico}
                                </span>
                                <span className="acq-suggest-meta">
                                  {entry.codiceArticolo
                                    ? `Codice ${entry.codiceArticolo} - `
                                    : ""}
                                  {typeof entry.prezzoAttuale === "number"
                                    ? `${entry.prezzoAttuale.toFixed(2)} ${entry.valuta ?? ""}/${String(
                                        entry.unita || "",
                                      ).toLowerCase()}`
                                    : "Prezzo non disponibile"}
                                  {entry.fonteNumeroPreventivo
                                    ? ` - N. ${entry.fonteNumeroPreventivo}`
                                    : ""}
                                  {entry.fonteDataPreventivo
                                    ? ` del ${entry.fonteDataPreventivo}`
                                    : ""}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <input
                        className="mdo-table-input mdo-table-input--qty"
                        type="number"
                        placeholder="0"
                        value={quantita}
                        onChange={(event) => setQuantita(event.target.value)}
                      />
                    </td>
                    <td>
                      {selectedListinoVoce?.prezzoAttuale !== null &&
                      selectedListinoVoce?.prezzoAttuale !== undefined
                        ? `${selectedListinoVoce.prezzoAttuale.toFixed(2)} ${selectedListinoVoce.valuta ?? ""}`
                        : "—"}
                    </td>
                    <td>
                      {selectedListinoVoce?.prezzoAttuale !== null &&
                      selectedListinoVoce?.prezzoAttuale !== undefined
                        ? (() => {
                            const preview = computeLineTotal({
                              qty: Number.parseFloat(quantita || "0"),
                              unitPrice: selectedListinoVoce.prezzoAttuale,
                              selectedUom: unita,
                              priceUom: selectedListinoVoce.unita,
                              note: upsertConversionFactorInNote(
                                newMaterialeNota,
                                conversionFactorInput,
                              ),
                            });
                            if (preview.status === "needs_factor" || preview.total === null) {
                              return "—";
                            }
                            return `${preview.total.toFixed(2)} ${selectedListinoVoce.valuta ?? ""}`;
                          })()
                        : "—"}
                    </td>
                    <td>
                      <div className="mdo-row-actions mdo-row-actions--insert">
                        <select
                          className="mdo-table-input"
                          value={normalizeUom(String(unita || "PZ"))}
                          onChange={(event) =>
                            setUnita(
                              normalizeUom(event.target.value).toLowerCase() as UnitaMisura,
                            )
                          }
                        >
                          <option value="PZ">PZ</option>
                          <option value="NR">NR</option>
                          <option value="MT">MT</option>
                          <option value="M">M</option>
                          <option value="KG">KG</option>
                          <option value="LT">LT</option>
                        </select>
                        <label className="mdo-chip-button mdo-chip-upload">
                          Foto
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                        </label>
                        <button
                          type="button"
                          className="mdo-chip-button"
                          onClick={() => {
                            setFotoFile(null);
                            setFotoPreview(null);
                          }}
                        >
                          Pulisci
                        </button>
                        <button
                          type="button"
                          className="mdo-chip-button"
                          onClick={() => setShowEntryDetails((current) => !current)}
                        >
                          {showEntryDetails ? "Meno" : "Dettagli"}
                        </button>
                        <button
                          type="button"
                          className="mdo-add-button"
                          onClick={aggiungiMateriale}
                          disabled={!descrizione.trim() || !quantita.trim() || !fornitoreAttivoNome}
                        >
                          Aggiungi
                        </button>
                      </div>
                    </td>
                  </tr>
                  {showEntryDetails ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="om-entry-details">
                          <div className="om-entry-details-grid">
                            <div className="om-entry-detail-field om-entry-detail-readonly">
                              <span>Prezzo da listino</span>
                              <strong className="om-entry-readonly-value">
                                {selectedListinoVoce?.prezzoAttuale !== null &&
                                selectedListinoVoce?.prezzoAttuale !== undefined
                                  ? selectedListinoVoce.prezzoAttuale.toFixed(2)
                                  : "—"}
                              </strong>
                            </div>
                            <div className="om-entry-detail-field om-entry-detail-readonly">
                              <span>Valuta</span>
                              <strong className="om-entry-readonly-value">
                                {selectedListinoVoce?.valuta ?? "—"}
                              </strong>
                            </div>
                            <label className="om-entry-detail-field om-entry-detail-note">
                              <span>Nota</span>
                              <input
                                className="mdo-table-input"
                                type="text"
                                placeholder="Nota riga (opzionale)"
                                value={newMaterialeNota}
                                onChange={(event) => setNewMaterialeNota(event.target.value)}
                              />
                            </label>
                            {selectedListinoVoce ? (
                              <div className="om-entry-detail-ref">
                                <strong>
                                  {selectedListinoVoce.fonteNumeroPreventivo
                                    ? `N. ${selectedListinoVoce.fonteNumeroPreventivo}`
                                    : "Listino senza documento"}
                                </strong>
                                <span>
                                  {selectedListinoVoce.fonteDataPreventivo
                                    ? `Data ${selectedListinoVoce.fonteDataPreventivo}`
                                    : "Prezzo da listino corrente"}
                                </span>
                              </div>
                            ) : null}
                            {needsConversionFactorInput ? (
                              <label className="om-entry-detail-field">
                                <span>Fattore conversione UDM</span>
                                <input
                                  className="mdo-table-input mdo-table-input--factor"
                                  type="number"
                                  inputMode="decimal"
                                  step="0.01"
                                  min="0"
                                  placeholder="Fattore"
                                  value={conversionFactorInput}
                                  onChange={(event) =>
                                    setConversionFactorInput(event.target.value)
                                  }
                                />
                                {!hasValidConversionFactorInput ? (
                                  <div className="mdo-row-warning">
                                    UDM diverse: totale bloccato finche non inserisci fattore.
                                  </div>
                                ) : null}
                              </label>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}

                  {materialiFiltrati.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="mdo-empty mdo-empty-state mdo-empty-state--table">
                          Nessun materiale inserito.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    materialiFiltrati.map((materiale) => {
                      const prezzoInfo = prezzoSourceByMaterialeId.get(materiale.id);
                      const noteRiga = getMaterialNote(materiale);
                      const line = prezzoInfo
                        ? computeLineTotal({
                            qty: Number(materiale.quantita || 0),
                            unitPrice: prezzoInfo.prezzoUnitario,
                            selectedUom: materiale.unita,
                            priceUom: prezzoInfo.unita,
                            note: noteRiga,
                          })
                        : null;
                      const valuta =
                        prezzoInfo?.valuta === "CHF" || prezzoInfo?.valuta === "EUR"
                          ? prezzoInfo.valuta
                          : prezzoInfo?.valuta ?? "-";
                      const prezzoLabel = prezzoInfo
                        ? `${prezzoInfo.prezzoUnitario.toFixed(2)} ${valuta}`
                        : "—";
                      const totaleLabel =
                        line && line.total !== null && line.status !== "needs_factor"
                          ? `${line.total.toFixed(2)} ${valuta}`
                          : "—";
                      const hasDocumento =
                        Boolean(materiale.pdfUrl) ||
                        Boolean(materiale.imageUrls?.length) ||
                        Boolean(materiale.fotoUrl);

                      return (
                        <tr key={materiale.id} className="om-row">
                          <td>
                            <div className="om-material-desc">
                              <div className="om-material-title">
                                {materiale.descrizione}
                              </div>
                              <div className="om-material-meta">
                                UDM {String(materiale.unita || "PZ").toUpperCase()}
                                {materiale.fotoUrl ? " • Foto" : ""}
                                {noteRiga ? " • Nota presente" : ""}
                                {prezzoInfo?.numeroPreventivo
                                  ? ` • N. ${prezzoInfo.numeroPreventivo}`
                                  : ""}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="om-material-qty">
                              <strong>{materiale.quantita}</strong>
                              <span>{String(materiale.unita || "PZ").toUpperCase()}</span>
                            </div>
                          </td>
                          <td>{prezzoLabel}</td>
                          <td>
                            {totaleLabel}
                            {line?.status === "needs_factor" ? (
                              <span className="om-badge om-badge--warn">
                                UDM da verificare
                              </span>
                            ) : null}
                          </td>
                          <td className="om-material-actions-cell">
                            <div className="mdo-row-actions">
                              <label className="mdo-chip-button mdo-chip-upload">
                                Foto
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (!file) return;
                                    aggiornaFotoMateriale(materiale.id, file);
                                    event.currentTarget.value = "";
                                  }}
                                />
                              </label>
                              {hasDocumento ? (
                                <button
                                  type="button"
                                  className="mdo-chip-button"
                                  onClick={() => openDocumentoMateriale(materiale)}
                                >
                                  Documento
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="mdo-chip-button"
                                onClick={() => {
                                  const nextNote = window.prompt(
                                    "Nota materiale",
                                    noteRiga,
                                  );
                                  if (nextNote === null) return;
                                  const trimmed = nextNote.trim();
                                  setNoteByMaterialeId((current) => {
                                    const next = { ...current };
                                    if (!trimmed) {
                                      delete next[materiale.id];
                                      return next;
                                    }
                                    next[materiale.id] = trimmed;
                                    return next;
                                  });
                                }}
                              >
                                Nota
                              </button>
                              {!prezzoInfo ? (
                                <button
                                  type="button"
                                  className="mdo-chip-button"
                                  onClick={() => openBozzaListinoManuale(materiale)}
                                >
                                  + Listino
                                </button>
                              ) : null}
                              {materiale.fotoUrl ? (
                                <button
                                  type="button"
                                  className="mdo-chip-button"
                                  onClick={() => rimuoviFotoMateriale(materiale.id)}
                                >
                                  Rimuovi foto
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="mdo-delete"
                                onClick={() => eliminaMateriale(materiale.id)}
                                aria-label={`Elimina ${materiale.descrizione}`}
                              >
                                Elimina
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mdo-card-footer-bar om-side om-right om-rightCard">
              <div className="om-side-cards om-kpiGrid">
                <div className="mdo-sticky-info om-stat-card om-kpiCard">
                  <span>Fornitore</span>
                  <strong>{fornitoreAttivoNome || "Non selezionato"}</strong>
                </div>
                <div className="mdo-sticky-info om-stat-card om-kpiCard">
                  <span>Materiali temporanei</span>
                  <strong>{materiali.length}</strong>
                </div>
                <div className="mdo-sticky-info om-stat-card om-kpiCard">
                  <span>Totale stimato</span>
                  <strong>
                    {totalsSummary.mixedValute
                      ? `CHF ${totalsSummary.totalsByValuta.CHF.toFixed(2)} / EUR ${totalsSummary.totalsByValuta.EUR.toFixed(2)}`
                      : totalsSummary.usedValute.length === 1
                        ? `${totalsSummary.usedValute[0]} ${totalsSummary.totalsByValuta[totalsSummary.usedValute[0]].toFixed(2)}`
                        : totalsSummary.totaleSenzaValuta > 0
                          ? `${totalsSummary.totaleStimato.toFixed(2)} -`
                          : "-"}
                  </strong>
                </div>
                <div className="mdo-sticky-info om-stat-card om-kpiCard">
                  <span>Prezzi mancanti</span>
                  <strong>{totalsSummary.prezziMancanti}</strong>
                </div>
                <div className="mdo-sticky-info om-stat-card om-kpiCard">
                  <span>UDM da verificare</span>
                  <strong>{totalsSummary.udmDaVerificare}</strong>
                </div>
              </div>
              <label className="acq-order-note om-order-note om-notes">
                <span>Note ordine (solo bozza/PDF)</span>
                <textarea
                  value={ordineNote}
                  onChange={(event) => setOrdineNote(event.target.value)}
                  placeholder="Inserisci note generali ordine"
                />
              </label>
              <div className="mdo-sticky-actions om-side-actions om-footerActions">
                <button
                  type="button"
                  className="mdo-header-button mdo-header-button--secondary"
                  onClick={clearProcurementDraftState}
                >
                  Pulisci bozza
                </button>
                <button
                  type="button"
                  className="mdo-secondary-button"
                  onClick={() => openCanonicalProcurementView({ tab: "ordini" })}
                >
                  Ordini
                </button>
                <button
                  type="button"
                  className="mdo-secondary-button"
                  onClick={() => openCanonicalProcurementView({ tab: "arrivi" })}
                >
                  Arrivi
                </button>
                <button
                  type="button"
                  className="mdo-secondary-button"
                  onClick={() => openCanonicalProcurementView({ tab: "preventivi" })}
                >
                  Prezzi & Preventivi
                </button>
                <button
                  type="button"
                  className="mdo-header-button"
                  onClick={salvaOrdine}
                  disabled={!canSaveOrdine}
                >
                  CONFERMA ORDINE
                </button>
              </div>
              {totalsSummary.prezziMancanti > 0 || totalsSummary.udmDaVerificare > 0 ? (
                <div className="mdo-footer-warning">
                  Totale parziale:
                  {totalsSummary.prezziMancanti > 0
                    ? ` ${totalsSummary.prezziMancanti} righe senza prezzo.`
                    : ""}
                  {totalsSummary.udmDaVerificare > 0
                    ? ` ${totalsSummary.udmDaVerificare} righe con UDM diverse da verificare.`
                    : ""}
                </div>
              ) : null}
              {draftSavedAt ? (
                <div className="acq-draft-indicator">Bozza salvata</div>
              ) : null}
            </div>
          </section>
        )}
        </div>
      </div>
    </div>
  );
}
