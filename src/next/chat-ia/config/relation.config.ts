export type RelationKindEnum =
  | "driver_vehicle"
  | "vehicle_refueling"
  | "vehicle_maintenance"
  | "material_supplier"
  | "site_equipment";

export type RelationCertainty = "exact" | "explicit_assignment" | "weak";

export type RelationConfigRule = {
  relationKind: RelationKindEnum;
  sourceEntryConfigKey: string;
  sourceFields: string[];
  sourceFieldLabel: string;
  rule: string;
  certainty: RelationCertainty;
  targetLabelFields?: string[];
};

export const RELATION_CONFIG_VERSION = "relation.config.v0.1";

export const RELATION_CONFIG: RelationConfigRule[] = [
  {
    relationKind: "driver_vehicle",
    sourceEntryConfigKey: "vehicles.mezziAziendali",
    sourceFields: ["autistaId"],
    sourceFieldLabel: "autistaId",
    rule: "autistaId_explicit",
    certainty: "explicit_assignment",
    targetLabelFields: ["targa"],
  },
  {
    relationKind: "driver_vehicle",
    sourceEntryConfigKey: "sessions.autistiSessioneAttive",
    sourceFields: ["badgeAutista", "targaMotrice"],
    sourceFieldLabel: "badgeAutista+targaMotrice",
    rule: "active_assignment_badge_exact",
    certainty: "explicit_assignment",
    targetLabelFields: ["targaMotrice"],
  },
  {
    relationKind: "vehicle_refueling",
    sourceEntryConfigKey: "refuelings.rifornimenti",
    sourceFields: ["targa"],
    sourceFieldLabel: "targa",
    rule: "vehicle_refueling_targa_exact",
    certainty: "exact",
    targetLabelFields: ["targa", "mezzoTarga", "targaMotrice"],
  },
  {
    relationKind: "vehicle_maintenance",
    sourceEntryConfigKey: "maintenance.manutenzioni",
    sourceFields: ["targa"],
    sourceFieldLabel: "targa",
    rule: "vehicle_maintenance_targa_exact",
    certainty: "exact",
    targetLabelFields: ["targa", "mezzoTarga"],
  },
  {
    relationKind: "material_supplier",
    sourceEntryConfigKey: "orders.ordini",
    sourceFields: ["idFornitore", "materiali"],
    sourceFieldLabel: "idFornitore+materiali",
    rule: "supplier_material_order_structured",
    certainty: "exact",
    targetLabelFields: ["idFornitore", "supplierId", "fornitoreId"],
  },
  {
    relationKind: "site_equipment",
    sourceEntryConfigKey: "materials.materialiConsegnati",
    sourceFields: ["cantiereId", "materiale"],
    sourceFieldLabel: "cantiereId+materiale",
    rule: "site_material_structured",
    certainty: "exact",
    targetLabelFields: ["cantiereId", "cantiere"],
  },
];
