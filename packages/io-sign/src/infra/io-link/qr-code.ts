import {
  GenerateSignatureRequestQrCode,
  SignatureRequestId,
} from "../../signature-request";
import { IoLinkConfig } from "./config";

export const makeGenerateSignatureRequestQrCode =
  (ioLinkConfig: IoLinkConfig): GenerateSignatureRequestQrCode =>
  (signatureRequestId: SignatureRequestId) =>
    new URL(
      `qrcode?feat=firma&srid=${signatureRequestId}`,
      ioLinkConfig.baseUrl
    ).href;
