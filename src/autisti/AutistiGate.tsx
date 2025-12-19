import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAutistaLocal, getMezzoLocal } from "./autistiStorage";
import { getItemSync } from "../utils/storageSync";

const CONTROLLI_KEY = "@controlli_mezzo_autisti";

export default function AutistiGate() {
  const navigate = useNavigate();

  useEffect(() => {
    async function checkFlow() {
      const autista = getAutistaLocal();
      const mezzo = getMezzoLocal();

      if (!autista) {
        navigate("/autisti/login", { replace: true });
        return;
      }

      if (!mezzo) {
        navigate("/autisti/setup-mezzo", { replace: true });
        return;
      }
// SE NON C'È MOTRICE → STO CAMBIANDO → TORNO A SETUP
if (!mezzo.targaCamion) {
  navigate("/autisti/setup-mezzo");
  return;
}

      // ================================
      // CONTROLLO MEZZO OBBLIGATORIO
      // ================================
      const controlli = (await getItemSync(CONTROLLI_KEY)) || [];

     const controlloValido = controlli
  .filter((c: any) => c.obbligatorio === true)
  .find(
    (c: any) =>
      c.badgeAutista === autista.badge &&
      c.targaCamion === mezzo.targaCamion
  );


      if (!controlloValido) {
             + navigate("/autisti/controllo", { replace: true });

        return;
      }

      navigate("/autisti/home", { replace: true });
    }

    checkFlow();
  }, [navigate]);

  return null;
}
