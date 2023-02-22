# 1. Which code generator we should choice to use on client demo?

Date: 2023-02-22

## Status

Accepted

## Context
We are making a client that will be given to the issuers to test or/and use directly for the integration with Firma con IO
The first solution, the creation handmade of all APIs and all classes isn't scalable in the future because the APIs could be changed and it should be redevelop and it is not a good way.
Starting from this point I tried different tools and here it is my analisys.

###Autorest:
https://github.com/Azure/autorest

It is made from Microsoft and it is production ready, however it create few files separated by the scope and for me its aren't very readable.
A good point for this solution is the number of languages supported, infact it can write code in Java, GO, Python,  c# and typescript, naturally, basing on the code of Firma con IO, I tested the typescript generator.
###IO-TS generator:
https://github.com/Fredx87/openapi-io-ts

It is a generator in alpha version and, at this moment, doesn't accept the issuer's openapi specifications without any spoken error.
However it generate the code only in typescript using the libraries:
*io-ts
*fp-ts

It could be good now but in the future these libraries could benot maintained, as the generator itself, because developed from single user.

###Openapi generator:
https://openapi-generator.tech/docs/generators/typescript/

This is developed by an active community and it can write code in many different languages and libraries (here it is the official list https://openapi-generator.tech/docs/generators/).
It created all files separated and organized to be simply readable (if you generate the code using the typescript generator) so it seems the most flexible and the most espandable between all of generators that I analized.

## Decision

In this context, and thinking also for the future, I think that the openapitools' openapi generator is the best choice.

## Consequences

The demo client will based partially on the code generated by the openapi generator.