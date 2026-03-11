import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  canRoleAccessGuardArea,
  getGuardAreaAccessConfig,
  getNextRoleFromSearch,
  type NextGuardAreaId,
} from "./nextAccess";

type NextRoleGuardProps = {
  areaId: NextGuardAreaId;
  children?: ReactNode;
};

function NextRoleGuard({ areaId, children }: NextRoleGuardProps) {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const access = getGuardAreaAccessConfig(areaId);
  const allowed = canRoleAccessGuardArea(role, areaId);

  useEffect(() => {
    if (!import.meta.env.DEV || allowed) {
      return;
    }

    console.warn(
      `[NextRoleGuard] route ${areaId} aperta in modalita permissiva per role=${role}; ` +
        `permissionKey=${access.permissionKey}. Nessun blocco runtime applicato per non rompere il clone read-only.`,
    );
  }, [access.permissionKey, allowed, areaId, role]);

  return children ?? null;
}

export default NextRoleGuard;
