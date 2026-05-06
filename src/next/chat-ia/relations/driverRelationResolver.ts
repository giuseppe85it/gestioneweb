/*
 * @deprecated Sostituito dal backend relation-resolver.js del motore generico v1.
 * Questo modulo frontend legacy verra' rimosso nella prossima major.
 * Riferimento: BLOCCO 8 PIANO_ESECUTIVO_CHAT_IA_NEXT.md.
 */

import {
  readNextAnagraficheFlottaSnapshot,
  type NextAnagraficheFlottaMezzoItem,
} from "../../nextAnagraficheFlottaDomain";
import {
  readNextAutistiReadOnlySnapshot,
  type NextAutistiCanonicalAssignment,
} from "../../domain/nextAutistiDomain";
import type { NextCollegaReadOnlyItem } from "../../domain/nextColleghiDomain";
import type { DriverVehicleCertifiedRelation, RelationProof } from "../core/chatIaTypes";

const LEGACY_DRIVER_RELATION_RESOLVER_WARNING =
  "[driverRelationResolver] DEPRECATED: resolver relazioni frontend legacy invocato; usare backend relation-resolver.js.";

function normalizeId(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBadge(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, "").toLowerCase() : "";
}

function normalizePlate(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : "";
}

function buildVehicleRelationProof(vehicle: NextAnagraficheFlottaMezzoItem): RelationProof {
  return {
    relationKind: "driver_vehicle",
    sourceCollection: "storage/@mezzi_aziendali",
    sourceRecordId: vehicle.id || vehicle.targa,
    sourceField: "autistaId",
    rule: "autistaId_explicit",
    certainty: "explicit_assignment",
  };
}

function buildAssignmentRelationProof(assignment: NextAutistiCanonicalAssignment): RelationProof {
  return {
    relationKind: "driver_vehicle",
    sourceCollection: `storage/${assignment.sourceDataset}`,
    sourceRecordId: assignment.id,
    sourceField: "badgeAutista+mezzoTarga",
    rule:
      assignment.sourceKind === "sessione_attiva"
        ? "active_assignment_badge_exact"
        : "confirmed_vehicle_change_badge_exact",
    certainty: "explicit_assignment",
  };
}

function relationFromVehicle(vehicle: NextAnagraficheFlottaMezzoItem): DriverVehicleCertifiedRelation | null {
  const vehiclePlate = normalizePlate(vehicle.targa);
  if (!vehiclePlate) return null;
  return {
    relationKind: "driver_vehicle",
    vehiclePlate,
    relationProof: buildVehicleRelationProof(vehicle),
  };
}

function relationFromAssignment(
  assignment: NextAutistiCanonicalAssignment,
): DriverVehicleCertifiedRelation | null {
  const vehiclePlate = normalizePlate(assignment.mezzoTarga);
  if (!vehiclePlate) return null;
  return {
    relationKind: "driver_vehicle",
    vehiclePlate,
    relationProof: buildAssignmentRelationProof(assignment),
  };
}

function addRelationIfCertified(
  target: Map<string, DriverVehicleCertifiedRelation>,
  relation: DriverVehicleCertifiedRelation | null,
): void {
  if (!relation?.relationProof) return;
  if (!target.has(relation.vehiclePlate)) {
    target.set(relation.vehiclePlate, relation);
  }
}

export async function resolveDriverVehicleRelations(
  driver: NextCollegaReadOnlyItem,
): Promise<DriverVehicleCertifiedRelation[]> {
  console.warn(LEGACY_DRIVER_RELATION_RESOLVER_WARNING);
  const driverId = normalizeId(driver.id);
  const driverBadge = normalizeBadge(driver.badge);
  const relations = new Map<string, DriverVehicleCertifiedRelation>();

  if (!driverId) {
    return [];
  }

  const [flottaSnapshot, autistiSnapshot] = await Promise.all([
    readNextAnagraficheFlottaSnapshot({ includeClonePatches: false }),
    readNextAutistiReadOnlySnapshot(Date.now(), {
      includeLocalClone: false,
      includeStorageOverlay: false,
    }),
  ]);

  flottaSnapshot.items
    .filter((vehicle) => normalizeId(vehicle.autistaId) === driverId)
    .forEach((vehicle) => addRelationIfCertified(relations, relationFromVehicle(vehicle)));

  if (driverBadge) {
    autistiSnapshot.assignments
      .filter((assignment) => assignment.linkReliability === "forte")
      .filter((assignment) => normalizeBadge(assignment.badgeAutista) === driverBadge)
      .forEach((assignment) => addRelationIfCertified(relations, relationFromAssignment(assignment)));
  }

  return Array.from(relations.values()).sort((left, right) =>
    left.vehiclePlate.localeCompare(right.vehiclePlate, "it", { sensitivity: "base" }),
  );
}
