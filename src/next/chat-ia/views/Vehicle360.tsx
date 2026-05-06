import type { ChatZeroInvenzioniMessage } from "../core/chatIaTypes";
import CertifiedView from "./CertifiedView";

type Vehicle360Props = {
  message: ChatZeroInvenzioniMessage;
};

export default function Vehicle360({ message }: Vehicle360Props) {
  return <CertifiedView message={message} viewKind="Vehicle360" />;
}
