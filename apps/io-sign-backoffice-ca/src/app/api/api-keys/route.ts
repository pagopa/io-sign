import { apimClient, config, cosmosClient } from "@/app/config";
import { NextRequest } from "next/server";
import { addApiKey } from "@/endpoints/add-api-key";
import { getCreatedResponse, getErrorResponse } from "../response";

export async function POST(request: NextRequest) {
  return addApiKey(request, cosmosClient, apimClient, config)
    .then(getCreatedResponse)
    .catch(getErrorResponse);
}
