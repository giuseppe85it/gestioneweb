import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "./firebase";

import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import "./App.css";
import NextHomePage from "./next/NextHomePage";
import NextCentroControlloParityPage from "./next/NextCentroControlloParityPage";
import NextScadenzeCollaudiPage from "./next/NextScadenzeCollaudiPage";
import NextIAArchivistaPage from "./next/NextIAArchivistaPage";
import NextIADocumentiPage from "./next/NextIADocumentiPage";
import NextLibrettiExportPage from "./next/NextLibrettiExportPage";
import NextCisternaPage from "./next/NextCisternaPage";
import NextCisternaIAPage from "./next/NextCisternaIAPage";
import NextCisternaSchedeTestPage from "./next/NextCisternaSchedeTestPage";
import NextGestioneOperativaPage from "./next/NextGestioneOperativaPage";
import NextMagazzinoPage from "./next/NextMagazzinoPage";
import NextAttrezzatureCantieriPage from "./next/NextAttrezzatureCantieriPage";
import NextManutenzioniPage from "./next/NextManutenzioniPage";
import NextOrariCartellinoPage from "./next/NextOrariCartellinoPage";
import NextAcquistiPage from "./next/NextAcquistiPage";
import NextMaterialiDaOrdinarePage from "./next/NextMaterialiDaOrdinarePage";
import NextOrdiniInAttesaPage from "./next/NextOrdiniInAttesaPage";
import NextOrdiniArrivatiPage from "./next/NextOrdiniArrivatiPage";
import NextDettaglioOrdinePage from "./next/NextDettaglioOrdinePage";
import NextShell from "./next/NextShell";
import NextAutistiEventoModal from "./next/components/NextAutistiEventoModal";
import { createManutenzioneDaFareFromEvento } from "./next/writers/nextManutenzioneDaFareCreateWriter";
import type { HomeEvent } from "./utils/homeEvents";
import NextDossierMezzoPage from "./next/NextDossierMezzoPage";
import NextDossierGommePage from "./next/NextDossierGommePage";
import NextDossierRifornimentiPage from "./next/NextDossierRifornimentiPage";
import NextDossierMezzoComandoPage from "./next/NextDossierMezzoComandoPage";
import NextAnalisiEconomicaPage from "./next/NextAnalisiEconomicaPage";
import NextDossierListaPage from "./next/NextDossierListaPage";
import NextSchedaMezzoPage from "./next/scheda/NextSchedaMezzoPage";
import NextSchedaAutistaPage from "./next/scheda/NextSchedaAutistaPage";
import NextRoleGuard from "./next/NextRoleGuard";
import NextRoleLandingRedirect from "./next/NextRoleLandingRedirect";
import NextDettaglioLavoroLegacyRedirect from "./next/redirects/NextDettaglioLavoroLegacyRedirect";
import {
  NextMezziDossierDetailLegacyRedirect,
  NextMezziDossierLegacyRedirect,
  NextOperativitaLegacyRedirect,
} from "./next/NextLegacyStructuralRedirects";
import NextCapoMezziPage from "./next/NextCapoMezziPage";
import NextCapoCostiMezzoPage from "./next/NextCapoCostiMezzoPage";
import NextColleghiPage from "./next/NextColleghiPage";
import NextFornitoriPage from "./next/NextFornitoriPage";
import NextAnagrafichePage from "./next/NextAnagrafichePage";
import NextEuromeccPage from "./next/NextEuromeccPage";
import { buildNextMagazzinoPath } from "./next/nextStructuralPaths";

/* ==================== APP PRINCIPALE ==================== */
import Home from "./pages/Home";
import LavoriDaEseguire from "./pages/LavoriDaEseguire";
import LavoriEseguiti from "./pages/LavoriEseguiti";
import LavoriInAttesa from "./pages/LavoriInAttesa";
import GestioneOperativa from "./pages/GestioneOperativa";
import CentroControllo from "./pages/CentroControllo";

import DossierLista from "./pages/DossierLista";
import DossierMezzo from "./pages/DossierMezzo";
import DossierGomme from "./pages/DossierGomme";
import DossierRifornimenti from "./pages/DossierRifornimenti";
import AnalisiEconomica from "./pages/AnalisiEconomica";
import Mezzo360 from "./pages/Mezzo360";
import Autista360 from "./pages/Autista360";
import CapoMezzi from "./pages/CapoMezzi";
import CapoCostiMezzo from "./pages/CapoCostiMezzo";

import MaterialiDaOrdinare from "./pages/MaterialiDaOrdinare";
import Acquisti from "./pages/Acquisti";
import MaterialiConsegnati from "./pages/MaterialiConsegnati";
import Inventario from "./pages/Inventario";
import AttrezzatureCantieri from "./pages/AttrezzatureCantieri";

import Colleghi from "./pages/Colleghi";
import Fornitori from "./pages/Fornitori";
import Mezzi from "./pages/Mezzi";
import Manutenzioni from "./pages/Manutenzioni";

import OrdiniArrivati from "./pages/OrdiniArrivati";
import OrdiniInAttesa from "./pages/OrdiniInAttesa";


import DettaglioLavoro from "./pages/DettaglioLavoro";
import DettaglioOrdine from "./pages/DettaglioOrdine";

/* ==================== IA ==================== */
import IAHome from "./pages/IA/IAHome";
import IAApiKey from "./pages/IA/IAApiKey";
import IALibretto from "./pages/IA/IALibretto";
import IADocumenti from "./pages/IA/IADocumenti";
import IACoperturaLibretti from "./pages/IA/IACoperturaLibretti";
import LibrettiExport from "./pages/LibrettiExport";
import CisternaCaravatePage from "./pages/CisternaCaravate/CisternaCaravatePage";
import CisternaCaravateIA from "./pages/CisternaCaravate/CisternaCaravateIA";
import CisternaSchedeTest from "./pages/CisternaCaravate/CisternaSchedeTest";

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
import OrariNote from "./autisti/OrariNote";


/* ==================== AUTISTI INBOX (ADMIN) ==================== */
import AutistiInboxHome from "./autistiInbox/AutistiInboxHome";
import CambioMezzoInbox from "./autistiInbox/CambioMezzoInbox";
import AutistiAdmin from "./autistiInbox/AutistiAdmin";
import AutistiControlliAll from "./autistiInbox/AutistiControlliAll";
import AutistiSegnalazioniAll from "./autistiInbox/AutistiSegnalazioniAll";
import RichiestaAttrezzatureAll from "./autistiInbox/RichiestaAttrezzatureAll";
import AutistiGommeAll from "./autistiInbox/AutistiGommeAll";
import AutistiLogAccessiAll from "./autistiInbox/AutistiLogAccessiAll";

function formatAutistiInboxDay(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const nextAutistiInboxCloneConfig = {
  homePath: "/next/autisti-inbox",
  adminPath: "/next/autisti-admin",
  segnalazioniPath: "/next/autisti-inbox/segnalazioni",
  controlliPath: "/next/autisti-inbox/controlli",
  richiestaAttrezzaturePath: "/next/autisti-inbox/richiesta-attrezzature",
  logAccessiPath: "/next/autisti-inbox/log-accessi",
  gommePath: "/next/autisti-inbox/gomme",
  buildCambioMezzoPath: (day: Date) =>
    `/next/autisti-inbox/cambio-mezzo?day=${formatAutistiInboxDay(day)}`,
};

// In "autisti in box" (clone NEXT) usiamo il modal NEXT che crea una vera
// Manutenzione Next in @manutenzioni (writer createManutenzioneDaFareFromEvento),
// invece del modal legacy che scriveva un Lavoro in @lavori (invisibile alle
// Manutenzioni Next). onAfterGommeImport ricarica gli eventi della inbox dopo
// la creazione, cosi la riga riflette subito lo stato "presa in carico".
function NextAutistiInboxEventoModal({
  event,
  onClose,
  onAfterGommeImport,
}: {
  event: HomeEvent | null;
  onClose: () => void;
  onAfterGommeImport?: () => void | Promise<void>;
}) {
  return (
    <NextAutistiEventoModal
      event={event}
      onClose={onClose}
      onAfterGommeImport={onAfterGommeImport}
      onCreateManutenzioneDaFare={async (input) => {
        const result = await createManutenzioneDaFareFromEvento(input);
        if (result.ok && onAfterGommeImport) {
          await onAfterGommeImport();
        }
        return result;
      }}
    />
  );
}

function NextAnagraficheAliasRedirect({
  to,
  legacyFallback,
}: {
  to: string;
  legacyFallback: unknown;
}) {
  void legacyFallback;
  return <Navigate to={to} replace />;
}

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
      <Route path="/next/autisti">
        <Route index element={<Navigate replace to="/autisti" />} />
        <Route path="*" element={<Navigate replace to="/autisti" />} />
      </Route>
      <Route path="/next/autista" element={<Navigate replace to="/autisti" />} />
      <Route path="/next" element={<NextShell />}>
        <Route index element={<NextHomePage />} />
        <Route
          path="centro-controllo"
          element={
            <NextRoleGuard areaId="centro-controllo">
              <NextCentroControlloParityPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="scadenze-collaudi"
          element={
            <NextRoleGuard areaId="centro-controllo">
              <NextScadenzeCollaudiPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="gestione-operativa"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <NextGestioneOperativaPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="operativita-globale"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <NextOperativitaLegacyRedirect />
            </NextRoleGuard>
          }
        />
        <Route
          path="magazzino"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <NextMagazzinoPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="inventario"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <Navigate replace to={buildNextMagazzinoPath("inventario")} />
            </NextRoleGuard>
          }
        />
        <Route
          path="materiali-consegnati"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <Navigate replace to={buildNextMagazzinoPath("materiali-consegnati")} />
            </NextRoleGuard>
          }
        />
        <Route
          path="attrezzature-cantieri"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <NextAttrezzatureCantieriPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="manutenzioni"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <NextManutenzioniPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="acquisti"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <NextAcquistiPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="acquisti/dettaglio/:ordineId"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <NextDettaglioOrdinePage />
            </NextRoleGuard>
          }
        />
        <Route
          path="materiali-da-ordinare"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <NextMaterialiDaOrdinarePage />
            </NextRoleGuard>
          }
        />
        <Route
          path="euromecc"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <NextEuromeccPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="ordini-in-attesa"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <NextOrdiniInAttesaPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="ordini-arrivati"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <NextOrdiniArrivatiPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="dettaglio-ordine/:ordineId"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <NextDettaglioOrdinePage />
            </NextRoleGuard>
          }
        />
        <Route
          path="lavori-da-eseguire"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <Navigate to="/next/manutenzioni" replace />
            </NextRoleGuard>
          }
        />
        <Route
          path="capo/mezzi"
          element={
            <NextRoleGuard areaId="capo">
              <NextCapoMezziPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="capo/costi/:targa"
          element={
            <NextRoleGuard areaId="capo">
              <NextCapoCostiMezzoPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="anagrafiche"
          element={
            <NextRoleGuard areaId="anagrafiche">
              <NextAnagrafichePage />
            </NextRoleGuard>
          }
        />
        <Route
          path="colleghi"
          element={
            <NextRoleGuard areaId="colleghi">
              <NextAnagraficheAliasRedirect
                to="/next/anagrafiche?tab=colleghi"
                legacyFallback={NextColleghiPage}
              />
            </NextRoleGuard>
          }
        />
        <Route
          path="fornitori"
          element={
            <NextRoleGuard areaId="fornitori">
              <NextAnagraficheAliasRedirect
                to="/next/anagrafiche?tab=fornitori"
                legacyFallback={NextFornitoriPage}
              />
            </NextRoleGuard>
          }
        />
        <Route
          path="lavori-in-attesa"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <Navigate to="/next/manutenzioni" replace />
            </NextRoleGuard>
          }
        />
        <Route
          path="lavori-eseguiti"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <Navigate to="/next/manutenzioni" replace />
            </NextRoleGuard>
          }
        />
        <Route
          path="dettagliolavori/:lavoroId"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <NextDettaglioLavoroLegacyRedirect />
            </NextRoleGuard>
          }
        />
        <Route
          path="dettagliolavori"
          element={
            <NextRoleGuard areaId="operativita-globale">
              <Navigate to="/next/manutenzioni" replace />
            </NextRoleGuard>
          }
        />
        <Route
          path="mezzi"
          element={
            <NextRoleGuard areaId="mezzi-dossier">
              <Navigate to="/next/dossiermezzi" replace />
            </NextRoleGuard>
          }
        />
        <Route
          path="dossiermezzi"
          element={
            <NextRoleGuard areaId="mezzi-dossier">
              <NextDossierListaPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="dossiermezzi/:targa"
          element={
            <NextRoleGuard areaId="mezzi-dossier">
              <NextDossierMezzoPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="dossier/:targa"
          element={
            <NextRoleGuard areaId="mezzi-dossier">
              <NextDossierMezzoPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="dossier/:targa/comando"
          element={
            <NextRoleGuard areaId="mezzi-dossier">
              <NextDossierMezzoComandoPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="scheda-mezzo/:targa"
          element={
            <NextRoleGuard areaId="mezzi-dossier">
              <NextSchedaMezzoPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="scheda-autista/:badge"
          element={
            <NextRoleGuard areaId="colleghi">
              <NextSchedaAutistaPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="dossier/:targa/gomme"
          element={
            <NextRoleGuard areaId="mezzi-dossier">
              <NextDossierGommePage />
            </NextRoleGuard>
          }
        />
        <Route
          path="dossier/:targa/rifornimenti"
          element={
            <NextRoleGuard areaId="mezzi-dossier">
              <NextDossierRifornimentiPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="mezzi-dossier"
          element={
            <NextRoleGuard areaId="mezzi-dossier">
              <NextMezziDossierLegacyRedirect />
            </NextRoleGuard>
          }
        />
        <Route
          path="mezzi-dossier/:targa"
          element={
            <NextRoleGuard areaId="mezzi-dossier">
              <NextMezziDossierDetailLegacyRedirect />
            </NextRoleGuard>
          }
        />
        <Route
          path="analisi-economica/:targa"
          element={
            <NextRoleGuard areaId="mezzi-dossier">
              <NextAnalisiEconomicaPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="ia/archivista"
          element={
            <NextRoleGuard areaId="ia">
              <NextIAArchivistaPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="libretti-export"
          element={
            <NextRoleGuard areaId="libretti-export">
              <NextLibrettiExportPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="cisterna"
          element={
            <NextRoleGuard areaId="cisterna">
              <NextCisternaPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="cisterna/ia"
          element={
            <NextRoleGuard areaId="cisterna">
              <NextCisternaIAPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="cisterna/schede-test"
          element={
            <NextRoleGuard areaId="cisterna">
              <NextCisternaSchedeTestPage />
            </NextRoleGuard>
          }
        />
        <Route
          path="autisti-inbox"
          element={
            <AutistiInboxHome
              cloneConfig={nextAutistiInboxCloneConfig}
              eventModalComponent={NextAutistiInboxEventoModal}
            />
          }
        />
        <Route path="autisti-inbox/cambio-mezzo" element={<CambioMezzoInbox />} />
        <Route path="autisti-inbox/controlli" element={<AutistiControlliAll />} />
        <Route path="autisti-inbox/segnalazioni" element={<AutistiSegnalazioniAll />} />
        <Route path="autisti-inbox/log-accessi" element={<AutistiLogAccessiAll />} />
        <Route
          path="autisti-inbox/richiesta-attrezzature"
          element={<RichiestaAttrezzatureAll />}
        />
        <Route path="autisti-inbox/gomme" element={<AutistiGommeAll />} />
        <Route
          path="ia/documenti"
          element={
            <NextRoleGuard areaId="ia">
              <NextIADocumentiPage />
            </NextRoleGuard>
          }
        />
        <Route path="autisti-admin" element={<AutistiAdmin />} />
        <Route path="autisti-admin/orari-cartellino" element={<NextOrariCartellinoPage />} />
        <Route path="*" element={<NextRoleLandingRedirect />} />
      </Route>

      {/* HOME */}
      <Route path="/" element={<div className="app-shell app-shell--homeWide"><Home /></div>} />

      <Route element={<div className="app-shell"><Outlet /></div>}>
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
        <Route path="/dossier/:targa/rifornimenti" element={<DossierRifornimenti />} />
        <Route path="/mezzo-360/:targa" element={<Mezzo360 />} />
        <Route path="/autista-360" element={<Autista360 />} />
        <Route path="/autista-360/:badge" element={<Autista360 />} />

        {/* CAPO */}
        <Route path="/capo/mezzi" element={<CapoMezzi />} />
        <Route path="/capo/costi/:targa" element={<CapoCostiMezzo />} />

        {/* MATERIALI */}
        <Route path="/acquisti" element={<Acquisti />} />
        <Route path="/acquisti/dettaglio/:ordineId" element={<Acquisti />} />
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
        <Route path="/dettagliolavori" element={<DettaglioLavoro />} />
        <Route path="/dettaglio-ordine/:ordineId" element={<DettaglioOrdine />} />
        <Route path="/gestione-operativa" element={<GestioneOperativa />} />
        <Route path="/centro-controllo" element={<CentroControllo />} />
        <Route path="/attrezzature-cantieri" element={<AttrezzatureCantieri />} />

        {/* IA */}
        <Route path="/ia" element={<IAHome />} />
        <Route path="/ia/apikey" element={<IAApiKey />} />
        <Route path="/ia/libretto" element={<IALibretto />} />
        <Route path="/ia/documenti" element={<IADocumenti />} />
        <Route path="/ia/copertura-libretti" element={<IACoperturaLibretti />} />
        <Route path="/libretti-export" element={<LibrettiExport />} />
        <Route path="/cisterna" element={<CisternaCaravatePage />} />
        <Route path="/cisterna/ia" element={<CisternaCaravateIA />} />
        <Route path="/cisterna/schede-test" element={<CisternaSchedeTest />} />

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
        <Route path="/autisti/orari-note" element={<OrariNote />} />

        {/* ==================== AUTISTI INBOX (ADMIN) ==================== */}
        <Route path="/autisti-inbox" element={<AutistiInboxHome />} />
        <Route path="/autisti-inbox/cambio-mezzo" element={<CambioMezzoInbox />} />
        <Route path="/autisti-inbox/controlli" element={<AutistiControlliAll />} />
        <Route path="/autisti-inbox/segnalazioni" element={<AutistiSegnalazioniAll />} />
        <Route path="/autisti-inbox/log-accessi" element={<AutistiLogAccessiAll />} />
        <Route
          path="/autisti-inbox/richiesta-attrezzature"
          element={<RichiestaAttrezzatureAll />}
        />
        <Route path="/autisti-inbox/gomme" element={<AutistiGommeAll />} />
        <Route path="/autisti-admin" element={<AutistiAdmin />} />
      </Route>
    </Routes>
  );
}

export default App;
