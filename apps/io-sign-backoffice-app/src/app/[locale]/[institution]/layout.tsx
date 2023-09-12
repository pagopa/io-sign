import { notFound } from "next/navigation";

import { getInstitution } from "@/lib/institutions/use-cases";
import { getLoggedUser } from "@/lib/auth/use-cases";
import { getTOSAcceptance } from "@/lib/consents/use-cases";

import Header from "./_components/Header";
import Footer from "./_components/Footer";
import Consent from "./_components/Consent";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { institution: string };
}) {
  const loggedUser = await getLoggedUser();
  const institution = await getInstitution(params.institution);

  if (!institution) {
    notFound();
  }

  const tosAcceptance = await getTOSAcceptance(loggedUser.id, institution.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Header institutionId={institution.id} />
      {tosAcceptance ? (
        children
      ) : (
        <Consent loggedUser={loggedUser} institutionId={institution.id}>
          {children}
        </Consent>
      )}
      <Footer />
    </div>
  );
}
