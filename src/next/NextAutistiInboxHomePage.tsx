import { useEffect, useMemo, useRef, useState } from "react";
import AutistiInboxHome from "../autistiInbox/AutistiInboxHome";
import NextAutistiEventoModal from "./components/NextAutistiEventoModal";
import {
  readNextAutistiReadOnlySnapshot,
  type NextAutistiReadOnlySnapshot,
} from "./domain/nextAutistiDomain";
import InternalAiUniversalHandoffBanner from "./internal-ai/InternalAiUniversalHandoffBanner";
import { useInternalAiUniversalHandoffConsumer } from "./internal-ai/internalAiUniversalHandoffConsumer";

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

export default function NextAutistiInboxHomePage() {
  const handoff = useInternalAiUniversalHandoffConsumer({
    moduleId: "next.autisti",
  });
  const [snapshot, setSnapshot] = useState<NextAutistiReadOnlySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lifecycleRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setError(null);
        const nextSnapshot = await readNextAutistiReadOnlySnapshot();
        if (cancelled) {
          return;
        }
        setSnapshot(nextSnapshot);
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        setSnapshot(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Impossibile leggere l'inbox autisti clone-safe.",
        );
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSignals = useMemo(() => {
    if (!snapshot || handoff.state.status !== "ready") {
      return [];
    }

    const autistaQuery = normalizeText(handoff.state.prefill.autista);
    const badgeQuery = normalizeText(handoff.state.prefill.badge);
    const targaQuery = normalizeText(handoff.state.prefill.targa);

    return snapshot.signals.filter((entry) => {
      const matchesAutista = autistaQuery
        ? normalizeText(entry.autistaNome).includes(autistaQuery)
        : true;
      const matchesBadge = badgeQuery ? normalizeText(entry.badgeAutista).includes(badgeQuery) : true;
      const matchesTarga = targaQuery ? normalizeText(entry.mezzoTarga).includes(targaQuery) : true;
      return matchesAutista && matchesBadge && matchesTarga;
    });
  }, [handoff.state, snapshot]);

  useEffect(() => {
    if (handoff.state.status !== "ready" || !snapshot) {
      return;
    }

    if (lifecycleRef.current === handoff.state.payload.handoffId) {
      return;
    }

    handoff.acknowledge(
      "prefill_applicato",
      "Autisti inbox ha agganciato il payload standard e il contesto segnali nel boundary NEXT.",
    );
    handoff.acknowledge(
      handoff.state.requiresVerification ? "da_verificare" : "completato",
      handoff.state.requiresVerification
        ? "Autisti inbox e aperta con prefill ma richiede ancora verifica dei campi segnalati."
        : "Autisti inbox ha consumato il payload standard e mostra il contesto corretto del clone.",
    );
    lifecycleRef.current = handoff.state.payload.handoffId;
  }, [handoff, snapshot]);

  return (
    <>
      {handoff.state.status === "ready" ? (
        <InternalAiUniversalHandoffBanner
          title="Handoff IA consumato su Autisti Inbox"
          description="L'inbox autisti del clone legge il payload standard e filtra il contesto rilevante nel boundary NEXT."
          payload={handoff.state.payload}
        />
      ) : null}
      {filteredSignals.length ? (
        <div
          style={{
            display: "grid",
            gap: 10,
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            background: "#f8fafc",
          }}
        >
          <strong>Segnali autisti agganciati</strong>
          <p style={{ margin: 0 }}>
            {filteredSignals.length} segnali coerenti con il payload IA.
          </p>
          <p style={{ margin: 0 }}>
            Top segnali: {filteredSignals.slice(0, 3).map((entry) => entry.titolo).join(" | ")}
          </p>
        </div>
      ) : null}
      {error ? (
        <div className="next-clone-placeholder" style={{ marginBottom: 16 }}>
          {error}
        </div>
      ) : null}
      {handoff.state.status === "error" ? (
        <div className="next-clone-placeholder" style={{ marginBottom: 16 }}>
          {handoff.state.errorMessage}
        </div>
      ) : null}
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
    </>
  );
}
