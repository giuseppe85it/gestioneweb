import type { NextAreaId } from "./nextData";

export type NextRole = "admin" | "gestionale" | "autista";

export type NextExperienceKind = "gestionale" | "autista-separata";

export type NextPermissionKey =
  | "next.centro-controllo"
  | "next.mezzi-dossier"
  | "next.operativita-globale"
  | "next.ia-gestionale"
  | "next.strumenti-trasversali"
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
export const NEXT_DRIVER_EXPERIENCE_PATH = "/next/autista";

export const NEXT_ROLE_PRESETS: Record<NextRole, NextRolePreset> = {
  admin: {
    id: "admin",
    label: "Admin",
    shortLabel: "Admin",
    description:
      "Vede tutte le macro-aree della shell NEXT e governa la futura matrice permessi dal lato gestionale.",
    landingPath: "/next/centro-controllo",
    experience: "gestionale",
    futureNote:
      "Base corretta per Super Admin e governo permessi, ma ancora senza auth reale o pannello backend.",
  },
  gestionale: {
    id: "gestionale",
    label: "Utente gestionale",
    shortLabel: "Gestionale",
    description:
      "Accede solo alle aree operative autorizzate. In questa fase la visibilita e simulata lato frontend e pronta per una matrice futura per singola utenza.",
    landingPath: "/next/centro-controllo",
    experience: "gestionale",
    futureNote:
      "La visibilita attuale e un preset tecnico; in seguito verra sostituita o raffinata da permessi granulari per nick/utenza.",
  },
  autista: {
    id: "autista",
    label: "Autista",
    shortLabel: "Autista",
    description:
      "Non entra nella shell gestionale come utente ridotto. La sua esperienza resta concettualmente separata e continuera a vivere su percorsi dedicati.",
    landingPath: NEXT_DRIVER_EXPERIENCE_PATH,
    experience: "autista-separata",
    futureNote:
      "Questa simulazione ribadisce la separazione tra area autisti e backoffice; non implementa la UX finale dell'app autisti.",
  },
};

export const NEXT_AREA_ACCESS: Record<NextAreaId, NextAreaAccessConfig> = {
  "centro-controllo": {
    permissionKey: "next.centro-controllo",
    allowedRoles: ["admin", "gestionale"],
    futureScope: "Macro-area operativa ad alta priorita, candidata a permessi granulari per utente.",
  },
  "mezzi-dossier": {
    permissionKey: "next.mezzi-dossier",
    allowedRoles: ["admin", "gestionale"],
    futureScope: "Area mezzo-centrica da affinare con visibilita dossier, costi e documenti sensibili.",
  },
  "operativita-globale": {
    permissionKey: "next.operativita-globale",
    allowedRoles: ["admin", "gestionale"],
    futureScope: "Workflow globali e code operative, pronti per autorizzazioni per modulo/azione.",
  },
  "ia-gestionale": {
    permissionKey: "next.ia-gestionale",
    allowedRoles: ["admin", "gestionale"],
    futureScope: "Assistente business read-only, con eventuali scope futuri separati da audit tecnico e configurazioni sensibili.",
  },
  "strumenti-trasversali": {
    permissionKey: "next.strumenti-trasversali",
    allowedRoles: ["admin"],
    futureScope: "Area di governance, sistema e strumenti tecnici che non deve comparire a chi non ha potere amministrativo.",
  },
};

const NEXT_BASE_PERMISSIONS: Record<NextRole, NextPermissionMatrix> = {
  admin: {
    "next.centro-controllo": true,
    "next.mezzi-dossier": true,
    "next.operativita-globale": true,
    "next.ia-gestionale": true,
    "next.strumenti-trasversali": true,
    "next.autista-separato": false,
  },
  gestionale: {
    "next.centro-controllo": true,
    "next.mezzi-dossier": true,
    "next.operativita-globale": true,
    "next.ia-gestionale": true,
    "next.strumenti-trasversali": false,
    "next.autista-separato": false,
  },
  autista: {
    "next.centro-controllo": false,
    "next.mezzi-dossier": false,
    "next.operativita-globale": false,
    "next.ia-gestionale": false,
    "next.strumenti-trasversali": false,
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

export const canRoleAccessArea = (role: NextRole, areaId: NextAreaId): boolean => {
  const access = NEXT_AREA_ACCESS[areaId];
  return getNextSimulatedAccessProfile(role).permissions[access.permissionKey];
};

export const getVisibleNextAreaIds = (role: NextRole): NextAreaId[] => {
  const areaIds = Object.keys(NEXT_AREA_ACCESS) as NextAreaId[];
  return areaIds.filter((areaId) => canRoleAccessArea(role, areaId));
};
