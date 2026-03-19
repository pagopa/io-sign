import { faker } from "@faker-js/faker/locale/it";
import { HttpResponse, http } from "msw";

export const buildHandlers = () => {
  const baseURL = process.env.SELFCARE_API_URL;
  const mockInstitutionId = process.env.MOCK_SELFCARE_INSTITUTION_ID as string;

  return [
    http.get(`${baseURL}/external/v2/institutions`, ({ request }) => {
      const url = new URL(request.url);
      const userIdForAuth = url.searchParams.get("userIdForAuth");
      console.log("userIdForAuth:", userIdForAuth);
      const resultArray = [
        HttpResponse.json(getInstitutions(mockInstitutionId), {
          status: 200,
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
    http.get(
      `${baseURL}/external/v2/institutions/:institutionId`,
      ({ params }) => {
        const { institutionId } = params;
        console.log("institutionId:", institutionId);
        const resultArray = [
          HttpResponse.json(getInstitution(mockInstitutionId), {
            status: 200,
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
      },
    ),
    http.get(
      `${baseURL}/external/v2/institutions/:institutionId/products`,
      ({ request, params }) => {
        const url = new URL(request.url);
        const userId = url.searchParams.get("userId");
        console.log("userId:", userId);
        const { institutionId } = params;
        console.log("institutionId:", institutionId);
        const resultArray = [
          HttpResponse.json(getProducts(), {
            status: 200,
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
      },
    ),
  ];
};

const getInstitution = (id: string) => ({
  id,
  externalId: "00464700046",
  origin: "IPA",
  originId: "C_D967",
  description: "Ente di Test",
  institutionType: "PA",
  digitalAddress: "test@cert.test.it",
  address: faker.location.streetAddress(),
  zipCode: faker.location.zipCode(),
  taxCode: "00464700046",
  geographicTaxonomies: [
    {
      code: "ITA",
      desc: "ITALIA",
    },
  ],
  attributes: [
    {
      origin: "IPA",
      code: "L6",
      description: "description",
    },
  ],
  onboarding: [
    {
      productId: "prod-io-sign",
      tokenId: "a-token-id",
      status: "ACTIVE",
      billing: {
        vatNumber: "00464700046",
        recipientCode: "AA01234",
        publicServices: false,
      },
      createdAt: "2023-03-01T12:01:24.111Z",
      updatedAt: "2023-03-01T12:02:18.583Z",
      institutionType: "PA",
      origin: "IPA",
      originId: "C_D967",
    },
    {
      productId: "prod-pn",
      tokenId: "a-token-id",
      status: "ACTIVE",
      billing: {
        vatNumber: "00464700046",
        recipientCode: "0000000",
        publicServices: false,
      },
      createdAt: "2023-08-04T14:42:17.366904Z",
      updatedAt: "2023-08-04T14:44:31.465366Z",
      institutionType: "PA",
      origin: "IPA",
      originId: "C_D967",
    },
  ],
  supportEmail: "assistenza.test@test.email.it",
  imported: false,
  createdAt: "2023-03-01T12:01:23.643Z",
  updatedAt: "2023-08-04T14:48:32.647198Z",
  delegation: false,
  logo: `${process.env.SELFCARE_URL}/institutions/${id}/logo.png`,
});

const getInstitutions = (...ids: string[]) => {
  return ids.map((id) => getInstitution(id));
};

const getProducts = () => [
  {
    id: "prod-io-sign",
    title: "Firma con IO",
    contractTemplatePath: "url/io_sign-accordo_di_adesione-v.8.0.0.html",
    contractTemplateVersion: "8.0.0",
    createdAt: "2023-02-23T16:22:40.006Z",
    description: "description",
    urlPublic: "https://url/firma-con-io",
    urlBO: "https://url/auth/<IdentityToken>",
    depictImageUrl:
      "https://url/resources/products/prod-io-sign/depict-image.jpeg",
    identityTokenAudience: "firmaconio.selfcare.pagopa.it",
    logo: "https://url/resources/products/prod-io/logo.svg",
    logoBgColor: "#0B3EE3",
    roleMappings: {
      MANAGER: {
        multiroleAllowed: false,
        skipUserCreation: false,
        roles: [
          {
            code: "admin",
            label: "Amministratore",
            description: "role description",
          },
        ],
      },
      DELEGATE: {
        multiroleAllowed: false,
        skipUserCreation: false,
        roles: [
          {
            code: "admin",
            label: "Amministratore",
            description: "role description",
          },
        ],
      },
      OPERATOR: {
        multiroleAllowed: false,
        skipUserCreation: false,
        roles: [
          {
            code: "operator",
            label: "Operatore",
            description: "role description",
          },
        ],
      },
    },
  },
  {
    id: "prod-pn",
    title: "SEND - Servizio Notifiche Digitali",
    contractTemplatePath: "url/pn-accordo_di_adesione-v.2.0.2.html",
    contractTemplateVersion: "2.0.2",
    createdAt: "2022-04-22T13:41:24.742073Z",
    description: "description",
    urlPublic: "https://url/pubbliche-amministrazioni/",
    urlBO: "https://url/#selfCareToken=<IdentityToken>&lang=<lang>",
    depictImageUrl: "https://url/resources/products/prod-pn/depict-image.jpeg",
    identityTokenAudience: "url",
    logo: "https://url/resources/products/prod-pn/logo.svg",
    logoBgColor: "#0066CC",
    roleMappings: {
      MANAGER: {
        multiroleAllowed: false,
        skipUserCreation: false,
        roles: [
          {
            code: "admin",
            label: "Amministratore",
            description: "role description",
          },
        ],
      },
      DELEGATE: {
        multiroleAllowed: false,
        skipUserCreation: false,
        roles: [
          {
            code: "admin",
            label: "Amministratore",
            description: "role description",
          },
        ],
      },
      SUB_DELEGATE: {
        multiroleAllowed: false,
        skipUserCreation: false,
        roles: [
          {
            code: "admin",
            label: "Amministratore",
            description: "role description",
          },
        ],
      },
      OPERATOR: {
        multiroleAllowed: true,
        skipUserCreation: false,
        roles: [
          {
            code: "operator",
            label: "Gestore Notifiche",
            description: "role description",
          },
        ],
      },
    },
  },
];
