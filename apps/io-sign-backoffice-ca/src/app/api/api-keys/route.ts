import { apimClient, config, cosmosClient } from "@/app/config";
import { addApiKey } from "@/endpoints/add-api-key";
import { NextRequest, NextResponse } from "next/server";

const getResponseFromError = (e: Error) => {
  switch (e.name) {
    case "ParseError":
      return NextResponse.json(
        { error: "Error on request validation" },
        { status: 400 }
      );
    case "SubscriptionCreationError":
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    case "CosmosDatabaseError":
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    case "ApiKeyAlreadyExistsError":
      return NextResponse.json(
        { error: "API key already exists" },
        { status: 409 }
      );
  }
};

export async function POST(request: NextRequest) {
  return addApiKey(request, cosmosClient, apimClient, config)
    .then((apiKey) => NextResponse.json(apiKey, { status: 201 }))
    .catch(getResponseFromError);
}
