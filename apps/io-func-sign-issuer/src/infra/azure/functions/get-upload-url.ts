import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import { GetUploadUrlHandler } from "../../http/handlers/get-upload-url";

export const GetUploadUrlFunction = httpAzureFunction(GetUploadUrlHandler);
