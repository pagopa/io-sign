import readYamlFile from 'read-yaml-file';
import dotenv from 'dotenv';
import * as fetch from "isomorphic-fetch";
import { callSigners } from './signer';
//import { callDossier } from './dossier';
import { callSignatureRequests } from './signature-request';
import { Configuration } from "@io-sign/io-sign-api-client";
dotenv.config();
const apiPath = process.env['API_PATH'];
const subscriptionKey = process.env['SUBSCRIPTION_KEY'];

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

const data: any=readYamlFile.sync('./openapi.yaml'); //.then((result: any) => {
	console.log(data);
	if (data.signatureRequest != null) {
		await callSignatureRequests(configuration, data.signatureRequest);
	}
	if (data.signer) {
		await callSigners(configuration, data.signer);
	}

})
//.catch((err) => {
//	console.log(err);
//});