import * as E from "io-ts/lib/Encoder";

import { UploadUrl } from "../../../upload";
import { UploadUrl as UploadUrlApiModel } from "../models/UploadUrl";

export const UploadUrlToApiModel: E.Encoder<UploadUrlApiModel, UploadUrl> = {
  encode: (uploadUrl) => uploadUrl.href
};
