import { NextIntlClientProvider, useLocale, useMessages } from "next-intl";

import { pick } from "lodash";

import { Institution } from "@/lib/selfcare/api";

import CreateApiKeyClientForm from "./CreateApiKeyClientForm";

export default function CreateApiKeyForm({
  children,
  institution,
}: {
  children: React.ReactNode;
  institution: Institution;
}) {
  const locale = useLocale();
  const messages = useMessages();

  if (!messages) {
    throw new Error("unable to fetch localized messages");
  }

  const createApiKeyFormMessages = pick(messages, [
    "firmaconio.apiKey.network",
    "firmaconio.apiKey.testers",
    "firmaconio.createApiKey.form",
    "firmaconio.modals",
  ]);

  return (
    <NextIntlClientProvider locale={locale} messages={createApiKeyFormMessages}>
      <CreateApiKeyClientForm institution={institution}>
        {children}
      </CreateApiKeyClientForm>
    </NextIntlClientProvider>
  );
}
