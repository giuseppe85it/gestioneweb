import type { HomeEvent } from "../../utils/homeEvents";
import NextHomeAutistiEventoModal, {
  type CreateManutenzioneDaFareSubmitInput,
  type CreateManutenzioneDaFareSubmitResult,
} from "./NextHomeAutistiEventoModal";

type NextAutistiEventoModalProps = {
  event: HomeEvent | null;
  onClose: () => void;
  onAfterGommeImport?: () => void | Promise<void>;
  onCreateManutenzioneDaFare?: (
    input: CreateManutenzioneDaFareSubmitInput,
  ) => Promise<CreateManutenzioneDaFareSubmitResult>;
  onImportGommeDossier?: (event: HomeEvent) => void | Promise<void>;
};

function NextAutistiEventoModal({
  event,
  onClose,
  onCreateManutenzioneDaFare,
  onImportGommeDossier,
}: NextAutistiEventoModalProps) {
  return (
    <NextHomeAutistiEventoModal
      event={event}
      onClose={onClose}
      editable
      onCreateManutenzioneDaFare={onCreateManutenzioneDaFare}
      onImportGommeDossier={onImportGommeDossier}
    />
  );
}

export default NextAutistiEventoModal;
