"use client";

import { useEffect, useState } from "react";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { kebabCase } from "lodash";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Alert, Snackbar, Stack, Button } from "@mui/material";
import { LoadingButton } from "@mui/lab";

import { CreateApiKeyPayload, createApiKeyPayloadSchema } from "@/lib/api-keys";
import { createApiKey } from "@/lib/api-keys/client";
import { Institution } from "@/lib/selfcare/api";

import NextLink from "next/link";

export default function CreateApiKeyClientForm({
  children,
  institution,
}: {
  children: React.ReactNode;
  institution: Institution;
}) {
  const methods = useForm<CreateApiKeyPayload>({
    defaultValues: {
      environment: "test",
      displayName: "",
      cidrs: [],
      testers: [],
      institutionId: institution.id,
    },
    resolver: zodResolver(createApiKeyPayloadSchema),
  });

  const t = useTranslations("firmaconio.createApiKey.form");

  const { setValue, watch, formState, handleSubmit } = methods;

  const router = useRouter();

  const [showError, setShowError] = useState(false);

  const environment = watch("environment", "test");

  useEffect(() => {
    const random = Math.random().toString(32).substring(3, 7);
    setValue(
      "displayName",
      `${kebabCase(institution.name)}-${random}-${environment}`
    );
  }, [institution.name, environment]);

  const onSubmit = async (data: CreateApiKeyPayload) => {
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={5}>
          {children}
          <Stack direction="row" justifyContent="space-between">
            <Button
              variant="outlined"
              href={`/${institution.id}/api-keys`}
              LinkComponent={NextLink}
            >
              {t("actions.cancel")}
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={formState.isSubmitting}
            >
              {t("actions.confirm")}
            </LoadingButton>
          </Stack>
        </Stack>
      </form>
      <Snackbar
        open={showError}
        autoHideDuration={3000}
        onClose={onSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="error" variant="outlined">
          {t("errors.generic")}
        </Alert>
      </Snackbar>
    </FormProvider>
  );
}
