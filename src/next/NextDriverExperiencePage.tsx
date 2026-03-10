import { Link } from "react-router-dom";
import "./next-shell.css";

function NextDriverExperiencePage() {
  return (
    <section className="next-clone-placeholder">
      <h1>Area Autista</h1>
      <p>L'esperienza autisti resta separata e non entra nel clone admin della NEXT.</p>
      <p style={{ marginTop: 12 }}>
        <Link to="/next/centro-controllo">Torna alla Home clone</Link>
      </p>
    </section>
  );
}

export default NextDriverExperiencePage;
