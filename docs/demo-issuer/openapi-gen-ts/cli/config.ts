import * as dotenv from 'dotenv';
import { RequestContext } from "../http/http";

dotenv.config();
export type Environment = {
  BASE_PATH: string;
  API_PATH: string;
  SUBSCRIPTION_KEY: string;
};
const env = process.env as Environment;
export const basePath= env.BASE_PATH+env.API_PATH;
export const config = {
    headers: {
      'Content-Type': 'application/json',
'Ocp-Apim-Subscription-Key': env.SUBSCRIPTION_KEY
	}
  };
    export function applySecurityAuthentication(context: RequestContext) : Promise<RequestContext> {
			context.setHeaderParam("Ocp-Apim-Subscription-Key", process.env.SUBSCRIPTION_KEY||'');
			return Promise.resolve(context);
	};