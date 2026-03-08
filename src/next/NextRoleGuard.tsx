import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import NextAccessDeniedPage from "./NextAccessDeniedPage";
import NextAreaPage from "./NextAreaPage";
import {
  NEXT_DRIVER_EXPERIENCE_PATH,
  buildNextPathWithRole,
  canRoleAccessArea,
  getNextRoleFromSearch,
} from "./nextAccess";
import type { NextAreaId } from "./nextData";

type NextRoleGuardProps = {
  areaId: NextAreaId;
  children?: ReactNode;
};

function NextRoleGuard({ areaId, children }: NextRoleGuardProps) {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);

  if (canRoleAccessArea(role, areaId)) {
    return children ?? <NextAreaPage areaId={areaId} />;
  }

  if (role === "autista") {
    return (
      <Navigate
        to={buildNextPathWithRole(NEXT_DRIVER_EXPERIENCE_PATH, role, location.search)}
        replace
      />
    );
  }

  return <NextAccessDeniedPage areaId={areaId} role={role} />;
}

export default NextRoleGuard;
