"use client";

import { useRouter } from "next/navigation";

import {
  HeaderProduct,
  HeaderAccount,
  ProductEntity,
  PartyEntity,
  JwtUser,
  RootLinkType,
} from "@pagopa/mui-italia";

type Props = {
  rootLink: RootLinkType;
  loggedUser: JwtUser;
  institutions: Array<PartyEntity>;
  currentInstitutionId: string | null;
  products: Array<ProductEntity>;
  supportUrl: string;
  documentationUrl: string;
};

export default function ClientHeader(props: Props) {
  const router = useRouter();
  const onAssistanceClick = () => (window.location.href = props.supportUrl);
  const onDocumentationClick = () =>
    window.open(props.documentationUrl, "_blank", "noreferrer");
  const onLogout = () => router.push("/auth/logout");
  const onSelectedParty = ({ id }: PartyEntity) => router.push(`/${id}`);
  const onSelectedProduct = () => {};
  return (
    <>
      <HeaderAccount
        rootLink={props.rootLink}
        loggedUser={props.loggedUser}
        onAssistanceClick={onAssistanceClick}
        onDocumentationClick={onDocumentationClick}
        onLogout={onLogout}
      />
      <HeaderProduct
        partyList={props.institutions}
        partyId={props.currentInstitutionId ?? undefined}
        productsList={props.products}
        productId="prod-io-sign"
        onSelectedParty={onSelectedParty}
        onSelectedProduct={onSelectedProduct}
      ></HeaderProduct>
    </>
  );
}
