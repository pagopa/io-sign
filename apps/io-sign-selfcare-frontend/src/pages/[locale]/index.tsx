import { useRouter } from "next/router";
import Head from "next/head";

import { Box, Button, Stack, Typography } from "@mui/material";
import { IllusPaymentCompleted, JwtUser } from "@pagopa/mui-italia";
import { Trans, useTranslation } from "next-i18next";
import CommonHeader from "@/components/CommonHeader/CommonHeader";
import Footer from "@/components/Footer/Footer";

import { CONFIG } from "@/config";
import { getStaticPaths, makeStaticProps } from "@/static";

const loggedUserMock: JwtUser = {
  id: "thisIsAMockedUser",
};

const assistanceEmail = CONFIG.ASSISTANCE.MAIL;

const getStaticProps = makeStaticProps();
export { getStaticPaths, getStaticProps };

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>{CONFIG.IOSIGN.NAME}</title>
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
          <IllusPaymentCompleted />
          <Typography variant="h4">
            {t("common.thanksYouPage.title")}
          </Typography>
          <Typography variant="body1" align="center">
            <Trans i18nKey="common.thanksYouPage.content"></Trans>
            <br />
            <a href={`mailto:${assistanceEmail}`}>{assistanceEmail}</a>
          </Typography>
          <Box
            sx={{ pt: 2 }}
            onClick={() => router.push(CONFIG.SELFCARE.DASHBOARDLINK)}
          >
            <Button variant="outlined">
              {t("common.backComponent.label")}
            </Button>
          </Box>
        </Stack>

        <Box gridArea="footer">
          <Footer loggedUser={true} />
        </Box>
      </Box>
    </>
  );
}
