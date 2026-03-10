import { Link } from "react-router-dom";
import "./next-shell.css";

function NextStrumentiTrasversaliPage() {
  return (
    <section className="next-clone-placeholder">
      <h1>Strumenti Trasversali</h1>
      <p>Area non ancora clonata nella NEXT read-only. Restano da riallineare dopo le pagine madre prioritarie.</p>
      <p style={{ marginTop: 12 }}>
        <Link to="/next/centro-controllo">Torna alla Home clone</Link>
      </p>
    </section>
  );
}

export default NextStrumentiTrasversaliPage;
