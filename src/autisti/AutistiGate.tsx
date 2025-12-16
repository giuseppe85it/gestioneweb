import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAutistaLocal, getMezzoLocal } from "./autistiStorage";

export default function AutistiGate() {
  const navigate = useNavigate();

  useEffect(() => {
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

    navigate("/autisti/home", { replace: true });
  }, [navigate]);

  return null;
}
