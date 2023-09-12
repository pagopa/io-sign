"use client";

import { useCallback, useReducer } from "react";
import { useTranslations } from "next-intl";

import { Typography, Stack, Snackbar, Alert } from "@mui/material";
import { LoadingButton } from "@mui/lab";

import Page from "@/components/Page";
import { User } from "@/lib/auth";
import { Institution } from "@/lib/institutions";

export type Props = {
  children: React.ReactNode;
  loggedUser: User;
  institutionId: Institution["id"];
};

type State = {
  accepted: boolean;
  loading: boolean;
  error: boolean;
};

const initialState = {
  accepted: false,
  loading: false,
  error: false,
};

type Action =
  | "accept_terms"
  | "accept_terms_ok"
  | "accept_terms_fail"
  | "reset";

function reducer(state: State, action: Action): State {
  switch (action) {
    case "accept_terms": {
      return {
        ...state,
        loading: true,
      };
    }
    case "accept_terms_ok": {
      return {
        ...state,
        loading: false,
        accepted: true,
      };
    }
    case "accept_terms_fail": {
      return {
        ...state,
        loading: false,
        error: true,
      };
    }
    default: {
      return initialState;
    }
  }
}

export default function Consent({
  children,
  loggedUser,
  institutionId,
}: Props) {
  const t = useTranslations("firmaconio.tos");

  const [state, dispatch] = useReducer(reducer, initialState);

  const onClick = useCallback(async () => {
    dispatch("accept_terms");
    try {
      const resp = await fetch(`/api/consents`, {
        method: "POST",
        body: JSON.stringify({
          institutionId,
          userId: loggedUser.id,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      dispatch(resp.ok ? "accept_terms_ok" : "accept_terms_fail");
    } catch {
      dispatch("accept_terms_fail");
    }
  }, [loggedUser, institutionId]);

  const onSnackbarClose = () => {
    dispatch("reset");
  };

  if (state.accepted) {
    return children;
  }

  return (
    <Page hideSidenav>
      <Stack flexGrow={1} justifyContent="center">
        <Stack spacing={8}>
          <Stack spacing={1} alignItems="center">
            <Typography variant="h3">{t("title")}</Typography>
            <Typography variant="body1">{t("description")}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="center">
            <LoadingButton
              loading={state.loading}
              variant="contained"
              onClick={onClick}
            >
              {t("cta")}
            </LoadingButton>
          </Stack>
        </Stack>
      </Stack>
      <Snackbar
        open={state.error}
        autoHideDuration={3000}
        onClose={onSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="error" variant="outlined">
          {t("errors.generic")}
        </Alert>
      </Snackbar>
    </Page>
  );
}
