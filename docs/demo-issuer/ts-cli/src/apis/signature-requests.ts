import axios, { AxiosResponse} from 'axios';
import {basePath, config} from './config.js';
import { printResponse } from "./../utils/print-response.js";

const apiPath= "/signature-requests";

export async function getSignatureRequest(id: String) {
	async function callApi() {
   
  let response: Promise<AxiosResponse> = axios.get(basePath+apiPath+'/'+id, config);
  printResponse(response);
	}
callApi();
}

export async function getDocumentUploadUrl(reqId: String, docId: String) {
	async function callApi() {
  let response: Promise<AxiosResponse> = axios.get(basePath+apiPath+'/'+reqId+'/documents/'+docId+'/upload_url', config);
  printResponse(response);
	}
callApi();
}

export async function sendNotification(req_id: String) {
	async function callApi() {
  let response: Promise<AxiosResponse> = axios.put(basePath+apiPath+'/'+req_id+'/notification', null, config);
  printResponse(response);
	}
callApi();
}

export async function setSignatureRequestStatus(req_id: String) {
	let obj = 'READY';
	async function callApi() {
  let response: Promise<AxiosResponse> = axios.put(basePath+apiPath+'/'+req_id+'/status', obj, config);
  printResponse(response);
	}
callApi();
}


export async function createSignatureRequest(dossier_id: String, signer_id:String, expires_at: String) {
	let obj = {
		  "dossier_id": dossier_id,
  "signer_id": signer_id,
  "expires_at": expires_at
	};
	async function callApi() {
  let response: Promise<AxiosResponse> = axios.post(basePath+apiPath, obj, config);
  printResponse(response);
	}
callApi();
}
