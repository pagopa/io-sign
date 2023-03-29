import * as fs from "fs";
import * as YAML from "yaml";
import * as dotenv from "dotenv";
import * as fetch from "isomorphic-fetch";
import { Configuration } from "@io-sign/io-sign-api-client";
import { callSigners } from "./signer";
import { callDossier } from "./dossier";
import { callSignatureRequests } from "./signature-request";

dotenv.config();

const apiPath = process.env.API_PATH;
const subscriptionKey = process.env.SUBSCRIPTION_KEY;

if (subscriptionKey === undefined || subscriptionKey === null) {
  throw new Error("Missing Subscription Key");
}

if (apiPath === undefined || apiPath === null) {
  throw new Error("Missing api path");
}

const configuration = new Configuration({
  basePath: apiPath,
  apiKey: subscriptionKey,
  fetchApi: fetch,
});

const file = fs.readFileSync("./file.yaml", "utf8");
const data = YAML.parse(file);

if (data.signatureRequest != null) {
  callSignatureRequests(configuration, data.signatureRequest)
    .then((result) => console.log(result))
    .catch((err) => console.log(err));
}

if (data.signer) {
  callSigners(configuration, data.signer)
    .then((result) => console.log(result))
    .catch((err) => console.log(err));
}

if (data.dossier) {
  callDossier(configuration, data.dossier)
    .then((result) => console.log(result))
    .catch((err) => console.log(err));
}
