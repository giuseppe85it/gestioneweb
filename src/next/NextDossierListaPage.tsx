import DossierLista from "../pages/DossierLista";
import NextMotherPage from "./NextMotherPage";

export default function NextDossierListaPage() {
  return (
    <NextMotherPage pageId="dossier-lista">
      <DossierLista />
    </NextMotherPage>
  );
}
