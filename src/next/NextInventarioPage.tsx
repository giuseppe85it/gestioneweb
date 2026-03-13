import Inventario from "../pages/Inventario";
import NextMotherPage from "./NextMotherPage";

export default function NextInventarioPage() {
  return (
    <NextMotherPage pageId="inventario">
      <Inventario />
    </NextMotherPage>
  );
}
