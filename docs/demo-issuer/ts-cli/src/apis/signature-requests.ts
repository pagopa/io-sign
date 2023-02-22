import axios, { AxiosError} from 'axios';
import {basePath, config} from './config.js';

const apiPath= "/signature-requests";

export async function getSignatureRequest(id: String) {
	async function callApi() {
   axios.get(basePath+apiPath+'/'+id, config)
  .then(response => console.log(response.data))
  .catch((error: AxiosError) => {
    if (error.response) {
      console.error(error.response.data);
      console.error(error.response.status);
      console.error(error.response.headers);
    } else if (error.request) {
      console.error(error.request);
    } else {
      console.error('Error', error.message);
    }
    console.error(error.config);
  });
	}
callApi();
}

export async function getDocumentUploadUrl(reqId: String, docId: String) {
	async function callApi() {
 axios.get(basePath+apiPath+'/'+reqId+'/documents/'+docId+'/upload_url', config)

  .then(response => console.log(response.data))
  .catch((error: AxiosError) => {
    if (error.response) {
      console.error(error.response.data);
      console.error(error.response.status);
      console.error(error.response.headers);
    } else if (error.request) {
      console.error(error.request);
    } else {
      console.error('Error', error.message);
    }
    console.error(error.config);
  });
	}
callApi();
}

export async function sendNotification(req_id: String) {
	async function callApi() {
   axios.put(basePath+apiPath+'/'+req_id+'/notification', null, config)
  .then(response => console.log(response.data))
  .catch((error: AxiosError) => {
    if (error.response) {
      console.error(error.response.data);
      console.error(error.response.status);
      console.error(error.response.headers);
    } else if (error.request) {
      console.error(error.request);
    } else {
      console.error('Error', error.message);
    }
    console.error(error.config);
  });
	}
callApi();
}

export async function setSignatureRequestStatus(req_id: String) {
	let obj = 'READY';
	async function callApi() {
   axios.put(basePath+apiPath+'/'+req_id+'/status', obj, config)
  .then(response => console.log(response.data))
  .catch((error: AxiosError) => {
    if (error.response) {
      console.error(error.response.data);
      console.error(error.response.status);
      console.error(error.response.headers);
    } else if (error.request) {
      console.error(error.request);
    } else {
      console.error('Error', error.message);
    }
    console.error(error.config);
  });
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
   axios.post(basePath+apiPath, obj, config)
  .then(response => console.log(response.data))
  .catch((error: AxiosError) => {
    if (error.response) {
      console.error(error.response.data);
      console.error(error.response.status);
      console.error(error.response.headers);
    } else if (error.request) {
      console.error(error.request);
    } else {
      console.error('Error', error.message);
    }
    console.error(error.config);
  });
	}
callApi();
}
