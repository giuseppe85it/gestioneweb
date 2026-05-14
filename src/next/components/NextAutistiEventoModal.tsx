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
};

function NextAutistiEventoModal({
  event,
  onClose,
  onCreateManutenzioneDaFare,
}: NextAutistiEventoModalProps) {
  return (
    <NextHomeAutistiEventoModal
      event={event}
      onClose={onClose}
      editable
      onCreateManutenzioneDaFare={onCreateManutenzioneDaFare}
    />
  );
}

export default NextAutistiEventoModal;
