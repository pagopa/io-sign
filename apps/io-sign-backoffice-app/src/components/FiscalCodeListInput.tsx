"use client";

import { useTranslations } from "next-intl";

import { z } from "zod";

import EditableList, { Props as EditableListProps } from "./EditableList";

import { fiscalCodeSchema } from "@/lib/api-keys";

export type Props = Pick<
  EditableListProps,
  "onChange" | "items" | "disabled" | "deleteModal"
> & {
  editModal?: Partial<EditableListProps["editModal"]>;
};

export default function FiscalCodeListInput({
  items,
  onChange,
  editModal = {},
  deleteModal,
  disabled = false,
}: Props) {
  const t = useTranslations("firmaconio");
  const editModalWithDefaults: EditableListProps["editModal"] = Object.assign(
    {
      title: t("modals.editFiscalCode.title"),
    },
    editModal
  );

  const schema = z.string().toUpperCase().pipe(fiscalCodeSchema);

  return (
    <EditableList
      schema={schema}
      items={items}
      onChange={onChange}
      addItemButtonLabel={t("apiKey.testers.list.button")}
      inputLabel={t("apiKey.testers.list.inputLabel")}
      errorLabel={t("apiKey.testers.errors.invalid")}
      editModal={editModalWithDefaults}
      deleteModal={deleteModal}
      disabled={disabled}
    />
  );
}
