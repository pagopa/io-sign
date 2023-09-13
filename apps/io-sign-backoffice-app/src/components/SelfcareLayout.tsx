import { notFound } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getInstitution } from "@/lib/institutions/use-cases";

export type Props = {
  children: React.ReactNode;
  institutionId: string;
};

export default async function SelfcareLayout({
  children,
  institutionId,
}: Props) {
  const institution = await getInstitution(institutionId);
  if (!institution) {
    notFound();
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Header institutionId={institution.id} />
      {children}
      <Footer />
    </div>
  );
}
