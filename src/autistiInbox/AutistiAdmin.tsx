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

const KEY_SESSIONI = "@autisti_sessione_attive";
const KEY_MEZZI = "@mezzi_aziendali";
const KEY_CONTROLLI = "@controlli_mezzo_autisti";
const KEY_RIFORNIMENTI = "@rifornimenti_autisti_tmp";
const KEY_SEGNALAZIONI = "@segnalazioni_autisti_tmp";
const KEY_RICHIESTE_ATTREZZATURE = "@richieste_attrezzature_autisti_tmp";
const KEY_STORICO_EVENTI_OPERATIVI = "@storico_eventi_operativi";

type TabKey =
  | "rifornimenti"
  | "segnalazioni"
  | "controlli"
  | "attrezzature"
  | "storico_cambio";

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

function toStrOrNull(v: any): string | null {
  if (v === undefined || v === null || v === "") return null;
  return String(v);
}

function formatDateTime(ts: number) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const [storicoOperativi, setStoricoOperativi] = useState<any[]>([]);
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
    | null
  >(null);
  const [adminEditId, setAdminEditId] = useState<string | null>(null);
  const [adminEditOriginal, setAdminEditOriginal] = useState<any>(null);
  const [adminEditForm, setAdminEditForm] = useState<any>({});
  const [adminEditNote, setAdminEditNote] = useState("");
  const [adminEditFotos, setAdminEditFotos] = useState<string[]>([]);
  const [adminEditFotoDataUrl, setAdminEditFotoDataUrl] = useState<string | null>(null);
  const [canonEditOpen, setCanonEditOpen] = useState(false);
  const [canonEditId, setCanonEditId] = useState<string | null>(null);
  const [canonEditIndex, setCanonEditIndex] = useState<number | null>(null);
  const [canonEditForm, setCanonEditForm] = useState<any>({});

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const e = await loadHomeEvents(day);

        const operativi = (await getItemSync(KEY_STORICO_EVENTI_OPERATIVI)) || [];
        const operativiArr = Array.isArray(operativi) ? operativi : [];

        const live = await loadRimorchiStatus();

        const sess = (await getItemSync(KEY_SESSIONI)) || [];
        const sessArr = Array.isArray(sess) ? sess : [];

        const mezziRaw = await getItemSync(KEY_MEZZI);
        const mezziArr = normalizeMezzi(mezziRaw);

        if (!alive) return;
        setEvents(e);
        setStoricoOperativi(operativiArr);
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
      case "attrezzature":
        list = events.filter((e) => (e as any).tipo === "richiesta_attrezzature");
        break;
      case "storico_cambio":
        list = [];
        break;
      default:
        list = [];
    }

    if (tab === "rifornimenti" || tab === "segnalazioni" || tab === "attrezzature") {
      return [...list].sort((a, b) => getRecordTs(b.payload) - getRecordTs(a.payload));
    }
    return list;
  }, [events, tab]);

  const cambioCanonico = useMemo(() => {
    const list: Array<any> = [];
    if (!Array.isArray(storicoOperativi)) return list;
    storicoOperativi.forEach((evt, index) => {
      const tipo = String(evt?.tipo ?? "");
      if (tipo !== "CAMBIO_ASSETTO") return;
      const ts = toTs(evt?.timestamp);
      if (!ts) return;
      if (!isSameDay(ts, day)) return;
      list.push({ ...evt, _ts: ts, _index: index });
    });
    return list.sort((a, b) => (b._ts ?? 0) - (a._ts ?? 0));
  }, [storicoOperativi, day]);

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

  function normTarga(value?: string | null) {
    return String(value ?? "").trim().toUpperCase();
  }

  function getCategoriaValue(targa?: string | null) {
    const key = String(targa ?? "").trim().toUpperCase();
    if (!key) return "";
    return mezziByTarga.get(key) || "";
  }

  function getCambioCanonSnapshot(record: any) {
    const primaMotrice = toStrOrNull(
      record?.prima?.motrice ??
        record?.prima?.targaMotrice ??
        record?.primaMotrice ??
        record?.targaMotricePrima ??
        null
    );
    const dopoMotrice = toStrOrNull(
      record?.dopo?.motrice ??
        record?.dopo?.targaMotrice ??
        record?.dopoMotrice ??
        record?.targaMotriceDopo ??
        null
    );
    const primaRimorchio = toStrOrNull(
      record?.prima?.rimorchio ??
        record?.prima?.targaRimorchio ??
        record?.primaRimorchio ??
        record?.targaRimorchioPrima ??
        null
    );
    const dopoRimorchio = toStrOrNull(
      record?.dopo?.rimorchio ??
        record?.dopo?.targaRimorchio ??
        record?.dopoRimorchio ??
        record?.targaRimorchioDopo ??
        null
    );
    return {
      prima: { motrice: primaMotrice, rimorchio: primaRimorchio },
      dopo: { motrice: dopoMotrice, rimorchio: dopoRimorchio },
    };
  }

  function isSameCambioValue(a: string | null, b: string | null) {
    const aa = (a ?? "").trim().toUpperCase();
    const bb = (b ?? "").trim().toUpperCase();
    if (!aa && !bb) return true;
    return aa === bb;
  }

  function buildCambioLine(label: string, prima: string | null, dopo: string | null) {
    if ((!prima && !dopo) || isSameCambioValue(prima, dopo)) return null;
    const left = prima ? String(prima) : "-";
    const right = dopo ? String(dopo) : "-";
    return `${label}: ${left} -> ${right}`;
  }

  function getCambioBadgeNome(record: any) {
    const badge = toStrOrNull(record?.badgeAutista ?? record?.badge ?? null);
    const nome = toStrOrNull(
      record?.nomeAutista ?? record?.autistaNome ?? record?.autista ?? null
    );
    return {
      badge: badge ?? "-",
      nome: nome ?? "-",
    };
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

  function getLivePillClass(stato: string, alert: boolean) {
    if (alert) return "pill-danger";
    if (stato === "ACCOPPIATO") return "pill-ok";
    if (stato === "SOLO MOTRICE") return "pill-warn";
    return "pill-warn";
  }

  const conflitti = useMemo(() => {
    const motrici = new Map<
      string,
      Array<{ badgeAutista: string | null; nomeAutista: string | null }>
    >();
    const rimorchi = new Map<
      string,
      Array<{ badgeAutista: string | null; nomeAutista: string | null }>
    >();

    sessioniRaw.forEach((s) => {
      const badgeAutista = s?.badgeAutista ?? null;
      const nomeAutista = s?.nomeAutista ?? s?.autistaNome ?? s?.autista ?? null;
      const targaMotrice = normTarga(s?.targaMotrice ?? null);
      const targaRimorchio = normTarga(s?.targaRimorchio ?? null);

      if (targaMotrice) {
        const list = motrici.get(targaMotrice) || [];
        list.push({ badgeAutista, nomeAutista });
        motrici.set(targaMotrice, list);
      }

      if (targaRimorchio) {
        const list = rimorchi.get(targaRimorchio) || [];
        list.push({ badgeAutista, nomeAutista });
        rimorchi.set(targaRimorchio, list);
      }
    });

    const motriciConflict = new Map(
      Array.from(motrici.entries()).filter(([, list]) => list.length > 1)
    );
    const rimorchiConflict = new Map(
      Array.from(rimorchi.entries()).filter(([, list]) => list.length > 1)
    );

    return { motrici: motriciConflict, rimorchi: rimorchiConflict };
  }, [sessioniRaw]);

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
        const motriceKey = normTarga(targaMotrice);
        const rimorchioKey = normTarga(targaRimorchio);
        const motriceOthers = motriceKey
          ? (conflitti.motrici.get(motriceKey) || []).filter(
              (c) => c.badgeAutista !== badgeAutista
            )
          : [];
        const rimorchioOthers = rimorchioKey
          ? (conflitti.rimorchi.get(rimorchioKey) || []).filter(
              (c) => c.badgeAutista !== badgeAutista
            )
          : [];
        const seen = new Set<string>();
        const conflictList = [...motriceOthers, ...rimorchioOthers]
          .map((c) => {
            const badge = c.badgeAutista ? `badge ${c.badgeAutista}` : "badge -";
            const nome = c.nomeAutista ?? "-";
            return `${badge} (${nome})`;
          })
          .filter((label) => {
            if (seen.has(label)) return false;
            seen.add(label);
            return true;
          });
        const conflictText =
          conflictList.length > 0 ? `in uso anche da: ${conflictList.join(", ")}` : "";
        return {
          key: s?.id ?? `${targaMotrice ?? "m"}_${targaRimorchio ?? "r"}_${idx}`,
          targaMotrice,
          targaRimorchio,
          autista,
          badgeAutista,
          ts,
          stato,
          alert,
          conflict: conflictList.length > 0,
          conflictText,
        };
      })
      .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
  }, [conflitti, sessioniRaw]);

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

  async function forceLibero(
    badgeAutista: string,
    scope: "MOTRICE" | "RIMORCHIO" | "TUTTO",
    reason: string
  ) {
    const sess = (await getItemSync(KEY_SESSIONI)) || [];
    if (!Array.isArray(sess)) return;

    const note = reason.trim() || "forza libero";
    const now = Date.now();
    const updated = sess.map((s) => {
      if (s?.badgeAutista !== badgeAutista) return s;
      const next = { ...s };
      if (scope === "MOTRICE" || scope === "TUTTO") {
        next.targaMotrice = null;
      }
      if (scope === "RIMORCHIO" || scope === "TUTTO") {
        next.targaRimorchio = null;
      }
      return {
        ...next,
        revoked: {
          ...(s?.revoked || {}),
          by: "ADMIN",
          at: now,
          scope,
          reason: note,
        },
        adminEdit: {
          ...(s?.adminEdit || {}),
          edited: true,
          editedAt: now,
          editedBy: "admin",
          note,
        },
      };
    });

    await setItemSync(KEY_SESSIONI, updated);

    const live = await loadRimorchiStatus();
    const sess2 = (await getItemSync(KEY_SESSIONI)) || [];
    setRimorchiLive(live);
    setSessioniRaw(Array.isArray(sess2) ? sess2 : []);
  }

  async function deleteSessione(badgeAutista: string) {
    const sess = (await getItemSync(KEY_SESSIONI)) || [];
    if (!Array.isArray(sess)) return;

    const updated = sess.filter((s) => s?.badgeAutista !== badgeAutista);
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
      | "controllo",
    record: any,
    fallbackId?: string
  ) {
    const base = record || {};
    const ts = getRecordTs(base);
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

  function openCanonEdit(record: any) {
    const ts = toTs(record?.timestamp) ?? 0;
    const { prima, dopo } = getCambioCanonSnapshot(record);
    const { badge, nome } = getCambioBadgeNome(record);
    setCanonEditId(record?.id ? String(record.id) : null);
    setCanonEditIndex(
      typeof record?._index === "number" ? Number(record._index) : null
    );
    setCanonEditForm({
      dataOra: ts ? toDateTimeLocal(ts) : "",
      badgeAutista: badge ?? "",
      nomeAutista: nome ?? "",
      luogo: record?.luogo ?? "",
      primaMotrice: prima.motrice ?? "",
      dopoMotrice: dopo.motrice ?? "",
      primaRimorchio: prima.rimorchio ?? "",
      dopoRimorchio: dopo.rimorchio ?? "",
    });
    setCanonEditOpen(true);
  }

  function closeCanonEdit() {
    setCanonEditOpen(false);
    setCanonEditId(null);
    setCanonEditIndex(null);
    setCanonEditForm({});
  }

  function updateCanonForm(key: string, value: any) {
    setCanonEditForm((prev: any) => ({ ...prev, [key]: value }));
  }

  async function saveCanonEdit() {
    const raw = (await getItemSync(KEY_STORICO_EVENTI_OPERATIVI)) || [];
    if (!Array.isArray(raw)) return;

    let idx = -1;
    if (canonEditId) {
      idx = raw.findIndex((r) => String(r?.id ?? "") === String(canonEditId));
    }
    if (idx < 0 && canonEditIndex != null && canonEditIndex >= 0) {
      idx = canonEditIndex;
    }
    if (idx < 0) return;

    const original = raw[idx] || {};
    const dataOra = fromDateTimeLocal(canonEditForm.dataOra || "");
    const ts = dataOra || toTs(original?.timestamp) || Date.now();
    const badgeAutista = String(canonEditForm.badgeAutista ?? "").trim() || null;
    const nomeAutista = String(canonEditForm.nomeAutista ?? "").trim() || null;
    const luogo = String(canonEditForm.luogo ?? "").trim() || null;
    const primaMotrice = String(canonEditForm.primaMotrice ?? "").trim() || null;
    const dopoMotrice = String(canonEditForm.dopoMotrice ?? "").trim() || null;
    const primaRimorchio = String(canonEditForm.primaRimorchio ?? "").trim() || null;
    const dopoRimorchio = String(canonEditForm.dopoRimorchio ?? "").trim() || null;

    const next = {
      ...original,
      timestamp: ts,
      badgeAutista,
      nomeAutista,
      autista: nomeAutista ?? original?.autista ?? null,
      autistaNome: nomeAutista ?? original?.autistaNome ?? null,
      luogo,
      prima: {
        ...(original?.prima || {}),
        motrice: primaMotrice,
        targaMotrice: primaMotrice,
        rimorchio: primaRimorchio,
        targaRimorchio: primaRimorchio,
      },
      dopo: {
        ...(original?.dopo || {}),
        motrice: dopoMotrice,
        targaMotrice: dopoMotrice,
        rimorchio: dopoRimorchio,
        targaRimorchio: dopoRimorchio,
      },
      adminEdit: {
        ...(original?.adminEdit || {}),
        edited: true,
        editedAt: Date.now(),
        editedBy: "ADMIN",
        note: original?.adminEdit?.note ?? "",
      },
    };

    const updated = raw.slice();
    updated[idx] = next;
    await setItemSync(KEY_STORICO_EVENTI_OPERATIVI, updated);
    setStoricoOperativi(updated);
    closeCanonEdit();
  }

  async function deleteCanonEvent() {
    if (!canonEditId && canonEditIndex == null) return;
    const confirmDelete = window.confirm("Eliminare questo evento?");
    if (!confirmDelete) return;

    const raw = (await getItemSync(KEY_STORICO_EVENTI_OPERATIVI)) || [];
    if (!Array.isArray(raw)) return;

    const updated = raw.filter((r, idx) => {
      if (canonEditId) return String(r?.id ?? "") !== String(canonEditId);
      return idx !== canonEditIndex;
    });

    await setItemSync(KEY_STORICO_EVENTI_OPERATIVI, updated);
    setStoricoOperativi(updated);
    closeCanonEdit();
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
        : null;
    if (!key) return;

    const raw = (await getItemSync(key)) || [];
    if (!Array.isArray(raw)) return;

    const idx = raw.findIndex((r) => String(r?.id ?? "") === String(adminEditId));
    if (idx < 0) return;

    const original = raw[idx] || {};
    const next = { ...original };

    const dataOra = fromDateTimeLocal(adminEditForm.dataOra || "");
    const ts = dataOra || getRecordTs(original);
    next.timestamp = ts;
    if (adminEditKind !== "attrezzature" && ("data" in original || adminEditForm.dataOra)) {
      next.data = ts;
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
        : ["timestamp"];

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
            <div
              className={`row ${s.alert ? "pill-danger" : ""} ${s.conflict ? "conflict" : ""}`}
              key={`live_${s.key}`}
            >
              <div className="row-left">
                {/* ORA CORRENTE */}
                <div className="time">{s.ts ? formatHHMM(s.ts) : formatHHMM(nowTs)}</div>
                <div className="main">
                  <div className="line1">
                    <span className={`pill ${getLivePillClass(s.stato, s.alert)}`}>{s.stato}</span>
                    {s.conflict ? (
                      <>
                        <span className="sep">|</span>
                        <span className="pill conflict">CONFLITTO</span>
                      </>
                    ) : null}
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
                  {s.conflictText ? (
                    <div className="line2 conflict-note">{s.conflictText}</div>
                  ) : null}
                </div>
              </div>

              <div className="row-actions">
                {s.badgeAutista ? (
                  <>
                    <button
                      type="button"
                      className="edit"
                      onClick={() => openEditSession(s.targaRimorchio as string)}
                      disabled={!s.targaRimorchio}
                    >
                      MODIFICA
                    </button>
                    <button
                      type="button"
                      className="edit danger"
                      disabled={!s.targaMotrice}
                      onClick={() => {
                        if (!s.badgeAutista) return;
                        const ok = window.confirm(
                          `Forzare LIBERO MOTRICE per badge ${s.badgeAutista}?`
                        );
                        if (!ok) return;
                        const reason =
                          window.prompt("Motivo revoca", "forza libero") || "forza libero";
                        forceLibero(s.badgeAutista, "MOTRICE", reason);
                      }}
                      title="Rimuove la motrice dalla sessione attiva"
                    >
                      FORZA LIBERO MOTRICE
                    </button>
                    <button
                      type="button"
                      className="edit danger"
                      disabled={!s.targaRimorchio}
                      onClick={() => {
                        if (!s.badgeAutista) return;
                        const ok = window.confirm(
                          `Forzare LIBERO RIMORCHIO per badge ${s.badgeAutista}?`
                        );
                        if (!ok) return;
                        const reason =
                          window.prompt("Motivo revoca", "forza libero") || "forza libero";
                        forceLibero(s.badgeAutista, "RIMORCHIO", reason);
                      }}
                      title="Rimuove il rimorchio dalla sessione attiva"
                    >
                      FORZA LIBERO RIMORCHIO
                    </button>
                    <button
                      type="button"
                      className="edit danger"
                      disabled={!s.targaMotrice && !s.targaRimorchio}
                      onClick={() => {
                        if (!s.badgeAutista) return;
                        const ok = window.confirm(
                          `Forzare LIBERO TUTTO per badge ${s.badgeAutista}?`
                        );
                        if (!ok) return;
                        const reason =
                          window.prompt("Motivo revoca", "forza libero") || "forza libero";
                        forceLibero(s.badgeAutista, "TUTTO", reason);
                      }}
                      title="Rimuove motrice e rimorchio dalla sessione attiva"
                    >
                      FORZA LIBERO TUTTO
                    </button>
                    {!s.targaMotrice && !s.targaRimorchio ? (
                      <button
                        type="button"
                        className="edit danger"
                        onClick={() => {
                          if (!s.badgeAutista) return;
                          const ok = window.confirm(
                            `Eliminare la sessione per badge ${s.badgeAutista}?`
                          );
                          if (!ok) return;
                          deleteSessione(s.badgeAutista);
                        }}
                      >
                        ELIMINA SESSIONE
                      </button>
                    ) : null}
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
              className={tab === "storico_cambio" ? "tab active" : "tab"}
              onClick={() => setTab("storico_cambio")}
              type="button"
            >
              Cambio mezzo (storico canonico)
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
            <h2>
              {tab === "storico_cambio"
                ? "Cambio mezzo (storico canonico)"
                : tab.toUpperCase()}
            </h2>
            {loading && <span className="loading">Caricamento...</span>}
          </div>

          {!loading && tab !== "storico_cambio" && filtered.length === 0 && (
            <div className="empty">Nessun elemento per questa data.</div>
          )}

          {!loading && tab === "storico_cambio" && cambioCanonico.length === 0 && (
            <div className="empty">Nessun evento per questa data.</div>
          )}

          {tab !== "storico_cambio" &&
            filtered.map((e) => {
            const p = e.payload || {};
            const isCtrl = e.tipo === "controllo";
            const isAttrezzature = e.tipo === "richiesta_attrezzature";
            const isRifornSegn = e.tipo === "rifornimento" || e.tipo === "segnalazione";
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
                : null;
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

          {tab === "storico_cambio" && (
            <div className="canon-list">
              <div className="canon-row canon-row-head">
                <div className="canon-cell">Data/Ora</div>
                <div className="canon-cell">Badge/Nome</div>
                <div className="canon-cell">Luogo</div>
                <div className="canon-cell">Motrice</div>
                <div className="canon-cell">Rimorchio</div>
                <div className="canon-cell canon-actions">Azioni</div>
              </div>
              {cambioCanonico.map((evt) => {
                const ts = evt?._ts ?? toTs(evt?.timestamp) ?? 0;
                const { prima, dopo } = getCambioCanonSnapshot(evt);
                const motriceLine = buildCambioLine(
                  "MOTRICE",
                  prima.motrice,
                  dopo.motrice
                );
                const rimorchioLine = buildCambioLine(
                  "RIMORCHIO",
                  prima.rimorchio,
                  dopo.rimorchio
                );
                const { badge, nome } = getCambioBadgeNome(evt);
                const luogo = toStrOrNull(evt?.luogo) ?? "-";
                return (
                  <div
                    className="canon-row"
                    key={evt?.id ?? `${ts}-${evt?._index ?? 0}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => openCanonEdit(evt)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openCanonEdit(evt);
                    }}
                  >
                    <div className="canon-cell">{formatDateTime(ts)}</div>
                    <div className="canon-cell">{`BADGE ${badge} | ${nome}`}</div>
                    <div className="canon-cell">{luogo}</div>
                    <div className="canon-cell">{motriceLine ?? ""}</div>
                    <div className="canon-cell">{rimorchioLine ?? ""}</div>
                    <div className="canon-cell canon-actions">
                      <button
                        type="button"
                        className="edit"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          openCanonEdit(evt);
                        }}
                      >
                        MODIFICA
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
                    : "Modifica evento"}
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
                      {(adminEditForm.targaRimorchio ?? "") ||
                      adminEditOriginal?.targaRimorchio ? (
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

        {canonEditOpen && (
          <div className="aix-backdrop" onMouseDown={closeCanonEdit}>
            <div className="aix-modal admin-edit-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="aix-head">
                <h3>Modifica evento</h3>
                <button className="aix-close" type="button" onClick={closeCanonEdit}>
                  CHIUDI
                </button>
              </div>

              <div className="aix-body admin-edit-body">
                <div className="admin-edit-scroll">
                  <div className="admin-edit-section">
                    <h4>Evento</h4>
                    <div className="admin-edit-grid">
                      <label>
                        Data/Ora
                        <input
                          type="datetime-local"
                          value={canonEditForm.dataOra ?? ""}
                          onChange={(e) => updateCanonForm("dataOra", e.target.value)}
                        />
                      </label>
                      <label>
                        Badge
                        <input
                          value={canonEditForm.badgeAutista ?? ""}
                          onChange={(e) => updateCanonForm("badgeAutista", e.target.value)}
                        />
                      </label>
                      <label>
                        Nome
                        <input
                          value={canonEditForm.nomeAutista ?? ""}
                          onChange={(e) => updateCanonForm("nomeAutista", e.target.value)}
                        />
                      </label>
                      <label className="admin-edit-full">
                        Luogo
                        <input
                          value={canonEditForm.luogo ?? ""}
                          onChange={(e) => updateCanonForm("luogo", e.target.value)}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="admin-edit-section">
                    <h4>Prima</h4>
                    <div className="admin-edit-grid">
                      <label>
                        Motrice
                        <input
                          value={canonEditForm.primaMotrice ?? ""}
                          onChange={(e) => updateCanonForm("primaMotrice", e.target.value)}
                        />
                      </label>
                      <label>
                        Rimorchio
                        <input
                          value={canonEditForm.primaRimorchio ?? ""}
                          onChange={(e) => updateCanonForm("primaRimorchio", e.target.value)}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="admin-edit-section">
                    <h4>Dopo</h4>
                    <div className="admin-edit-grid">
                      <label>
                        Motrice
                        <input
                          value={canonEditForm.dopoMotrice ?? ""}
                          onChange={(e) => updateCanonForm("dopoMotrice", e.target.value)}
                        />
                      </label>
                      <label>
                        Rimorchio
                        <input
                          value={canonEditForm.dopoRimorchio ?? ""}
                          onChange={(e) => updateCanonForm("dopoRimorchio", e.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="admin-edit-actions">
                  <button className="edit" type="button" onClick={closeCanonEdit}>
                    ANNULLA
                  </button>
                  <button className="edit danger" type="button" onClick={deleteCanonEvent}>
                    ELIMINA EVENTO
                  </button>
                  <button className="edit" type="button" onClick={saveCanonEdit}>
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
                      onClick={() => {
                        const s =
                          sessioniRaw.find((x) => x?.targaRimorchio === editTargetTarga) || null;
                        if (!s?.badgeAutista) return;
                        forceLibero(s.badgeAutista, "RIMORCHIO", "forza libero");
                      }}
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





