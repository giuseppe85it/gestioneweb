import { register } from "./chatIaToolRegistry";
import { toolComparePeriods } from "./registry/toolComparePeriods";
import { toolCompareRefuelingSources } from "./registry/toolCompareRefuelingSources";
import { toolComputeAverage } from "./registry/toolComputeAverage";
import { toolDeleteArchivedReport } from "./registry/toolDeleteArchivedReport";
import { toolDownloadDocumentPdf } from "./registry/toolDownloadDocumentPdf";
import { toolFindInvoiceSupplier } from "./registry/toolFindInvoiceSupplier";
import { toolFindOutliers } from "./registry/toolFindOutliers";
import { toolGenerateReportPdf } from "./registry/toolGenerateReportPdf";
import { toolGetAdBlueTankEvents } from "./registry/toolGetAdBlueTankEvents";
import { toolGetCapoCostsByVehicle } from "./registry/toolGetCapoCostsByVehicle";
import { toolGetCisternaDocuments } from "./registry/toolGetCisternaDocuments";
import { toolGetCisternaRefuelings } from "./registry/toolGetCisternaRefuelings";
import { toolGetCisternaSnapshot } from "./registry/toolGetCisternaSnapshot";
import { toolGetConsumptionAverage } from "./registry/toolGetConsumptionAverage";
import { toolGetCostAggregates } from "./registry/toolGetCostAggregates";
import { toolGetCosts } from "./registry/toolGetCosts";
import { toolGetDocumentCostsByVehicle } from "./registry/toolGetDocumentCostsByVehicle";
import { toolGetEuromeccData } from "./registry/toolGetEuromeccData";
import { toolGetDriverActivity } from "./registry/toolGetDriverActivity";
import { toolGetDriverByBadge } from "./registry/toolGetDriverByBadge";
import { toolGetDriverByName } from "./registry/toolGetDriverByName";
import { toolGetDriverOperationalProfile } from "./registry/toolGetDriverOperationalProfile";
import { toolGetEuromeccSnapshot } from "./registry/toolGetEuromeccSnapshot";
import { toolGetHistoricalOperationalEvents } from "./registry/toolGetHistoricalOperationalEvents";
import { toolGetInvoiceById } from "./registry/toolGetInvoiceById";
import { toolGetMaterialMovements } from "./registry/toolGetMaterialMovements";
import { toolGetProcurementCosts } from "./registry/toolGetProcurementCosts";
import { toolGetRefuelings } from "./registry/toolGetRefuelings";
import { toolGetRefuelingsAggregated } from "./registry/toolGetRefuelingsAggregated";
import { toolGetSavedEconomicAnalysis } from "./registry/toolGetSavedEconomicAnalysis";
import { toolGetSiteEquipment } from "./registry/toolGetSiteEquipment";
import { toolGetVehicleByPlate } from "./registry/toolGetVehicleByPlate";
import { toolGetVehicleCostSummary } from "./registry/toolGetVehicleCostSummary";
import { toolGetVehicleDocuments } from "./registry/toolGetVehicleDocuments";
import { toolGetVehicleDossierSnapshot } from "./registry/toolGetVehicleDossierSnapshot";
import { toolGetVehicleEvents } from "./registry/toolGetVehicleEvents";
import { toolGetVehicleMaintenanceHistory } from "./registry/toolGetVehicleMaintenanceHistory";
import { toolGetVehicleMaterialMovements } from "./registry/toolGetVehicleMaterialMovements";
import { toolGetVehicleStatus } from "./registry/toolGetVehicleStatus";
import { toolGetVehicleTimeline360 } from "./registry/toolGetVehicleTimeline360";
import { toolListArchivedReports } from "./registry/toolListArchivedReports";
import { toolListDrivers } from "./registry/toolListDrivers";
import { toolListInventory } from "./registry/toolListInventory";
import { toolListScheduledMaintenanceDue } from "./registry/toolListScheduledMaintenanceDue";
import { toolListSuppliers } from "./registry/toolListSuppliers";
import { toolListVehicles } from "./registry/toolListVehicles";
import { toolListVehiclesWithoutDriver } from "./registry/toolListVehiclesWithoutDriver";
import { toolListWorkshops } from "./registry/toolListWorkshops";
import { toolNavigateTo } from "./registry/toolNavigateTo";
import { toolOpenDossierPage } from "./registry/toolOpenDossierPage";
import { toolOpenMagazzinoSection } from "./registry/toolOpenMagazzinoSection";
import { toolReconcileCisternaMonth } from "./registry/toolReconcileCisternaMonth";
import { toolRetrieveArchivedReport } from "./registry/toolRetrieveArchivedReport";
import { toolSaveReportToArchive } from "./registry/toolSaveReportToArchive";
import { toolSearchDocumentsAndInvoices } from "./registry/toolSearchDocumentsAndInvoices";
import { toolSearchMaintenances } from "./registry/toolSearchMaintenances";
import { toolSearchOperationalEvents } from "./registry/toolSearchOperationalEvents";
import { toolSearchVehiclesByAttribute } from "./registry/toolSearchVehiclesByAttribute";
import { toolSearchWorkOrders } from "./registry/toolSearchWorkOrders";

let initialized = false;

export function initToolRegistry(): void {
  if (initialized) {
    return;
  }

  register(toolComparePeriods);
  register(toolCompareRefuelingSources);
  register(toolComputeAverage);
  register(toolDeleteArchivedReport);
  register(toolDownloadDocumentPdf);
  register(toolFindInvoiceSupplier);
  register(toolFindOutliers);
  register(toolGenerateReportPdf);
  register(toolGetAdBlueTankEvents);
  register(toolGetCapoCostsByVehicle);
  register(toolGetCisternaDocuments);
  register(toolGetCisternaRefuelings);
  register(toolGetCisternaSnapshot);
  register(toolGetConsumptionAverage);
  register(toolGetCostAggregates);
  register(toolGetCosts);
  register(toolGetDocumentCostsByVehicle);
  register(toolGetEuromeccData);
  register(toolGetDriverActivity);
  register(toolGetDriverByBadge);
  register(toolGetDriverByName);
  register(toolGetDriverOperationalProfile);
  register(toolGetEuromeccSnapshot);
  register(toolGetHistoricalOperationalEvents);
  register(toolGetInvoiceById);
  register(toolGetMaterialMovements);
  register(toolGetProcurementCosts);
  register(toolGetRefuelings);
  register(toolGetRefuelingsAggregated);
  register(toolGetSavedEconomicAnalysis);
  register(toolGetSiteEquipment);
  register(toolGetVehicleByPlate);
  register(toolGetVehicleCostSummary);
  register(toolGetVehicleDocuments);
  register(toolGetVehicleDossierSnapshot);
  register(toolGetVehicleEvents);
  register(toolGetVehicleMaintenanceHistory);
  register(toolGetVehicleMaterialMovements);
  register(toolGetVehicleStatus);
  register(toolGetVehicleTimeline360);
  register(toolListArchivedReports);
  register(toolListDrivers);
  register(toolListInventory);
  register(toolListScheduledMaintenanceDue);
  register(toolListSuppliers);
  register(toolListVehicles);
  register(toolListVehiclesWithoutDriver);
  register(toolListWorkshops);
  register(toolNavigateTo);
  register(toolOpenDossierPage);
  register(toolOpenMagazzinoSection);
  register(toolReconcileCisternaMonth);
  register(toolRetrieveArchivedReport);
  register(toolSaveReportToArchive);
  register(toolSearchDocumentsAndInvoices);
  register(toolSearchMaintenances);
  register(toolSearchOperationalEvents);
  register(toolSearchVehiclesByAttribute);
  register(toolSearchWorkOrders);
  initialized = true;
}

export {
  getAllToolDefinitions,
  getAllToolDefinitionsForOpenAI,
  getChatIaToolHandler,
  getToolByName,
  listChatIaTools,
} from "./chatIaToolRegistry";
