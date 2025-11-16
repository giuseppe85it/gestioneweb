import { Routes, Route, Link } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home";
import LavoriDaEseguire from "./pages/LavoriDaEseguire";
import LavoriInAttesa from "./pages/LavoriInAttesa";
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
import OrdiniNonArrivati from "./pages/OrdiniNonArrivati";
import CheckStorage from "./pages/CheckStorage";

function App() {
  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Gestione Manutenzione – Web</h1>

      <nav style={{ marginBottom: 20 }}>
        <Link to="/">Home</Link> |{" "}
        <Link to="/lavori-da-eseguire">Lavori da eseguire</Link> |{" "}
        <Link to="/materiali-da-ordinare">Materiali da ordinare</Link> |{" "}
        <Link to="/inventario">Inventario</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lavori-da-eseguire" element={<LavoriDaEseguire />} />
        <Route path="/lavori-in-attesa" element={<LavoriInAttesa />} />
        <Route path="/lavori-eseguiti" element={<LavoriEseguiti />} />
        <Route path="/materiali-da-ordinare" element={<MaterialiDaOrdinare />} />
        <Route path="/materiali-consegnati" element={<MaterialiConsegnati />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/colleghi" element={<Colleghi />} />
        <Route path="/fornitori" element={<Fornitori />} />
        <Route path="/mezzi" element={<Mezzi />} />
        <Route path="/storico" element={<Storico />} />
        <Route path="/ordini-arrivati" element={<OrdiniArrivati />} />
        <Route path="/ordini-in-attesa" element={<OrdiniInAttesa />} />
        <Route path="/ordini-non-arrivati" element={<OrdiniNonArrivati />} />
        <Route path="/check-storage" element={<CheckStorage />} />
      </Routes>
    </div>
  );
}

export default App;
