import { useContext } from "react";

import InstitutionContext from "@/context/institution";

export default function Preview({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const institutionId = useContext(InstitutionContext);
  if (
    process.env.NODE_ENV === "development" ||
    institutionId === "4a4149af-172e-4950-9cc8-63ccc9a6d865"
  ) {
    return children;
  }
  return fallback ?? fallback;
}
