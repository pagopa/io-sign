import { createContext } from "@lit-labs/context";

export interface IOLinkProvider {
  getIOLink(id: string): URL;
  getQrCodeUrl(id: string): URL;
}

export const IOLinkProviderContext = createContext<IOLinkProvider>(
  Symbol("io-link-provider"),
);

const buildUrlWithParams = (path: string, params: Record<string, string>) => {
  const url = new URL(path, import.meta.env.VITE_IO_LINK_BASE_URL);
  Object.entries(params).forEach(([k, v]) => {
    url.searchParams.append(k, v);
  });
  return url;
};

export class IOSignLinkProvider implements IOLinkProvider {
  getIOLink(id: string): URL {
    return buildUrlWithParams("open", {
      feat: "firma",
      srid: id,
    });
  }
  getQrCodeUrl(id: string): URL {
    return buildUrlWithParams("qrcode.png", {
      feat: "firma",
      srid: id,
      width: "150",
      color: "#17324dff",
    });
  }
}
