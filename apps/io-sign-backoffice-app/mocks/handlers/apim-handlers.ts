import { faker } from "@faker-js/faker/locale/it";
import { http, HttpResponse } from "msw";

export const buildHandlers = () => {
  const apimApiUrl = process.env.MOCK_APIM_API_URL;

  interface ApimSubscriptionRequestBody {
    properties?: {
      state?: string;
      displayName?: string;
      scope?: string;
    };
  }

  return [
    http.post(`${apimApiUrl}/subscriptions/:id/listSecrets`, () => {
      const resultArray = [
        HttpResponse.json(
          {
            primaryKey: `${faker.string.alphanumeric(32)}`,
          },
          {
            status: 200,
          },
        ),
        HttpResponse.json(null, {
          status: 400,
        }),
        HttpResponse.json(null, {
          status: 403,
        }),
        HttpResponse.json(null, {
          status: 404,
        }),
        HttpResponse.json(null, {
          status: 500,
        }),
      ];
      return resultArray[0];
    }),
    http.put(`${apimApiUrl}/subscriptions/:id`, async ({ request, params }) => {
      const body = await request.clone().json() as ApimSubscriptionRequestBody;
      const { id } = params;

      // Suspend subscription case
      if (body.properties?.state === "suspended") {
        return HttpResponse.json(
          {
            id: id,
            state: body.properties?.state,
          },
          { status: 200 },
        );
      }
      // Create subscription case
      if (body.properties?.displayName) {
        return HttpResponse.json(
          {
            id: id,
            displayName: body.properties.displayName,
            name: body.properties.displayName,
            primaryKey: `${faker.string.alphanumeric(32)}`,
            state: "active",
          },
          { status: 201 },
        );
      }
      // Fallback case (body does not match any criteria)
      return new HttpResponse(null, { status: 400 });
    }),
  ];
};
