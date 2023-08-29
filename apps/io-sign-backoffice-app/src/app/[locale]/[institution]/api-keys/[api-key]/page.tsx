import PageHeader, { Props as PageHeaderProps } from "@/components/PageHeader";
import { VpnKey, VpnKeyOff } from "@mui/icons-material";
import { Stack } from "@mui/material";

import { useTranslations } from "next-intl";

export default function ApiKeyDetailPage({
  params,
}: {
  params: { institution: string; ["api-key"]: string };
}) {
  const t = useTranslations("firmaconio");

  const displayName = params["api-key"];

  const apiKeysHref = `/${params.institution}/api-keys`;

  const headerProps: PageHeaderProps = {
    title: displayName,
    navigation: {
      hierarchy: [
        { icon: VpnKey, label: t("apiKeys.title"), href: apiKeysHref },
        { label: displayName },
      ],
      startButton: { label: "Indietro", href: apiKeysHref },
    },
  };
  return (
    <Stack>
      <PageHeader {...headerProps} />
    </Stack>
  );
}

/*import {
  Typography,
  Button,
  Breadcrumbs,
  TableRow,
  TableBody,
  Table,
  TableCell,
  TableContainer,
  Chip,
  TextField,
  IconButton,
} from "@mui/material";
import { Box, Container, Stack } from "@mui/system";

import {
  Add,
  ArrowBack,
  Delete,
  Edit,
  PeopleAlt,
  PinDrop,
  SvgIconComponent,
  Visibility,
  VisibilityOff,
  VpnKey,
} from "@mui/icons-material";

function ApiKeyCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: SvgIconComponent;
  children: React.ReactNode;
}) {
  return (
    <Stack p={3} spacing={3} bgcolor="background.paper">
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Icon fontSize="small" />
          <Typography variant="sidenav">{title}</Typography>
        </Stack>
        <Box sx={{ display: description ? "block" : "none" }}>
          <Typography variant="body2">{description}</Typography>
        </Box>
      </Stack>
      <Box children={children} />
    </Stack>
  );
}

function ApiKeyContentCard() {
  return (
    <ApiKeyCard title="API Key" icon={VpnKey}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <TextField
          size="small"
          sx={{ minWidth: "40ch" }}
          value="dfe05ee3a7704ef983efacd6b748e64a"
          type="password"
        />
        <IconButton color="primary">
          <Visibility />
        </IconButton>
      </Stack>
    </ApiKeyCard>
  );
}

function ApiKeyNetworkCard() {
  const cidrs = [
    "192.168.1.10/24",
    "10.70.25.0/8",
    "127.0.0.1/32",
    "255.255.255.255/32",
  ];

  return (
    <ApiKeyCard
      title="Indirizzi IP"
      description="Aggiungi uno o più indirizzi IP. Se non lo hai, potrai aggiungerlo anche in seguito."
      icon={PinDrop}
    >
      <Stack spacing={3}>
        <Stack spacing={2}>
          {cidrs.map((cidr, i) => (
            <Stack key={i} direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" fontWeight={600} minWidth="18ch">
                {cidr}
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton color="primary" size="small">
                  <Edit fontSize="inherit" />
                </IconButton>
                <IconButton sx={{ color: "error.main" }} size="small">
                  <Delete fontSize="inherit" />
                </IconButton>
              </Stack>
            </Stack>
          ))}
        </Stack>
        <Box>
          <Button variant="contained" size="small" startIcon={<Add />}>
            Aggiungi indirizzo IP
          </Button>
        </Box>
      </Stack>
    </ApiKeyCard>
  );
}

function ApiKeyTesterCard() {
  return (
    <ApiKeyCard
      title="Codici fiscali"
      description="Aggiungi uno o più codici fiscali. Se non lo hai, potrai aggiungerlo anche in seguito."
      icon={PeopleAlt}
    >
      <span>Ciao</span>
    </ApiKeyCard>
  );
}

export default function Page() {
  return (
    <Stack spacing={5}>
      <Stack spacing={1}>
 
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button startIcon={<ArrowBack />} size="small">
            Indietro
          </Button>
          <Breadcrumbs>
            <Stack direction="row" alignItems="center" spacing={0}>
              <VpnKey />
              <Typography>API Key</Typography>
            </Stack>
            <Typography color="text.disabled">Geronimo</Typography>
          </Breadcrumbs>
        </Stack>
        <Typography variant="h4">Geronimo</Typography>
      </Stack>

      <Stack spacing={4}>
        <Stack p={3} bgcolor="background.paper">
          <TableContainer>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ width: "200px" }} size="small">
                    <Typography variant="body2">Ambiente</Typography>
                  </TableCell>
                  <TableCell size="small">
                    <Typography variant="body2" fontWeight={600}>
                      Test
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell size="small">
                    <Typography variant="body2">Data creazione</Typography>
                  </TableCell>
                  <TableCell size="small">
                    <Typography variant="body2" fontWeight={600}>
                      21/09/2022
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell size="small">
                    <Typography variant="body2">Stato</Typography>
                  </TableCell>
                  <TableCell size="small">
                    <Chip color="success" size="small" label="Attiva" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>

        <ApiKeyContentCard />
      </Stack>
      <ApiKeyNetworkCard />
    </Stack>
  );
}*/
