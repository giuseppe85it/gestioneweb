import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "./firebase";

import { Routes, Route } from "react-router-dom";
import "./App.css";

/* ==================== APP PRINCIPALE ==================== */
import Home from "./pages/Home";
import LavoriDaEseguire from "./pages/LavoriDaEseguire";
import LavoriEseguiti from "./pages/LavoriEseguiti";
import LavoriInAttesa from "./pages/LavoriInAttesa";
import GestioneOperativa from "./pages/GestioneOperativa";

import DossierLista from "./pages/DossierLista";
import DossierMezzo from "./pages/DossierMezzo";
import DossierGomme from "./pages/DossierGomme";
import AnalisiEconomica from "./pages/AnalisiEconomica";
import Mezzo360 from "./pages/Mezzo360";

import MaterialiDaOrdinare from "./pages/MaterialiDaOrdinare";
import MaterialiConsegnati from "./pages/MaterialiConsegnati";
import Inventario from "./pages/Inventario";
import AttrezzatureCantieri from "./pages/AttrezzatureCantieri";

import Colleghi from "./pages/Colleghi";
import Fornitori from "./pages/Fornitori";
import Mezzi from "./pages/Mezzi";
import Manutenzioni from "./pages/Manutenzioni";

import Storico from "./pages/Storico";
import OrdiniArrivati from "./pages/OrdiniArrivati";
import OrdiniInAttesa from "./pages/OrdiniInAttesa";

import CheckStorage from "./pages/CheckStorage";
import DettaglioLavoro from "./pages/DettaglioLavoro";
import DettaglioOrdine from "./pages/DettaglioOrdine";

/* ==================== IA ==================== */
import IAHome from "./pages/IA/IAHome";
import IAApiKey from "./pages/IA/IAApiKey";
import IALibretto from "./pages/IA/IALibretto";
import IADocumenti from "./pages/IA/IADocumenti";

/* ==================== APP AUTISTI ==================== */
import LoginAutista from "./autisti/LoginAutista";
import HomeAutista from "./autisti/HomeAutista";
import SetupMezzo from "./autisti/SetupMezzo";
import Rifornimento from "./autisti/Rifornimento";
import ControlloMezzo from "./autisti/ControlloMezzo";
import Segnalazioni from "./autisti/Segnalazioni";
import CambioMezzoAutista from "./autisti/CambioMezzoAutista";
import AutistiGate from "./autisti/AutistiGate";
import RichiestaAttrezzature from "./autisti/RichiestaAttrezzature";


/* ==================== AUTISTI INBOX (ADMIN) ==================== */
import AutistiInboxHome from "./autistiInbox/AutistiInboxHome";
import CambioMezzoInbox from "./autistiInbox/CambioMezzoInbox";
import AutistiAdmin from "./autistiInbox/AutistiAdmin";
import AutistiControlliAll from "./autistiInbox/AutistiControlliAll";
import AutistiSegnalazioniAll from "./autistiInbox/AutistiSegnalazioniAll";
import RichiestaAttrezzatureAll from "./autistiInbox/RichiestaAttrezzatureAll";
import AutistiGommeAll from "./autistiInbox/AutistiGommeAll";
function App() {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        await signInAnonymously(auth);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  if (!authReady) return null;

  return (
    <Routes>
      {/* HOME */}
      <Route path="/" element={<Home />} />

      {/* LAVORI */}
      <Route path="/lavori-da-eseguire" element={<LavoriDaEseguire />} />
      <Route path="/lavori-eseguiti" element={<LavoriEseguiti />} />
      <Route path="/lavori-in-attesa" element={<LavoriInAttesa />} />

      {/* DOSSIER */}
      <Route path="/dossiermezzi" element={<DossierLista />} />
      <Route path="/dossiermezzi/:targa" element={<DossierMezzo />} />
      <Route path="/dossier/:targa" element={<DossierMezzo />} />
      <Route path="/analisi-economica/:targa" element={<AnalisiEconomica />} />
      <Route path="/dossier/:targa/gomme" element={<DossierGomme />} />
      <Route path="/mezzo-360/:targa" element={<Mezzo360 />} />

      {/* MATERIALI */}
      <Route path="/materiali-da-ordinare" element={<MaterialiDaOrdinare />} />
      <Route path="/materiali-consegnati" element={<MaterialiConsegnati />} />
      <Route path="/inventario" element={<Inventario />} />

      {/* ANAGRAFICHE */}
      <Route path="/colleghi" element={<Colleghi />} />
      <Route path="/fornitori" element={<Fornitori />} />
      <Route path="/mezzi" element={<Mezzi />} />

      {/* MANUTENZIONI */}
      <Route path="/manutenzioni" element={<Manutenzioni />} />

      {/* ORDINI */}
      <Route path="/ordini-arrivati" element={<OrdiniArrivati />} />
      <Route path="/ordini-in-attesa" element={<OrdiniInAttesa />} />

      {/* ALTRO */}
      <Route path="/storico" element={<Storico />} />
      <Route path="/check-storage" element={<CheckStorage />} />
      <Route path="/dettagliolavori" element={<DettaglioLavoro />} />
      <Route path="/dettaglio-ordine/:ordineId" element={<DettaglioOrdine />} />
      <Route path="/gestione-operativa" element={<GestioneOperativa />} />
      <Route path="/attrezzature-cantieri" element={<AttrezzatureCantieri />} />

      {/* IA */}
      <Route path="/ia" element={<IAHome />} />
      <Route path="/ia/apikey" element={<IAApiKey />} />
      <Route path="/ia/libretto" element={<IALibretto />} />
      <Route path="/ia/documenti" element={<IADocumenti />} />

      {/* ==================== APP AUTISTI ==================== */}
      <Route path="/autisti" element={<AutistiGate />} />
      <Route path="/autisti/login" element={<LoginAutista />} />
      <Route path="/autisti/home" element={<HomeAutista />} />
      <Route path="/autisti/setup-mezzo" element={<SetupMezzo />} />
<Route path="/autisti/cambio-mezzo" element={<CambioMezzoAutista />} />
      <Route path="/autisti/rifornimento" element={<Rifornimento />} />
      <Route path="/autisti/controllo" element={<ControlloMezzo />} />
      <Route path="/autisti/segnalazioni" element={<Segnalazioni />} />
<Route path="/autisti/richiesta-attrezzature" element={<RichiestaAttrezzature />} />

      {/* ==================== AUTISTI INBOX (ADMIN) ==================== */}
      <Route path="/autisti-inbox" element={<AutistiInboxHome />} />
<Route  path="/autisti-inbox/cambio-mezzo"  element={<CambioMezzoInbox />}/>
<Route path="/autisti-inbox/controlli" element={<AutistiControlliAll />} />
<Route path="/autisti-inbox/segnalazioni" element={<AutistiSegnalazioniAll />} />
<Route
  path="/autisti-inbox/richiesta-attrezzature"
  element={<RichiestaAttrezzatureAll />}
/>
<Route path="/autisti-inbox/gomme" element={<AutistiGommeAll />} />
<Route path="/autisti-admin" element={<AutistiAdmin />} />


    </Routes>
  );
}

export default App;
