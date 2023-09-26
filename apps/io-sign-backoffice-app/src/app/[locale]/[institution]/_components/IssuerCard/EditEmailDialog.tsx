"use client";

import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Stack, Typography, TextField, Button } from "@mui/material";

import Dialog from "@/components/Dialog";
import { useTranslations } from "next-intl";

export type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (email: string) => void;
  currentEmail: string;
};

const formFieldsSchema = z.object({
  email: z.string().email({
    message: "errors.invalid",
  }),
});

type FormFields = z.infer<typeof formFieldsSchema>;

// todo (SFEQS-2019): "reset" function called from "onSubmit" function
// does not reset the validation state of the form. Maybe is a bug
// "react-hook-form"
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
    formState: { isDirty, errors },
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

  const onCancel = () => {
    onClose();
    reset();
  };

  return (
    <Dialog open={open} onClose={onClose}>
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
                  helperText={
                    errors.email ? t(errors.email?.message) : undefined
                  }
                />
              )}
            />
          </Stack>
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button variant="outlined" onClick={onCancel}>
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || errors.email !== undefined}
              variant="contained"
            >
              {t("confirm")}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Dialog>
  );
}
