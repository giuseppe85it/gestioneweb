import type { HomeEvent } from "../../utils/homeEvents";
import AutistiEventoModal from "../../components/AutistiEventoModal";

type NextAutistiEventoModalProps = {
  event: HomeEvent | null;
  onClose: () => void;
  onAfterGommeImport?: () => void | Promise<void>;
};

function NextAutistiEventoModal(props: NextAutistiEventoModalProps) {
  return (
    <AutistiEventoModal
      {...props}
      buildCloneLavoroDetailPath={(lavoroId) =>
        lavoroId ? `/next/dettagliolavori/${encodeURIComponent(lavoroId)}` : null
      }
    />
  );
}

export default NextAutistiEventoModal;
