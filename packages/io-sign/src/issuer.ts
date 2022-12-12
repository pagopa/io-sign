import * as t from "io-ts";
import { Id, newId } from "./id";

export const Issuer = t.type({
  id: Id,
  subscriptionId: t.string,
});

export type Issuer = t.TypeOf<typeof Issuer>;

export const newIssuer = (subscriptionId: string): Issuer => ({
  id: newId(),
  subscriptionId,
});
