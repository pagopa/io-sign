"use client";

import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Stack, Typography, TextField, Button } from "@mui/material";
import { LoadingButton } from "@mui/lab";

import Dialog from "@/components/Dialog";
import { useTranslations } from "next-intl";

export type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (email: string) => void;
  currentEmail: string;
};

const formFieldsSchema = z.object({
  email: z.string().email(),
});

type FormFields = z.infer<typeof formFieldsSchema>;

export default function EditEmailDialog({
  open,
  onClose,
  currentEmail,
  onConfirm,
}: Props) {
  const t = useTranslations(
    "firmaconio.overview.cards.issuer.supportEmail.editModal"
  );
  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<FormFields>({
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(formFieldsSchema),
  });
  const onSubmit = (data: FormFields) => {
    onConfirm(data.email);
    reset();
  };
  return (
    <Dialog open={open}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={4}>
          <Stack spacing={2}>
            <Typography variant="h6">{t("title")}</Typography>
            <Typography variant="body1">{t("description")}</Typography>
          </Stack>
          <Stack spacing={1}>
            <Typography variant="body2" fontWeight={600}>
              {t("currentValueLabel")}
            </Typography>
            <Typography variant="body2">{currentEmail}</Typography>
          </Stack>
          <Stack spacing={2}>
            <Typography variant="body2" fontWeight={600}>
              {t("newValueLabel")}
            </Typography>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t("newValueInputLabel")}
                  autoComplete="off"
                  error={errors.email ? true : false}
                  helperText={errors.email?.message}
                />
              )}
            />
          </Stack>
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button variant="outlined" onClick={onClose}>
              {t("cancel")}
            </Button>
            <LoadingButton
              type="submit"
              loading={isSubmitting}
              variant="contained"
            >
              {t("confirm")}
            </LoadingButton>
          </Stack>
        </Stack>
      </form>
    </Dialog>
  );
}
