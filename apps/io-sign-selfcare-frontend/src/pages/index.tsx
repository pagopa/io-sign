import { useRouter } from "next/router";
import Head from "next/head";

import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import CommonHeader from "@/components/CommonHeader/CommonHeader";
import Footer from "@/components/Footer/Footer";

import { Box, Button, Stack, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { JwtUser } from "@pagopa/mui-italia";

import { CONFIG } from "@/config";

const loggedUserMock: JwtUser = {
  id: "thisIsAMockedUser",
};

const assistanceEmail = CONFIG.ASSISTANCE.MAIL;

export default function Home() {
  const router = useRouter();
  return (
    <>
      <Head>
        <title>Firma con IO - Adesione terminata</title>
        <meta
          name="description"
          content="Portale di backoffice per il prodotto Firma con IO"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Box gridArea="header">
          <CommonHeader
            loggedUser={loggedUserMock}
            assistanceEmail={assistanceEmail}
          />
        </Box>
        <Stack
          alignItems="center"
          direction="column"
          justifyContent="center"
          flexGrow={1}
          spacing={2}
        >
          <CheckCircleOutlineIcon color="secondary" sx={{ fontSize: 60 }} />
          <Typography variant="h4">Il tuo ente ha aderito</Typography>
          <Typography variant="body1" align="center">
            Se non hai ricevuto l’email con le indicazioni e le API Key,
            <br />
            contatta il tuo referente PagoPA o scrivi a<br />
            <a href={`mailto:${assistanceEmail}`}>{assistanceEmail}</a>
          </Typography>
          <Box sx={{ pt: 2 }} onClick={() => router.back()}>
            <Button variant="outlined">Indietro</Button>
          </Box>
        </Stack>

        <Box gridArea="footer">
          <Footer loggedUser={true} />
        </Box>
      </Box>
    </>
  );
}
export const getStaticProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      locale,
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
};
