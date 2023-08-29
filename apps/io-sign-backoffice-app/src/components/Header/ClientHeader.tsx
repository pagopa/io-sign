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
  currentInstitutionId: string;
  products: Array<ProductEntity>;
  supportUrl: string;
  documentationUrl: string;
};

export default function ClientHeader(props: Props) {
  const router = useRouter();
  function handleAssistanceClick() {
    window.location.href = props.supportUrl;
  }
  function handleDocumentationClick() {
    window.open(props.documentationUrl, "_blank", "noreferrer");
  }
  function handleLogout() {
    router.push("/auth/logout");
  }
  function handleSelectedParty({ id }: PartyEntity) {
    router.push(`/${id}`);
  }
  function handleSelectedProduct({ id }: ProductEntity) {
    router.push(`/${id}`);
  }
  return (
    <>
      <HeaderAccount
        rootLink={props.rootLink}
        loggedUser={props.loggedUser}
        onAssistanceClick={handleAssistanceClick}
        onDocumentationClick={handleDocumentationClick}
        onLogout={handleLogout}
      />
      <HeaderProduct
        partyList={props.institutions}
        partyId={props.currentInstitutionId}
        productsList={props.products}
        productId="prod-io-sign"
        onSelectedParty={handleSelectedParty}
        onSelectedProduct={handleSelectedProduct}
      ></HeaderProduct>
    </>
  );
}
