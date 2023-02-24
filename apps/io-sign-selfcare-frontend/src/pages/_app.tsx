import type { AppProps } from "next/app";

import { theme } from "@pagopa/mui-italia";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { appWithTranslation } from "next-i18next";

const App = ({ Component, pageProps }: AppProps) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <Component {...pageProps} />
  </ThemeProvider>
);

export default appWithTranslation(App);
