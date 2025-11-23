import { useState } from "react";

interface StorageEntry {
  key: string;
  value: string;
}

function CheckStorage() {
  const [entries, setEntries] = useState<StorageEntry[]>([]);
  const [keyInput, setKeyInput] = useState("");
  const [valueInput, setValueInput] = useState("");

  const caricaStorage = () => {
    const items: StorageEntry[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key) ?? "";
      items.push({ key, value });
    }

    setEntries(items);
  };

  const salvaVoce = () => {
    if (!keyInput.trim()) return;

    localStorage.setItem(keyInput, valueInput);
    setKeyInput("");
    setValueInput("");
    caricaStorage();
  };

  const eliminaVoce = (key: string) => {
    localStorage.removeItem(key);
    caricaStorage();
  };

  const svuotaTutto = () => {
    localStorage.clear();
    setEntries([]);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Check Storage</h2>

      <div style={{ marginBottom: 20 }}>
        <button onClick={caricaStorage} style={{ marginRight: 10 }}>
          Carica contenuto
        </button>
        <button onClick={svuotaTutto}>Svuota tutto</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Chiave"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          style={{ marginRight: 10 }}
        />

        <input
          type="text"
          placeholder="Valore"
          value={valueInput}
          onChange={(e) => setValueInput(e.target.value)}
          style={{ marginRight: 10, width: 200 }}
        />

        <button onClick={salvaVoce}>Salva</button>
      </div>

      <h3>Elementi in storage</h3>

      <ul>
        {entries.map((item) => (
          <li key={item.key} style={{ marginBottom: 8 }}>
            <b>{item.key}:</b> {item.value}
            <button
              onClick={() => eliminaVoce(item.key)}
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

export default CheckStorage;
