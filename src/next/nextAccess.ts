import type { NextAreaId } from "./nextData";
import { NEXT_HOME_PATH } from "./nextStructuralPaths";

export type NextRole = "admin" | "gestionale" | "autista";

export type NextExperienceKind = "gestionale" | "autista-separata";

export type NextSpecialRouteId = "autista-separato";
export type NextGuardAreaId = NextAreaId | NextSpecialRouteId;

export type NextPermissionKey =
  | "next.centro-controllo"
  | "next.mezzi-dossier"
  | "next.operativita-globale"
  | "next.capo"
  | "next.colleghi"
  | "next.fornitori"
  | "next.ia"
  | "next.libretti-export"
  | "next.cisterna"
  | "next.autista-separato";

export type NextPermissionMatrix = Record<NextPermissionKey, boolean>;

export type NextRolePreset = {
  id: NextRole;
  label: string;
  shortLabel: string;
  description: string;
  landingPath: string;
  experience: NextExperienceKind;
  futureNote: string;
};

export type NextAreaAccessConfig = {
  permissionKey: NextPermissionKey;
  allowedRoles: NextRole[];
  futureScope: string;
};

export type NextSimulatedAccessProfile = NextRolePreset & {
  permissions: NextPermissionMatrix;
};

export const NEXT_ROLE_QUERY_PARAM = "role";
export const NEXT_DEFAULT_ROLE: NextRole = "admin";
export const NEXT_DRIVER_EXPERIENCE_PATH = "/next/autisti";

export const NEXT_ROLE_PRESETS: Record<NextRole, NextRolePreset> = {
  admin: {
    id: "admin",
    label: "Admin",
    shortLabel: "Admin",
    description:
      "Vede tutte le aree oggi attive del clone read-only e governa la futura matrice permessi dal lato gestionale.",
    landingPath: NEXT_HOME_PATH,
    experience: "gestionale",
    futureNote:
      "Base corretta per Super Admin e governo permessi, ma ancora senza auth reale o pannello backend.",
  },
  gestionale: {
    id: "gestionale",
    label: "Utente gestionale",
    shortLabel: "Gestionale",
    description:
      "Accede alle aree operative clone-safe gia aperte. In questa fase la visibilita resta simulata lato frontend.",
    landingPath: NEXT_HOME_PATH,
    experience: "gestionale",
    futureNote:
      "La visibilita attuale e un preset tecnico; in seguito verra sostituita o raffinata da permessi granulari per nick/utenza.",
  },
  autista: {
    id: "autista",
    label: "Autista",
    shortLabel: "Autista",
    description:
      "La sua esperienza resta separata dalla shell gestionale e passa ora da una tranche clone-safe dedicata sotto `/next/autisti`, con `Rifornimento`, `Segnalazioni` e `RichiestaAttrezzature` locali al clone.",
    landingPath: NEXT_DRIVER_EXPERIENCE_PATH,
    experience: "autista-separata",
    futureNote:
      "Terza tranche clone-safe chiusa sui moduli auditati: `AutistiGate`, `LoginAutista`, `SetupMezzo`, `ControlloMezzo`, `HomeAutista`, `CambioMezzoAutista`, `Rifornimento` clone-local, `Segnalazioni` con allegati locali, `RichiestaAttrezzature` con allegati locali e flusso `Gomme` clone-safe; i moduli avanzati restano fuori perimetro.",
  },
};

export const NEXT_AREA_ACCESS: Record<NextAreaId, NextAreaAccessConfig> = {
  "centro-controllo": {
    permissionKey: "next.centro-controllo",
    allowedRoles: ["admin", "gestionale"],
    futureScope: "Cockpit operativo clone-safe con quick link verso i moduli gia aperti o esplicitamente bloccati.",
  },
  "mezzi-dossier": {
    permissionKey: "next.mezzi-dossier",
    allowedRoles: ["admin", "gestionale"],
    futureScope: "Area mezzo-centrica clone-safe, ora riallineata su `Mezzi`, `Dossier Mezzi`, `Dossier Gomme`, `Dossier Rifornimenti` e `Analisi Economica` come route autonome.",
  },
  "operativita-globale": {
    permissionKey: "next.operativita-globale",
    allowedRoles: ["admin", "gestionale"],
    futureScope: "Famiglia clone read-only di `Gestione Operativa`, ora riallineata anche in route autonome per inventario, materiali consegnati, attrezzature cantieri, manutenzioni, acquisti, materiali da ordinare, ordini, dettaglio ordine, liste lavori, `Autisti Inbox` e `Autisti Admin` reader-first.",
  },
  "capo": {
    permissionKey: "next.capo",
    allowedRoles: ["admin", "gestionale"],
    futureScope: "Route capo gia attive nel clone, con consultazione aperta e writer di approvazione ancora bloccati.",
  },
  "colleghi": {
    permissionKey: "next.colleghi",
    allowedRoles: ["admin", "gestionale"],
    futureScope: "Anagrafica colleghi clone-safe in sola lettura.",
  },
  "fornitori": {
    permissionKey: "next.fornitori",
    allowedRoles: ["admin", "gestionale"],
    futureScope: "Anagrafica fornitori clone-safe in sola lettura.",
  },
  "ia": {
    permissionKey: "next.ia",
    allowedRoles: ["admin", "gestionale"],
    futureScope: "Hub clone read-only del modulo madre Intelligenza Artificiale, ora riallineato anche sulle child route strutturali (`apikey`, `libretto`, `documenti`, `copertura-libretti`) con scritture neutralizzate.",
  },
  "libretti-export": {
    permissionKey: "next.libretti-export",
    allowedRoles: ["admin", "gestionale"],
    futureScope: "Primo figlio IA clone-safe, limitato a lista, selezione e anteprima PDF locale.",
  },
  "cisterna": {
    permissionKey: "next.cisterna",
    allowedRoles: ["admin", "gestionale"],
    futureScope:
      "Route base clone-safe per archivio cisterna, report mensile e tabelle per targa, con IA, schede-test, export e salvataggi ancora bloccati.",
  },
};

export const NEXT_SPECIAL_ROUTE_ACCESS: Record<NextSpecialRouteId, NextAreaAccessConfig> = {
  "autista-separato": {
    permissionKey: "next.autista-separato",
    allowedRoles: ["autista"],
    futureScope:
      "Esperienza separata dalla shell admin, ora estesa anche a `Rifornimento` clone-local, `Segnalazioni` con allegati locali e `RichiestaAttrezzature` con allegati locali su `/next/autisti`, con gate/login/setup/controllo/home/cambio-mezzo e flusso gomme raggiungibile.",
  },
};

const NEXT_GUARD_AREA_ACCESS: Record<NextGuardAreaId, NextAreaAccessConfig> = {
  ...NEXT_AREA_ACCESS,
  ...NEXT_SPECIAL_ROUTE_ACCESS,
};

const NEXT_BASE_PERMISSIONS: Record<NextRole, NextPermissionMatrix> = {
  admin: {
    "next.centro-controllo": true,
    "next.mezzi-dossier": true,
    "next.operativita-globale": true,
    "next.capo": true,
    "next.colleghi": true,
    "next.fornitori": true,
    "next.ia": true,
    "next.libretti-export": true,
    "next.cisterna": true,
    "next.autista-separato": false,
  },
  gestionale: {
    "next.centro-controllo": true,
    "next.mezzi-dossier": true,
    "next.operativita-globale": true,
    "next.capo": true,
    "next.colleghi": true,
    "next.fornitori": true,
    "next.ia": true,
    "next.libretti-export": true,
    "next.cisterna": true,
    "next.autista-separato": false,
  },
  autista: {
    "next.centro-controllo": false,
    "next.mezzi-dossier": false,
    "next.operativita-globale": false,
    "next.capo": false,
    "next.colleghi": false,
    "next.fornitori": false,
    "next.ia": false,
    "next.libretti-export": false,
    "next.cisterna": false,
    "next.autista-separato": true,
  },
};

const isNextRole = (value: string): value is NextRole =>
  value === "admin" || value === "gestionale" || value === "autista";

export const normalizeNextRole = (value: string | null | undefined): NextRole => {
  if (!value) {
    return NEXT_DEFAULT_ROLE;
  }

  return isNextRole(value) ? value : NEXT_DEFAULT_ROLE;
};

export const getNextRoleFromSearch = (search: string): NextRole => {
  const params = new URLSearchParams(search);
  return normalizeNextRole(params.get(NEXT_ROLE_QUERY_PARAM));
};

export const buildNextPathWithRole = (
  pathname: string,
  role: NextRole,
  search = "",
): string => {
  const params = new URLSearchParams(search);
  params.set(NEXT_ROLE_QUERY_PARAM, role);

  const serialized = params.toString();
  return serialized ? `${pathname}?${serialized}` : pathname;
};

export const getNextRoleLandingPath = (role: NextRole): string => NEXT_ROLE_PRESETS[role].landingPath;

export const getNextSimulatedAccessProfile = (role: NextRole): NextSimulatedAccessProfile => ({
  ...NEXT_ROLE_PRESETS[role],
  permissions: { ...NEXT_BASE_PERMISSIONS[role] },
});

export const getGuardAreaAccessConfig = (areaId: NextGuardAreaId): NextAreaAccessConfig =>
  NEXT_GUARD_AREA_ACCESS[areaId];

export const canRoleAccessArea = (role: NextRole, areaId: NextAreaId): boolean => {
  const access = NEXT_AREA_ACCESS[areaId];
  return getNextSimulatedAccessProfile(role).permissions[access.permissionKey];
};

export const canRoleAccessGuardArea = (role: NextRole, areaId: NextGuardAreaId): boolean => {
  const access = getGuardAreaAccessConfig(areaId);
  return getNextSimulatedAccessProfile(role).permissions[access.permissionKey];
};

export const getVisibleNextAreaIds = (role: NextRole): NextAreaId[] => {
  const areaIds = Object.keys(NEXT_AREA_ACCESS) as NextAreaId[];
  return areaIds.filter((areaId) => canRoleAccessArea(role, areaId));
};
