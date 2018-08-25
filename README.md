# KNoT Cloud library for Node.js

A client side library that provides access to the KNoT Cloud for Node.js applications.

# Getting started

## Install

While it isn't available through NPM:

```
git clone https://github.com/CESARBR/knot-lib-node
cd knot-lib-node
npm install
npm run build
```

Then, in your project root:

```
npm install --save file:path/to/knot-lib-node
```

## Quickstart

`KNoTCloud` connects to http://host:port using the UUID and token as credentials, respectively. Replace this address with your cloud instance and the credentials with valid ones.

```
const KNoTCloud = require('knot-cloud');
const cloud = new KNoTCloud(
  'knot-test.cesar.org.br',
  3000,
  '78159106-41ca-4022-95e8-2511695ce64c',
  'd5265dbc4576a88f8654a8fc2c4d46a6d7b85574',
);

async function main() {
  try {
    await cloud.connect();
    const devices = cloud.getDevices();
    console.log(devices);
  } catch (err) {
    console.error(err);
  }

  await cloud.close();
}
main();
```
