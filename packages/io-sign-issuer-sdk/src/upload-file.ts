import { readFileSync } from "fs";

export const callDocumentUpload = async (path: string, uploadUrl: string) => {
  const pdfBlob = await readFileSync(path);

  const options = {
    method: "PUT",
    headers: {
      "Content-Type": "application/pdf",
      "x-ms-blob-type": "BlockBlob",
    },
    body: pdfBlob,
  };
  const response = await fetch(uploadUrl, options);
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  console.log(response.status);
};
