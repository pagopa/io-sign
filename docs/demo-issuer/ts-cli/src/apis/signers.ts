import axios, { AxiosResponse} from 'axios';
import {basePath, config} from './config.js';
import { printResponse } from "./../utils/print-response.js";
const apiPath= "/signers";

export async function postSigner(fiscalCode: String) {
	  let obj = {"fiscal_code": fiscalCode};
	  
async function callApi() {
  let response: Promise<AxiosResponse> = axios.post(basePath+apiPath, obj, config);
  printResponse(response);
	}
callApi();
}
