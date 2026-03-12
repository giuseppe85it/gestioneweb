import { Navigate, useLocation } from "react-router-dom";
import {
  buildNextPathWithRole,
  getNextRoleFromSearch,
  getNextRoleLandingPath,
} from "./nextAccess";

function NextRoleLandingRedirect() {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const targetPath = buildNextPathWithRole(getNextRoleLandingPath(role), role, location.search);

  return <Navigate to={targetPath} replace />;
}

export default NextRoleLandingRedirect;
