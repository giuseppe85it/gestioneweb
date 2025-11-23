import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

interface EventoStorico {
  id: string;
  tipo: string;
  descrizione: string;
  data: string;
}

function Storico() {
  const [eventi, setEventi] = useState<EventoStorico[]>([]);
  const [tipo, setTipo] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [data, setData] = useState("");

  // ------------------ 🔥 LISTENER FIRESTORE ------------------
  useEffect(() => {
    const ref = doc(db, "storage", "@storico");

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setEventi([]);
        return;
      }
      setEventi(snap.data().value || []);
    });

    return () => unsub();
  }, []);
  // -----------------------------------------------------------

  // Salva eventi interi su Firestore
  const salvaSuFirestore = async (nuovaLista: EventoStorico[]) => {
    await setDoc(doc(db, "storage", "@storico"), { value: nuovaLista });
  };

  // Aggiungi evento
  const aggiungiEvento = async () => {
    if (!tipo.trim() || !descrizione.trim()) return;

    const nuovo: EventoStorico = {
      id: Date.now().toString(),
      tipo: tipo.trim(),
      descrizione: descrizione.trim(),
      data: data || new Date().toLocaleDateString("it-IT"),
    };

    const updated = [...eventi, nuovo];
    await salvaSuFirestore(updated);

    setTipo("");
    setDescrizione("");
    setData("");
  };

  // Elimina evento
  const eliminaEvento = async (id: string) => {
    const updated = eventi.filter((e) => e.id !== id);
    await salvaSuFirestore(updated);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Storico</h2>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Tipo evento"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          style={{ marginRight: 10, width: 150 }}
        />

        <input
          type="text"
          placeholder="Descrizione"
          value={descrizione}
          onChange={(e) => setDescrizione(e.target.value)}
          style={{ marginRight: 10, width: 250 }}
        />

        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          style={{ marginRight: 10 }}
        />

        <button onClick={aggiungiEvento}>Aggiungi</button>
      </div>

      <h3>Eventi registrati</h3>

      <ul>
        {eventi.map((ev) => (
          <li key={ev.id} style={{ marginBottom: 8 }}>
            <b>[{ev.tipo}]</b> – {ev.descrizione} – {ev.data}
            <button
              onClick={() => eliminaEvento(ev.id)}
              style={{ marginLeft: 10 }}
            >
              Elimina
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Storico;
