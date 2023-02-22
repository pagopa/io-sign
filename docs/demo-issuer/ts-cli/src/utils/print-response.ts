import { AxiosError, AxiosResponse } from "axios";

export async function printResponse(response: Promise<AxiosResponse>) {
  try {
    console.log(response.data);
  } catch (error) {
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
  }
}
