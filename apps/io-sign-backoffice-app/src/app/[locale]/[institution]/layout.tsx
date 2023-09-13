import SelfcareLayout from "@/components/SelfcareLayout";

import { checkTOSAcceptance } from "@/lib/consents/use-cases";

import { redirect } from "next/navigation";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { institution: string };
}) {
  try {
    await checkTOSAcceptance(params.institution);
  } catch {
    redirect(`/consent/${params.institution}`);
  }
  return (
    <SelfcareLayout institutionId={params.institution}>
      {children}
    </SelfcareLayout>
  );
}
