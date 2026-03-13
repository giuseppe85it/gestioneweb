import { Outlet, useLocation } from "react-router-dom";
import { useNextCloneNavigation } from "./nextCloneNavigation";

function NextShell() {
  const location = useLocation();
  useNextCloneNavigation();

  const shellClassName =
    location.pathname === "/next" ? "app-shell app-shell--homeWide" : "app-shell";

  return (
    <div className={shellClassName}>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default NextShell;
