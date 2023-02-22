#CLI for the issuer

##Installation
Launch the commands:
npm install
and
tsc

##run
Launch the command
npm run start-cli

##Note to the developers
There is an issue with the commands launched by shortcut like copy & paste and its are inhibited by default on many cli created by typescript.
In src/functions/inquirer-config.ts there is a method that should resolve it but when it is implemented (see in src/functions/signer-cli.ts) it didn't recognize the object passed.