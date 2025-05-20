import * as E from "io-ts/lib/Encoder";
import { UploadUrl as UploadUrlApiModel } from "../models/UploadUrl";
import { UploadUrl } from "../../../upload";

export const UploadUrlToApiModel: E.Encoder<UploadUrlApiModel, UploadUrl> = {
  encode: (uploadUrl) => uploadUrl.href
};
