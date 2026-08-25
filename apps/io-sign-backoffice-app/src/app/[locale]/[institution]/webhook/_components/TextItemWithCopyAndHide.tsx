import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import { ContentCopy, Visibility, VisibilityOff } from "@mui/icons-material";

export const TextItemWithCopyAndHide = ({
  label,
  value,
  showCopyButton = true,
}: {
  label: string;
  value: string;
  showCopyButton?: boolean;
}) => {
  const t = useTranslations("firmaconio.components.textItemWithCopyAndHide");
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Stack spacing={1}>
      <TextField
        label={label}
        value={value}
        type={visible ? "text" : "password"}
        fullWidth
        inputProps={{ readOnly: true }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={visible ? t("hide") : t("show")}>
                <IconButton
                  onClick={() => setVisible((v) => !v)}
                  edge="end"
                  size="small"
                >
                  {visible ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Tooltip>
              {showCopyButton && (
                <Tooltip title={copied ? t("copied") : t("copy")}>
                  <IconButton onClick={handleCopy} edge="end" size="small">
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              )}
            </InputAdornment>
          ),
        }}
      />
    </Stack>
  );
};
