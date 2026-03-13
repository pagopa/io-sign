import SelfcareLayout from "@/components/SelfcareLayout";

import { checkTOSAcceptance } from "@/lib/consents/use-cases";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ institution: string }>;
}) {
  const { institution } = await params;
  try {
    await checkTOSAcceptance(institution);
  } catch (e) {
    return (
      <SelfcareLayout institutionId={institution}>
        {children}
      </SelfcareLayout>
    );
  }
  redirect(`/${institution}`);
}
