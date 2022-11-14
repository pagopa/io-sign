import { Id } from "@internal/io-sign/id";
import * as t from "io-ts";

export const Istitution = t.type({
  issuerId: Id,
  subsciptionId: Id,
  description: t.string,
});

export type Istitution = t.TypeOf<typeof Istitution>;

export const IstitutionRegistry = t.array(Istitution);
export type IstitutionRegistry = t.TypeOf<typeof IstitutionRegistry>;

export const istitutionRegistry: IstitutionRegistry = [
  {
    subsciptionId: "io-sign-demo-subscription" as Id,
    issuerId: "mock-issuer-io-sign-demo-subscription" as Id,
    description: "Ente di test",
  },
];
