import axios, { AxiosResponse} from 'axios';
import {basePath, config} from './config.js';
import { Dossier } from "./../models/request-models.js";
import { printResponse } from "./../utils/print-response.js";

const apiPath= "/dossiers";

export async function getDossier(id: String) {
	async function callApi() {
  let response: Promise<AxiosResponse> = axios.get(basePath+apiPath+'/'+id, config);
  printResponse(response);
	}
callApi();
}

export async function postDossier(obj: Dossier) {
	async function callApi() {
  let response: Promise<AxiosResponse> = axios.post(basePath+apiPath, obj, config);
  printResponse(response);
	}
callApi();
}
