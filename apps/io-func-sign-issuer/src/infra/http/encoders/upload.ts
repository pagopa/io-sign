import { UploadUrl as UploadUrlApiModel } from "../models/UploadUrl";
import { UploadUrl } from "../../../upload";

import * as E from "io-ts/lib/Encoder";

export const UploadUrlToApiModel: E.Encoder<UploadUrlApiModel, UploadUrl> = {
  encode: (uploadUrl) => uploadUrl.href,
};
