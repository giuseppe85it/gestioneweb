import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./autisti.css";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { getAutistaLocal, getMezzoLocal, saveAutistaLocal } from "./autistiStorage";

const KEY_STORICO_EVENTI_OPERATIVI = "@storico_eventi_operativi";

type EventoOperativo = {
  id: string;
  tipo: string;
  timestamp: number;
  badgeAutista?: string;
  nomeAutista?: string;
  autistaNome?: string;
  autista?: string;
  source?: string;
};

async function appendEventoOperativo(evt: EventoOperativo) {
  const raw = (await getItemSync(KEY_STORICO_EVENTI_OPERATIVI)) || [];
  const list: EventoOperativo[] = Array.isArray(raw)
    ? raw
    : raw?.value && Array.isArray(raw.value)
    ? raw.value
    : [];
  if (list.some((e) => e?.id === evt.id)) return;
  list.push(evt);
  await setItemSync(KEY_STORICO_EVENTI_OPERATIVI, list);
}

export default function LoginAutista() {
  const navigate = useNavigate();

  const [badge, setBadge] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔒 REDIRECT AUTOMATICO SE GIÀ LOGGATO
  useEffect(() => {
    const autista = getAutistaLocal();
    const mezzo = getMezzoLocal();

    if (autista && mezzo) {
      navigate("/autisti/home", { replace: true });
    }
  }, [navigate]);

  async function handleLogin() {
    if (!badge.trim()) {
      setErrore("Inserisci il badge");
      return;
    }

    setLoading(true);
    setErrore(null);

    try {
      const colleghi = (await getItemSync("@colleghi")) || [];
      const collega = colleghi.find(
        (c: any) => String(c.badge) === badge.trim()
      );

      if (!collega) {
        setErrore("Badge non valido");
        setLoading(false);
        return;
      }

      const autista = {
        id: collega.id,
        nome: collega.nome,
        badge: badge.trim(),
      };

      // 🔹 SALVATAGGIO PER ADMIN / STORICO

      // 🔹 SALVATAGGIO LOCALE PER SESSIONE
      saveAutistaLocal(autista);

      try {
        const now = Date.now();
        await appendEventoOperativo({
          id: `LOGIN_AUTISTA-${autista.badge}-${now}`,
          tipo: "LOGIN_AUTISTA",
          timestamp: now,
          badgeAutista: autista.badge,
          nomeAutista: autista.nome,
          autistaNome: autista.nome,
          autista: autista.nome,
          source: "AUTISTI",
        });
      } catch (err) {
        console.warn("Login autista: impossibile scrivere evento", err);
      }

      navigate("/autisti/setup-mezzo");
    } catch (e) {
      setErrore("Errore durante il login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="autisti-container">
      <h1 className="autisti-title">Accesso Autisti</h1>

      <div className="autisti-card">
        <label className="autisti-label">Badge</label>

        <input
          className="autisti-input"
          type="number"
          placeholder="Inserisci badge"
          value={badge}
          onChange={(e) => setBadge(e.target.value)}
        />

        {errore && <div className="autisti-error">{errore}</div>}

        <button
          className="autisti-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Verifica..." : "ENTRA"}
        </button>
      </div>
    </div>
  );
}
