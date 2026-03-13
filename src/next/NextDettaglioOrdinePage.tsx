import { useLocation } from "react-router-dom";
import Acquisti from "../pages/Acquisti";
import DettaglioOrdine from "../pages/DettaglioOrdine";
import NextMotherPage from "./NextMotherPage";

export default function NextDettaglioOrdinePage() {
  const location = useLocation();
  const isAcquistiDetailRoute = location.pathname.includes("/next/acquisti/dettaglio/");

  if (isAcquistiDetailRoute) {
    return (
      <NextMotherPage pageId="acquisti">
        <Acquisti />
      </NextMotherPage>
    );
  }

  return (
    <NextMotherPage pageId="dettaglio-ordine">
      <DettaglioOrdine />
    </NextMotherPage>
  );
}
