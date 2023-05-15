# Demo client issuer

## Purposse
Originally created as a CLI that implemented a conversational interface to take many commands useful to test the Firma con IO's issuer apis, in the last version is a simple test tool that, parsing a file .yaml call the same api to do some operations based on the parameters passed.
It can manage a complete flow from the retrieve of the signer id to the send of the message on IO.

## command to use it
yarn generate:api-client (a command to generate the api client if it isn't already generated)
yarn build-api-client (a command to build the api client)
yarn install
yarn buildyarn start

## structure of the file.yaml

fiscalCode: is a string contained the fiscal code in upper case to retrieve the signer id 
example:
fiscalCode: "AAABBB01S99H501z"

documentsPaths: an array that contains the list of documents' paths 
example
documentsPaths: ["documento1.pdf", "documento2.pdf"]

dossier: an object that contains the rappresentation of the dossier, if it doesn't contain the id's parameter the code creates a new dossier outherwise  it return  the dossier
example:
dossier:
  supportMail: "support@example.com"
  id: "xxx"
  title: "example dossier"
  documentsMetadata:
    - title: "Example document 1"
      signatureFields:
        - clause:
            title: "signature required"
            type: "REQUIRED"
          attrs:
            coordinates:
              x: 10
              y: 10
            page: 0
            size:
              w: 10
              h: 10
        - clause:
            title: "signature unfair"
            type: "UNFAIR"
          attrs:
            coordinates:
              x: 10
              y: 10
            page: 0
            size:
              w: 10
              h: 10
        - clause:
            title: "signature optional"
            type: "OPTIONAL"
          attrs:
            coordinates:
              x: 10
              y: 10
            page: 0
            size:
              w: 10
              h: 10
    - title: "Example Document 2"
      signatureFields:
        - clause:
            title: "signature required"
            type: "REQUIRED"
          attrs:
            coordinates:
              x: 10
              y: 10
            page: 0
            size:
              w: 10
              h: 10

signatureRequest: an object that contains four optional fields:
1) id: the code retrieve the signatureRequest;
2) dossierId: this parameter is setted by the code if it is created on the fly
3) expiresAt: the date to set the expire date of the signature request
4) signerId:  it is seted by the code if fiscalCode is setted.
example:
signatureRequest:
  id: "AAA"
  expiresAt: "2023-05-5T00:00:00.000Z"
  dossierId: "XXX"
  signerId: "SSS"
  
  signatureRequests: it returns the list of siggnature requests linked to a single dossier
  signatureRequests:
  limit: 20
  continuationToken: "0"
  id: "xxx"
