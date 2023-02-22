import * as dotenv from 'dotenv';

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
