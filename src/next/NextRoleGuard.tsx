import type { ReactNode } from "react";

type NextRoleGuardProps = {
  areaId: string;
  children?: ReactNode;
};

function NextRoleGuard({ children }: NextRoleGuardProps) {
  return children ?? null;
}

export default NextRoleGuard;
