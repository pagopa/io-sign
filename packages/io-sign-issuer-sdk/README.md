# Demo client issuer

Create a project that uses a cli or/and web interface that can be given to the issuer to test or, why not, used directly to integrate with Firma con IO without any development

This folder contains the CLI that actually can contact all APIs one-to-one and that has only a fix that should be corrected to be production ready: all commands launched using ctrl or cmd are inhibited by Inquirer there is a class (inquirer-config.ts") that should fix it but it returns an error.

npx @openapitools/openapi-generator-cli generate -i openapi.yaml -g typescript -o src/generated

The file openapi.yaml is the same as found on apps/io-func-sign-issuer with only a change,
the URI format seems to create some problems so the format was changed in a string
