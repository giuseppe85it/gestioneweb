import { Navigate, useLocation } from "react-router-dom";
import Home from "../pages/Home";
import { getNextRoleFromSearch } from "./nextAccess";
import NextMotherPage from "./NextMotherPage";
import { NEXT_AUTISTI_APP_PATH } from "./nextStructuralPaths";

export default function NextHomePage() {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);

  if (role === "autista") {
    return <Navigate replace to={`${NEXT_AUTISTI_APP_PATH}${location.search || ""}`} />;
  }

  return (
    <NextMotherPage pageId="home">
      <Home />
    </NextMotherPage>
  );
}
