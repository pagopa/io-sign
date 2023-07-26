"use client";

import { HeaderAccount, RootLinkType } from "@pagopa/mui-italia";
import { User } from "@/app/auth/_lib/user";
import { useRouter } from "next/navigation";

type Props = {
  loggedUser: User;
  documentationUrl: string;
  supportUrl: string;
  companyLink: RootLinkType;
};

export default function HeaderWithAccountInfo({
  loggedUser,
  documentationUrl,
  supportUrl,
  companyLink,
}: Props) {
  const router = useRouter();
  function handleAssistanceClick() {
    window.location.href = supportUrl;
  }
  function handleDocumentationClick() {
    window.open(documentationUrl, "_blank", "noreferrer");
  }
  function handleLogout() {
    router.push("/auth/logout");
  }
  return (
    <HeaderAccount
      rootLink={companyLink}
      onAssistanceClick={handleAssistanceClick}
      onDocumentationClick={handleDocumentationClick}
      loggedUser={loggedUser}
      onLogout={handleLogout}
    />
  );
}
