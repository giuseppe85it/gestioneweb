import { Link } from "react-router-dom";
import "./next-shell.css";

function NextIAGestionalePage() {
  return (
    <section className="next-clone-placeholder">
      <h1>IA Gestionale</h1>
      <p>Area non ancora clonata nella NEXT read-only. Il lavoro attivo resta sulle schermate madre prioritarie.</p>
      <p style={{ marginTop: 12 }}>
        <Link to="/next/centro-controllo">Torna alla Home clone</Link>
      </p>
    </section>
  );
}

export default NextIAGestionalePage;
