import { Link } from "react-router-dom";
import "./next-shell.css";

type NextAccessDeniedPageProps = {
  areaId: string;
  role: string;
};

function NextAccessDeniedPage(_props: NextAccessDeniedPageProps) {
  return (
    <section className="next-clone-placeholder">
      <h1>Accesso non disponibile</h1>
      <p>Questa vista non e attiva nel clone read-only corrente.</p>
      <p style={{ marginTop: 12 }}>
        <Link to="/next">Torna alla Home clone</Link>
      </p>
    </section>
  );
}

export default NextAccessDeniedPage;
