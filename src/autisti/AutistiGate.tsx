import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getItemSync } from "../utils/storageSync";

export default function AutistiGate() {
  const navigate = useNavigate();

  useEffect(() => {
    const autista = getItemSync("@autista_attivo");
    const mezzo = getItemSync("@mezzo_attivo_autista");

    if (!autista) {
      navigate("/autisti/login", { replace: true });
      return;
    }

    if (!mezzo) {
      navigate("/autisti/setup-mezzo", { replace: true });
      return;
    }

    navigate("/autisti/home", { replace: true });
  }, [navigate]);

  return null; // non renderizza nulla
}
