import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getItemSync } from "../utils/storageSync";

export default function AutistiGate() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function check() {
      const autista = await getItemSync("@autista_attivo");
      const mezzo = await getItemSync("@mezzo_attivo_autista");

      if (!mounted) return;

      if (!autista) {
        navigate("/autisti/login", { replace: true });
        return;
      }

      if (!mezzo) {
        navigate("/autisti/setup-mezzo", { replace: true });
        return;
      }

      navigate("/autisti/home", { replace: true });
    }

    check();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return null;
}
