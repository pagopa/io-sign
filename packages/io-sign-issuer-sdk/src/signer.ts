import {
  Configuration,
  SignerApi,
  GetSignerByFiscalCodeBody,
} from "@io-sign/io-sign-api-client";

export const callSigners = async (configuration: Configuration, fiscalCode: string) => {
  const api = new SignerApi(configuration);

  const getSignerByFiscalCodeBody: GetSignerByFiscalCodeBody = {
    fiscalCode: fiscalCode,
  };

  return api.getSignerByFiscalCode({ getSignerByFiscalCodeBody });
};
