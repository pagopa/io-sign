"use client";

import { useTranslations } from "next-intl";

import EditableList, { Props as EditableListProps } from "./EditableList";

import { cidrSchema } from "@/lib/api-keys";

export type Props = Pick<
  EditableListProps,
  "onChange" | "value" | "disabled"
> & {
  editModal?: Partial<EditableListProps["editModal"]>;
};

export default function IpAddressListInput({
  value,
  onChange,
  editModal = {},
  disabled = false,
}: Props) {
  const t = useTranslations("firmaconio");
  const editModalWithDefaults: EditableListProps["editModal"] = Object.assign(
    {
      title: t("modals.editIpAddress.title"),
    },
    editModal
  );
  return (
    <EditableList
      schema={cidrSchema}
      value={value}
      onChange={onChange}
      addItemButtonLabel={t("apiKey.network.list.button")}
      inputLabel={t("apiKey.network.list.inputLabel")}
      editModal={editModalWithDefaults}
      disabled={disabled}
    />
  );
}
