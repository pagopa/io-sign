import * as E from "io-ts/lib/Encoder";

import { Signer } from "@pagopa/io-sign/signer";
import { SignerDetailView as SignerApiModel } from "../models/SignerDetailView";

export const SignerToApiModel: E.Encoder<SignerApiModel, Signer> = {
  encode: ({ id }) => ({ id }),
};
