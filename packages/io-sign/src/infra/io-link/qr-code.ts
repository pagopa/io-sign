import {
  GenerateSignatureRequestQrCode,
  SignatureRequestId,
} from "../../signature-request";
import { IoLinkConfig } from "./config";

export const makeGenerateSignatureRequestQrCode =
  (ioLinkConfig: IoLinkConfig): GenerateSignatureRequestQrCode =>
  (signatureRequestId: SignatureRequestId) =>
    new URL(
      `qrcode.png?feat=firma&srid=${signatureRequestId}`,
      ioLinkConfig.baseUrl,
    ).href;
