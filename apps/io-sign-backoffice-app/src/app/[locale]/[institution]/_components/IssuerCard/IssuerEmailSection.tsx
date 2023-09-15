"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Snackbar, Stack, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Issuer } from "@/lib/issuers";
import useSubmitMachine from "@/hooks/useSubmitMachine";
import EditEmailDialog from "./EditEmailDialog";

export type Props = {
  issuer: Issuer;
};

export default function IssuerEmailSection({ issuer }: Props) {
  const t = useTranslations("firmaconio.overview.cards.issuer.supportEmail");

  const [currentEmail, setCurrentEmail] = useState(issuer.supportEmail);
  const [showEditModal, setShowEditModal] = useState(false);

  const submit = useSubmitMachine();

  const onEditClick = () => {
    setShowEditModal(true);
  };

  const onEditModalClose = () => {
    setShowEditModal(false);
  };

  const onEditModalConfirm = useCallback(
    async (email: string) => {
      setShowEditModal(false);
      submit.start();
      try {
        const response = await fetch(
          `/api/institutions/${issuer.institutionId}/issuers/${issuer.id}`,
          {
            method: "PATCH",
            body: JSON.stringify([
              {
                op: "replace",
                path: "/supportEmail",
                value: email,
              },
            ]),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        submit.end(true);
        setCurrentEmail(email);
      } catch (cause) {
        submit.end(false);
      }
    },
    [issuer, submit]
  );

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="body2" width="157px">
          {t("label")}
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {currentEmail}
        </Typography>
      </Stack>
      <Stack direction="row">
        <LoadingButton
          loading={submit.state === "submitting"}
          size="small"
          variant="contained"
          onClick={onEditClick}
        >
          {t("cta")}
        </LoadingButton>
      </Stack>
      <EditEmailDialog
        open={showEditModal}
        onClose={onEditModalClose}
        onConfirm={onEditModalConfirm}
        currentEmail={currentEmail}
      />
      {submit.submitted && (
        <Snackbar
          open={true}
          autoHideDuration={3000}
          onClose={submit.reset}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={submit.state === "success" ? "success" : "error"}
            variant="outlined"
          >
            {t(`edit.${submit.state}`)}
          </Alert>
        </Snackbar>
      )}
    </Stack>
  );
}
