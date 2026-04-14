import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import UnisciDocumentiTool from "./strumenti/UnisciDocumentiTool";
import { NEXT_HOME_PATH, NEXT_INTERNAL_AI_PATH } from "./nextStructuralPaths";
import { setPendingMergeFile } from "./strumenti/pendingMergeStore";

export default function NextStrumentiUnisciDocumentiPage() {
  const navigate = useNavigate();
  const pdfReadyHandledRef = useRef(false);

  return (
    <main>
      <p>Apertura strumento...</p>
      <UnisciDocumentiTool
        onPdfReady={(file) => {
          pdfReadyHandledRef.current = true;
          console.log("[wrapper] onPdfReady ricevuto:", file?.name, `${file?.size ?? 0}b`); // DEBUG MERGE
          setPendingMergeFile(file);
          console.log("[wrapper] dopo setPendingMergeFile, navigo"); // DEBUG MERGE
          navigate(NEXT_INTERNAL_AI_PATH);
        }}
        onClose={() => {
          if (pdfReadyHandledRef.current) {
            console.log("[wrapper] onClose ignorato (PDF già consegnato)"); // DEBUG MERGE
            return;
          }
          console.log("[wrapper] onClose invocato"); // DEBUG MERGE
          if (typeof window !== "undefined" && window.history.length > 1) {
            navigate(-1);
            return;
          }

          navigate(NEXT_HOME_PATH);
        }}
      />
    </main>
  );
}
