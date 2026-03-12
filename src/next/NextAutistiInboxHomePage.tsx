import AutistiInboxHome from "../autistiInbox/AutistiInboxHome";
import NextAutistiEventoModal from "./components/NextAutistiEventoModal";

export default function NextAutistiInboxHomePage() {
  return (
    <AutistiInboxHome
      cloneConfig={{
        homePath: "/next",
        adminPath: "/next/autisti-admin",
        segnalazioniPath: "/next/autisti-inbox/segnalazioni",
        controlliPath: "/next/autisti-inbox/controlli",
        richiestaAttrezzaturePath: "/next/autisti-inbox/richiesta-attrezzature",
        logAccessiPath: "/next/autisti-inbox/log-accessi",
        gommePath: "/next/autisti-inbox/gomme",
        buildCambioMezzoPath: (day) => {
          const year = day.getFullYear();
          const month = String(day.getMonth() + 1).padStart(2, "0");
          const dayValue = String(day.getDate()).padStart(2, "0");
          return `/next/autisti-inbox/cambio-mezzo?day=${year}-${month}-${dayValue}`;
        },
      }}
      eventModalComponent={NextAutistiEventoModal}
    />
  );
}
