import "./Home.css";
import { Link } from "react-router-dom";


function Home() {
  return (
    <div className="home-container">
      
      {/* Cerchio */}
      <div className="home-circle"></div>

      {/* 12 - Lavori da eseguire */}
      <Link to="/lavori-da-eseguire" className="home-icon icon-12">
        <span>🛠️</span>
        <p>Lavori</p>
      </Link>

      {/* 1:30 - Lavori in attesa */}
      <Link to="/lavori-in-attesa" className="home-icon icon-130">
        <span>⏳</span>
        <p>Attesa</p>
      </Link>

      {/* 3 - Materiali da ordinare */}
      <Link to="/materiali-da-ordinare" className="home-icon icon-3">
        <span>📦</span>
        <p>Da ordinare</p>
      </Link>

      {/* 4:30 - Materiali consegnati */}
      <Link to="/materiali-consegnati" className="home-icon icon-430">
        <span>✅</span>
        <p>Consegnati</p>
      </Link>

      {/* 6 - Inventario */}
      <Link to="/inventario" className="home-icon icon-6">
        <span>📚</span>
        <p>Inventario</p>
      </Link>

      {/* 7:30 - Mezzi */}
      <Link to="/mezzi" className="home-icon icon-730">
        <span>🚚</span>
        <p>Mezzi</p>
      </Link>

      {/* 9 - Colleghi */}
      <Link to="/colleghi" className="home-icon icon-9">
        <span>👥</span>
        <p>Colleghi</p>
      </Link>

      {/* 10:30 - Fornitori */}
      <Link to="/fornitori" className="home-icon icon-1030">
        <span>🏭</span>
        <p>Fornitori</p>
      </Link>

      {/* CARD CENTRALE */}
      <div className="home-center-card">
        <h1>Gestione Mezzi</h1>
      </div>
    </div>
  );
}

export default Home;
