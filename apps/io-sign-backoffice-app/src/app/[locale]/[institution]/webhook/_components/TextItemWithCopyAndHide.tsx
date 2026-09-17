import { useState } from "react";
import { IconButton, Stack, TextField } from "@mui/material";
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
  const [visible, setVisible] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
  };

  return (
    <Stack direction="row" spacing={1}>
      <TextField
        label={label}
        value={value}
        type={visible ? "text" : "password"}
        fullWidth
        inputProps={{ readOnly: true }}
      />
      <IconButton color="primary" onClick={() => setVisible((v) => !v)}>
        {visible ? (
          <Visibility fontSize="inherit" />
        ) : (
          <VisibilityOff fontSize="inherit" />
        )}
      </IconButton>
      {showCopyButton && (
        <>
          <IconButton color="primary" onClick={handleCopy}>
            <ContentCopy fontSize="inherit" />
          </IconButton>
        </>
      )}
    </Stack>
  );
};
