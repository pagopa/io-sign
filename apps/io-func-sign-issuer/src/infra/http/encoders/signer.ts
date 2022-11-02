import * as E from "io-ts/lib/Encoder";

import { SignerDetailView as SignerApiModel } from "../models/SignerDetailView";
import { Signer } from "@internal/io-sign/signer";

export const SignerToApiModel: E.Encoder<SignerApiModel, Signer> = {
  encode: ({ id }) => ({ id }),
};
