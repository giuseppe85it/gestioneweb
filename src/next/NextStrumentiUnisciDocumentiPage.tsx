import { useNavigate } from "react-router-dom";
import UnisciDocumentiTool from "./strumenti/UnisciDocumentiTool";
import { NEXT_HOME_PATH } from "./nextStructuralPaths";

export default function NextStrumentiUnisciDocumentiPage() {
  const navigate = useNavigate();

  return (
    <main>
      <p>Apertura strumento...</p>
      <UnisciDocumentiTool
        onPdfReady={() => undefined}
        onClose={() => {
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
