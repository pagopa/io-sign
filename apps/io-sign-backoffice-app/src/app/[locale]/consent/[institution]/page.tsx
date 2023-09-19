"use client";

import { useTranslations } from "next-intl";

import NextLink from "next/link";

import { Typography, Stack, Link } from "@mui/material";
import { LoadingButton } from "@mui/lab";

import Page from "@/components/Page";

import { useCallback, useState } from "react";

import { useRouter } from "next/navigation";

export default function Consent({
  params,
}: {
  params: { institution: string };
}) {
  const t = useTranslations("firmaconio.tos");

  const router = useRouter();

  const [state, setState] = useState({
    loading: false,
    error: false,
  });

  const onClick = useCallback(async () => {
    setState({ loading: true, error: false });
    try {
      const response = await fetch(
        `/api/institutions/${params.institution}/consents`,
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      router.push(`/${params.institution}`);
    } catch {
      setState({ loading: false, error: true });
    }
  }, [router, params.institution]);

  return (
    <Page hideSidenav>
      <Stack flexGrow={1} justifyContent="center">
        <Stack spacing={8}>
          <Stack spacing={1} alignItems="center">
            <Typography variant="h3">{t("title")}</Typography>
            <Typography variant="body1">
              {t.rich("description", {
                pp: (label) => (
                  <Link component={NextLink} href="/privacy-policy">
                    {label}
                  </Link>
                ),
              })}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="center">
            <LoadingButton
              loading={state.loading}
              onClick={onClick}
              variant="contained"
            >
              {t("cta")}
            </LoadingButton>
          </Stack>
        </Stack>
      </Stack>
    </Page>
  );
}
