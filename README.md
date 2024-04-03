# PDND-ANPR-Demo

An example showing how to access e-services exposed through [PDND Interoperabilità](https://www.interop.pagopa.it/) via Node.js / TypesScript.

## Targeted e-service

The `accertamentoEsistenzaVita` e-service by ANPR is targeted.

## Configuration

A `config.json` file must be present in the root folder in order to run the example. a `configTemplate.json` file is provided as a guideline.

## How to run the example

### Prerequisites

#### Node.js

A recent version (tested on v20.10.0) of the [Node.js](https://nodejs.org/en) runtime is expected to be already installed on your machine.

#### TypeScript

You shouldn't need to perform any particular operation, but who knows...

### RUN

In the root folder, execute the following commands:

1. `npm install`
2. `npx ts-node ./src/app.ts`

Enjoy!

### Improved QOL

Were you in need of inspecting the program execution, and well accustomed to VSCode, all is provided for a basic debug.
