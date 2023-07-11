import { ApiKey, ApiKeyBody, apiKeyBody, newApiKey } from "@/api-key";
import { NextResponse } from "next/server";
import { DefaultAzureCredential } from "@azure/identity";
import { ApiManagementClient } from "@azure/arm-apimanagement";
import { z } from "zod";

const loadCredentialsFromEnvironment = () =>
  z
    .object({
      SUBSCRIPTION_ID: z.string().nonempty(),
      RESOURCE_GROUP_NAME: z.string().nonempty(),
      SERVICE_NAME: z.string().nonempty(),
    })
    .transform((env) => ({
      subscriptionId: env.SUBSCRIPTION_ID,
      resourceGroupName: env.RESOURCE_GROUP_NAME,
      serviceName: env.SERVICE_NAME,
    }))
    .parse(process.env);

class SubscriptionCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubscriptionCreationError";
  }
}
// già è presente
class CosmosDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CosmosDatabaseError";
  }
}

class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

const createApiManagementClient = (subscriptionId: string) =>
  new ApiManagementClient(new DefaultAzureCredential(), subscriptionId);

async function createAPIMSubscription(resourceId: string, displayName: string) {
  const { subscriptionId, resourceGroupName, serviceName } =
    loadCredentialsFromEnvironment();

  await createApiManagementClient(subscriptionId)
    .subscription.createOrUpdate(resourceGroupName, serviceName, resourceId, {
      displayName,
      scope: `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.ApiManagement/service/${serviceName}/products/io-back-office-dev`, // env?
    })
    .catch(() => {
      throw new SubscriptionCreationError(
        "subscription creation error message"
      );
    });
}

async function insertApiKey(apiKey: ApiKey) {
  return apiKey;
  // throw new CosmosDatabaseError("cosmos database error message");
}

const getResponseFromError = (e: Error) => {
  switch (e.name) {
    case "ParseError":
      return NextResponse.json({ error: "parse Problem" }, { status: 400 });
    case "SubscriptionCreationError":
      return NextResponse.json({ error: "APIM Problem" }, { status: 500 });
    case "CosmosDatabaseError":
      return NextResponse.json({ error: "Database Problem" }, { status: 500 });
  }
};

const parseApiKeyBody = (x: unknown): ApiKeyBody => {
  try {
    return apiKeyBody.parse(x);
  } catch {
    // mi perdo info qui. mettere in "cause"
    throw new ParseError("parse error message");
  }
};

// manca 409
export async function POST(request: Request) {
  return request
    .json()
    .then(parseApiKeyBody)
    .then(async (x) => {
      await createAPIMSubscription(x.resourceId, x.displayName);
      return x;
    })
    .then(newApiKey)
    .then(insertApiKey)
    .then((apiKey) => NextResponse.json(apiKey, { status: 201 }))
    .catch(getResponseFromError);
}

/**
 * no riassegnare valori
 * funzioni pure
 * approccio dichiarativo il più possibile
 * funzione per ottenere già il client apim configurato (tipo createApiManagementClient() che restituisce già l’instanza prendendo le credenziali da env e tutto)
 * si potrebbe usare direttamente il client di cosmos invece delle funzioni insertApiKey
 * try catch unico:
 * con una bellissima funzione che trasforma un Error in un errore specifico devi solo discriminare i vari errori. il modo più facile è settando un name custom
 * esempio: se fai in modo che createAPIMSubscription in caso di fallimento lancia un SubscriptionCreationError, poi nel catch unico puoi fare tipo switch (e.name) … e questo switch puoi metterlo in una funzione a parte che magari come unica responsabilità ha il convertire un Error in una Response (che è anche facilmente testabile poi). quindi poi dentro l’unico catch ti resterebbe una cosa tipo:
 * const errorResponse = getResponseFromError(e); return response
 * poi se le operazioni sono “poche” magari puoi anche usare .then invece di await e quindi avere tutte le chiamate con .then e alla fine solo il .catch(getResponseFromError) così non devi neanche creare variabili temporanee solo per memorizzare il risultato di await ed è più facile, forse, mantenere uno stile più immutabile
 * ah, ultima cosa: Error nel suo costruttore prende (message, cause) cause è un oggetto custom che puoi scegliere tu dove dentro puoi metterci eventuali dettagli dell’errore che vorresti portare nella risposta (che magari non stanno bene nel “message”)
 */
