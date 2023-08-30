"use client";

import { useTranslations } from "next-intl";

import EditableList, { Props as EditableListProps } from "./EditableList";

import { fiscalCodeSchema } from "@/lib/api-keys";

export type Props = Pick<
  EditableListProps,
  "onChange" | "value" | "disabled"
> & {
  editModal?: Partial<EditableListProps["editModal"]>;
};

export default function FiscalCodeListInput({
  value,
  onChange,
  editModal = {},
  disabled = false,
}: Props) {
  const t = useTranslations("firmaconio");
  const editModalWithDefaults: EditableListProps["editModal"] = Object.assign(
    {
      title: t("modals.editFiscalCode.title"),
    },
    editModal
  );
  return (
    <EditableList
      schema={fiscalCodeSchema}
      value={value}
      onChange={onChange}
      addItemButtonLabel={t("apiKey.testers.list.button")}
      inputLabel={t("apiKey.testers.list.inputLabel")}
      editModal={editModalWithDefaults}
      disabled={disabled}
    />
  );
}
