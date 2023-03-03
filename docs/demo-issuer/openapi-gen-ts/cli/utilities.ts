import * as dotenv from 'dotenv';
import { Configuration, createConfiguration } from "../configuration";
import { GetSignerByFiscalCodeBody } from "../models/GetSignerByFiscalCodeBody";
import { SignerDetailView } from "../models/SignerDetailView";
import {
  RequestContext,
  HttpMethod,
  ResponseContext,
  HttpFile,
  IsomorphicFetchHttpLibrary,
} from "../http/http";

dotenv.config();
export type EndpointResponse = {
  status: number;
  headers: any;
  body: any;
};

    function applySecurityAuthentication(context: RequestContext) : Promise<RequestContext> {
			context.setHeaderParam("Ocp-Apim-Subscription-Key", process.env.SUBSCRIPTION_KEY||'');
			return Promise.resolve(context);
	};
	
	export function createResponse(req: RequestContext) : Promise<EndpointResponse> {
	  let instance = new IsomorphicFetchHttpLibrary();
let response: EndpointResponse = {
	status:1,
	headers: {},
	body: {}
	
};

let task = new Promise<EndpointResponse>((resolve, reject) => {
applySecurityAuthentication(req)
    .then((data: RequestContext) => {
      instance
        .send(data).toPromise()
        .then((data: ResponseContext) => {
			response.status = data.httpStatusCode;
			response.headers=data.headers;
			data.getBodyAsAny().then((body) => {
		response.body=body;
			resolve(response);
        })
        .catch((error: any) => 
		{
						reject(error);
		});
		})
        .catch((error: any) => {
						reject(error);
		});
    })
        .catch((error: any) => {
						reject(error);
		});
});
		return task;
	}
