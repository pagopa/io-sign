import * as fs from 'fs';

export const callDocumentUpload = async (
documentPath: string,
uploadUrl: string
) => {
	try {
  const pdfBlob = await fetch(documentPath).then((response) => response.blob());

  const options = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/pdf',
  'x-ms-blob-type': 'BlockBlob'
    },
    body: pdfBlob
  };
  const response = await fetch(uploadUrl, options);
  if (!response.ok) {
          throw new Error(response.statusText);
        }
        const responseData = await response.json();
        console.log(responseData);
      } catch (error) {
        console.error("catch"+error);
      }
};