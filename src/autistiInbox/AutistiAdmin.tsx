import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AutistiAdmin.css";

import {
  loadHomeEvents,
  loadRimorchiStatus,
  type HomeEvent,
  type RimorchioStatus,
} from "../utils/homeEvents";
import { getItemSync, setItemSync } from "../utils/storageSync";

const KEY_SGANCIO_RIMORCHI = "@storico_sganci_rimorchi";
const KEY_CAMBI_MOTRICE = "@storico_cambi_motrice";
const KEY_SESSIONI = "@autisti_sessione_attive";
const KEY_MEZZI = "@mezzi_aziendali";
const KEY_CONTROLLI = "@controlli_mezzo_autisti";
const KEY_RIFORNIMENTI = "@rifornimenti_autisti_tmp";
const KEY_SEGNALAZIONI = "@segnalazioni_autisti_tmp";
const KEY_RICHIESTE_ATTREZZATURE = "@richieste_attrezzature_autisti_tmp";

type TabKey =
  | "rifornimenti"
  | "segnalazioni"
  | "controlli"
  | "cambi"
  | "attrezzature";

function isSameDay(ts: number, day: Date) {
  const d = new Date(ts);
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  );
}

function formatDayLabel(d: Date) {
  const giorni = [
    "Domenica",
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
  ];
  const mesi = [
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre",
  ];
  return `${giorni[d.getDay()]} ${String(d.getDate()).padStart(
    2,
    "0"
  )} ${mesi[d.getMonth()]} ${d.getFullYear()}`;
}

function formatHHMM(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(
    2,
    "0"
  )}`;
}

function toTs(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : null;
  }
  if (v && typeof v === "object" && typeof v.toMillis === "function") {
    const t = v.toMillis();
    return typeof t === "number" && Number.isFinite(t) ? t : null;
  }
  return null;
}

function normalizeMezzi(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw?.value && Array.isArray(raw.value)) return raw.value;
  return [];
}

export default function AutistiAdmin() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabKey>("rifornimenti");
  const [day, setDay] = useState<Date>(() => new Date());

  // ORA CORRENTE per LIVE
  const [nowTs, setNowTs] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowTs(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const [events, setEvents] = useState<HomeEvent[]>([]);
  const [storicoRimorchi, setStoricoRimorchi] = useState<any[]>([]);
  const [, setStoricoCambiMotrice] = useState<any[]>([]);
  const [, setRimorchiLive] = useState<RimorchioStatus[]>([]);
  const [sessioniRaw, setSessioniRaw] = useState<any[]>([]);
  const [mezziAziendali, setMezziAziendali] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modale modifica sessione
  const [editOpen, setEditOpen] = useState(false);
  const [editTargetTarga, setEditTargetTarga] = useState<string | null>(null);
  const [editAutista, setEditAutista] = useState("");
  const [editMotrice, setEditMotrice] = useState("");
  const [editRimorchio, setEditRimorchio] = useState("");
  const [adminEditOpen, setAdminEditOpen] = useState(false);
  const [adminEditKind, setAdminEditKind] = useState<
    | "rifornimento"
    | "segnalazione"
    | "attrezzature"
    | "controllo"
    | "cambio"
    | "aggancio"
    | "sgancio"
    | null
  >(null);
  const [adminEditId, setAdminEditId] = useState<string | null>(null);
  const [adminEditOriginal, setAdminEditOriginal] = useState<any>(null);
  const [adminEditForm, setAdminEditForm] = useState<any>({});
  const [adminEditNote, setAdminEditNote] = useState("");
  const [adminEditFotos, setAdminEditFotos] = useState<string[]>([]);
  const [adminEditFotoDataUrl, setAdminEditFotoDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const e = await loadHomeEvents(day);

        const s = (await getItemSync(KEY_SGANCIO_RIMORCHI)) || [];
        const all = Array.isArray(s) ? s : [];

        const live = await loadRimorchiStatus();

        const sess = (await getItemSync(KEY_SESSIONI)) || [];
        const sessArr = Array.isArray(sess) ? sess : [];

        const cambi = (await getItemSync(KEY_CAMBI_MOTRICE)) || [];
        const cambiArr = Array.isArray(cambi) ? cambi : [];

        const mezziRaw = await getItemSync(KEY_MEZZI);
        const mezziArr = normalizeMezzi(mezziRaw);

        if (!alive) return;
        setEvents(e);
        setStoricoRimorchi(all);
        setStoricoCambiMotrice(cambiArr);
        setRimorchiLive(live);
        setSessioniRaw(sessArr);
        setMezziAziendali(mezziArr);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [day]);

  const filtered = useMemo(() => {
    let list: HomeEvent[] = [];
    switch (tab) {
      case "rifornimenti":
        list = events.filter((e) => e.tipo === "rifornimento");
        break;
      case "segnalazioni":
        list = events.filter((e) => e.tipo === "segnalazione");
        break;
      case "controlli":
        list = events.filter((e) => e.tipo === "controllo");
        break;
      case "cambi":
        list = events.filter((e) => e.tipo === "cambio_mezzo");
        break;
      case "attrezzature":
        list = events.filter((e) => (e as any).tipo === "richiesta_attrezzature");
        break;
      default:
        list = [];
    }

    if (tab === "rifornimenti" || tab === "segnalazioni" || tab === "attrezzature") {
      return [...list].sort((a, b) => getRecordTs(b.payload) - getRecordTs(a.payload));
    }
    return list;
  }, [events, tab]);

  const mezziByTarga = useMemo(() => {
    const map = new Map<string, string>();
    mezziAziendali.forEach((m) => {
      const t = String(m?.targa ?? "").trim().toUpperCase();
      if (!t) return;
      const cat = String(m?.categoria ?? "").trim();
      if (cat) map.set(t, cat);
    });
    return map;
  }, [mezziAziendali]);

  function getCategoria(targa?: string | null) {
    const key = String(targa ?? "").trim().toUpperCase();
    if (!key) return "-";
    return mezziByTarga.get(key) || "-";
  }

  
  function getCategoriaValue(targa?: string | null) {
    const key = String(targa ?? "").trim().toUpperCase();
    if (!key) return "";
    return mezziByTarga.get(key) || "";
  }

  function getRecordTs(record: any) {
    return (
      toTs(record?.timestamp ?? record?.data ?? record?.adminEdit?.editedAt) ??
      0
    );
  }

  function toDateTimeLocal(ts: number) {
    if (!ts) return "";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  function fromDateTimeLocal(value: string) {
    if (!value) return 0;
    const ts = Date.parse(value);
    return Number.isFinite(ts) ? ts : 0;
  }

  function updateAdminForm(key: string, value: any) {
    setAdminEditForm((prev: any) => ({ ...prev, [key]: value }));
  }

  function renderTargaCategoria(targa?: string | null) {
    const value = targa ? String(targa) : "-";
    return (
      <>
        <strong>{value}</strong>
        <span className="sep">|</span>
        <span className="muted">categoria: {getCategoria(targa)}</span>
      </>
    );
  }

  function renderTargaPill(
    label: string,
    targa?: string | null,
    categoria?: string | null,
    variant?: "danger" | "neutral" | "ok"
  ) {
    const value = targa ? String(targa) : "-";
    const cat = categoria && categoria !== "-" ? String(categoria) : "";
    const isMissing = !targa;
    const className = [
      "targa-pill",
      variant === "danger" ? "danger" : "",
      variant === "ok" ? "ok" : "",
      isMissing ? "neutral" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={className} aria-label={label}>
        <div className="targa-main">{value}</div>
        {cat ? <div className="targa-sub">cat. {cat}</div> : null}
      </div>
    );
  }

  function normalizeTargaValue(value: any): string {
    return String(value ?? "").trim().toUpperCase();
  }

  function resolveCambioFlags(record: any): { motrice?: boolean; rimorchio?: boolean } {
    const pairs = [
      ["targaMotricePrima", "targaMotriceDopo", "motrice"],
      ["targaCamionPrima", "targaCamionDopo", "motrice"],
      ["targaMotriceOld", "targaMotriceNew", "motrice"],
      ["targaCamionOld", "targaCamionNew", "motrice"],
      ["targaMotriceFrom", "targaMotriceTo", "motrice"],
      ["targaCamionFrom", "targaCamionTo", "motrice"],
      ["targaRimorchioPrima", "targaRimorchioDopo", "rimorchio"],
      ["targaRimorchioOld", "targaRimorchioNew", "rimorchio"],
      ["targaRimorchioFrom", "targaRimorchioTo", "rimorchio"],
    ] as const;

    let motriceFlag: boolean | undefined;
    let rimorchioFlag: boolean | undefined;

    pairs.forEach(([fromKey, toKey, target]) => {
      const fromVal = record?.[fromKey];
      const toVal = record?.[toKey];
      if (fromVal == null || toVal == null) return;
      const changed = normalizeTargaValue(fromVal) !== normalizeTargaValue(toVal);
      if (target === "motrice" && motriceFlag === undefined) motriceFlag = changed;
      if (target === "rimorchio" && rimorchioFlag === undefined) rimorchioFlag = changed;
    });

    if (motriceFlag === undefined && rimorchioFlag === undefined) return {};
    return { motrice: motriceFlag, rimorchio: rimorchioFlag };
  }

  function getLivePillClass(stato: string, alert: boolean) {
    if (alert) return "pill-danger";
    if (stato === "ACCOPPIATO") return "pill-ok";
    if (stato === "SOLO MOTRICE") return "pill-warn";
    return "pill-warn";
  }

  const agganciRimorchi = useMemo(() => {
    // SOLO storico: eventi certi di aggancio (no merge con LIVE).
    return storicoRimorchi
      .filter((x) => x?.timestampAggancio && isSameDay(x.timestampAggancio, day))
      .map((x) => ({ ...x, _ts: x.timestampAggancio }))
      .sort((a, b) => (b._ts ?? 0) - (a._ts ?? 0));
  }, [storicoRimorchi, day]);

  const sganciRimorchi = useMemo(() => {
    return storicoRimorchi
      .filter((x) => x?.timestampSgancio && isSameDay(x.timestampSgancio, day))
      .map((x) => ({ ...x, _ts: x.timestampSgancio }))
      .sort((a, b) => (b._ts ?? 0) - (a._ts ?? 0));
  }, [storicoRimorchi, day]);

  const sessioniLive = useMemo(() => {
    return sessioniRaw
      .map((s, idx) => {
        const targaMotrice = s?.targaMotrice ?? null;
        const targaRimorchio = s?.targaRimorchio ?? null;
        const autista = s?.nomeAutista ?? s?.autistaNome ?? s?.autista ?? null;
        const badgeAutista = s?.badgeAutista ?? null;
        const ts = toTs(s?.timestamp) ?? 0;
        let stato = "SESSIONE INCOMPLETA";
        let alert = false;
        if (targaMotrice && targaRimorchio) stato = "ACCOPPIATO";
        else if (targaMotrice && !targaRimorchio) stato = "SOLO MOTRICE";
        else if (!targaMotrice && targaRimorchio) {
          stato = "RIMORCHIO SENZA MOTRICE";
          alert = true;
        }
        return {
          key: s?.id ?? `${targaMotrice ?? "m"}_${targaRimorchio ?? "r"}_${idx}`,
          targaMotrice,
          targaRimorchio,
          autista,
          badgeAutista,
          ts,
          stato,
          alert,
        };
      })
      .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
  }, [sessioniRaw]);

  const showAdminVerifica =
    adminEditKind !== "attrezzature" &&
    ((adminEditOriginal &&
      ("flagVerifica" in adminEditOriginal || "motivoVerifica" in adminEditOriginal)) ||
      !!adminEditForm.flagVerifica ||
      !!adminEditForm.motivoVerifica);
  const showAdminStato =
    (adminEditOriginal && "stato" in adminEditOriginal) || !!adminEditForm.stato;
  const showAdminLetta =
    (adminEditOriginal && "letta" in adminEditOriginal) || !!adminEditForm.letta;
  const showAdminTarga =
    adminEditKind === "segnalazione" &&
    ((adminEditOriginal && "targa" in adminEditOriginal) || !!adminEditForm.targa);

  async function forceLibero(targaRimorchio: string) {
    const sess = (await getItemSync(KEY_SESSIONI)) || [];
    if (!Array.isArray(sess)) return;

    const updated = sess.map((s) => {
      if (s?.targaRimorchio !== targaRimorchio) return s;
      return {
        ...s,
        targaRimorchio: null,
        adminEdit: {
          edited: true,
          editedAt: Date.now(),
          editedBy: "admin",
          note: "Forzato LIBERO da Centro rettifica",
        },
      };
    });

    await setItemSync(KEY_SESSIONI, updated);

    const live = await loadRimorchiStatus();
    const sess2 = (await getItemSync(KEY_SESSIONI)) || [];
    setRimorchiLive(live);
    setSessioniRaw(Array.isArray(sess2) ? sess2 : []);
  }

  function openEditSession(targaRimorchio: string) {
    const s = sessioniRaw.find((x) => x?.targaRimorchio === targaRimorchio) || null;

    setEditTargetTarga(targaRimorchio);
    setEditAutista(String(s?.nomeAutista ?? s?.autistaNome ?? ""));
    setEditMotrice(String(s?.targaMotrice ?? ""));
    setEditRimorchio(String(s?.targaRimorchio ?? targaRimorchio));
    setEditOpen(true);
  }

  async function saveEditSession() {
    if (!editTargetTarga) return;

    const sess = (await getItemSync(KEY_SESSIONI)) || [];
    if (!Array.isArray(sess)) return;

    const updated = sess.map((s) => {
      if (s?.targaRimorchio !== editTargetTarga) return s;

      return {
        ...s,
        nomeAutista: editAutista.trim() || null,
        autistaNome: editAutista.trim() || null,
        targaMotrice: editMotrice.trim() || null,
        targaRimorchio: editRimorchio.trim() || null,
        adminEdit: {
          edited: true,
          editedAt: Date.now(),
          editedBy: "admin",
          note: "Modifica sessione attiva da Centro rettifica",
          patch: {
            autistaNome: editAutista.trim() || null,
            targaMotrice: editMotrice.trim() || null,
            targaRimorchio: editRimorchio.trim() || null,
          },
        },
      };
    });

    await setItemSync(KEY_SESSIONI, updated);

    const live = await loadRimorchiStatus();
    const sess2 = (await getItemSync(KEY_SESSIONI)) || [];
    setRimorchiLive(live);
    setSessioniRaw(Array.isArray(sess2) ? sess2 : []);

    setEditOpen(false);
    setEditTargetTarga(null);
  }

  function renderCategoriaLine(targa?: string | null) {
    const cat = getCategoriaValue(targa);
    if (!cat) return null;
    return <div className="admin-edit-cat">cat. {cat}</div>;
  }

  function openAdminEdit(
    kind:
      | "rifornimento"
      | "segnalazione"
      | "attrezzature"
      | "controllo"
      | "cambio"
      | "aggancio"
      | "sgancio",
    record: any,
    fallbackId?: string
  ) {
    const base = record || {};
    const ts =
      kind === "cambio"
        ? toTs(base.timestampCambio) ?? getRecordTs(base)
        : kind === "aggancio"
        ? toTs(base.timestampAggancio) ?? getRecordTs(base)
        : kind === "sgancio"
        ? toTs(base.timestampSgancio) ?? getRecordTs(base)
        : getRecordTs(base);
    const id = String(base?.id ?? fallbackId ?? "");
    const check = base.check || {};
    const condizioni = base.condizioni || {};
    const generali = condizioni.generali || {};
    const specifiche = condizioni.specifiche || {};

    setAdminEditKind(kind);
    setAdminEditId(id || null);
    setAdminEditOriginal(base);
    setAdminEditForm({
      autistaNome: String(base.autista ?? base.autistaNome ?? base.nomeAutista ?? ""),
      badgeAutista: String(base.badgeAutista ?? ""),
      targaCamion: String(base.targaCamion ?? base.targaMotrice ?? ""),
      targaRimorchio: String(base.targaRimorchio ?? ""),
      targa: String(base.targa ?? ""),
      ambito: String(base.ambito ?? base.target ?? ""),
      target: String(base.target ?? ""),
      tipo: String(base.tipo ?? ""),
      metodoPagamento: String(base.metodoPagamento ?? ""),
      paese: String(base.paese ?? ""),
      km: base.km ?? "",
      litri: base.litri ?? "",
      importo: base.importo ?? "",
      note: String(base.note ?? ""),
      obbligatorio: !!base.obbligatorio,
      checkGomme: !!check.gomme,
      checkFreni: !!check.freni,
      checkLuci: !!check.luci,
      checkPerdite: !!check.perdite,
      luogo: String(base.luogo ?? ""),
      statoCarico: String(base.statoCarico ?? ""),
      condFreni: !!generali.freni,
      condGomme: !!generali.gomme,
      condPerdite: !!generali.perdite,
      condBotole: !!specifiche.botole,
      condCinghie: !!specifiche.cinghie,
      condStecche: !!specifiche.stecche,
      condTubi: !!specifiche.tubi,
      flagVerifica: !!base.flagVerifica,
      motivoVerifica: String(base.motivoVerifica ?? ""),
      tipoProblema: String(base.tipoProblema ?? ""),
      descrizione: String(base.descrizione ?? ""),
      stato: String(base.stato ?? ""),
      letta: !!base.letta,
      testo: String(base.testo ?? ""),
      dataOra: toDateTimeLocal(ts),
    });
    setAdminEditNote(String(base.adminEdit?.note ?? ""));
    setAdminEditFotos(Array.isArray(base.foto) ? base.foto.slice() : []);
    setAdminEditFotoDataUrl(base.fotoDataUrl ?? null);
    setAdminEditOpen(true);
  }

  function closeAdminEdit() {
    setAdminEditOpen(false);
    setAdminEditKind(null);
    setAdminEditId(null);
    setAdminEditOriginal(null);
    setAdminEditForm({});
    setAdminEditNote("");
    setAdminEditFotos([]);
    setAdminEditFotoDataUrl(null);
  }

  function removeSegnalazioneFoto(index: number) {
    setAdminEditFotos((prev) => prev.filter((_, i) => i !== index));
  }

  function normalizeValue(v: any) {
    if (v === undefined || v === "") return null;
    return v;
  }

  function valuesEqual(a: any, b: any) {
    const left = normalizeValue(a);
    const right = normalizeValue(b);
    if (Array.isArray(left) || Array.isArray(right)) {
      return JSON.stringify(left || []) === JSON.stringify(right || []);
    }
    return left === right;
  }

  function buildPatch(original: any, next: any, fields: string[]) {
    const patch: Record<string, any> = {};
    fields.forEach((field) => {
      if (!valuesEqual(original?.[field], next?.[field])) {
        patch[field] = next?.[field];
      }
    });
    return patch;
  }

  async function saveAdminEdit() {
    if (!adminEditKind || !adminEditId) return;

    const key =
      adminEditKind === "rifornimento"
        ? KEY_RIFORNIMENTI
        : adminEditKind === "segnalazione"
        ? KEY_SEGNALAZIONI
        : adminEditKind === "attrezzature"
        ? KEY_RICHIESTE_ATTREZZATURE
        : adminEditKind === "controllo"
        ? KEY_CONTROLLI
        : adminEditKind === "aggancio" || adminEditKind === "sgancio"
        ? KEY_SGANCIO_RIMORCHI
        : KEY_CAMBI_MOTRICE;

    const raw = (await getItemSync(key)) || [];
    if (!Array.isArray(raw)) return;

    const idx = raw.findIndex((r) => String(r?.id ?? "") === String(adminEditId));
    if (idx < 0) return;

    const original = raw[idx] || {};
    const next = { ...original };

    const dataOra = fromDateTimeLocal(adminEditForm.dataOra || "");
    const ts = dataOra || getRecordTs(original);
    if (adminEditKind === "cambio") {
      next.timestampCambio = ts;
      if ("timestamp" in original) next.timestamp = ts;
    } else if (adminEditKind === "aggancio") {
      next.timestampAggancio = ts;
    } else if (adminEditKind === "sgancio") {
      next.timestampSgancio = ts;
    } else {
      next.timestamp = ts;
      if (adminEditKind !== "attrezzature" && ("data" in original || adminEditForm.dataOra)) {
        next.data = ts;
      }
    }

    if (adminEditKind === "rifornimento") {
      next.autistaNome = adminEditForm.autistaNome.trim() || null;
      next.badgeAutista = adminEditForm.badgeAutista.trim() || null;
      next.targaCamion = adminEditForm.targaCamion.trim() || null;
      next.targaRimorchio = adminEditForm.targaRimorchio.trim() || null;
      next.tipo = adminEditForm.tipo.trim() || null;
      next.metodoPagamento = adminEditForm.metodoPagamento.trim() || null;
      next.paese = adminEditForm.paese.trim() || null;
      next.km =
        adminEditForm.km === "" ? null : Number.isFinite(Number(adminEditForm.km))
          ? Number(adminEditForm.km)
          : null;
      next.litri =
        adminEditForm.litri === "" ? null : Number.isFinite(Number(adminEditForm.litri))
          ? Number(adminEditForm.litri)
          : null;
      next.importo =
        adminEditForm.importo === "" ? null : Number.isFinite(Number(adminEditForm.importo))
          ? Number(adminEditForm.importo)
          : null;
      next.note = adminEditForm.note.trim() || null;
      if ("flagVerifica" in original || adminEditForm.flagVerifica) {
        next.flagVerifica = !!adminEditForm.flagVerifica;
      }
      if ("motivoVerifica" in original || adminEditForm.motivoVerifica) {
        next.motivoVerifica = adminEditForm.motivoVerifica.trim() || null;
      }
    }

    if (adminEditKind === "segnalazione") {
      next.autistaNome = adminEditForm.autistaNome.trim() || null;
      next.badgeAutista = adminEditForm.badgeAutista.trim() || null;
      next.targaCamion = adminEditForm.targaCamion.trim() || null;
      next.targaRimorchio = adminEditForm.targaRimorchio.trim() || null;
      if ("targa" in original || adminEditForm.targa.trim()) {
        next.targa = adminEditForm.targa.trim() || null;
      }
      if ("ambito" in original || adminEditForm.ambito.trim()) {
        next.ambito = adminEditForm.ambito.trim() || null;
      }
      if ("target" in original || adminEditForm.ambito.trim()) {
        next.target = adminEditForm.ambito.trim() || null;
      }
      next.tipoProblema = adminEditForm.tipoProblema.trim() || null;
      next.descrizione = adminEditForm.descrizione.trim() || null;
      next.note = adminEditForm.note.trim() || null;
      if ("stato" in original || adminEditForm.stato) {
        next.stato = adminEditForm.stato.trim() || null;
      }
      if ("letta" in original || adminEditForm.letta) {
        next.letta = !!adminEditForm.letta;
      }
      if ("flagVerifica" in original || adminEditForm.flagVerifica) {
        next.flagVerifica = !!adminEditForm.flagVerifica;
      }
      if ("motivoVerifica" in original || adminEditForm.motivoVerifica) {
        next.motivoVerifica = adminEditForm.motivoVerifica.trim() || null;
      }
      next.foto = adminEditFotos;
    }

    if (adminEditKind === "attrezzature") {
      next.testo = adminEditForm.testo.trim() || null;
      next.autistaNome = adminEditForm.autistaNome.trim() || null;
      next.badgeAutista = adminEditForm.badgeAutista.trim() || null;
      next.targaCamion = adminEditForm.targaCamion.trim() || null;
      next.targaRimorchio = adminEditForm.targaRimorchio.trim() || null;
      if ("stato" in original || adminEditForm.stato) {
        next.stato = adminEditForm.stato.trim() || null;
      }
      if ("letta" in original || adminEditForm.letta) {
        next.letta = !!adminEditForm.letta;
      }
      next.fotoDataUrl = adminEditFotoDataUrl || null;
    }

    if (adminEditKind === "controllo") {
      next.autistaNome = adminEditForm.autistaNome.trim() || null;
      next.badgeAutista = adminEditForm.badgeAutista.trim() || null;
      next.targaCamion = adminEditForm.targaCamion.trim() || null;
      next.targaRimorchio = adminEditForm.targaRimorchio.trim() || null;
      next.target = adminEditForm.target.trim() || null;
      next.note = adminEditForm.note.trim() || null;
      if ("obbligatorio" in original || adminEditForm.obbligatorio) {
        next.obbligatorio = !!adminEditForm.obbligatorio;
      }
      next.check = {
        gomme: !!adminEditForm.checkGomme,
        freni: !!adminEditForm.checkFreni,
        luci: !!adminEditForm.checkLuci,
        perdite: !!adminEditForm.checkPerdite,
      };
    }

    if (adminEditKind === "cambio") {
      next.autista = adminEditForm.autistaNome.trim() || null;
      next.badgeAutista = adminEditForm.badgeAutista.trim() || null;
      next.targaMotrice = adminEditForm.targaCamion.trim() || null;
      next.luogo = adminEditForm.luogo.trim() || null;
      next.condizioni = {
        generali: {
          freni: !!adminEditForm.condFreni,
          gomme: !!adminEditForm.condGomme,
          perdite: !!adminEditForm.condPerdite,
        },
        specifiche: {
          botole: !!adminEditForm.condBotole,
          cinghie: !!adminEditForm.condCinghie,
          stecche: !!adminEditForm.condStecche,
          tubi: !!adminEditForm.condTubi,
        },
      };
    }

    if (adminEditKind === "aggancio" || adminEditKind === "sgancio") {
      next.autista = adminEditForm.autistaNome.trim() || null;
      next.badgeAutista = adminEditForm.badgeAutista.trim() || null;
      next.targaMotrice = adminEditForm.targaCamion.trim() || null;
      next.targaRimorchio = adminEditForm.targaRimorchio.trim() || null;
      next.luogo = adminEditForm.luogo.trim() || null;
      next.statoCarico = adminEditForm.statoCarico.trim() || null;
      next.condizioni = {
        generali: {
          freni: !!adminEditForm.condFreni,
          gomme: !!adminEditForm.condGomme,
          perdite: !!adminEditForm.condPerdite,
        },
        specifiche: {
          botole: !!adminEditForm.condBotole,
          cinghie: !!adminEditForm.condCinghie,
          stecche: !!adminEditForm.condStecche,
          tubi: !!adminEditForm.condTubi,
        },
      };
    }

    const patchFields =
      adminEditKind === "rifornimento"
        ? [
            "autistaNome",
            "badgeAutista",
            "targaCamion",
            "targaRimorchio",
            "tipo",
            "metodoPagamento",
            "paese",
            "km",
            "litri",
            "importo",
            "note",
            "flagVerifica",
            "motivoVerifica",
            "timestamp",
            "data",
          ]
        : adminEditKind === "segnalazione"
        ? [
            "autistaNome",
            "badgeAutista",
            "ambito",
            "target",
            "targaCamion",
            "targaRimorchio",
            "targa",
            "tipoProblema",
            "descrizione",
            "note",
            "stato",
            "letta",
            "flagVerifica",
            "motivoVerifica",
            "foto",
            "timestamp",
            "data",
          ]
        : adminEditKind === "attrezzature"
        ? [
            "testo",
            "autistaNome",
            "badgeAutista",
            "targaCamion",
            "targaRimorchio",
            "stato",
            "letta",
            "fotoDataUrl",
            "timestamp",
          ]
        : adminEditKind === "controllo"
        ? [
            "autistaNome",
            "badgeAutista",
            "targaCamion",
            "targaRimorchio",
            "target",
            "check",
            "note",
            "obbligatorio",
            "timestamp",
          ]
        : adminEditKind === "aggancio"
        ? [
            "autista",
            "badgeAutista",
            "targaMotrice",
            "targaRimorchio",
            "luogo",
            "statoCarico",
            "condizioni",
            "timestampAggancio",
          ]
        : adminEditKind === "sgancio"
        ? [
            "autista",
            "badgeAutista",
            "targaMotrice",
            "targaRimorchio",
            "luogo",
            "statoCarico",
            "condizioni",
            "timestampSgancio",
          ]
        : [
            "autista",
            "badgeAutista",
            "targaMotrice",
            "luogo",
            "condizioni",
            "timestampCambio",
          ];

    next.adminEdit = {
      edited: true,
      editedAt: Date.now(),
      editedBy: "admin",
      note: adminEditNote.trim() || null,
      patch: buildPatch(original, next, patchFields),
    };

    const updated = [...raw];
    updated[idx] = next;
    await setItemSync(key, updated);

    const e = await loadHomeEvents(day);
    setEvents(e);
    closeAdminEdit();
  }

  return (
    <div className="autisti-admin-page">
      <div className="autisti-admin-wrap">
        <div className="autisti-admin-head">
          <div className="autisti-admin-head-left">
            <button
              type="button"
              className="autisti-admin-logo"
              onClick={() => navigate("/")}
              title="Home"
            >
              <img src="/logo.png" alt="Logo" />
            </button>
            <button
              type="button"
              className="autisti-admin-back"
              onClick={() => navigate("/autisti-inbox")}
            >
              {"<"} INBOX
            </button>
          </div>

          <h1>Centro rettifica dati</h1>
        </div>

        {/* LIVE RIMORCHI */}
        <div className="autisti-admin-card">
          <div className="autisti-admin-card-head">
            <h2>Sessioni attive (LIVE)</h2>
            {loading && <span className="loading">Caricamento...</span>}
          </div>

          {!loading && sessioniLive.length === 0 && (
            <div className="empty">Nessun rimorchio agganciato al momento.</div>
          )}

          {sessioniLive.map((s) => (
            <div className={`row ${s.alert ? "pill-danger" : ""}`} key={`live_${s.key}`}>
              <div className="row-left">
                {/* ORA CORRENTE */}
                <div className="time">{s.ts ? formatHHMM(s.ts) : formatHHMM(nowTs)}</div>
                <div className="main">
                  <div className="line1">
                    <span className={`pill ${getLivePillClass(s.stato, s.alert)}`}>{s.stato}</span>
                    <span className="sep">|</span>
                    <span>{s.autista ?? "-"}</span>
                    <span className="sep">|</span>
                    <span className="muted">badge {s.badgeAutista ?? "-"}</span>
                  </div>
                  <div className="line2 targa-pills-row">
                    {renderTargaPill("Motrice", s.targaMotrice, getCategoria(s.targaMotrice))}
                    {renderTargaPill(
                      "Rimorchio",
                      s.targaRimorchio,
                      getCategoria(s.targaRimorchio),
                      !s.targaMotrice && s.targaRimorchio ? "danger" : undefined
                    )}
                  </div>
                </div>
              </div>

              <div className="row-actions">
                {s.targaRimorchio ? (
                  <>
                    <button
                      type="button"
                      className="edit"
                      onClick={() => openEditSession(s.targaRimorchio as string)}
                    >
                      MODIFICA
                    </button>
                    <button
                      type="button"
                      className="edit danger"
                      onClick={() => forceLibero(s.targaRimorchio as string)}
                      title="Rimuove il rimorchio dalla sessione attiva"
                    >
                      FORZA LIBERO
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* TABS + DATA */}
        <div className="autisti-admin-topbar">
          <div className="autisti-admin-tabs">
            <button
              className={tab === "rifornimenti" ? "tab active" : "tab"}
              onClick={() => setTab("rifornimenti")}
              type="button"
            >
              Rifornimenti
            </button>
            <button
              className={tab === "segnalazioni" ? "tab active" : "tab"}
              onClick={() => setTab("segnalazioni")}
              type="button"
            >
              Segnalazioni
            </button>
            <button
              className={tab === "controlli" ? "tab active" : "tab"}
              onClick={() => setTab("controlli")}
              type="button"
            >
              Controllo mezzo
            </button>
            <button
              className={tab === "cambi" ? "tab active" : "tab"}
              onClick={() => setTab("cambi")}
              type="button"
            >
              Cambio mezzo
            </button>
            <button
              className={tab === "attrezzature" ? "tab active" : "tab"}
              onClick={() => setTab("attrezzature")}
              type="button"
            >
              Richieste attrezzature
            </button>
          </div>

          <div className="autisti-admin-datebar">
            <button
              type="button"
              className="nav"
              onClick={() =>
                setDay((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1))
              }
              title="Giorno precedente"
            >
              {"<"}
            </button>

            <span className="label">{formatDayLabel(day)}</span>

            <button
              type="button"
              className="nav"
              onClick={() =>
                setDay((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))
              }
              title="Giorno successivo"
            >
              {">"}
            </button>
          </div>
        </div>

        {/* LISTA PER CATEGORIA */}
        <div className="autisti-admin-card">
          <div className="autisti-admin-card-head">
            <h2>{tab === "cambi" ? "Cambio mezzo (motrice)" : tab.toUpperCase()}</h2>
            {loading && <span className="loading">Caricamento...</span>}
          </div>

          {!loading && filtered.length === 0 && (
            <div className="empty">Nessun elemento per questa data.</div>
          )}

          {filtered.map((e) => {
            const p = e.payload || {};
            const isCtrl = e.tipo === "controllo";
            const isAttrezzature = e.tipo === "richiesta_attrezzature";
            const isRifornSegn = e.tipo === "rifornimento" || e.tipo === "segnalazione";
            const isCambio = e.tipo === "cambio_mezzo";
            const targaCamion = p?.targaCamion ?? p?.targaMotrice ?? null;
            const targaRimorchio = p?.targaRimorchio ?? null;
            const categoriaCamion = targaCamion ? getCategoriaValue(targaCamion) : "";
            const rowTs =
              (e.tipo === "rifornimento" ||
              e.tipo === "segnalazione" ||
              e.tipo === "richiesta_attrezzature")
                ? getRecordTs(p) || e.timestamp
                : e.timestamp;
            const editKind =
              e.tipo === "rifornimento"
                ? "rifornimento"
                : e.tipo === "segnalazione"
                ? "segnalazione"
                : e.tipo === "richiesta_attrezzature"
                ? "attrezzature"
                : e.tipo === "controllo"
                ? "controllo"
                : e.tipo === "cambio_mezzo"
                ? "cambio"
                : null;
            const cambioFlags = isCambio ? resolveCambioFlags(p) : {};
            let motriceVariant: "ok" | "danger" | undefined;
            let rimorchioVariant: "ok" | "danger" | undefined;
            if (cambioFlags.motrice !== undefined || cambioFlags.rimorchio !== undefined) {
              if (cambioFlags.motrice && cambioFlags.rimorchio) {
                motriceVariant = "ok";
                rimorchioVariant = "ok";
              } else if (cambioFlags.motrice && cambioFlags.rimorchio === false) {
                motriceVariant = "ok";
                rimorchioVariant = "danger";
              } else if (cambioFlags.motrice === false && cambioFlags.rimorchio) {
                motriceVariant = "danger";
                rimorchioVariant = "ok";
              }
            }
            return (
              <div className="row" key={e.id}>
                <div className="row-left">
                  <div className="time">{formatHHMM(rowTs)}</div>
                  <div className="main">
                    <div className="line1">
                      {isCtrl ? (
                        <>
                          <span>{e.autista ?? "-"}</span>
                          <span className="sep">|</span>
                          <span className="muted">{String(p.target || "??").toUpperCase()}</span>
                        </>
                      ) : isAttrezzature ? (
                        <span>{e.autista ?? "-"}</span>
                      ) : isRifornSegn ? (
                        <span>{e.autista ?? "-"}</span>
                      ) : (
                        <>
                          {renderTargaCategoria(e.targa ?? "-")}
                          <span className="sep">|</span>
                          <span>{e.autista ?? "-"}</span>
                        </>
                      )}
                    </div>

                    {isCtrl ? (
                      <div className="line2 targa-pills-row">
                        {renderTargaPill("Motrice", p.targaCamion, getCategoria(p.targaCamion))}
                        {renderTargaPill(
                          "Rimorchio",
                          p.targaRimorchio,
                          getCategoria(p.targaRimorchio)
                        )}
                      </div>
                    ) : isRifornSegn ? (
                      <div className="line2">
                        <span>Targa: {targaCamion ? String(targaCamion) : "-"}</span>
                        {targaRimorchio ? (
                          <>
                            <span className="sep">|</span>
                            <span>Rim: {String(targaRimorchio)}</span>
                          </>
                        ) : null}
                        {categoriaCamion ? (
                          <>
                            <span className="sep">|</span>
                            <span>Categoria: {categoriaCamion}</span>
                          </>
                        ) : null}
                      </div>
                    ) : isCambio ? (
                      <div className="line2 targa-pills-row">
                        {renderTargaPill(
                          "Motrice",
                          targaCamion,
                          getCategoria(targaCamion),
                          motriceVariant
                        )}
                        {renderTargaPill(
                          "Rimorchio",
                          targaRimorchio,
                          getCategoria(targaRimorchio),
                          rimorchioVariant
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                {editKind ? (
                  <button
                    type="button"
                    className="edit"
                    onClick={() => openAdminEdit(editKind, p, e.id)}
                  >
                    MODIFICA
                  </button>
                ) : (
                  <button type="button" className="edit" disabled title="Step successivo">
                    MODIFICA
                  </button>
                )}
              </div>
                );
              })}
            </div>
        {tab === "cambi" && (
          <>
            <div className="autisti-admin-card">
              <div className="autisti-admin-card-head">
                <h2>Agganci rimorchi</h2>
                {loading && <span className="loading">Caricamento...</span>}
              </div>

              {!loading && agganciRimorchi.length === 0 && (
                <div className="empty">Nessun aggancio per questa data.</div>
              )}

              {agganciRimorchi.map((a) => (
                <div className="row" key={a.id ?? `${a._ts}_${a.targaRimorchio}`}>
                  <div className="row-left">
                    <div className="time">{a._ts ? formatHHMM(a._ts) : "--:--"}</div>
                    <div className="main">
                      <div className="line1">
                        <span>{a.autista ?? "-"}</span>
                      </div>
                      <div className="line2 targa-pills-row">
                        {renderTargaPill("Motrice", a.targaMotrice, getCategoria(a.targaMotrice))}
                        {renderTargaPill(
                          "Rimorchio",
                          a.targaRimorchio,
                          getCategoria(a.targaRimorchio)
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="edit"
                    onClick={() => openAdminEdit("aggancio", a, a.id)}
                  >
                    MODIFICA
                  </button>
                </div>
              ))}
            </div>

            <div className="autisti-admin-card">
              <div className="autisti-admin-card-head">
                <h2>Sganci rimorchi</h2>
                {loading && <span className="loading">Caricamento...</span>}
              </div>

              {!loading && sganciRimorchi.length === 0 && (
                <div className="empty">Nessuno sgancio per questa data.</div>
              )}

              {sganciRimorchi.map((s) => (
                <div className="row" key={s.id ?? `${s._ts}_${s.targaRimorchio}`}>
                  <div className="row-left">
                    <div className="time">{s._ts ? formatHHMM(s._ts) : "--:--"}</div>
                    <div className="main">
                      <div className="line1">
                        <span>{s.autista ?? "-"}</span>
                      </div>
                      <div className="line2 targa-pills-row">
                        {renderTargaPill("Motrice", s.targaMotrice, getCategoria(s.targaMotrice))}
                        {renderTargaPill(
                          "Rimorchio",
                          s.targaRimorchio,
                          getCategoria(s.targaRimorchio)
                        )}
                      </div>
                    </div>
                  </div>

                  <button type="button" className="edit" disabled title="Step successivo">
                    MODIFICA
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* MODALE EDIT EVENTI */}
        {adminEditOpen && adminEditKind && (
          <div className="aix-backdrop" onMouseDown={closeAdminEdit}>
            <div className="aix-modal admin-edit-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="aix-head">
                <h3>
                  {adminEditKind === "rifornimento"
                    ? "Modifica rifornimento"
                    : adminEditKind === "segnalazione"
                    ? "Modifica segnalazione"
                    : adminEditKind === "attrezzature"
                    ? "Modifica richiesta attrezzature"
                    : adminEditKind === "controllo"
                    ? "Modifica controllo mezzo"
                    : adminEditKind === "aggancio"
                    ? "Modifica aggancio rimorchio"
                    : adminEditKind === "sgancio"
                    ? "Modifica sgancio rimorchio"
                    : "Modifica cambio mezzo"}
                </h3>
                <button className="aix-close" type="button" onClick={closeAdminEdit}>
                  CHIUDI
                </button>
              </div>

              <div className="aix-body admin-edit-body">
                <div className="admin-edit-scroll">
                  <div className="admin-edit-section">
                    <h4>Autista</h4>
                    <div className="admin-edit-grid">
                      <label>
                        Nome
                        <input
                          value={adminEditForm.autistaNome ?? ""}
                          onChange={(e) => updateAdminForm("autistaNome", e.target.value)}
                        />
                      </label>
                      <label>
                        Badge
                        <input
                          value={adminEditForm.badgeAutista ?? "-"}
                          onChange={(e) => updateAdminForm("badgeAutista", e.target.value)}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="admin-edit-section">
                    <h4>Mezzo</h4>
                    <div className="admin-edit-grid">
                      <label>
                        Motrice
                        <input
                          value={adminEditForm.targaCamion ?? ""}
                          onChange={(e) => updateAdminForm("targaCamion", e.target.value)}
                        />
                        {renderCategoriaLine(adminEditForm.targaCamion)}
                      </label>
                      {adminEditKind !== "cambio" &&
                      ((adminEditForm.targaRimorchio ?? "") ||
                        adminEditOriginal?.targaRimorchio) ? (
                        <label>
                          Rimorchio
                          <input
                            value={adminEditForm.targaRimorchio ?? ""}
                            onChange={(e) => updateAdminForm("targaRimorchio", e.target.value)}
                          />
                          {renderCategoriaLine(adminEditForm.targaRimorchio)}
                        </label>
                      ) : null}
                      {adminEditKind === "segnalazione" ? (
                        <label>
                          Ambito
                          <select
                            value={adminEditForm.ambito ?? ""}
                            onChange={(e) => updateAdminForm("ambito", e.target.value)}
                          >
                            <option value="">—</option>
                            <option value="motrice">Motrice</option>
                            <option value="rimorchio">Rimorchio</option>
                            <option value="entrambi">Entrambi</option>
                          </select>
                        </label>
                      ) : null}
                      {showAdminTarga ? (
                        <label>
                          Targa (se presente)
                          <input
                            value={adminEditForm.targa ?? ""}
                            onChange={(e) => updateAdminForm("targa", e.target.value)}
                          />
                          {renderCategoriaLine(adminEditForm.targa)}
                        </label>
                      ) : null}
                    </div>
                  </div>

                  <div className="admin-edit-section">
                    <h4>Dati</h4>
                    <div className="admin-edit-grid">
                      <label>
                        Data/Ora
                        <input
                          type="datetime-local"
                          value={adminEditForm.dataOra ?? ""}
                          onChange={(e) => updateAdminForm("dataOra", e.target.value)}
                        />
                      </label>

                      {adminEditKind === "rifornimento" ? (
                        <>
                          <label>
                            Tipo
                            <input
                              value={adminEditForm.tipo ?? ""}
                              onChange={(e) => updateAdminForm("tipo", e.target.value)}
                            />
                          </label>
                          <label>
                            Metodo pagamento
                            <input
                              value={adminEditForm.metodoPagamento ?? ""}
                              onChange={(e) => updateAdminForm("metodoPagamento", e.target.value)}
                            />
                          </label>
                          <label>
                            Paese
                            <input
                              value={adminEditForm.paese ?? ""}
                              onChange={(e) => updateAdminForm("paese", e.target.value)}
                            />
                          </label>
                          <label>
                            KM
                            <input
                              type="number"
                              value={adminEditForm.km ?? ""}
                              onChange={(e) => updateAdminForm("km", e.target.value)}
                            />
                          </label>
                          <label>
                            Litri
                            <input
                              type="number"
                              value={adminEditForm.litri ?? ""}
                              onChange={(e) => updateAdminForm("litri", e.target.value)}
                            />
                          </label>
                          <label>
                            Importo
                            <input
                              type="number"
                              value={adminEditForm.importo ?? ""}
                              onChange={(e) => updateAdminForm("importo", e.target.value)}
                            />
                          </label>
                          <label className="admin-edit-full">
                            Note
                            <textarea
                              value={adminEditForm.note ?? ""}
                              onChange={(e) => updateAdminForm("note", e.target.value)}
                            />
                          </label>
                        </>
                      ) : null}

                      {adminEditKind === "segnalazione" ? (
                        <>
                          <label>
                            Tipo problema
                            <input
                              value={adminEditForm.tipoProblema ?? ""}
                              onChange={(e) => updateAdminForm("tipoProblema", e.target.value)}
                            />
                          </label>
                          <label className="admin-edit-full">
                            Descrizione
                            <textarea
                              value={adminEditForm.descrizione ?? ""}
                              onChange={(e) => updateAdminForm("descrizione", e.target.value)}
                            />
                          </label>
                          <label className="admin-edit-full">
                            Note
                            <textarea
                              value={adminEditForm.note ?? ""}
                              onChange={(e) => updateAdminForm("note", e.target.value)}
                            />
                          </label>
                        </>
                      ) : null}

                      {adminEditKind === "attrezzature" ? (
                        <label className="admin-edit-full">
                          Testo
                          <textarea
                            value={adminEditForm.testo ?? ""}
                            onChange={(e) => updateAdminForm("testo", e.target.value)}
                          />
                        </label>
                      ) : null}

                      {adminEditKind === "controllo" ? (
                        <>
                          <label>
                            Target
                            <select
                              value={adminEditForm.target ?? ""}
                              onChange={(e) => updateAdminForm("target", e.target.value)}
                            >
                              <option value="">-</option>
                              <option value="motrice">Motrice</option>
                              <option value="rimorchio">Rimorchio</option>
                              <option value="entrambi">Entrambi</option>
                            </select>
                          </label>
                          <label className="admin-edit-checkbox">
                            <input
                              type="checkbox"
                              checked={!!adminEditForm.checkGomme}
                              onChange={(e) => updateAdminForm("checkGomme", e.target.checked)}
                            />
                            Gomme
                          </label>
                          <label className="admin-edit-checkbox">
                            <input
                              type="checkbox"
                              checked={!!adminEditForm.checkFreni}
                              onChange={(e) => updateAdminForm("checkFreni", e.target.checked)}
                            />
                            Freni
                          </label>
                          <label className="admin-edit-checkbox">
                            <input
                              type="checkbox"
                              checked={!!adminEditForm.checkLuci}
                              onChange={(e) => updateAdminForm("checkLuci", e.target.checked)}
                            />
                            Luci
                          </label>
                          <label className="admin-edit-checkbox">
                            <input
                              type="checkbox"
                              checked={!!adminEditForm.checkPerdite}
                              onChange={(e) => updateAdminForm("checkPerdite", e.target.checked)}
                            />
                            Perdite
                          </label>
                          <label className="admin-edit-checkbox">
                            <input
                              type="checkbox"
                              checked={!!adminEditForm.obbligatorio}
                              onChange={(e) => updateAdminForm("obbligatorio", e.target.checked)}
                            />
                            Obbligatorio
                          </label>
                          <label className="admin-edit-full">
                            Note
                            <textarea
                              value={adminEditForm.note ?? ""}
                              onChange={(e) => updateAdminForm("note", e.target.value)}
                            />
                          </label>
                        </>
                      ) : null}

                      {adminEditKind === "cambio" ||
                      adminEditKind === "aggancio" ||
                      adminEditKind === "sgancio" ? (
                        <>
                          <label className="admin-edit-full">
                            Luogo
                            <input
                              value={adminEditForm.luogo ?? ""}
                              onChange={(e) => updateAdminForm("luogo", e.target.value)}
                            />
                          </label>
                          {adminEditKind === "aggancio" || adminEditKind === "sgancio" ? (
                            <label>
                              Stato carico
                              <select
                                value={adminEditForm.statoCarico ?? ""}
                                onChange={(e) => updateAdminForm("statoCarico", e.target.value)}
                              >
                                <option value="">-</option>
                                <option value="PIENO">Pieno</option>
                                <option value="PARZIALE">Parziale</option>
                                <option value="VUOTO">Vuoto</option>
                              </select>
                            </label>
                          ) : null}
                          <label className="admin-edit-checkbox">
                            <input
                              type="checkbox"
                              checked={!!adminEditForm.condFreni}
                              onChange={(e) => updateAdminForm("condFreni", e.target.checked)}
                            />
                            Freni
                          </label>
                          <label className="admin-edit-checkbox">
                            <input
                              type="checkbox"
                              checked={!!adminEditForm.condGomme}
                              onChange={(e) => updateAdminForm("condGomme", e.target.checked)}
                            />
                            Gomme
                          </label>
                          <label className="admin-edit-checkbox">
                            <input
                              type="checkbox"
                              checked={!!adminEditForm.condPerdite}
                              onChange={(e) => updateAdminForm("condPerdite", e.target.checked)}
                            />
                            Perdite
                          </label>
                          <label className="admin-edit-checkbox">
                            <input
                              type="checkbox"
                              checked={!!adminEditForm.condBotole}
                              onChange={(e) => updateAdminForm("condBotole", e.target.checked)}
                            />
                            Botole
                          </label>
                          <label className="admin-edit-checkbox">
                            <input
                              type="checkbox"
                              checked={!!adminEditForm.condCinghie}
                              onChange={(e) => updateAdminForm("condCinghie", e.target.checked)}
                            />
                            Cinghie
                          </label>
                          <label className="admin-edit-checkbox">
                            <input
                              type="checkbox"
                              checked={!!adminEditForm.condStecche}
                              onChange={(e) => updateAdminForm("condStecche", e.target.checked)}
                            />
                            Stecche
                          </label>
                          <label className="admin-edit-checkbox">
                            <input
                              type="checkbox"
                              checked={!!adminEditForm.condTubi}
                              onChange={(e) => updateAdminForm("condTubi", e.target.checked)}
                            />
                            Tubi
                          </label>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="admin-edit-section">
                    <h4>Stato</h4>
                    <div className="admin-edit-grid">
                      {showAdminStato ? (
                        <label>
                          Stato
                          <input
                            value={adminEditForm.stato ?? ""}
                            onChange={(e) => updateAdminForm("stato", e.target.value)}
                          />
                        </label>
                      ) : null}
                      {showAdminLetta ? (
                        <label className="admin-edit-checkbox">
                          <input
                            type="checkbox"
                            checked={!!adminEditForm.letta}
                            onChange={(e) => updateAdminForm("letta", e.target.checked)}
                          />
                          Letta
                        </label>
                      ) : null}
                      {showAdminVerifica ? (
                        <label className="admin-edit-checkbox">
                          <input
                            type="checkbox"
                            checked={!!adminEditForm.flagVerifica}
                            onChange={(e) => updateAdminForm("flagVerifica", e.target.checked)}
                          />
                          Flag verifica
                        </label>
                      ) : null}
                      {showAdminVerifica ? (
                        <label className="admin-edit-full">
                          Motivo verifica
                          <input
                            value={adminEditForm.motivoVerifica ?? ""}
                            onChange={(e) => updateAdminForm("motivoVerifica", e.target.value)}
                          />
                        </label>
                      ) : null}
                    </div>
                  </div>

                  <div className="admin-edit-section">
                    <h4>Foto</h4>
                    {adminEditKind === "segnalazione" && adminEditFotos.length > 0 ? (
                      <div className="admin-edit-photos">
                        {adminEditFotos.map((url, idx) => (
                          <div className="admin-edit-photo" key={`foto_${idx}`}>
                            <img src={url} alt={`foto_${idx}`} />
                            <button
                              type="button"
                              className="edit danger"
                              onClick={() => removeSegnalazioneFoto(idx)}
                            >
                              RIMUOVI
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {adminEditKind === "attrezzature" && adminEditFotoDataUrl ? (
                      <div className="admin-edit-photos">
                        <div className="admin-edit-photo">
                          <img src={adminEditFotoDataUrl} alt="foto_attrezzature" />
                          <button
                            type="button"
                            className="edit danger"
                            onClick={() => setAdminEditFotoDataUrl(null)}
                          >
                            RIMUOVI
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="admin-edit-section">
                    <h4>Note admin</h4>
                    <div className="admin-edit-grid">
                      <label className="admin-edit-full">
                        Note
                        <textarea
                          value={adminEditNote}
                          onChange={(e) => setAdminEditNote(e.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="admin-edit-actions">
                  <button className="edit" type="button" onClick={closeAdminEdit}>
                    ANNULLA
                  </button>
                  <button className="edit" type="button" onClick={saveAdminEdit}>
                    SALVA
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODALE EDIT SESSIONE LIVE */}
        {editOpen && (
          <div className="aix-backdrop" onMouseDown={() => setEditOpen(false)}>
            <div className="aix-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="aix-head">
                <h3>Modifica sessione rimorchio LIVE</h3>
                <button className="aix-close" type="button" onClick={() => setEditOpen(false)}>
                  CHIUDI
                </button>
              </div>

              <div className="aix-body">
                <div className="aix-form">
                  <label>
                    Autista
                    <input value={editAutista} onChange={(e) => setEditAutista(e.target.value)} />
                  </label>
                  <label>
                    Motrice
                    <input value={editMotrice} onChange={(e) => setEditMotrice(e.target.value)} />
                  </label>
                  <label>
                    Rimorchio
                    <input value={editRimorchio} onChange={(e) => setEditRimorchio(e.target.value)} />
                  </label>
                </div>

                <div className="aix-actions">
                  <button className="edit" type="button" onClick={saveEditSession}>
                    SALVA
                  </button>
                  {editTargetTarga ? (
                    <button
                      className="edit danger"
                      type="button"
                      onClick={() => forceLibero(editTargetTarga)}
                    >
                      FORZA LIBERO
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}





