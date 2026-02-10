import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../../firebase";
import type { CisternaAutistaEvent, RifornimentoAutistaRecord } from "../../cisterna/types";
import {
  CISTERNA_REFUEL_TAG,
  CISTERNA_SCHEDE_COLLECTION,
  currentMonthKey,
  getAutistiEventsFor,
  getColleghiNomi,
  getMezziTarghe,
  normalizeAutistiEvents,
  monthLabel,
  RIFORNIMENTI_AUTISTI_KEY,
} from "../../cisterna/collections";
import { callEstrattiSchedaCisternaCells } from "../../cisterna/iaClient";
import "./CisternaSchedeTest.css";

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_");
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

type CropArea = { x: number; y: number; width: number; height: number };

type CalibPoint = { x: number; y: number };
type CalibColumn = [CalibPoint, CalibPoint, CalibPoint, CalibPoint];
type CalibColumns = {
  data?: CalibPoint[];
  targa?: CalibPoint[];
  litri?: CalibPoint[];
};
type CalibrationPayload = {
  version: 1;
  imageHash?: string;
  columns: { data: CalibPoint[]; targa: CalibPoint[]; litri: CalibPoint[] };
};

const DEFAULT_ROW_COUNT = 35;
const CALIB_ORDER = ["data", "targa", "litri"] as const;
const CALIB_STORAGE_KEY = "cisterna_schede_calib_v1";
const AUTISTI_LOOKBACK_DAYS = 45;
const AUTISTI_MATCH_THRESHOLD = 2;

async function getCroppedBlob(imageSrc: string, pixelCrop: CropArea): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Impossibile creare il canvas per il ritaglio.");
  }
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Impossibile creare il ritaglio."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.92
    );
  });
}

function toNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function toStringValue(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function toDateFromUnknown(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (typeof value === "number") {
    const ms = value > 1_000_000_000_000 ? value : value * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "string") {
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return direct;
  }

  if (typeof value === "object" && value !== null) {
    const maybeTs = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };
    if (typeof maybeTs.toDate === "function") {
      const d = maybeTs.toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof maybeTs.seconds === "number") {
      const d = new Date(maybeTs.seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof maybeTs._seconds === "number") {
      const d = new Date(maybeTs._seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  return null;
}

function validateRows(
  rows: RowLike[],
  options?: {
    isTargaKnown?: (targa: string) => boolean;
    isAziendaConfirmed?: (row: RowLike, isTargaKnown: boolean) => boolean;
  }
) {
  const invalidRowIndexes: number[] = [];
  const reasonsByRow: Record<number, string[]> = {};
  const isTargaKnown = options?.isTargaKnown;
  const isAziendaConfirmed = options?.isAziendaConfirmed;

  rows.forEach((row, index) => {
    const dataValue = String(row.data ?? "").trim();
    const targaValue = String(row.targa ?? "").trim();
    const nomeValue = String(row.nome ?? "").trim();
    const litriText =
      row.litri == null
        ? ""
        : typeof row.litri === "string"
        ? row.litri.trim()
        : String(row.litri);
    const hasAny = Boolean(dataValue || targaValue || nomeValue || litriText);
    if (!hasAny) return;

    const reasons: string[] = [];
    if (!dataValue) {
      reasons.push("Data mancante");
    } else if (!isValidDate(dataValue)) {
      reasons.push("Data non valida");
    }

    if (!targaValue) {
      reasons.push("Targa mancante");
    }

    const litriValue = parseLitri(litriText);
    if (!litriText) {
      reasons.push("Litri mancanti");
    } else if (litriValue == null || litriValue <= 0) {
      reasons.push("Litri non validi");
    }

    if (isTargaKnown && isAziendaConfirmed && targaValue) {
      const targaKnown = isTargaKnown(targaValue);
      if (!targaKnown && !isAziendaConfirmed(row, targaKnown)) {
        reasons.push("Azienda obbligatoria per targa non in elenco");
      }
    }

    if (reasons.length > 0) {
      invalidRowIndexes.push(index);
      reasonsByRow[index] = reasons;
    }
  });

  return { invalidRowIndexes, reasonsByRow };
}

function buildValidationMessage(
  invalidRowIndexes: number[],
  reasonsByRow: Record<number, string[]>
): string {
  if (invalidRowIndexes.length === 0) return "";
  const rowsLabel = invalidRowIndexes.map((idx) => idx + 1).join(", ");
  const allReasons = new Set<string>();
  invalidRowIndexes.forEach((idx) => {
    (reasonsByRow[idx] || []).forEach((reason) => allReasons.add(reason));
  });
  const missing: string[] = [];
  if (allReasons.has("Data mancante")) missing.push("Data");
  if (allReasons.has("Targa mancante")) missing.push("Targa");
  if (allReasons.has("Litri mancanti")) missing.push("Litri");
  const invalid: string[] = [];
  if (allReasons.has("Data non valida")) invalid.push("Data");
  if (allReasons.has("Litri non validi")) invalid.push("Litri");
  const needsAzienda = allReasons.has("Azienda obbligatoria per targa non in elenco");

  let message = `Errore: controlla le righe ${rowsLabel}.`;
  if (missing.length > 0) {
    message += ` Mancano ${missing.join("/")}.`;
  }
  if (invalid.length > 0) {
    message += ` Valori non validi: ${invalid.join("/")}.`;
  }
  if (needsAzienda) {
    message += " Se la targa non e in elenco, seleziona l'azienda.";
  }
  return message;
}

function sanitizeForFirestore<T>(value: T, inArray = false): T {
  if (value === undefined) {
    return (inArray ? null : undefined) as T;
  }
  if (value === null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item, true)) as T;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    Object.entries(obj).forEach(([key, val]) => {
      const cleaned = sanitizeForFirestore(val, false);
      if (cleaned !== undefined) {
        next[key] = cleaned;
      }
    });
    return next as T;
  }
  return value;
}

function formatLitri(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "-";
  const rounded = Math.round(value * 100) / 100;
  const text = rounded.toFixed(2);
  return text.replace(/\.?0+$/, "");
}

function normalizeStatus(value: unknown, rawValue: string): "OK" | "INCERTO" | "VUOTO" {
  const normalized = String(value || "").toUpperCase().trim();
  if (normalized === "OK" || normalized === "INCERTO" || normalized === "VUOTO") {
    return normalized as "OK" | "INCERTO" | "VUOTO";
  }
  const raw = rawValue.trim();
  if (!raw) return "VUOTO";
  if (raw.toUpperCase() === "INCERTO") return "INCERTO";
  return "OK";
}

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpPoint(a: CalibPoint, b: CalibPoint, t: number): CalibPoint {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function distance(a: CalibPoint, b: CalibPoint) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function denormalizePoint(point: CalibPoint, width: number, height: number): CalibPoint {
  return { x: point.x * width, y: point.y * height };
}

function isColumnComplete(points?: CalibPoint[]): points is CalibColumn {
  return Array.isArray(points) && points.length === 4;
}

function getRowQuad(
  columnPoints: CalibColumn,
  rowIndex: number,
  rowCount: number
): CalibColumn {
  const [tl, tr, br, bl] = columnPoints;
  const t0 = rowIndex / rowCount;
  const t1 = (rowIndex + 1) / rowCount;
  const leftTop = lerpPoint(tl, bl, t0);
  const rightTop = lerpPoint(tr, br, t0);
  const leftBottom = lerpPoint(tl, bl, t1);
  const rightBottom = lerpPoint(tr, br, t1);
  return [leftTop, rightTop, rightBottom, leftBottom];
}

function getColumnBounds(points: CalibPoint[]) {
  const xs = points.map((p) => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  return { x1: minX, x2: maxX };
}

function warpQuadToRect(
  img: HTMLImageElement,
  quad: CalibColumn,
  outWidth: number,
  outHeight: number,
  sliceCount = 20
): string {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(outWidth));
  canvas.height = Math.max(1, Math.round(outHeight));
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const slices = Math.max(6, Math.min(30, Math.round(sliceCount)));
  const maxW = img.naturalWidth || img.width;
  const maxH = img.naturalHeight || img.height;
  for (let i = 0; i < slices; i += 1) {
    const t0 = i / slices;
    const t1 = (i + 1) / slices;
    const topLeft = lerpPoint(quad[0], quad[3], t0);
    const topRight = lerpPoint(quad[1], quad[2], t0);
    const bottomLeft = lerpPoint(quad[0], quad[3], t1);
    const bottomRight = lerpPoint(quad[1], quad[2], t1);

    const srcXRaw = Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
    const srcYRaw = Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
    const srcMaxX = Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
    const srcMaxY = Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
    const srcX = clampValue(srcXRaw, 0, Math.max(0, maxW - 1));
    const srcY = clampValue(srcYRaw, 0, Math.max(0, maxH - 1));
    const srcW = clampValue(srcMaxX - srcX, 1, Math.max(1, maxW - srcX));
    const srcH = clampValue(srcMaxY - srcY, 1, Math.max(1, maxH - srcY));

    const destY = Math.round((i / slices) * canvas.height);
    const destH = Math.max(1, Math.round(canvas.height / slices));

    ctx.drawImage(
      img,
      srcX,
      srcY,
      srcW,
      srcH,
      0,
      destY,
      canvas.width,
      destH
    );
  }

  return canvas.toDataURL("image/jpeg", 0.82);
}

async function buildStripImage(images: string[]): Promise<string> {
  if (images.some((src) => !src)) return "";
  const loaded = await Promise.all(images.map((src) => createImage(src)));
  const height = Math.max(...loaded.map((img) => img.height));
  const scaledWidths = loaded.map((img) =>
    img.height > 0 ? (img.width * height) / img.height : img.width
  );
  const width = scaledWidths.reduce((acc, value) => acc + value, 0);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  let offsetX = 0;
  loaded.forEach((img, index) => {
    const drawWidth = Math.max(1, Math.round(scaledWidths[index]));
    ctx.drawImage(img, offsetX, 0, drawWidth, canvas.height);
    offsetX += drawWidth;
  });
  return canvas.toDataURL("image/jpeg", 0.82);
}

type RowStatus = "OK" | "INCERTO" | "VUOTO";

type ManualRow = {
  id: string;
  data: string;
  targa: string;
  nome: string;
  litri: string;
  azienda: "cementi" | "import";
  aziendaConfirmed: boolean;
};

type IaEditableRow = {
  id: string;
  data: string;
  targa: string;
  litri: string;
  note: string;
  dataStatus: RowStatus;
  targaStatus: RowStatus;
  litriStatus: RowStatus;
  verified: boolean;
};

type ManualAutistiMatch = {
  events: CisternaAutistaEvent[];
  total: number;
  diff: number | null;
  status: "missing" | "none" | "match" | "diff";
};

type AutosuggestInputProps = {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  ariaLabel?: string;
};

type PendingSave = {
  mode: "manual" | "ia";
  rows: Array<{
    data: string;
    targa: string;
    litri: number | null;
    nome?: string;
    azienda?: "cementi" | "import";
    statoRevisione: "verificato" | "da_verificare";
  }>;
  rowCount: number;
  needsReview: boolean;
  meta?: Record<string, unknown>;
};

type StoredSchedaRow = {
  data?: string | null;
  targa?: string | null;
  litri?: number | string | null;
  nome?: string | null;
  azienda?: string | null;
  statoRevisione?: "verificato" | "da_verificare" | string | null;
  data_status?: string | null;
  targa_status?: string | null;
  litri_status?: string | null;
  note?: string | null;
};

type StoredSchedaDoc = {
  source?: "manual" | "ia" | string | null;
  fonte?: string | null;
  rows?: StoredSchedaRow[] | null;
  rowCount?: number | null;
  needsReview?: boolean;
  mese?: string | null;
  yearMonth?: string | null;
  createdAt?: unknown;
  fileUrl?: string | null;
  nomeFile?: string | null;
};

type RowLike = {
  data?: string | null;
  targa?: string | null;
  litri?: string | number | null;
  nome?: string | null;
  azienda?: string | null;
  aziendaConfirmed?: boolean;
};

const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;
const MAX_SUGGESTIONS = 8;
const AZIENDE_OPTIONS = [
  { value: "cementi", label: "GHIELMICEMENTI" },
  { value: "import", label: "GHIELMIIMPORT" },
] as const;
type AziendaOption = (typeof AZIENDE_OPTIONS)[number]["value"];

function normalizeAzienda(value: unknown): AziendaOption {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw === "import" || raw === "ghielmiimport" || raw === "ghielmimport"
    ? "import"
    : "cementi";
}

function makeRowId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyManualRow(): ManualRow {
  return {
    id: makeRowId(),
    data: "",
    targa: "",
    nome: "",
    litri: "",
    azienda: "cementi",
    aziendaConfirmed: false,
  };
}

function makeInitialRows(count: number, seedDate = ""): ManualRow[] {
  return Array.from({ length: count }, () => ({
    id: makeRowId(),
    data: seedDate,
    targa: "",
    nome: "",
    litri: "",
    azienda: "cementi",
    aziendaConfirmed: false,
  }));
}

function isValidYearMonth(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return false;
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

function buildRecentMonths(count: number, base = new Date()): string[] {
  const items: string[] = [];
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  for (let i = 0; i < count; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth() - i, 1);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    items.push(`${d.getFullYear()}-${month}`);
  }
  return items;
}

function isValidDate(value: string): boolean {
  return DATE_REGEX.test(value.trim());
}

function formatDateDmYyyy(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function normalizeDateInput(value: string): string {
  const cleaned = String(value ?? "").replace(/[^\d/]/g, "");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 8 && !cleaned.includes("/")) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
  return cleaned;
}

function parseLitri(value: string): number | null {
  if (!value) return null;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

function normalizeQuery(value: string): string {
  return String(value || "").trim().toLowerCase();
}

function buildMatches(query: string, suggestions: string[]): string[] {
  const q = normalizeQuery(query);
  if (!q) return [];
  const starts: string[] = [];
  const contains: string[] = [];
  suggestions.forEach((item) => {
    const raw = String(item || "");
    const candidate = raw.trim();
    if (!candidate) return;
    const hay = candidate.toLowerCase();
    if (hay.startsWith(q)) {
      starts.push(candidate);
    } else if (hay.includes(q)) {
      contains.push(candidate);
    }
  });
  const merged = [...starts, ...contains];
  const unique: string[] = [];
  const seen = new Set<string>();
  merged.forEach((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(item);
  });
  return unique.slice(0, MAX_SUGGESTIONS);
}

function AutosuggestInput({
  value,
  onChange,
  suggestions,
  placeholder,
  disabled,
  className,
  inputRef,
  onKeyDown,
  ariaLabel,
}: AutosuggestInputProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [portalStyle, setPortalStyle] = useState<CSSProperties | null>(null);
  const matches = useMemo(
    () => buildMatches(value, suggestions),
    [value, suggestions]
  );

  useEffect(() => {
    if (normalizeQuery(value).length >= 1 && matches.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
    setHighlight(-1);
  }, [value, matches.length]);

  const commitValue = (next: string) => {
    onChange(next);
    setOpen(false);
    setHighlight(-1);
  };

  const lastPortalKeyRef = useRef<string>("");
  const updatePortalPosition = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const key = [
      Math.round(rect.left),
      Math.round(rect.top),
      Math.round(rect.width),
      Math.round(rect.height),
    ].join("|");
    if (key === lastPortalKeyRef.current) return;
    lastPortalKeyRef.current = key;
    setPortalStyle({
      position: "fixed",
      left: rect.left,
      top: rect.bottom + 4,
      width: rect.width,
      zIndex: 100000,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleScroll = () => updatePortalPosition();
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open, updatePortalPosition]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const inWrapper = wrapperRef.current?.contains(target);
      const inList = listRef.current?.contains(target);
      if (!inWrapper && !inList) {
        setOpen(false);
        setHighlight(-1);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (open && matches.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlight((prev) => Math.min(prev + 1, matches.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlight((prev) => Math.max(prev - 1, 0));
      } else if (event.key === "Enter") {
        if (highlight >= 0 && highlight < matches.length) {
          event.preventDefault();
          commitValue(matches[highlight]);
        }
      } else if (event.key === "Escape") {
        setOpen(false);
        setHighlight(-1);
      }
    }
    onKeyDown?.(event);
  };

  return (
    <div className="cisterna-suggest" ref={wrapperRef}>
      <input
        ref={inputRef}
        className={className}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => {
          if (matches.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        autoComplete="off"
      />
      {open && matches.length > 0 && portalStyle
        ? createPortal(
            <div
              className="cisterna-suggest-portal"
              style={portalStyle}
              role="listbox"
              ref={listRef}
            >
              {matches.map((item, index) => (
                <button
                  key={`${item}-${index}`}
                  type="button"
                  className={`cisterna-suggest-item ${
                    index === highlight ? "active" : ""
                  }`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    commitValue(item);
                  }}
                  role="option"
                  aria-selected={index === highlight}
                >
                  {item}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

export default function CisternaSchedeTest() {
  const navigate = useNavigate();
  const location = useLocation();
  const editDocId = useMemo(() => {
    const param = new URLSearchParams(location.search).get("edit");
    return param ? param.trim() : "";
  }, [location.search]);
  const monthParam = useMemo(() => {
    const param = new URLSearchParams(location.search).get("month");
    return param ? param.trim() : "";
  }, [location.search]);
  const isEditMode = Boolean(editDocId);
  const initialYearMonth = useMemo(() => {
    if (monthParam && isValidYearMonth(monthParam)) return monthParam;
    return currentMonthKey();
  }, [monthParam]);
  const [mode, setMode] = useState<"manual" | "ia">("manual");
  const [manualRows, setManualRows] = useState<ManualRow[]>(() =>
    makeInitialRows(20)
  );
  const [manualError, setManualError] = useState<string>("");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualSavedId, setManualSavedId] = useState<string>("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string>("");
  const [editMonthLabel, setEditMonthLabel] = useState<string>("");
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>(initialYearMonth);
  const [targaSuggestions, setTargaSuggestions] = useState<string[]>([]);
  const [nomeSuggestions, setNomeSuggestions] = useState<string[]>([]);
  const [suggestionsError, setSuggestionsError] = useState<string>("");
  const [autistiEvents, setAutistiEvents] = useState<CisternaAutistaEvent[]>([]);
  const [autistiError, setAutistiError] = useState<string>("");
  const [autistiLoading, setAutistiLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [autistiExpanded, setAutistiExpanded] = useState<Record<string, boolean>>(
    {}
  );
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);
  const dataInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);
  const manualSeededRef = useRef(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [iaRows, setIaRows] = useState<IaEditableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [inputKey, setInputKey] = useState<number>(Date.now());
  const [zoom, setZoom] = useState(1);
  const [cropSaving, setCropSaving] = useState(false);
  const [cropError, setCropError] = useState<string>("");
  const cropContainerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    mode: "move" | "nw" | "ne" | "sw" | "se";
    startX: number;
    startY: number;
    startRect: { x: number; y: number; w: number; h: number };
  } | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(
    null
  );
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(
    null
  );
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null
  );
  const [cellThumbs, setCellThumbs] = useState<
    Array<{ dataImg?: string; targaImg?: string; litriImg?: string; stripImg?: string }>
  >([]);
  const [activeCell, setActiveCell] = useState<{ src: string; label: string } | null>(
    null
  );
  const [calibMode, setCalibMode] = useState<"none" | "perspective">("none");
  const [calibStep, setCalibStep] = useState(0);
  const [calibDraft, setCalibDraft] = useState<CalibColumns>({});
  const [calibration, setCalibration] = useState<CalibrationPayload | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [rowCountInput, setRowCountInput] = useState(DEFAULT_ROW_COUNT);
  const calibRef = useRef<HTMLDivElement | null>(null);

  type RawRow = {
    data?: string | null;
    targa?: string | null;
    litri?: unknown;
    data_raw?: string | null;
    targa_raw?: string | null;
    litri_raw?: string | number | null;
    data_status?: string | null;
    targa_status?: string | null;
    litri_status?: string | null;
    flags?: string[];
    issues?: string[];
    note?: string | null;
    needsReview?: boolean;
    [key: string]: unknown;
  };

  const d = (results ?? {}) as any;
  const isSuccess = d.ok === true || d.success === true;
  const rawLines = Array.isArray(d.rawLines)
    ? d.rawLines
    : Array.isArray(d.raw_lines)
    ? d.raw_lines
    : Array.isArray(d.tsv_lines)
    ? d.tsv_lines
    : [];
  const hasRowsArray = Array.isArray(d.rows);
  const structuredRows: RawRow[] = useMemo(() => {
    if (Array.isArray(d.rows)) {
      return d.rows as RawRow[];
    }
    return [];
  }, [d.rows]);

  const rowsExtracted = d.rowsExtracted ?? iaRows.length ?? 0;
  const rowsProblematic = iaRows.filter(
    (row) =>
      row.dataStatus !== "OK" || row.targaStatus !== "OK" || row.litriStatus !== "OK"
  ).length;
  const rowsUnverified = iaRows.filter((row) => !row.verified).length;
  const needsReview =
    (d.needsReview ?? false) || rowsProblematic > 0 || rowsUnverified > 0;
  const notes = d.notes ?? "";
  const hasStructuredTable = hasRowsArray;
  const pageTitle = isEditMode
    ? editMonthLabel
      ? `Modifica scheda (${editMonthLabel})`
      : "Modifica scheda"
    : "Schede Carburante (Cisterna Caravate)";
  const canSaveIa = Boolean(
    results && isSuccess && hasRowsArray && (isEditMode || fileUrl)
  );
  const displayColumns: CalibColumns =
    calibMode === "perspective" ? calibDraft : calibration?.columns ?? {};
  const currentCalibKey = CALIB_ORDER[calibStep];
  const targaLookup = useMemo(() => {
    return new Set(targaSuggestions.map((value) => String(value).trim().toUpperCase()));
  }, [targaSuggestions]);
  const nomeLookup = useMemo(() => {
    return new Set(nomeSuggestions.map((value) => normalizeQuery(value)));
  }, [nomeSuggestions]);
  const monthOptions = useMemo(() => {
    const list = buildRecentMonths(24);
    if (selectedYearMonth && !list.includes(selectedYearMonth)) {
      list.unshift(selectedYearMonth);
    }
    return list;
  }, [selectedYearMonth]);

  const handleYearMonthChange = (nextValue: string) => {
    if (!isValidYearMonth(nextValue) || nextValue === selectedYearMonth) {
      return;
    }
    if (isEditMode) {
      const ok = window.confirm("Stai cambiando mese della scheda. Vuoi continuare?");
      if (!ok) return;
    }
    setSelectedYearMonth(nextValue);
    if (isEditMode) {
      setEditMonthLabel(monthLabel(nextValue));
    }
  };

  const isTargaKnown = (value: string) => {
    const v = String(value || "").trim().toUpperCase();
    if (!v) return false;
    if (targaLookup.size === 0) return true;
    return targaLookup.has(v);
  };

  const isNomeKnown = (value: string) => {
    const v = normalizeQuery(value);
    if (!v) return false;
    if (nomeLookup.size === 0) return true;
    return nomeLookup.has(v);
  };

  const calcStatusForField = (value: string, kind: "data" | "targa" | "litri") => {
    const raw = String(value || "").trim();
    if (!raw) return "VUOTO" as RowStatus;
    if (kind === "data") {
      return isValidDate(raw) ? ("OK" as RowStatus) : ("INCERTO" as RowStatus);
    }
    if (kind === "litri") {
      const n = parseLitri(raw);
      return n && n > 0 ? ("OK" as RowStatus) : ("INCERTO" as RowStatus);
    }
    if (kind === "targa") {
      return isTargaKnown(raw) ? ("OK" as RowStatus) : ("INCERTO" as RowStatus);
    }
    return "OK" as RowStatus;
  };

  const addManualRow = (seed?: Partial<ManualRow>) => {
    const lastRow = manualRows[manualRows.length - 1];
    const lastDateRaw = String(lastRow?.data ?? "").trim();
    const lastDate = isValidDate(lastDateRaw) ? lastDateRaw : "";
    const next: ManualRow = {
      id: makeRowId(),
      data: seed?.data ?? lastDate,
      targa: "",
      nome: "",
      litri: "",
      azienda: "cementi",
      aziendaConfirmed: false,
      ...seed,
    };
    setManualRows((prev) => [...prev, next]);
    setManualSavedId("");
    setManualError("");
    setPendingFocusId(next.id);
  };

  const updateManualRow = (id: string, patch: Partial<ManualRow>) => {
    setManualRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
    setManualSavedId("");
    setManualError("");
  };

  const handleManualDateChange = (id: string, value: string) => {
    updateManualRow(id, { data: normalizeDateInput(value) });
  };

  const handleManualTargaChange = (row: ManualRow, value: string) => {
    const known = isTargaKnown(value);
    updateManualRow(row.id, {
      targa: value,
      aziendaConfirmed: known ? row.aziendaConfirmed : false,
    });
  };

  const duplicateManualRow = (index: number) => {
    const base = manualRows[index];
    if (!base) return;
    addManualRow({
      data: base.data,
      nome: base.nome,
      targa: base.targa,
      litri: base.litri,
      azienda: base.azienda,
      aziendaConfirmed: base.aziendaConfirmed,
    });
  };

  const removeManualRow = (id: string) => {
    setManualRows((prev) => {
      const next = prev.filter((row) => row.id !== id);
      if (next.length === 0) {
        return [createEmptyManualRow()];
      }
      return next;
    });
    setManualSavedId("");
    setManualError("");
  };

  const isManualRowEmpty = (row: ManualRow) => {
    return !row.data.trim() && !row.targa.trim() && !row.nome.trim() && !row.litri.trim();
  };

  const manualRowsForSave = useMemo(() => {
    return manualRows.filter((row) => !isManualRowEmpty(row));
  }, [manualRows]);

  const manualValidation = useMemo(
    () =>
      validateRows(manualRows, {
        isTargaKnown,
        isAziendaConfirmed: (row, isKnown) =>
          isKnown ? true : Boolean(row.aziendaConfirmed),
      }),
    [manualRows, targaLookup]
  );
  const iaValidation = useMemo(() => validateRows(iaRows), [iaRows]);

  const manualRowValidity = useMemo(() => {
    return manualRows.map((row) => {
      const isEmpty = isManualRowEmpty(row);
      const dataValid = isEmpty ? true : isValidDate(row.data);
      const litriValue = parseLitri(row.litri);
      const litriValid = isEmpty ? true : litriValue !== null && litriValue > 0;
      const targaMismatch =
        !isEmpty && Boolean(row.targa.trim()) && !isTargaKnown(row.targa);
      const nomeMismatch =
        !isEmpty && Boolean(row.nome.trim()) && !isNomeKnown(row.nome);
      const aziendaMissingForUnknown = !isEmpty && targaMismatch && !row.aziendaConfirmed;
      return {
        id: row.id,
        dataValid,
        litriValid,
        targaMismatch,
        nomeMismatch,
        aziendaMissingForUnknown,
      };
    });
  }, [manualRows, targaLookup, nomeLookup]);

  const manualInvalidCount = manualValidation.invalidRowIndexes.length;

  const manualAutistiMatches: ManualAutistiMatch[] = useMemo(() => {
    return manualRows.map((row) => {
      const dateKey = isValidDate(row.data) ? row.data.trim() : "";
      const targaKey = row.targa.trim();
      if (!dateKey || !targaKey) {
        return { events: [], total: 0, diff: null, status: "missing" };
      }
      const events = getAutistiEventsFor(autistiEvents, dateKey, targaKey);
      if (events.length === 0) {
        return { events: [], total: 0, diff: null, status: "none" };
      }
      const total = events.reduce(
        (sum, event) => sum + (event.litri ?? 0),
        0
      );
      const litriValue = parseLitri(row.litri);
      const diff =
        litriValue !== null
          ? Number((litriValue - total).toFixed(2))
          : null;
      if (litriValue === null) {
        return { events, total, diff, status: "diff" };
      }
      const status =
        Math.abs(diff || 0) <= AUTISTI_MATCH_THRESHOLD ? "match" : "diff";
      return { events, total, diff, status };
    });
  }, [manualRows, autistiEvents]);

  const toggleAutistiExpanded = (rowId: string) => {
    setAutistiExpanded((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  useEffect(() => {
    if (!editDocId) {
      setEditError("");
      setEditLoading(false);
      setEditMonthLabel("");
      return;
    }
    let cancelled = false;
    const loadEditDoc = async () => {
      setEditLoading(true);
      setEditError("");
      try {
        const snap = await getDoc(
          doc(db, CISTERNA_SCHEDE_COLLECTION, editDocId)
        );
        if (!snap.exists()) {
          throw new Error("Scheda non trovata.");
        }
        const data = snap.data() as StoredSchedaDoc;
        const rows = Array.isArray(data?.rows) ? data.rows : null;
        if (!rows) {
          throw new Error("Scheda non compatibile.");
        }
        const sourceRaw = String(data.source ?? data.fonte ?? "").toLowerCase();
        const nextMode = sourceRaw === "ia" ? "ia" : "manual";
        const yearMonthKey = String(data.yearMonth ?? data.mese ?? "").trim();
        const normalizedYearMonth = isValidYearMonth(yearMonthKey) ? yearMonthKey : "";
        const monthLabelText = normalizedYearMonth
          ? monthLabel(normalizedYearMonth)
          : (() => {
              const created = toDateFromUnknown(data.createdAt);
              return created
                ? created.toLocaleDateString("it-CH", {
                    month: "long",
                    year: "numeric",
                  })
                : "";
            })();
        if (cancelled) return;
        setEditMonthLabel(monthLabelText);
        setSelectedYearMonth(normalizedYearMonth || initialYearMonth);
        setMode(nextMode);
        setManualError("");
        setError("");
        setManualSavedId("");
        setSavedId("");
        setPendingSave(null);
        if (nextMode === "manual") {
          const mapped = rows.map((row) => ({
            id: makeRowId(),
            data: String(row.data ?? "").trim(),
            targa: String(row.targa ?? "").trim(),
            nome: String(row.nome ?? "").trim(),
            litri: row.litri == null ? "" : String(row.litri),
            azienda: normalizeAzienda(row.azienda),
            aziendaConfirmed: true,
          }));
          setResults(null);
          setIaRows([]);
          setManualRows(mapped.length > 0 ? mapped : [createEmptyManualRow()]);
        } else {
          const mappedRows = rows.map((row) => ({
            data: row.data ?? "",
            targa: row.targa ?? "",
            litri: row.litri ?? "",
            data_status: row.data_status ?? null,
            targa_status: row.targa_status ?? null,
            litri_status: row.litri_status ?? null,
            note: row.note ?? null,
          }));
          setManualRows([createEmptyManualRow()]);
          setResults({ ok: true, rows: mappedRows, needsReview: data.needsReview });
        }
      } catch (err: any) {
        if (!cancelled) {
          setEditError(err?.message || "Errore caricamento scheda.");
        }
      } finally {
        if (!cancelled) setEditLoading(false);
      }
    };
    void loadEditDoc();
    return () => {
      cancelled = true;
    };
  }, [editDocId, initialYearMonth]);

  useEffect(() => {
    if (isEditMode) return;
    setSelectedYearMonth(initialYearMonth);
  }, [initialYearMonth, isEditMode]);

  useEffect(() => {
    const raw = localStorage.getItem(CALIB_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as CalibrationPayload;
      if (
        parsed?.columns?.data?.length === 4 &&
        parsed?.columns?.targa?.length === 4 &&
        parsed?.columns?.litri?.length === 4
      ) {
        setCalibration(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!pendingFocusId) return;
    const el = dataInputRefs.current[pendingFocusId];
    if (el) {
      el.focus();
    }
    setPendingFocusId(null);
  }, [pendingFocusId]);

  useEffect(() => {
    let cancelled = false;
    const loadHistorySuggestions = async () => {
      const q = query(
        collection(db, CISTERNA_SCHEDE_COLLECTION),
        orderBy("createdAt", "desc"),
        limit(300)
      );
      const snap = await getDocs(q);
      const targaMap = new Map<string, string>();
      const nomeMap = new Map<string, string>();
      const pushUnique = (map: Map<string, string>, raw: unknown) => {
        const text = String(raw ?? "").trim();
        if (!text) return;
        const key = text.toLowerCase();
        if (!map.has(key)) map.set(key, text);
      };
      snap.forEach((docSnap) => {
        const data = docSnap.data() as { rows?: unknown[] } | undefined;
        const rows = Array.isArray(data?.rows) ? data?.rows ?? [] : [];
        rows.forEach((row: any) => {
          const targaRaw =
            row?.targa ??
            row?.targa_raw ??
            row?.macchina ??
            row?.macchina_raw ??
            row?.macchinaTarga ??
            "";
          pushUnique(targaMap, targaRaw);
          pushUnique(nomeMap, row?.nome);
        });
      });
      return {
        targhe: Array.from(targaMap.values()).sort((a, b) => a.localeCompare(b)),
        nomi: Array.from(nomeMap.values()).sort((a, b) => a.localeCompare(b)),
      };
    };

    const loadSuggestions = async () => {
      let targhe: string[] = [];
      let nomi: string[] = [];
      let errorMessage = "";

      try {
        const [mezzi, colleghi] = await Promise.all([
          getMezziTarghe(),
          getColleghiNomi(),
        ]);
        targhe = mezzi;
        nomi = colleghi;
      } catch (err: any) {
        errorMessage =
          err?.message || "Errore caricamento suggerimenti da mezzi/colleghi.";
      }

      if (targhe.length === 0 || nomi.length === 0) {
        try {
          const history = await loadHistorySuggestions();
          if (targhe.length === 0) targhe = history.targhe;
          if (nomi.length === 0) nomi = history.nomi;
        } catch (err: any) {
          if (!errorMessage) {
            errorMessage =
              err?.message || "Errore caricamento suggerimenti da storico.";
          }
        }
      }

      if (!cancelled) {
        setTargaSuggestions(targhe);
        setNomeSuggestions(nomi);
        setSuggestionsError(targhe.length === 0 && nomi.length === 0 ? errorMessage : "");
      }
    };
    void loadSuggestions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadAutistiEvents = async () => {
      setAutistiLoading(true);
      try {
        const ref = doc(db, "storage", RIFORNIMENTI_AUTISTI_KEY);
        const snap = await getDoc(ref);
        const raw = snap.exists() ? snap.data() : {};
        const value = Array.isArray(raw?.value)
          ? raw.value
          : Array.isArray(raw)
          ? raw
          : [];
        const normalized = normalizeAutistiEvents(value as any[]);
        const cutoffMs =
          Date.now() - AUTISTI_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
        const filtered = normalized.filter(
          (event) => !event.timestamp || event.timestamp >= cutoffMs
        );
        if (!cancelled) {
          setAutistiEvents(filtered);
          setAutistiError("");
        }
      } catch (err: any) {
        if (!cancelled) {
          setAutistiError(
            err?.message || "Errore caricamento rifornimenti autisti."
          );
        }
      } finally {
        if (!cancelled) setAutistiLoading(false);
      }
    };
    void loadAutistiEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!results || !Array.isArray(d.rows)) {
      setIaRows([]);
      return;
    }
    const nextRows = structuredRows.map((row, index) => {
      const dataRaw = toStringValue(row.data_raw ?? row.data ?? "");
      const targaRaw = toStringValue(row.targa_raw ?? row.targa ?? "");
      const litriRaw = toStringValue(row.litri_raw ?? row.litri ?? "");

      const dataStatus = normalizeStatus(row.data_status, dataRaw);
      const targaStatus = normalizeStatus(row.targa_status, targaRaw);
      const litriStatus = normalizeStatus(row.litri_status, litriRaw);

      const noteFlags = new Set<string>();
      if (Array.isArray(row.flags)) {
        row.flags.forEach((flag) => {
          if (flag) noteFlags.add(String(flag));
        });
      }
      if (Array.isArray(row.issues)) {
        row.issues.forEach((issue) => {
          if (issue) noteFlags.add(String(issue));
        });
      }

      const noteParts = [toStringValue(row.note ?? ""), ...Array.from(noteFlags)].filter(
        Boolean
      );
      const note = noteParts.join(" | ");
      const shouldVerify =
        dataStatus === "OK" && targaStatus === "OK" && litriStatus === "OK";

      return {
        id: `${index}-${makeRowId()}`,
        data: dataRaw,
        targa: targaRaw,
        litri: litriRaw,
        note,
        dataStatus,
        targaStatus,
        litriStatus,
        verified: shouldVerify,
      };
    });
    setIaRows(nextRows);
  }, [results, structuredRows]);

  useEffect(() => {
    if (!preview) {
      setImageSize(null);
      setCropRect(null);
      return;
    }
    let cancelled = false;
    createImage(preview)
      .then((img) => {
        if (cancelled) return;
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      })
      .catch(() => {
        if (!cancelled) setImageSize(null);
      });
    return () => {
      cancelled = true;
    };
  }, [preview]);

  useEffect(() => {
    setCellThumbs([]);
  }, [croppedPreview]);

  useEffect(() => {
    const el = cropContainerRef.current;
    if (!el) return;
    const update = () => {
      setContainerSize({ width: el.clientWidth, height: el.clientHeight });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [preview]);

  useEffect(() => {
    if (!imageSize) return;
    const margin = 0.08;
    const w = Math.max(1, imageSize.width * (1 - margin * 2));
    const h = Math.max(1, imageSize.height * (1 - margin * 2));
    setCropRect({
      x: (imageSize.width - w) / 2,
      y: (imageSize.height - h) / 2,
      w,
      h,
    });
  }, [imageSize?.width, imageSize?.height]);

  const display = useMemo(() => {
    if (!imageSize || !containerSize) return null;
    const scale = Math.min(
      containerSize.width / imageSize.width,
      containerSize.height / imageSize.height
    );
    const displayScale = scale * zoom;
    const displayWidth = imageSize.width * displayScale;
    const displayHeight = imageSize.height * displayScale;
    const offsetX = (containerSize.width - displayWidth) / 2;
    const offsetY = (containerSize.height - displayHeight) / 2;
    return { displayScale, displayWidth, displayHeight, offsetX, offsetY };
  }, [imageSize, containerSize, zoom]);

  const cropScreen = useMemo(() => {
    if (!display || !cropRect) return null;
    return {
      x: display.offsetX + cropRect.x * display.displayScale,
      y: display.offsetY + cropRect.y * display.displayScale,
      w: cropRect.w * display.displayScale,
      h: cropRect.h * display.displayScale,
    };
  }, [display, cropRect]);

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const startDrag = (
    e: React.PointerEvent,
    mode: "move" | "nw" | "ne" | "sw" | "se"
  ) => {
    if (!cropRect) return;
    e.preventDefault();
    e.stopPropagation();
    dragStateRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...cropRect },
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragStateRef.current;
    if (!drag || !display || !imageSize) return;
    const dx = (e.clientX - drag.startX) / display.displayScale;
    const dy = (e.clientY - drag.startY) / display.displayScale;
    const minSize = Math.max(40, Math.min(imageSize.width, imageSize.height) * 0.05);

    let { x, y, w, h } = drag.startRect;
    if (drag.mode === "move") {
      x = clamp(x + dx, 0, imageSize.width - w);
      y = clamp(y + dy, 0, imageSize.height - h);
    } else {
      if (drag.mode === "nw" || drag.mode === "sw") {
        const newX = clamp(x + dx, 0, x + w - minSize);
        w = x + w - newX;
        x = newX;
      }
      if (drag.mode === "ne" || drag.mode === "se") {
        w = clamp(w + dx, minSize, imageSize.width - x);
      }
      if (drag.mode === "nw" || drag.mode === "ne") {
        const newY = clamp(y + dy, 0, y + h - minSize);
        h = y + h - newY;
        y = newY;
      }
      if (drag.mode === "sw" || drag.mode === "se") {
        h = clamp(h + dy, minSize, imageSize.height - y);
      }
    }

    setCropRect({ x, y, w, h });
  };

  const handlePointerEnd = () => {
    dragStateRef.current = null;
  };

  const handleFitCrop = () => {
    if (!imageSize) return;
    const margin = 0.08;
    const w = Math.max(1, imageSize.width * (1 - margin * 2));
    const h = Math.max(1, imageSize.height * (1 - margin * 2));
    setCropRect({
      x: (imageSize.width - w) / 2,
      y: (imageSize.height - h) / 2,
      w,
      h,
    });
  };

  const startCalibration = () => {
    if (!croppedPreview) {
      setCropError("Salva un ritaglio prima di calibrare.");
      return;
    }
    setCalibMode("perspective");
    setCalibStep(0);
    if (calibration?.columns) {
      setCalibDraft({
        data: [...calibration.columns.data],
        targa: [...calibration.columns.targa],
        litri: [...calibration.columns.litri],
      });
    } else {
      setCalibDraft({});
    }
  };

  const clearCalibration = () => {
    setCalibration(null);
    setCalibDraft({});
    setCalibStep(0);
    setCalibMode("none");
    localStorage.removeItem(CALIB_STORAGE_KEY);
  };

  const resetAllCalibration = () => {
    setCalibDraft({});
    setCalibStep(0);
  };

  const resetCurrentColumn = () => {
    const key = CALIB_ORDER[calibStep];
    setCalibDraft((prev) => ({ ...prev, [key]: [] }));
  };

  const undoLastPoint = () => {
    const key = CALIB_ORDER[calibStep];
    setCalibDraft((prev) => {
      const current = prev[key] ?? [];
      if (current.length === 0) return prev;
      return { ...prev, [key]: current.slice(0, -1) };
    });
  };

  const isDraftComplete = CALIB_ORDER.every((key) => isColumnComplete(calibDraft[key]));

  const saveCalibration = () => {
    if (!isDraftComplete) {
      setCropError("Completa la calibrazione prima di salvare.");
      return;
    }
    const payload: CalibrationPayload = {
      version: 1,
      columns: {
        data: calibDraft.data as CalibColumn,
        targa: calibDraft.targa as CalibColumn,
        litri: calibDraft.litri as CalibColumn,
      },
    };
    localStorage.setItem(CALIB_STORAGE_KEY, JSON.stringify(payload));
    setCalibration(payload);
    setCalibMode("none");
  };

  const handleCalibPointerDown = (event: React.PointerEvent) => {
    if (calibMode !== "perspective") return;
    if (isDraftComplete) return;
    const target = calibRef.current;
    if (!target) return;
    event.preventDefault();
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = clampValue((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clampValue((event.clientY - rect.top) / rect.height, 0, 1);
    const key = CALIB_ORDER[calibStep];
    setCalibDraft((prev) => {
      const current = prev[key] ?? [];
      if (current.length >= 4) return prev;
      const next = [...current, { x, y }];
      return { ...prev, [key]: next };
    });
    if ((calibDraft[key]?.length ?? 0) + 1 >= 4) {
      setCalibStep((prev) => Math.min(prev + 1, CALIB_ORDER.length - 1));
    }
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResults(null);
    setIaRows([]);
    setFileUrl(null);
    setSavedId("");
    setError("");
    setCropError("");
    setZoom(1);
    setCellThumbs([]);
    setPendingSave(null);
    if (croppedPreview) {
      URL.revokeObjectURL(croppedPreview);
      setCroppedPreview(null);
    }

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      setError("Seleziona una foto prima di estrarre.");
      return;
    }
    if (!croppedPreview) {
      setError("Salva un ritaglio prima di estrarre.");
      return;
    }
    if (
      !calibration?.columns?.data ||
      !calibration?.columns?.targa ||
      !calibration?.columns?.litri
    ) {
      setError("Calibra prima le colonne.");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);
    setSavedId("");

    try {
      const img = await createImage(croppedPreview);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const rowCount = Math.max(
        1,
        Math.round(Number(rowCountInput) || DEFAULT_ROW_COUNT)
      );
      if (!width || !height || rowCount <= 0) {
        throw new Error("Impossibile calcolare le righe della tabella.");
      }

      const stripDataUrl = (value: string) => {
        const comma = value.indexOf(",");
        return comma >= 0 ? value.slice(comma + 1) : value;
      };

      const dataBounds = getColumnBounds(calibration.columns.data);
      const targaBounds = getColumnBounds(calibration.columns.targa);
      const litriBounds = getColumnBounds(calibration.columns.litri);

      const cropCell = (x: number, y: number, w: number, h: number) => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(w));
        canvas.height = Math.max(1, Math.round(h));
        const ctx = canvas.getContext("2d");
        if (!ctx) return "";
        ctx.drawImage(img, x, y, w, h, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.82);
      };

      const payloadRows: Array<{
        dataImg: string;
        targaImg: string;
        litriImg: string;
      }> = [];
      const thumbs: Array<{
        dataImg?: string;
        targaImg?: string;
        litriImg?: string;
        stripImg?: string;
      }> = [];

      const rowHeight = height / rowCount;
      for (let i = 0; i < rowCount; i += 1) {
        const y = i * rowHeight;
        const h = rowHeight;
        const dataX = dataBounds.x1 * width;
        const dataW = (dataBounds.x2 - dataBounds.x1) * width;
        const targaX = targaBounds.x1 * width;
        const targaW = (targaBounds.x2 - targaBounds.x1) * width;
        const litriX = litriBounds.x1 * width;
        const litriW = (litriBounds.x2 - litriBounds.x1) * width;

        const dataImg = cropCell(dataX, y, dataW, h);
        const targaImg = cropCell(targaX, y, targaW, h);
        const litriImg = cropCell(litriX, y, litriW, h);
        const stripImg = await buildStripImage([dataImg, targaImg, litriImg]);

        thumbs.push({ dataImg, targaImg, litriImg, stripImg });
        payloadRows.push({
          dataImg: stripDataUrl(dataImg),
          targaImg: stripDataUrl(targaImg),
          litriImg: stripDataUrl(litriImg),
        });
      }

      setCellThumbs(thumbs);
      const extracted = await callEstrattiSchedaCisternaCells({
        cells: payloadRows.map((row, index) => ({
          rowIndex: index,
          data_b64: row.dataImg,
          targa_b64: row.targaImg,
          litri_b64: row.litriImg,
        })),
        meta: { source: "schede-carburante", rows: rowCount },
      });
      const rowsEmpty =
        (extracted?.ok === true || extracted?.success === true) &&
        Array.isArray(extracted?.rows) &&
        extracted.rows.length === 0;
      if (rowsEmpty && (extracted?.rawText || extracted?.error)) {
        setError(
          "Estrazione completata ma senza righe valide. Verifica ritaglio e calibrazione."
        );
      }
      setResults(extracted);
    } catch (err: any) {
      setError(err?.message || "Errore estrazione scheda cisterna.");
    } finally {
      setLoading(false);
    }
  };

  const buildPendingSave = (input: PendingSave) => {
    setPendingSave(input);
  };

  const handleSaveManual = () => {
    const validation = validateRows(manualRows, {
      isTargaKnown,
      isAziendaConfirmed: (row, isKnown) =>
        isKnown ? true : Boolean(row.aziendaConfirmed),
    });
    if (validation.invalidRowIndexes.length > 0) {
      setManualError(
        buildValidationMessage(
          validation.invalidRowIndexes,
          validation.reasonsByRow
        )
      );
      return;
    }
    if (manualRowsForSave.length === 0) {
      setManualError("Inserisci almeno una riga prima di salvare.");
      return;
    }
    setManualError("");
    setManualSavedId("");
    const rowsToSave = manualRowsForSave.map((row) => {
      const dataValue = row.data.trim();
      const targaValue = row.targa.trim();
      const nomeValue = row.nome.trim();
      const aziendaValue = normalizeAzienda(row.azienda);
      const litriValue = parseLitri(row.litri);
      const dataValid = isValidDate(dataValue);
      const litriValid = litriValue !== null && litriValue > 0;
      const targaMismatch = Boolean(targaValue) && !isTargaKnown(targaValue);
      const nomeMismatch = Boolean(nomeValue) && !isNomeKnown(nomeValue);
      const statoRevisione: "verificato" | "da_verificare" =
        dataValid && litriValid && !targaMismatch && !nomeMismatch
          ? "verificato"
          : "da_verificare";
      return {
        data: dataValue,
        targa: targaValue,
        nome: nomeValue,
        azienda: aziendaValue,
        litri: litriValue ?? null,
        statoRevisione,
      };
    });
    const needsReview = rowsToSave.some(
      (row) => row.statoRevisione === "da_verificare"
    );
    buildPendingSave({
      mode: "manual",
      rows: rowsToSave,
      rowCount: rowsToSave.length,
      needsReview,
      meta: {
        fonte: "manual",
      },
    });
  };

  const handleSaveIa = () => {
    if (!results || !isSuccess || !hasRowsArray) {
      setError("Esegui prima l'estrazione.");
      return;
    }
    if (!isEditMode && !fileUrl) {
      setError("Esegui prima l'estrazione.");
      return;
    }
    const validation = validateRows(iaRows);
    if (validation.invalidRowIndexes.length > 0) {
      setError(
        buildValidationMessage(
          validation.invalidRowIndexes,
          validation.reasonsByRow
        )
      );
      return;
    }
    setError("");
    if (iaRows.length === 0) {
      setError("Nessuna riga disponibile per il salvataggio.");
      return;
    }
    setSavedId("");
    const rowsToSave = iaRows.map((row) => {
      const dataValue = row.data.trim();
      const targaValue = row.targa.trim();
      const litriValue = parseLitri(row.litri);
      const dataValid = isValidDate(dataValue);
      const litriValid = litriValue !== null && litriValue > 0;
      const statoRevisione: "verificato" | "da_verificare" =
        row.verified && dataValid && litriValid ? "verificato" : "da_verificare";
      return {
        data: dataValue,
        targa: targaValue,
        nome: "",
        litri: litriValue ?? null,
        statoRevisione,
      };
    });
    const needsReview = rowsToSave.some(
      (row) => row.statoRevisione === "da_verificare"
    );
    buildPendingSave({
      mode: "ia",
      rows: rowsToSave,
      rowCount: rowsToSave.length,
      needsReview,
      meta: isEditMode
        ? { fonte: "IA" }
        : {
            fileUrl,
            nomeFile: selectedFile?.name ?? null,
            rawLines,
            summary: {
              rowsExtracted,
              rowsWithIssues: rowsProblematic,
            },
            fonte: "IA",
          },
    });
  };

  const confirmSave = async () => {
    if (!pendingSave) return;
    const isEditing = isEditMode && Boolean(editDocId);
    if (pendingSave.mode === "manual") {
      setManualSaving(true);
      setManualError("");
    } else {
      setSaving(true);
      setError("");
    }

    try {
      if (isEditing) {
        const updatePayload = sanitizeForFirestore({
          rows: pendingSave.rows,
          rowCount: pendingSave.rowCount,
          needsReview: pendingSave.needsReview,
          yearMonth: selectedYearMonth,
          updatedAt: serverTimestamp(),
        });
        await updateDoc(
          doc(db, CISTERNA_SCHEDE_COLLECTION, editDocId),
          updatePayload
        );
        if (pendingSave.mode === "manual") {
          setManualSavedId(editDocId);
        } else {
          setSavedId(editDocId);
        }
      } else {
        const payload = sanitizeForFirestore({
          createdAt: serverTimestamp(),
          source: pendingSave.mode,
          rowCount: pendingSave.rowCount,
          rows: pendingSave.rows,
          needsReview: pendingSave.needsReview,
          yearMonth: selectedYearMonth,
          ...(pendingSave.meta || {}),
        });

        const savedRef = await addDoc(
          collection(db, CISTERNA_SCHEDE_COLLECTION),
          payload
        );

        if (pendingSave.mode === "manual") {
          setManualSavedId(savedRef.id);
        } else {
          setSavedId(savedRef.id);
        }
      }
      setPendingSave(null);
    } catch (err: any) {
      if (pendingSave.mode === "manual") {
        setManualError(err?.message || "Errore salvataggio scheda.");
      } else {
        setError(err?.message || "Errore salvataggio scheda.");
      }
    } finally {
      if (pendingSave.mode === "manual") {
        setManualSaving(false);
      } else {
        setSaving(false);
      }
    }
  };

  const handleIaFieldChange = (
    id: string,
    field: "data" | "targa" | "litri",
    value: string
  ) => {
    setIaRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const next = { ...row, [field]: value, verified: false };
        return {
          ...next,
          dataStatus: calcStatusForField(next.data, "data"),
          targaStatus: calcStatusForField(next.targa, "targa"),
          litriStatus: calcStatusForField(next.litri, "litri"),
        };
      })
    );
    setSavedId("");
  };

  const handleIaVerifyToggle = (id: string, value: boolean) => {
    setIaRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, verified: value } : row))
    );
    setSavedId("");
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    if (croppedPreview) {
      URL.revokeObjectURL(croppedPreview);
    }
    setCroppedPreview(null);
    setFileUrl(null);
    setResults(null);
    setIaRows([]);
    setSavedId("");
    setError("");
    setCropError("");
    setInputKey(Date.now());
    setCellThumbs([]);
    setPendingSave(null);
  };

  const handleModeChange = (next: "manual" | "ia") => {
    setMode(next);
    setManualError("");
    setError("");
    setPendingSave(null);
    if (next === "manual" && !manualSeededRef.current) {
      setManualRows((prev) => {
        if (prev.length >= 20) return prev;
        const missing = 20 - prev.length;
        const extra = Array.from({ length: missing }, () => createEmptyManualRow());
        return [...prev, ...extra];
      });
      manualSeededRef.current = true;
    }
  };

  const handlePrefillFromAutisti = async () => {
    if (!isValidYearMonth(selectedYearMonth)) {
      setManualError("Mese scheda non valido.");
      return;
    }
    setPrefillLoading(true);
    setManualError("");
    setManualSavedId("");
    setPendingSave(null);
    try {
      const ref = doc(db, "storage", RIFORNIMENTI_AUTISTI_KEY);
      const snap = await getDoc(ref);
      const raw = snap.exists() ? snap.data() : {};
      const list = Array.isArray(raw?.value)
        ? raw.value
        : Array.isArray(raw)
        ? raw
        : [];

      const mappedRows = (list as RifornimentoAutistaRecord[])
        .map((record, index) => {
          const tipo = String(record.tipo ?? "").trim().toLowerCase();
          if (tipo !== CISTERNA_REFUEL_TAG) return null;
          const dateValue =
            toDateFromUnknown(record.data) || toDateFromUnknown(record.timestamp);
          if (!dateValue) return null;
          const monthKey = `${dateValue.getFullYear()}-${String(
            dateValue.getMonth() + 1
          ).padStart(2, "0")}`;
          if (monthKey !== selectedYearMonth) return null;

          const targa = String(
            record.targaCamion ?? record.targaMotrice ?? record.mezzoTarga ?? ""
          )
            .trim()
            .toUpperCase();
          const litri = parseLitri(String(record.litri ?? ""));
          if (!targa || litri == null || litri <= 0) return null;

          const nome = [
            record.autistaNome,
            record.nomeAutista,
            typeof record.autista === "string" ? record.autista : "",
            typeof record.autista === "object" && record.autista
              ? record.autista.nome
              : "",
          ]
            .map((item) => String(item ?? "").trim())
            .find((item) => item !== "");

          return {
            id: makeRowId(),
            data: formatDateDmYyyy(dateValue),
            targa,
            nome: nome ?? "",
            litri: String(litri),
            azienda: "cementi" as AziendaOption,
            aziendaConfirmed: true,
            ts: dateValue.getTime(),
            idx: index,
          };
        })
        .filter((row): row is NonNullable<typeof row> => Boolean(row))
        .sort((a, b) => {
          if (b.ts !== a.ts) return b.ts - a.ts;
          if (a.targa !== b.targa) return a.targa.localeCompare(b.targa);
          return a.idx - b.idx;
        })
        .map(({ ts, idx, ...row }) => row);

      if (mappedRows.length === 0) {
        setManualRows(makeInitialRows(20));
        manualSeededRef.current = true;
        setManualError(
          `Nessun rifornimento autisti trovato per ${monthLabel(selectedYearMonth)}.`
        );
        return;
      }

      const rowsWithPadding =
        mappedRows.length >= 20
          ? mappedRows
          : [
              ...mappedRows,
              ...Array.from({ length: 20 - mappedRows.length }, () =>
                createEmptyManualRow()
              ),
            ];
      setMode("manual");
      setManualRows(rowsWithPadding);
      setAutistiExpanded({});
      setPendingFocusId(rowsWithPadding[0]?.id ?? null);
      manualSeededRef.current = true;
    } catch (err: any) {
      setManualError(
        err?.message || "Errore durante la precompilazione da autisti."
      );
    } finally {
      setPrefillLoading(false);
    }
  };

  const handleQuickTest = async () => {
    if (!croppedPreview) {
      setError("Nessun ritaglio disponibile per l'estrazione rapida.");
      return;
    }
    return handleExtract();
  };

  const handleSaveCrop = async () => {
    if (!preview || !cropRect || !selectedFile) {
      setCropError("Seleziona un'area di ritaglio prima di salvare.");
      return;
    }

    setCropSaving(true);
    setCropError("");

    try {
      const blob = await getCroppedBlob(preview, {
        x: Math.round(cropRect.x),
        y: Math.round(cropRect.y),
        width: Math.round(cropRect.w),
        height: Math.round(cropRect.h),
      });
      const now = new Date();
      const yyyy = String(now.getFullYear());
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const safeName = sanitizeFileName(selectedFile.name || "scheda");
      const path = `documenti_pdf/cisterna_schede/${yyyy}/${mm}/${Date.now()}_${safeName}_crop.jpg`;
      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
      const downloadUrl = await getDownloadURL(storageRef);
      setFileUrl(downloadUrl);

      if (croppedPreview) {
        URL.revokeObjectURL(croppedPreview);
      }
      setCroppedPreview(URL.createObjectURL(blob));
    } catch (err: any) {
      setCropError(err?.message || "Errore salvataggio ritaglio.");
    } finally {
      setCropSaving(false);
    }
  };

  return (
    <div className="cisterna-schede-page">
      <div className="cisterna-schede-shell">
        <header className="cisterna-schede-head">
          <div className="cisterna-schede-title">
            <img
              src="/logo.png"
              alt="Logo"
              className="cisterna-schede-logo"
              onClick={() => navigate("/")}
            />
            <div>
              <h1>{pageTitle}</h1>
              <p>
                Inserimento manuale e digitalizzazione da foto con correzione assistita.
              </p>
            </div>
          </div>
          <div className="cisterna-schede-actions">
            {isEditMode ? (
              <button type="button" onClick={() => navigate("/cisterna")}>
                Annulla
              </button>
            ) : null}
            <button type="button" onClick={() => navigate("/cisterna")}>
              Torna a Cisterna
            </button>
            <button type="button" onClick={() => navigate("/cisterna/ia")}>
              IA Cisterna
            </button>
          </div>
        </header>

        <div className="cisterna-schede-monthbar">
          <label className="cisterna-schede-month-label" htmlFor="cisterna-schede-month">
            Mese scheda
          </label>
          <select
            id="cisterna-schede-month"
            className="cisterna-schede-month-select"
            value={selectedYearMonth}
            onChange={(event) => handleYearMonthChange(event.target.value)}
          >
            {monthOptions.map((monthKey) => (
              <option key={monthKey} value={monthKey}>
                {monthLabel(monthKey)}
              </option>
            ))}
          </select>
        </div>

        {isEditMode ? (
          <div className="cisterna-schede-edit-info">
            <span className="cisterna-schede-edit-badge">EDIT MODE</span>
            {editLoading ? <span>Caricamento scheda...</span> : null}
            {editError ? (
              <div className="cisterna-schede-edit-error">
                <span>{editError}</span>
                <button type="button" onClick={() => navigate("/cisterna")}>
                  Torna a Archivio
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="cisterna-schede-tabs">
          <button
            type="button"
            className={mode === "manual" ? "active" : ""}
            onClick={() => handleModeChange("manual")}
          >
            Inserimento manuale
          </button>
          <button
            type="button"
            className={mode === "ia" ? "active" : ""}
            onClick={() => handleModeChange("ia")}
          >
            Da foto (IA)
          </button>
        </div>

        {mode === "manual" ? (
          <section className="cisterna-schede-card">
            <div className="cisterna-schede-manual-head">
              <div>
                <h2>Inserimento manuale</h2>
                <p>Compila la scheda carburante come da modulo cartaceo.</p>
              </div>
              <div className="cisterna-schede-manual-head-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={handlePrefillFromAutisti}
                  disabled={manualSaving || prefillLoading}
                >
                  {prefillLoading
                    ? "Precompilazione..."
                    : "Precompila da Autisti (supporto)"}
                </button>
                <button
                  type="button"
                  onClick={() => addManualRow()}
                  disabled={manualSaving}
                >
                  Aggiungi riga
                </button>
              </div>
            </div>

            {suggestionsError ? (
              <div className="cisterna-schede-error">{suggestionsError}</div>
            ) : null}
            {autistiError ? (
              <div className="cisterna-schede-error">{autistiError}</div>
            ) : null}
            {manualError ? (
              <div className="cisterna-schede-error">{manualError}</div>
            ) : null}
            {manualSavedId ? (
              <div className="cisterna-schede-ok">
                {isEditMode ? (
                  "Modifiche salvate."
                ) : (
                  <>
                    Scheda salvata con id: <strong>{manualSavedId}</strong>
                  </>
                )}
              </div>
            ) : null}

            <div className="cisterna-schede-table-wrap">
              <table className="cisterna-schede-table cisterna-schede-table--manual">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Targa</th>
                    <th>Nome</th>
                    <th>Azienda</th>
                    <th>Litri</th>
                    <th>Autisti (dettaglio)</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {manualRows.map((row, index) => {
                    const validity = manualRowValidity[index];
                    const invalidReasons = manualValidation.reasonsByRow[index];
                    const isInvalid = Boolean(invalidReasons);
                    const needsCheck =
                      Boolean(validity?.targaMismatch) ||
                      Boolean(validity?.nomeMismatch);
                    const autistiMatch = manualAutistiMatches[index];
                    const showExpanded = Boolean(autistiExpanded[row.id]);
                    const eventsToShow =
                      autistiMatch?.events && autistiMatch.events.length > 0
                        ? showExpanded
                          ? autistiMatch.events
                          : autistiMatch.events.slice(0, 5)
                        : [];
                    const dataIssue = invalidReasons?.some((reason) =>
                      reason.startsWith("Data")
                    );
                    const targaIssue = invalidReasons?.some((reason) =>
                      reason.startsWith("Targa")
                    );
                    const aziendaIssue = invalidReasons?.some((reason) =>
                      reason.startsWith("Azienda")
                    );
                    const litriIssue = invalidReasons?.some((reason) =>
                      reason.startsWith("Litri")
                    );
                    const rowClass = isInvalid
                      ? "cisterna-row-invalid"
                      : needsCheck
                      ? "cisterna-schede-row-verify"
                      : undefined;
                    return (
                      <tr key={row.id} className={rowClass}>
                        <td>
                          <div className="cisterna-schede-cell-edit cisterna-schede-cell-edit--date">
                            <div className="cisterna-date-cell">
                              <input
                                ref={(el) => {
                                  dataInputRefs.current[row.id] = el;
                                }}
                                className={`cisterna-schede-input ${
                                  !validity?.dataValid && row.data.trim()
                                    ? "invalid"
                                    : dataIssue
                                    ? "invalid"
                                    : ""
                                }`}
                                value={row.data}
                                onChange={(event) =>
                                  handleManualDateChange(row.id, event.target.value)
                                }
                                placeholder="gg/mm/aaaa"
                                aria-label="Data"
                                disabled={manualSaving}
                              />
                              <div className="cisterna-schede-date-tools">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateManualRow(row.id, {
                                      data: formatDateDmYyyy(new Date()),
                                    })
                                  }
                                  disabled={manualSaving}
                                >
                                  Oggi
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const date = new Date();
                                    date.setDate(date.getDate() - 1);
                                    updateManualRow(row.id, {
                                      data: formatDateDmYyyy(date),
                                    });
                                  }}
                                  disabled={manualSaving}
                                >
                                  Ieri
                                </button>
                              </div>
                            </div>
                            {!validity?.dataValid && row.data.trim() ? (
                              <span className="cisterna-schede-badge incerto">
                                Formato
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <div className="cisterna-schede-cell-edit">
                            <AutosuggestInput
                              value={row.targa}
                              onChange={(value) => handleManualTargaChange(row, value)}
                              suggestions={targaSuggestions}
                              placeholder="Targa"
                              className={`cisterna-schede-input ${
                                targaIssue ? "invalid" : ""
                              }`}
                              ariaLabel="Targa"
                              disabled={manualSaving}
                            />
                            {validity?.targaMismatch ? (
                              <span className="cisterna-schede-badge incerto">
                                NON IN ELENCO
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <div className="cisterna-schede-cell-edit">
                            <AutosuggestInput
                              value={row.nome}
                              onChange={(value) => updateManualRow(row.id, { nome: value })}
                              suggestions={nomeSuggestions}
                              placeholder="Nome"
                              className="cisterna-schede-input"
                              ariaLabel="Nome"
                              disabled={manualSaving}
                            />
                            {validity?.nomeMismatch ? (
                              <span className="cisterna-schede-badge incerto">
                                DA VERIFICARE
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <div className="cisterna-schede-cell-edit">
                            <select
                              className={`cisterna-schede-input ${aziendaIssue ? "invalid" : ""}`}
                              value={row.azienda}
                              onChange={(event) =>
                                updateManualRow(row.id, {
                                  azienda: normalizeAzienda(event.target.value),
                                  aziendaConfirmed: true,
                                })
                              }
                              disabled={manualSaving}
                            >
                              {AZIENDE_OPTIONS.map((azienda) => (
                                <option key={azienda.value} value={azienda.value}>
                                  {azienda.label}
                                </option>
                              ))}
                            </select>
                            {validity?.aziendaMissingForUnknown ? (
                              <span className="cisterna-schede-badge warn">
                                SELEZIONA AZIENDA
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <div className="cisterna-schede-cell-edit">
                            <input
                              className={`cisterna-schede-input ${
                                !validity?.litriValid && row.litri.trim()
                                  ? "invalid"
                                  : litriIssue
                                  ? "invalid"
                                  : ""
                              }`}
                              type="number"
                              min={0}
                              step={0.1}
                              value={row.litri}
                              onChange={(event) =>
                                updateManualRow(row.id, { litri: event.target.value })
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" &&
                                  index === manualRows.length - 1
                                ) {
                                  event.preventDefault();
                                  addManualRow();
                                }
                              }}
                              aria-label="Litri"
                              disabled={manualSaving}
                            />
                            {!validity?.litriValid && row.litri.trim() ? (
                              <span className="cisterna-schede-badge incerto">Valore</span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <div className="cisterna-schede-autisti">
                            {autistiMatch?.status === "missing" ? (
                              <span className="cisterna-schede-autisti-empty">-</span>
                            ) : autistiLoading ? (
                              <span className="cisterna-schede-autisti-empty">
                                Caricamento autisti...
                              </span>
                            ) : autistiMatch?.status === "none" ? (
                              <span className="cisterna-schede-autisti-empty">
                                Nessun dato autisti
                              </span>
                            ) : autistiMatch ? (
                              <>
                                <div className="cisterna-schede-autisti-list">
                                  {eventsToShow.map((event, eventIndex) => (
                                    <div
                                      key={`${event.id || event.originId || "ev"}-${eventIndex}`}
                                      className="cisterna-schede-autisti-item"
                                    >
                                      <span>{event.ora || "-"}</span>
                                      <strong>{formatLitri(event.litri)}</strong>
                                    </div>
                                  ))}
                                </div>
                                {autistiMatch.events.length > 5 ? (
                                  <button
                                    type="button"
                                    className="cisterna-schede-autisti-toggle"
                                    onClick={() => toggleAutistiExpanded(row.id)}
                                  >
                                    {showExpanded ? "Mostra meno" : "Mostra tutti"}
                                  </button>
                                ) : null}
                                <div className="cisterna-schede-autisti-meta">
                                  <span>
                                    Somma autisti: {formatLitri(autistiMatch.total)}
                                  </span>
                                  <span>
                                    Differenza:{" "}
                                    {autistiMatch.diff === null
                                      ? "-"
                                      : formatLitri(autistiMatch.diff)}
                                  </span>
                                  {autistiMatch.events.length > 0 ? (
                                    <button
                                      type="button"
                                      className="cisterna-schede-suggest-btn"
                                      onClick={() => {
                                        const litriValue = parseLitri(row.litri);
                                        if (litriValue === null || litriValue <= 0) {
                                          const suggested =
                                            autistiMatch.events.length === 1
                                              ? autistiMatch.events[0]?.litri ?? null
                                              : autistiMatch.total;
                                          if (suggested !== null && suggested > 0) {
                                            updateManualRow(row.id, {
                                              litri: String(suggested),
                                            });
                                          }
                                        }
                                        if (!row.nome.trim()) {
                                          const anyName =
                                            (autistiMatch.events[0] as any)?.autistaNome ??
                                            (autistiMatch.events[0] as any)?.nomeAutista ??
                                            "";
                                          const nameText = String(anyName ?? "").trim();
                                          if (nameText) {
                                            updateManualRow(row.id, { nome: nameText });
                                          }
                                        }
                                      }}
                                      disabled={manualSaving}
                                    >
                                      Accetta suggerimento
                                    </button>
                                  ) : null}
                                  <span
                                    className={`cisterna-schede-badge ${
                                      autistiMatch.status === "match" ? "ok" : "incerto"
                                    }`}
                                  >
                                    {autistiMatch.status === "match"
                                      ? "MATCH"
                                      : "DIFFERENZA"}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <span className="cisterna-schede-autisti-empty">—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="cisterna-schede-manual-actions">
                            <button
                              type="button"
                              onClick={() => duplicateManualRow(index)}
                              disabled={manualSaving}
                            >
                              Copia riga
                            </button>
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => removeManualRow(row.id)}
                              disabled={manualSaving}
                            >
                              Rimuovi
                            </button>
                            {isInvalid ? (
                              <div className="cisterna-row-error">
                                {(invalidReasons || []).join(", ")}
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {mode === "ia" ? (
          <section className="cisterna-schede-card">
          <label className="cisterna-schede-field">
            <span>Foto scheda cartacea</span>
            <input
              key={inputKey}
              type="file"
              accept="image/*"
              onChange={handleFile}
              disabled={loading || saving}
            />
          </label>

          <div className="cisterna-schede-row">
            <button
              type="button"
              onClick={handleExtract}
              disabled={!selectedFile || !croppedPreview || loading || saving || cropSaving}
            >
              {loading ? "Estrazione in corso..." : "Estrai da ritaglio"}
            </button>
            <button
              type="button"
              onClick={handleQuickTest}
              disabled={!croppedPreview || loading || saving || cropSaving}
            >
              Estrai rapido (senza upload)
            </button>
            <button
              type="button"
              onClick={handleSaveIa}
              disabled={!canSaveIa || loading || saving}
            >
              {saving
                ? "Salvataggio..."
                : isEditMode
                ? "Salva modifiche"
                : "Conferma e salva"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={handleReset}
              disabled={loading || saving}
            >
              Annulla
            </button>
          </div>

          {error ? <div className="cisterna-schede-error">{error}</div> : null}
          {savedId ? (
            <div className="cisterna-schede-ok">
              {isEditMode ? (
                "Modifiche salvate."
              ) : (
                <>
                  Scheda salvata con id: <strong>{savedId}</strong>
                </>
              )}
            </div>
          ) : null}

          {preview ? (
            <div className="cisterna-schede-crop">
              <div className="cisterna-schede-cropper">
                <div
                  ref={cropContainerRef}
                  className="cisterna-schede-crop-frame"
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                >
                  {display ? (
                    <img
                      src={preview}
                      alt="Preview scheda"
                      style={{
                        width: display.displayWidth,
                        height: display.displayHeight,
                        transform: `translate(${display.offsetX}px, ${display.offsetY}px)`,
                      }}
                    />
                  ) : (
                    <img src={preview} alt="Preview scheda" />
                  )}
                  {cropScreen && containerSize ? (
                    <>
                      <div
                        className="cisterna-schede-mask"
                        style={{
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: Math.max(0, cropScreen.y),
                        }}
                      />
                      <div
                        className="cisterna-schede-mask"
                        style={{
                          top: Math.max(0, cropScreen.y + cropScreen.h),
                          left: 0,
                          width: "100%",
                          height: Math.max(
                            0,
                            containerSize.height - (cropScreen.y + cropScreen.h)
                          ),
                        }}
                      />
                      <div
                        className="cisterna-schede-mask"
                        style={{
                          top: Math.max(0, cropScreen.y),
                          left: 0,
                          width: Math.max(0, cropScreen.x),
                          height: Math.max(0, cropScreen.h),
                        }}
                      />
                      <div
                        className="cisterna-schede-mask"
                        style={{
                          top: Math.max(0, cropScreen.y),
                          left: Math.max(0, cropScreen.x + cropScreen.w),
                          width: Math.max(
                            0,
                            containerSize.width - (cropScreen.x + cropScreen.w)
                          ),
                          height: Math.max(0, cropScreen.h),
                        }}
                      />
                      <div
                        className="cisterna-schede-crop-rect"
                        style={{
                          left: cropScreen.x,
                          top: cropScreen.y,
                          width: cropScreen.w,
                          height: cropScreen.h,
                        }}
                        onPointerDown={(e) => startDrag(e, "move")}
                      >
                        <div
                          className="cisterna-schede-handle nw"
                          onPointerDown={(e) => startDrag(e, "nw")}
                        />
                        <div
                          className="cisterna-schede-handle ne"
                          onPointerDown={(e) => startDrag(e, "ne")}
                        />
                        <div
                          className="cisterna-schede-handle sw"
                          onPointerDown={(e) => startDrag(e, "sw")}
                        />
                        <div
                          className="cisterna-schede-handle se"
                          onPointerDown={(e) => startDrag(e, "se")}
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="cisterna-schede-crop-controls">
                <label className="cisterna-schede-zoom">
                  Zoom
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                  />
                </label>
                <button type="button" onClick={handleFitCrop}>
                  Adatta alla tabella
                </button>
                <button
                  type="button"
                  onClick={handleSaveCrop}
                  disabled={cropSaving || loading || saving}
                >
                  {cropSaving ? "Salvataggio ritaglio..." : "Salva ritaglio"}
                </button>
                <label className="cisterna-schede-rowcount">
                  Righe tabella
                  <input
                    type="number"
                    min={5}
                    max={80}
                    value={rowCountInput}
                    onChange={(event) => setRowCountInput(Number(event.target.value))}
                  />
                </label>
                <button type="button" onClick={startCalibration} disabled={!croppedPreview}>
                  Calibra colonne (prospettiva)
                </button>
                <button type="button" onClick={clearCalibration} disabled={!calibration}>
                  Cancella calibrazione
                </button>
                <label className="cisterna-schede-toggle">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(event) => setShowGrid(event.target.checked)}
                  />
                  Mostra griglia
                </label>
              </div>
              {calibMode === "perspective" ? (
                <div className="cisterna-schede-calib-hint">
                  {isDraftComplete ? (
                    "Calibrazione completa: salva per usarla nell'estrazione."
                  ) : (
                    <>
                      Seleziona colonna: {CALIB_ORDER[calibStep].toUpperCase()} (4 punti:
                      TL, TR, BR, BL)
                    </>
                  )}
                </div>
              ) : null}
              {calibMode === "perspective" ? (
                <div className="cisterna-schede-calib-tools">
                  <button
                    type="button"
                    className="secondary"
                    onClick={undoLastPoint}
                    disabled={(calibDraft[CALIB_ORDER[calibStep]]?.length ?? 0) === 0}
                  >
                    Annulla ultimo punto
                  </button>
                  <button type="button" className="secondary" onClick={resetCurrentColumn}>
                    Reset colonna
                  </button>
                  <button type="button" className="secondary" onClick={resetAllCalibration}>
                    Reset tutto
                  </button>
                  <button type="button" onClick={saveCalibration} disabled={!isDraftComplete}>
                    Salva calibrazione
                  </button>
                </div>
              ) : null}
              {cropError ? (
                <div className="cisterna-schede-error">{cropError}</div>
              ) : null}
              {croppedPreview ? (
                <div className="cisterna-schede-preview" ref={calibRef}>
                  <img src={croppedPreview} alt="Preview ritaglio" />
                  <svg
                    className={`cisterna-schede-calib-svg ${
                      calibMode === "perspective" ? "active" : ""
                    }`}
                    viewBox="0 0 1 1"
                    preserveAspectRatio="none"
                    onPointerDown={handleCalibPointerDown}
                  >
                    {showGrid && rowCountInput > 1
                      ? Array.from({ length: rowCountInput - 1 }).map((_, idx) => {
                          const y = (idx + 1) / rowCountInput;
                          return (
                            <line
                              key={`row-${idx}`}
                              x1="0"
                              y1={y}
                              x2="1"
                              y2={y}
                              className="cisterna-schede-grid-line"
                            />
                          );
                        })
                      : null}
                    {CALIB_ORDER.map((key) => {
                      const points = displayColumns[key];
                      if (!points || points.length === 0) return null;
                      const pointsAttr = points.map((p) => `${p.x},${p.y}`).join(" ");
                      const isActive = calibMode === "perspective" && key === currentCalibKey;
                      const isComplete = points.length === 4;
                      return (
                        <g key={`col-${key}`}>
                          {isComplete ? (
                            <polygon
                              points={pointsAttr}
                              className={`cisterna-schede-calib-poly ${key} ${
                                isActive ? "active" : ""
                              }`}
                            />
                          ) : (
                            <polyline
                              points={pointsAttr}
                              className={`cisterna-schede-calib-poly ${key} ${
                                isActive ? "active" : ""
                              }`}
                            />
                          )}
                          {points.map((point, index) => (
                            <circle
                              key={`pt-${key}-${index}`}
                              cx={point.x}
                              cy={point.y}
                              r={0.008}
                              className={`cisterna-schede-calib-point ${key} ${
                                isActive ? "active" : ""
                              }`}
                            />
                          ))}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
        ) : null}

        {mode === "ia" && results ? (
          <section className="cisterna-schede-card">
            {!isSuccess || !hasRowsArray ? (
              <div className="cisterna-schede-error">
                {d.error || "Risposta IA non valida."}
              </div>
            ) : (
              <>
                <div className="cisterna-schede-summary">
                  <div>
                    <strong>Righe estratte</strong>
                    <span>{rowsExtracted}</span>
                  </div>
                  <div>
                    <strong>Righe con problemi</strong>
                    <span>{rowsProblematic}</span>
                  </div>
                  <div>
                    <strong>Righe verificate</strong>
                    <span>{iaRows.filter((row) => row.verified).length}</span>
                  </div>
                  <div>
                    <strong>Revisione richiesta</strong>
                    <span>{needsReview ? "Si" : "No"}</span>
                  </div>
                </div>
                {hasStructuredTable ? (
                  <div className="cisterna-schede-table-wrap">
                    <table className="cisterna-schede-table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Targa</th>
                          <th>Litri</th>
                          <th>Note</th>
                          <th>Verificato</th>
                          <th>Anteprima</th>
                        </tr>
                      </thead>
                      <tbody>
                        {iaRows.length === 0 ? (
                          <tr>
                            <td colSpan={6}>Nessuna riga trovata.</td>
                          </tr>
                        ) : (
                          iaRows.map((row: IaEditableRow, index: number) => {
                            const thumbs = cellThumbs[index] || {};
                            const invalidReasons = iaValidation.reasonsByRow[index];
                            const isRowInvalid = Boolean(invalidReasons);
                            const dataIssue = invalidReasons?.some((reason) =>
                              reason.startsWith("Data")
                            );
                            const targaIssue = invalidReasons?.some((reason) =>
                              reason.startsWith("Targa")
                            );
                            const litriIssue = invalidReasons?.some((reason) =>
                              reason.startsWith("Litri")
                            );
                            return (
                              <tr
                                key={`row-${index}`}
                                className={
                                  isRowInvalid
                                    ? "cisterna-row-invalid"
                                    : row.verified
                                    ? undefined
                                    : "cisterna-schede-row-dubious"
                                }
                              >
                                <td>
                                  <div className="cisterna-schede-cell-edit">
                                    <input
                                      className={`cisterna-schede-input ${
                                        dataIssue ? "invalid" : ""
                                      }`}
                                      value={row.data}
                                      onChange={(event) =>
                                        handleIaFieldChange(
                                          row.id,
                                          "data",
                                          event.target.value
                                        )
                                      }
                                      placeholder="gg/mm/aaaa"
                                      aria-label={`Data riga ${index + 1}`}
                                    />
                                    <span
                                      className={`cisterna-schede-badge ${row.dataStatus.toLowerCase()}`}
                                    >
                                      {row.dataStatus}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <div className="cisterna-schede-cell-edit">
                                    <AutosuggestInput
                                      value={row.targa}
                                      onChange={(value) =>
                                        handleIaFieldChange(row.id, "targa", value)
                                      }
                                      suggestions={targaSuggestions}
                                      placeholder="Targa"
                                      className={`cisterna-schede-input ${
                                        targaIssue ? "invalid" : ""
                                      }`}
                                      ariaLabel={`Targa riga ${index + 1}`}
                                    />
                                    <span
                                      className={`cisterna-schede-badge ${row.targaStatus.toLowerCase()}`}
                                    >
                                      {row.targaStatus}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <div className="cisterna-schede-cell-edit">
                                    <input
                                      className={`cisterna-schede-input ${
                                        litriIssue ? "invalid" : ""
                                      }`}
                                      type="number"
                                      min={0}
                                      step={0.1}
                                      value={row.litri}
                                      onChange={(event) =>
                                        handleIaFieldChange(
                                          row.id,
                                          "litri",
                                          event.target.value
                                        )
                                      }
                                      aria-label={`Litri riga ${index + 1}`}
                                    />
                                    <span
                                      className={`cisterna-schede-badge ${row.litriStatus.toLowerCase()}`}
                                    >
                                      {row.litriStatus}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  {row.note || "-"}
                                  {isRowInvalid ? (
                                    <div className="cisterna-row-error">
                                      {(invalidReasons || []).join(", ")}
                                    </div>
                                  ) : null}
                                </td>
                                <td>
                                  <label className="cisterna-schede-verify">
                                    <input
                                      type="checkbox"
                                      checked={row.verified}
                                      onChange={(event) =>
                                        handleIaVerifyToggle(row.id, event.target.checked)
                                      }
                                    />
                                    <span>Verificato</span>
                                  </label>
                                </td>
                                <td>
                                  <div className="cisterna-schede-cell">
                                    {thumbs.stripImg ? (
                                      <button
                                        type="button"
                                        className="cisterna-schede-thumb-btn"
                                        onClick={() =>
                                          setActiveCell({
                                            src: thumbs.stripImg as string,
                                            label: `Riga ${index + 1}`,
                                          })
                                        }
                                      >
                                        <img src={thumbs.stripImg} alt={`Riga ${index + 1}`} />
                                      </button>
                                    ) : (
                                      <span>-</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {rawLines.length > 0 ? (
                  <div className="cisterna-schede-rawblock">
                    <h3>Righe trascritte (RAW)</h3>
                    <div>
                      {rawLines.map((line: string, index: number) => (
                        <Fragment key={`raw-${index}`}>
                          <div>{line || "-"}</div>
                          {index < rawLines.length - 1 ? <hr /> : null}
                        </Fragment>
                      ))}
                    </div>
                    {notes ? <div>Note: {notes}</div> : null}
                  </div>
                ) : null}
              </>
            )}
          </section>
        ) : null}

        {activeCell ? (
          <div className="cisterna-schede-modal" onClick={() => setActiveCell(null)}>
            <div
              className="cisterna-schede-modal-inner"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="cisterna-schede-modal-head">
                <strong>{activeCell.label}</strong>
                <button type="button" onClick={() => setActiveCell(null)}>
                  Chiudi
                </button>
              </div>
              <img src={activeCell.src} alt={activeCell.label} />
            </div>
          </div>
        ) : null}

        {pendingSave
          ? (() => {
              const verifiedCount = pendingSave.rows.filter(
                (row) => row.statoRevisione === "verificato"
              ).length;
              const unverifiedCount = pendingSave.rows.length - verifiedCount;
              const savingActive =
                pendingSave.mode === "manual" ? manualSaving : saving;
              return (
                <div
                  className="cisterna-schede-modal cisterna-schede-confirm"
                  onClick={() => {
                    if (!savingActive) setPendingSave(null);
                  }}
                >
                  <div
                    className="cisterna-schede-modal-inner"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="cisterna-schede-modal-head">
                      <strong>Riepilogo salvataggio</strong>
                      <button
                        type="button"
                        onClick={() => setPendingSave(null)}
                        disabled={savingActive}
                      >
                        Chiudi
                      </button>
                    </div>
                    <div className="cisterna-schede-confirm-body">
                      <div className="cisterna-schede-summary">
                        <div>
                          <strong>Righe totali</strong>
                          <span>{pendingSave.rows.length}</span>
                        </div>
                        <div>
                          <strong>Righe verificate</strong>
                          <span>{verifiedCount}</span>
                        </div>
                        <div>
                          <strong>Righe non verificate</strong>
                          <span>{unverifiedCount}</span>
                        </div>
                      </div>
                      {unverifiedCount > 0 ? (
                        <div className="cisterna-schede-warning">
                          Attenzione: alcune righe non sono verificate.
                        </div>
                      ) : null}
                      <div className="cisterna-schede-confirm-actions">
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => setPendingSave(null)}
                          disabled={savingActive}
                        >
                          Annulla
                        </button>
                        <button
                          type="button"
                          onClick={confirmSave}
                          disabled={savingActive}
                        >
                          {savingActive
                            ? "Salvataggio..."
                            : isEditMode
                            ? "Conferma modifiche"
                            : "Conferma e salva"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          : null}

      </div>
      {mode === "manual" ? (
        <div className="cisterna-schede-savebar">
          <div>
            <strong>{manualRowsForSave.length} righe</strong>
            <span>
              {manualRowsForSave.length === 0
                ? "Aggiungi righe per salvare"
                : manualInvalidCount > 0
                ? `Righe non valide: ${manualInvalidCount}`
                : "Tutte le righe sono valide"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSaveManual}
            disabled={manualSaving || manualRowsForSave.length === 0}
          >
            {manualSaving
              ? "Salvataggio..."
              : isEditMode
              ? "Salva modifiche"
              : "Conferma e salva"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

