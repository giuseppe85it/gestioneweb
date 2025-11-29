import { Routes, Route } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home";
import LavoriDaEseguire from "./pages/LavoriDaEseguire";
import DossierLista from "./pages/DossierLista";
import LavoriEseguiti from "./pages/LavoriEseguiti";
import MaterialiDaOrdinare from "./pages/MaterialiDaOrdinare";
import MaterialiConsegnati from "./pages/MaterialiConsegnati";
import Inventario from "./pages/Inventario";
import Colleghi from "./pages/Colleghi";
import Fornitori from "./pages/Fornitori";
import Mezzi from "./pages/Mezzi";
import Storico from "./pages/Storico";
import OrdiniArrivati from "./pages/OrdiniArrivati";
import OrdiniInAttesa from "./pages/OrdiniInAttesa";
import CheckStorage from "./pages/CheckStorage";
import DettaglioLavoro from "./pages/DettaglioLavoro";
import DettaglioOrdine from "./pages/DettaglioOrdine";
import DossierMezzo from "./pages/DossierMezzo";
import Manutenzioni from "./pages/Manutenzioni";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/lavori-da-eseguire" element={<LavoriDaEseguire />} />
      <Route path="/lavori-eseguiti" element={<LavoriEseguiti />} />

      {/* ✔️ DOSSIER LISTA + DOSSIER MEZZO */}
      <Route path="/dossiermezzi" element={<DossierLista />} />
      <Route path="/dossiermezzi/:targa" element={<DossierMezzo />} />

      <Route path="/materiali-da-ordinare" element={<MaterialiDaOrdinare />} />
      <Route path="/materiali-consegnati" element={<MaterialiConsegnati />} />
      <Route path="/inventario" element={<Inventario />} />
      <Route path="/colleghi" element={<Colleghi />} />
      <Route path="/fornitori" element={<Fornitori />} />
      <Route path="/mezzi" element={<Mezzi />} />
      <Route path="/manutenzioni" element={<Manutenzioni />} />

      <Route path="/storico" element={<Storico />} />

      <Route path="/ordini-arrivati" element={<OrdiniArrivati />} />
      <Route path="/ordini-in-attesa" element={<OrdiniInAttesa />} />

      <Route path="/check-storage" element={<CheckStorage />} />
      <Route path="/dettagliolavori" element={<DettaglioLavoro />} />

      <Route path="/dettaglio-ordine/:ordineId" element={<DettaglioOrdine />} />
      
    </Routes>
  );
}

export default App;
