import axios, { AxiosError} from 'axios';
import {basePath, config} from './config.js';
import { Dossier } from "./../models/request-models.js";

const apiPath= "/dossiers";

export async function getDossier(id: String) {
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

export async function postDossier(obj: Dossier) {
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
