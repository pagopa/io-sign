"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";

import EditableList, { Props as EditableListProps } from "./EditableList";

import { cidrSchema, PUBLIC_CIDR } from "@/lib/api-keys";

export type Props = Pick<
  EditableListProps,
  "onChange" | "items" | "disabled" | "deleteModal"
> & {
  editModal?: Partial<EditableListProps["editModal"]>;
};

const IP_WHITELIST = "0.0.0.0";

const isIpWhitelist = (val: string) => val === IP_WHITELIST;

export default function IpAddressListInput({
  items,
  onChange,
  editModal = {},
  deleteModal,
  disabled = false,
}: Props) {
  const t = useTranslations("firmaconio");
  const editModalWithDefaults: EditableListProps["editModal"] = Object.assign(
    {
      title: t("modals.editIpAddress.title"),
    },
    editModal,
  );

  const schema = cidrSchema.or(
    z
      .string()
      .ip()
      .transform((ip) => (isIpWhitelist(ip) ? PUBLIC_CIDR : `${ip}/32`)),
  );

  const formatItem = (item: string) => item.replace("/32", "");

  return (
    <EditableList
      schema={schema}
      items={items}
      onChange={onChange}
      addItemButtonLabel={t("apiKey.network.list.button")}
      inputLabel={t("apiKey.network.list.inputLabel")}
      errorLabel={t("apiKey.network.errors.invalid")}
      editModal={editModalWithDefaults}
      deleteModal={deleteModal}
      disabled={disabled}
      transform={formatItem}
    />
  );
}
