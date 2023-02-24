import type { AppProps } from "next/app";
import { ThemeProvider } from "@mui/material";
import { theme } from "@pagopa/mui-italia";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
