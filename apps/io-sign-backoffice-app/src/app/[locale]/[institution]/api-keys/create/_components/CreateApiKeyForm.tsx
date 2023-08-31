"use client";

import { useForm, FormProvider } from "react-hook-form";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";

import { Institution } from "@/lib/selfcare/api";

import { kebabCase } from "lodash";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";

import { CreateApiKeyPayload, createApiKeyPayloadSchema } from "@/lib/api-keys";
import { Alert, Snackbar } from "@mui/material";
import { createApiKey } from "@/lib/api-keys/client";

export type FormFields = CreateApiKeyPayload;

export default function CreateApiKeyForm({
  children,
  institution,
}: {
  children: React.ReactNode;
  institution: Institution;
}) {
  const methods = useForm<FormFields>({
    defaultValues: {
      environment: "test",
      displayName: "",
      cidrs: [],
      testers: [],
      institutionId: institution.id,
    },
    resolver: zodResolver(createApiKeyPayloadSchema),
  });

  const router = useRouter();

  const { setValue, watch } = methods;

  const [showError, setShowError] = useState(false);

  const environment = watch("environment", "test");

  useEffect(() => {
    const random = Math.random().toString(32).substring(3, 7);
    setValue(
      "displayName",
      `${kebabCase(institution.name)}-${random}-${environment}`
    );
  }, [institution.name, environment]);

  const onSubmit = async (data: FormFields) => {
    try {
      const { id } = await createApiKey(data);
      router.push(`/${institution.id}/api-keys/${id}`);
    } catch (e) {
      console.log(e);
      setShowError(true);
    }
  };

  const onSnackbarClose = () => {
    setShowError(false);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
      <Snackbar
        open={showError}
        autoHideDuration={3000}
        onClose={onSnackbarClose}
      >
        <Alert severity="error">Ciao!</Alert>
      </Snackbar>
    </FormProvider>
  );
}
