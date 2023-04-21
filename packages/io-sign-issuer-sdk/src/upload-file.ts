import * as fs from 'fs';
export const callDocumentUpload = async (
documentPath: string,
uploadUrl: string
) => {
  const headers = new Headers();
  headers.append('x-ms-blob-type', 'BlockBlob');

  fs.readFile(documentPath, async (error, data) => {
    if (error) {
      console.error("errore upload file: "+error);
    } else {
      const formData = new FormData();
      formData.append('pdf', new Blob([data]), documentPath);

      try {
	console.log("upload-file");
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          body: formData,
          headers: headers
        });
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        const responseData = await response.json();
        console.log(responseData);
      } catch (error) {
        console.error("catch"+error);
      }
    }
  });
}