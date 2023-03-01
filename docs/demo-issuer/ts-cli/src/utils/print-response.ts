import { AxiosError, AxiosResponse } from "axios";
import { mainMenu } from "./../index.js";
export async function printResponse(response: Promise<AxiosResponse>) {
response.then((res) => {
	console.log(res.data);
}).catch((error) => {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error(error.response.data);
        console.error(error.response.status);
        console.error(error.response.headers);
      } else if (error.request) {
        console.error(error.request);
      } else {
        console.error("Error", error.message);
      }
      console.error(error.config);
    } else {
		console.error("Unexpected error:", error);
	}
  });
  	  mainMenu();

}
