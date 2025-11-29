import "./Home.css";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-container">

      <div className="home-content">

        <h1 className="home-title">Gestione Mezzi</h1>

        <div className="home-grid">

          <Link to="/lavori-da-eseguire" className="home-box">
            <img src="/icons/lavori.png" alt="Lavori" className="icon-img" />
            <p>Lavori</p>
          </Link>

          {/* ICONA DOSSIER (UNICA E CORRETTA) */}
          <Link to="/dossiermezzi" className="home-box">
            <img src="/icons/mezzi.png" alt="Dossier Mezzi" className="icon-img" />
            <p>Dossier</p>
          </Link>

          <Link to="/materiali-da-ordinare" className="home-box">
            <img src="/icons/daordinare.png" alt="Da ordinare" className="icon-img" />
            <p>Da ordinare</p>
          </Link>

          <Link to="/materiali-consegnati" className="home-box">
            <img src="/icons/consegnati.png" alt="Consegnati" className="icon-img" />
            <p>Consegnati</p>
          </Link>

          <Link to="/inventario" className="home-box">
            <img src="/icons/inventario.png" alt="Inventario" className="icon-img" />
            <p>Inventario</p>
          </Link>

          <Link to="/mezzi" className="home-box">
            <img src="/icons/mezzi.png" alt="Mezzi" className="icon-img" />
            <p>Mezzi</p>
          </Link>

          <Link to="/colleghi" className="home-box">
            <img src="/icons/colleghi.png" alt="Colleghi" className="icon-img" />
            <p>Colleghi</p>
          </Link>

          <Link to="/fornitori" className="home-box">
            <img src="/icons/fornitori.png" alt="Fornitori" className="icon-img" />
            <p>Fornitori</p>
          </Link>
<Link to="/manutenzioni" className="home-box">
  <img src="/icons/manutenzioni.png" alt="Manutenzioni" className="icon-img" />
  <p>Manutenzioni</p>
</Link>

        </div>

      </div>
    </div>
  );
}

export default Home;
