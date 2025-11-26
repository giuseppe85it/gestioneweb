import "./Home.css";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-container">

      <div className="home-content">

        <h1 className="home-title">Gestione Mezzi</h1>

        <div className="home-grid">
          
          <Link to="/lavori-da-eseguire" className="home-box">
            <span>🛠️</span>
            <p>Lavori</p>
          </Link>

          <Link to="/lavori-in-attesa" className="home-box">
            <span>⏳</span>
            <p>Attesa</p>
          </Link>

          <Link to="/materiali-da-ordinare" className="home-box">
            <span>📦</span>
            <p>Da ordinare</p>
          </Link>

          <Link to="/materiali-consegnati" className="home-box">
            <span>✅</span>
            <p>Consegnati</p>
          </Link>

          <Link to="/inventario" className="home-box">
            <span>📚</span>
            <p>Inventario</p>
          </Link>

          <Link to="/mezzi" className="home-box">
            <span>🚚</span>
            <p>Mezzi</p>
          </Link>

          <Link to="/colleghi" className="home-box">
            <span>👥</span>
            <p>Colleghi</p>
          </Link>

          <Link to="/fornitori" className="home-box">
            <span>🏭</span>
            <p>Fornitori</p>
          </Link>

        </div>

      </div>
    </div>
  );
}

export default Home;
