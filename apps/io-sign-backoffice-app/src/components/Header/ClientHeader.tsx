"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { Stack } from "@mui/material";

import { User } from "@/lib/auth";
import { Institution, Product } from "@/lib/institutions";

import { HeaderProduct } from "@pagopa/mui-italia";
import AccountHeader from "@/components/AccountHeader";

export type Props = {
  products: Product[];
  institutions: Institution[];
  institutionId: string;
  loggedUser: User;
};

export default function ClientHeader({
  loggedUser,
  products,
  institutions,
  institutionId,
}: Props) {
  const router = useRouter();

  const selfcareURL =
    process.env.NEXT_PUBLIC_SELFCARE_URL ?? "https://selfcare.pagopa.it";

  const onSelectedParty = useCallback(
    (party: { id: string }) => {
      router.push(`/${party.id}`);
    },
    [router]
  );

  const onSelectedProduct = useCallback(
    (product: { id: string }) => {
      const url = new URL(
        `token-exchange?institutionId=${institutionId}&productId=${product.id}`,
        selfcareURL
      );
      router.push(url.href);
    },
    [institutionId, router, selfcareURL]
  );

  return (
    <Stack>
      <AccountHeader loggedUser={loggedUser} />
      <HeaderProduct
        productsList={products}
        productId="prod-io-sign"
        partyList={institutions}
        partyId={institutionId}
        onSelectedParty={onSelectedParty}
        onSelectedProduct={onSelectedProduct}
      />
    </Stack>
  );
}
