import { Issuer, issuerSchema } from ".";
import { getCosmosContainerClient } from "../cosmos";

const cosmosContainerName = "issuers";

export async function getIssuer(institutionId: string): Promise<Issuer> {
  try {
    const { resources } = await getCosmosContainerClient(cosmosContainerName)
      .items.query({
        parameters: [
          {
            name: "@institutionId",
            value: institutionId,
          },
        ],
        query: "SELECT * FROM c where c.institutionId = @institutionId",
      })
      .fetchAll();
    const issuer = issuerSchema
      .array()
      .length(1)
      .transform((issuers) => issuers[0])
      .parse(resources);
    return issuer;
  } catch (e) {
    throw new Error("unable to get the issuer", { cause: e });
  }
}
