// src/pages/DettaglioOrdine.tsx

import  { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { uploadMaterialImage, deleteMaterialImage } from "../utils/materialImages";
import type { Ordine, MaterialeOrdine } from "../types/ordini";
import "./DettaglioOrdine.css";

const DettaglioOrdine: React.FC = () => {
  const { ordineId } = useParams<{ ordineId: string }>();
  const navigate = useNavigate();

  const [ordine, setOrdine] = useState<Ordine | null>(null);
  const [ordineOriginale, setOrdineOriginale] = useState<Ordine | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [addingMaterial, setAddingMaterial] = useState(false);

  const [newDesc, setNewDesc] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newUnit, setNewUnit] = useState("pz");
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);

  // -------------------------------------------
  // Load ordine
  // -------------------------------------------
  useEffect(() => {
    const load = async () => {
      if (!ordineId) return;

      const raw = await getItemSync("@ordini");
      const arr = Array.isArray(raw) ? (raw as Ordine[]) : [];

      const found = arr.find((o) => o.id === ordineId);
      if (!found) return;

      const a = JSON.parse(JSON.stringify(found));
      const b = JSON.parse(JSON.stringify(found));

      if (a.arrivato === undefined) a.arrivato = false;
      if (b.arrivato === undefined) b.arrivato = false;

      setOrdine(a);
      setOrdineOriginale(b);
      setLoading(false);
    };

    void load();
  }, [ordineId]);

  const oggi = () => {
    const n = new Date();
    const gg = String(n.getDate()).padStart(2, "0");
    const mm = String(n.getMonth() + 1).padStart(2, "0");
    const yy = n.getFullYear();
    return `${gg} ${mm} ${yy}`;
  };

  // -------------------------------------------
  // Ordina materiali
  // -------------------------------------------
  const materials = ordine
    ? [...ordine.materiali].sort((a, b) =>
        a.arrivato === b.arrivato ? 0 : a.arrivato ? 1 : -1
      )
    : [];

  // -------------------------------------------
  // Toggle ordine arrivato
  // -------------------------------------------
  const toggleArrivatoOrdine = async () => {
    if (!ordine) return;

    const nuovo = !ordine.arrivato;

    const updated: Ordine = {
      ...ordine,
      arrivato: nuovo,
      materiali: ordine.materiali.map((m) => ({
        ...m,
        arrivato: nuovo,
        dataArrivo: nuovo ? oggi() : "",
      })),
    };

    await salvaCompleto(updated);
  };

  // -------------------------------------------
  // Gestione campi materiale
  // -------------------------------------------
  const setField = (id: string, field: keyof MaterialeOrdine, value: any) => {
    setOrdine((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        materiali: prev.materiali.map((m) =>
          m.id === id ? { ...m, [field]: value } : m
        ),
      };
    });
  };

  const cambiaDescrizione = (id: string, v: string) =>
    setField(id, "descrizione", v.toUpperCase());

  const cambiaQuantita = (id: string, v: string) =>
    setField(id, "quantita", parseInt(v.replace(/\D/g, "").slice(0, 3)) || 0);

  const cambiaUnita = (id: string, v: string) => setField(id, "unita", v);

  const cambiaArrivato = (id: string, v: boolean) =>
    setField(id, "arrivato", v);

  const cambiaData = (id: string, v: string) =>
    setField(id, "dataArrivo", v);

  // -------------------------------------------
  // Upload foto
  // -------------------------------------------
  const uploadFoto = async (id: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ordine) return;

    const target = ordine.materiali.find((m) => m.id === id);
    const old = target?.fotoStoragePath;

    if (old) await deleteMaterialImage(old);

    const { fotoUrl, fotoStoragePath } = await uploadMaterialImage(file, id);

    setField(id, "fotoUrl", fotoUrl);
    setField(id, "fotoStoragePath", fotoStoragePath);
    e.target.value = "";
  };

  const rimuoviFoto = async (id: string) => {
    const target = ordine?.materiali.find((m) => m.id === id);

    if (target?.fotoStoragePath) {
      await deleteMaterialImage(target.fotoStoragePath);
    }

    setField(id, "fotoUrl", null);
    setField(id, "fotoStoragePath", null);
  };

  // -------------------------------------------
  // Aggiornamento inventario
  // -------------------------------------------
  const aggiornaInventario = async (oldO: Ordine, newO: Ordine) => {
    const raw = await getItemSync("@inventario");
    let inv: any[] = Array.isArray(raw) ? raw : [];

    const oldMap = new Map(oldO.materiali.map((m) => [m.id, m]));
    const newMap = new Map(newO.materiali.map((m) => [m.id, m]));

    const ids = new Set([...oldMap.keys(), ...newMap.keys()]);

    const applyDelta = (m: MaterialeOrdine, delta: number) => {
      // match su descrizione + unita + fornitore
      const idx = inv.findIndex(
        (x: any) =>
          x.descrizione === m.descrizione &&
          x.unita === m.unita &&
          x.fornitore === newO.nomeFornitore
      );

      if (idx >= 0) {
        // aggiorna quantità
        const newQty = inv[idx].quantita + delta;
        if (newQty <= 0) inv.splice(idx, 1);
        else inv[idx].quantita = newQty;
      } else if (delta > 0) {
        // nuova voce per fornitore diverso
        inv.push({
          id: `${Date.now()}_${Math.random()}`,
          descrizione: m.descrizione,
          unita: m.unita,
          quantita: delta,
          fornitore: newO.nomeFornitore || null,
          fotoUrl: m.fotoUrl || null,
          fotoStoragePath: m.fotoStoragePath || null,
        });
      }
    };

    ids.forEach((id) => {
      const old = oldMap.get(id);
      const now = newMap.get(id);

      if (old && !now) {
        if (old.arrivato) applyDelta(old, -old.quantita);
        return;
      }

      if (!old && now) {
        if (now.arrivato) applyDelta(now, now.quantita);
        return;
      }

      if (old && now) {
        if (!old.arrivato && now.arrivato) applyDelta(now, now.quantita);
        if (old.arrivato && !now.arrivato) applyDelta(old, -old.quantita);
        if (old.arrivato && now.arrivato) {
          const diff = now.quantita - old.quantita;
          if (diff !== 0) applyDelta(now, diff);
        }
      }
    });

    await setItemSync("@inventario", inv);
  };

  // -------------------------------------------
  // Salvataggio
  // -------------------------------------------
  const salvaCompleto = async (nuovo: Ordine) => {
    const raw = await getItemSync("@ordini");
    let arr = Array.isArray(raw) ? (raw as Ordine[]) : [];

    arr = arr.map((o) => (o.id === nuovo.id ? nuovo : o));

    await setItemSync("@ordini", arr);
    await aggiornaInventario(ordineOriginale!, nuovo);

    setOrdine(JSON.parse(JSON.stringify(nuovo)));
    setOrdineOriginale(JSON.parse(JSON.stringify(nuovo)));
    setEditing(false);
    setAddingMaterial(false);
  };

  // -------------------------------------------
  // Elimina materiale
  // -------------------------------------------
  const eliminaMateriale = async (id: string) => {
    if (!ordine) return;
    const target = ordine.materiali.find((m) => m.id === id);

    const updated: Ordine = {
      ...ordine,
      materiali: ordine.materiali.filter((m) => m.id !== id),
    };

    if (target?.arrivato) {
      const invRaw = await getItemSync("@inventario");
      let inv: any[] = Array.isArray(invRaw) ? invRaw : [];

      const idx = inv.findIndex(
        (i: any) =>
          i.descrizione === target.descrizione &&
          i.unita === target.unita &&
          i.fornitore === ordine.nomeFornitore
      );

      if (idx >= 0) {
        const newQty = inv[idx].quantita - target.quantita;
        if (newQty <= 0) inv.splice(idx, 1);
        else inv[idx].quantita = newQty;
      }

      await setItemSync("@inventario", inv);
    }

    await salvaCompleto(updated);
  };

  // -------------------------------------------
  // Aggiungi materiale
  // -------------------------------------------
  const salvaNuovoMateriale = async () => {
    if (!ordine) return;

    const id = `${Date.now()}_${Math.random()}`;

    let fotoUrl = null;
    let fotoStoragePath = null;

    if (newPhotoFile) {
      const up = await uploadMaterialImage(newPhotoFile, id);
      fotoUrl = up.fotoUrl;
      fotoStoragePath = up.fotoStoragePath;
    }

    const nuovo: MaterialeOrdine = {
      id,
      descrizione: newDesc.toUpperCase(),
      quantita: parseInt(newQty) || 0,
      unita: newUnit,
      arrivato: false,
      dataArrivo: "",
      fotoUrl,
      fotoStoragePath,
    };

    const updated: Ordine = {
      ...ordine,
      materiali: [...ordine.materiali, nuovo],
    };

    await salvaCompleto(updated);

    setNewDesc("");
    setNewQty("");
    setNewUnit("pz");
    setNewPhotoFile(null);
  };

  // -------------------------------------------
  // UI
  // -------------------------------------------
  if (loading || !ordine) {
    return (
      <div className="mdo-page">
        <div className="mdo-card">Caricamento…</div>
      </div>
    );
  }

  const tot = ordine.materiali.length;
  const arr = ordine.materiali.filter((m) => m.arrivato).length;

  const stato =
    arr === 0 ? "IN ATTESA" : arr < tot ? "PARZIALE" : "ARRIVATO";

  return (
    <div className="mdo-page">
      <div className="mdo-card">
        {/* HEADER */}
        <div className="dord-header">
          <div className="dord-header-left">
            <img src="/logo.png" className="dord-logo" />
            <h1 className="dord-title">Dettaglio Ordine</h1>
          </div>

          <div className="dord-header-buttons">
            <button
              className="btn-secondary"
              onClick={() => navigate("/ordini-in-attesa")}
            >
              Torna
            </button>

            {!editing && (
              <button className="btn-toggle" onClick={toggleArrivatoOrdine}>
                {ordine.arrivato
                  ? "Segna come NON Arrivato"
                  : "Segna come Arrivato"}
              </button>
            )}

            {!editing ? (
              <button
                className="btn-primary"
                onClick={() => setEditing(true)}
              >
                Modifica
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={() => salvaCompleto(ordine)}
              >
                Salva
              </button>
            )}
          </div>
        </div>

        {/* STATO */}
        <div className="dord-status">
          {stato === "IN ATTESA" && (
            <span className="badge badge-red">In attesa</span>
          )}
          {stato === "PARZIALE" && (
            <span className="badge badge-yellow">Parziale</span>
          )}
          {stato === "ARRIVATO" && (
            <span className="badge badge-green">Arrivato</span>
          )}
        </div>

        {/* INFO ORDINE */}
        <div className="dord-info-box">
          <span>Fornitore: {ordine.nomeFornitore}</span>
          <span>Data: {ordine.dataOrdine}</span>
          <span>Materiali: {tot}</span>
        </div>

        {/* AGGIUNGI MATERIALE */}
        {!editing && !addingMaterial && (
          <button className="btn-add" onClick={() => setAddingMaterial(true)}>
            + Aggiungi materiale
          </button>
        )}

        {/* FORM AGGIUNGI MATERIALE */}
        {addingMaterial && (
          <div className="add-box">
            <input
              className="add-input"
              placeholder="DESCRIZIONE"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />

            <div className="add-row">
              <input
                className="add-qty"
                placeholder="QTA"
                value={newQty}
                onChange={(e) =>
                  setNewQty(e.target.value.replace(/\D/g, "").slice(0, 3))
                }
              />

              <select
                className="add-unit"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
              >
                <option value="pz">PZ</option>
                <option value="kg">KG</option>
                <option value="m">M</option>
                <option value="lt">LT</option>
              </select>
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewPhotoFile(e.target.files?.[0] || null)}
            />

            <div className="add-actions">
              <button className="btn-primary" onClick={salvaNuovoMateriale}>
                Salva
              </button>
              <button
                className="btn-secondary"
                onClick={() => setAddingMaterial(false)}
              >
                Annulla
              </button>
            </div>
          </div>
        )}

        {/* LISTA MATERIALI */}
        <div className="materials-list">
          {materials.map((m) => (
            <div className="material-card" key={m.id}>
              <div className="photo-box">
                {m.fotoUrl ? (
                  <img src={m.fotoUrl} className="photo" />
                ) : (
                  <div className="photo-placeholder">Nessuna foto</div>
                )}

                {editing && (
                  <>
                    <label className="btn-secondary upload-label">
                      Foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => uploadFoto(m.id, e)}
                      />
                    </label>

                    {m.fotoUrl && (
                      <button
                        className="btn-danger"
                        onClick={() => rimuoviFoto(m.id)}
                      >
                        Rimuovi
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="mat-info">
                {!editing ? (
                  <div className="mat-desc">{m.descrizione}</div>
                ) : (
                  <input
                    className="input-desc"
                    value={m.descrizione}
                    onChange={(e) => cambiaDescrizione(m.id, e.target.value)}
                  />
                )}

                <div className="mat-row">
                  {!editing ? (
                    <span className="mat-qty">
                      {m.quantita} {m.unita}
                    </span>
                  ) : (
                    <>
                      <input
                        className="input-qty"
                        value={m.quantita}
                        onChange={(e) => cambiaQuantita(m.id, e.target.value)}
                      />
                      <select
                        className="input-unit"
                        value={m.unita}
                        onChange={(e) => cambiaUnita(m.id, e.target.value)}
                      >
                        <option value="pz">PZ</option>
                        <option value="kg">KG</option>
                        <option value="m">M</option>
                        <option value="lt">LT</option>
                      </select>
                    </>
                  )}
                </div>

                <div className="mat-arr">
                  {!editing ? (
                    m.arrivato ? (
                      <span className="arr-green">Arrivato</span>
                    ) : (
                      <span className="arr-red">In attesa</span>
                    )
                  ) : (
                    <input
                      type="checkbox"
                      checked={m.arrivato}
                      onChange={(e) => cambiaArrivato(m.id, e.target.checked)}
                    />
                  )}

                  {!editing ? (
                    m.arrivato && (
                      <span className="arr-date">{m.dataArrivo}</span>
                    )
                  ) : (
                    <input
                      className="input-date"
                      value={m.dataArrivo}
                      onChange={(e) => cambiaData(m.id, e.target.value)}
                      placeholder="gg mm aaaa"
                    />
                  )}
                </div>

                {editing && (
                  <button
                    className="btn-danger btn-elimina"
                    onClick={() => eliminaMateriale(m.id)}
                  >
                    Elimina
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DettaglioOrdine;
