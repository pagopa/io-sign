export async function addApiKey() {
  const response = await fetch("http://localhost:3000/api/api-keys", {
    method: "POST",
    body: JSON.stringify({
      institutionId: "a0e07d4a-9792-4af3-8175-889aead727b8",
      displayName: "Comune di Cori - Anagrafe - Lorem Ipsum",
      environment: "TEST",
      resourceId: Date.now() + "",
    }),
  }).then((response) => response.json());
  return JSON.stringify(response);
}
