const RELATION_CONFIG_VERSION = "relation.config.v0.1";

const RELATION_CONFIG = Object.freeze([
  Object.freeze({
    relationKind: "driver_vehicle",
    sourceEntryConfigKey: "vehicles.mezziAziendali",
    sourceFields: Object.freeze(["autistaId"]),
    sourceFieldLabel: "autistaId",
    rule: "autistaId_explicit",
    certainty: "explicit_assignment",
    targetLabelFields: Object.freeze(["targa"]),
  }),
  Object.freeze({
    relationKind: "driver_vehicle",
    sourceEntryConfigKey: "sessions.autistiSessioneAttive",
    sourceFields: Object.freeze(["badgeAutista", "targaMotrice"]),
    sourceFieldLabel: "badgeAutista+targaMotrice",
    rule: "active_assignment_badge_exact",
    certainty: "explicit_assignment",
    targetLabelFields: Object.freeze(["targaMotrice"]),
  }),
  Object.freeze({
    relationKind: "vehicle_refueling",
    sourceEntryConfigKey: "refuelings.rifornimenti",
    sourceFields: Object.freeze(["targa"]),
    sourceFieldLabel: "targa",
    rule: "vehicle_refueling_targa_exact",
    certainty: "exact",
    targetLabelFields: Object.freeze(["targa", "mezzoTarga", "targaMotrice"]),
  }),
  Object.freeze({
    relationKind: "vehicle_maintenance",
    sourceEntryConfigKey: "maintenance.manutenzioni",
    sourceFields: Object.freeze(["targa"]),
    sourceFieldLabel: "targa",
    rule: "vehicle_maintenance_targa_exact",
    certainty: "exact",
    targetLabelFields: Object.freeze(["targa", "mezzoTarga"]),
  }),
  Object.freeze({
    relationKind: "material_supplier",
    sourceEntryConfigKey: "orders.ordini",
    sourceFields: Object.freeze(["idFornitore", "materiali"]),
    sourceFieldLabel: "idFornitore+materiali",
    rule: "supplier_material_order_structured",
    certainty: "exact",
    targetLabelFields: Object.freeze(["idFornitore", "supplierId", "fornitoreId"]),
  }),
  Object.freeze({
    relationKind: "site_equipment",
    sourceEntryConfigKey: "materials.materialiConsegnati",
    sourceFields: Object.freeze(["cantiereId", "materiale"]),
    sourceFieldLabel: "cantiereId+materiale",
    rule: "site_material_structured",
    certainty: "exact",
    targetLabelFields: Object.freeze(["cantiereId", "cantiere"]),
  }),
]);

module.exports = Object.freeze({
  RELATION_CONFIG_VERSION,
  RELATION_CONFIG,
});
