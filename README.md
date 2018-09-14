# KNoT Cloud library for Node.js

A client side library that provides access to the KNoT Cloud for Node.js applications.

# Getting started

## Install

```console
npm install --save knot-cloud
```

## Quickstart

`KNoTCloud` connects to http://host:port using the UUID and token as credentials, respectively. Replace this address with your cloud instance and the credentials with valid ones.

```javascript
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

## Methods

### constructor(host, port, uuid, token)

Create a client object that will connect to a KNoT Cloud instance.

#### Arguments

* `host` **String** KNoT Cloud instance host name.
* `port` **Number** KNoT Cloud instance port.
* `uuid` **String** User UUID.
* `token` **String** User token.

#### Example

```javascript
const KNoTCloud = require('knot-cloud');
const cloud = new KNoTCloud(
  'knot-test.cesar.org.br',
  3000,
  '78159106-41ca-4022-95e8-2511695ce64c',
  'd5265dbc4576a88f8654a8fc2c4d46a6d7b85574',
);
```

### connect(): Promise&lt;Void&gt;

Connects to the KNoT Cloud instance.

#### Example

```javascript
const KNoTCloud = require('knot-cloud');
const cloud = new KNoTCloud(
  'knot-test.cesar.org.br',
  3000,
  '78159106-41ca-4022-95e8-2511695ce64c',
  'd5265dbc4576a88f8654a8fc2c4d46a6d7b85574',
);

async function main() {
  await cloud.connect();
}
main();
```

### close(): Promise&lt;Void&gt;

Closes the current connection.

#### Example

```javascript
const KNoTCloud = require('knot-cloud');
const cloud = new KNoTCloud(
  'knot-test.cesar.org.br',
  3000,
  '78159106-41ca-4022-95e8-2511695ce64c',
  'd5265dbc4576a88f8654a8fc2c4d46a6d7b85574',
);

async function main() {
  await cloud.connect();
  await cloud.close();
}
main();
```

### getDevices(): Promise&lt;Array&gt;

Gets the devices associated to the connected user.

##### Result

* `devices` **Array** devices registered on the cloud or an empty array. Each device is an object in the following format:
  * `id` **String** device ID (KNoT ID).
  * `name` **String** device name.
  * `online` **Boolean** whether this device is online or not.
  * `schema` **Array** schema items, each one formed by:
    * `sensor_id` **Number** sensor ID.
    * `value_type` **Number** semantic value type (voltage, current, temperature, etc).
    * `unit` **Number** sensor unit (V, A, W, W, etc).
    * `type_id` **Number** data value type (boolean, integer, etc).
    * `name` **String** sensor name.

#### Example

```javascript
const KNoTCloud = require('knot-cloud');
const cloud = new KNoTCloud(
  'knot-test.cesar.org.br',
  3000,
  '78159106-41ca-4022-95e8-2511695ce64c',
  'd5265dbc4576a88f8654a8fc2c4d46a6d7b85574',
);

async function main() {
  await cloud.connect();
  console.log(await cloud.getDevices());
  await cloud.close();
}
main();

// [ { online: true,
//    name: 'Door lock',
//    id: '7e133545550e496a',
//    schema: [ [Object], [Object] ] } ]
```

### getDevice(id): Promise&lt;Object&gt;

Gets the device identified by `id` associated to the connected user.

##### Argument

* `id` **String** device ID (KNoT ID).

##### Result

* `device` **Object** device as described in in [`getDevices()`](#getdevices-promisearray)

#### Example

```javascript
const KNoTCloud = require('knot-cloud');
const cloud = new KNoTCloud(
  'knot-test.cesar.org.br',
  3000,
  '78159106-41ca-4022-95e8-2511695ce64c',
  'd5265dbc4576a88f8654a8fc2c4d46a6d7b85574',
);

async function main() {
  await cloud.connect();
  console.log(await cloud.getDevice('7e133545550e496a'));
  await cloud.close();
}
main();

// { online: true,
//   name: 'Door lock',
//   id: '7e133545550e496a',
//   schema: [ { sensor_id: 1,
//               value_type: 3,
//               unit: 0,
//               type_id: 65521,
//               name: 'Lock' },
//             { sensor_id: 2,
//               value_type: 1,
//               unit: 2,
//               type_id: 9,
//               name: 'Card reader' } ] }
```

### getData(id[,limit, start, finish]): Promise&lt;Array&gt;

Gets the last 10 data items published by the device identified by `id`.

##### Arguments

* `id` **String** device ID (KNoT ID).
* `limit` **String** (Optional) the maximum number of data that you want, default=`10` (the value `*` returns all data)
* `start` **String** (Optional) the start date that you want your set of data (format=`YYYY/MM/DD HH:MM`)
* `finish` **String** (Optional) the finish date that you want your set of data (format=`YYYY/MM/DD HH:MM`)

##### Result

* `data_items` **Array** data items published by the device or an empty array. Each data item is an object in the following format:
  * `data` **Object** data published by the device, in the following format:
    * `sensor_id` **Number** sensor ID.
    * `value` **String|Boolean|Number** value published.
  * `timestamp` **Date** moment of publication.

#### Example

```javascript
const KNoTCloud = require('knot-cloud');
const cloud = new KNoTCloud(
  'knot-test.cesar.org.br',
  3000,
  '78159106-41ca-4022-95e8-2511695ce64c',
  'd5265dbc4576a88f8654a8fc2c4d46a6d7b85574',
);

async function main() {
  await cloud.connect();
  console.log(await cloud.getData('7e133545550e496a'));
  await cloud.close();
}
main();

// [ { data: { sensor_id: 2, value: 0 },
//     timestamp: '2018-08-25T05:29:43.519Z' },
//   { data: { sensor_id: 1, value: true },
//     timestamp: '2018-08-25T05:29:43.520Z' },
//     ... ]
```

### setData(id, data): Promise&lt;Void&gt;

Sets values to sensors.

##### Arguments

* `id` **String** device ID (KNoT ID).
* `data` **Array** array of sensor ID-value pairs, as follows:
  * `sensorId` **Number** sensor ID.
  * `value` **String|Boolean|Number** value to attribute to the sensor. Strings must be Base64 encoded.

#### Example

```javascript
const KNoTCloud = require('knot-cloud');
const cloud = new KNoTCloud(
  'knot-test.cesar.org.br',
  3000,
  '78159106-41ca-4022-95e8-2511695ce64c',
  'd5265dbc4576a88f8654a8fc2c4d46a6d7b85574',
);

async function main() {
  await cloud.connect();
  await cloud.setData('7e133545550e496a', [{ sensorId: 1, value: false }]);
  await cloud.close();
}
main();
```

### requestData(id, sensors): Promise&lt;Void&gt;

Requests the device to publish its current value a set of sensors. The value can be retrieved using `getData()` or by listening to device updates.

##### Arguments

* `id` **String** device ID (KNoT ID).
* `sensors` **Array** an array of sensor IDs (**Number**).

#### Example

```javascript
const KNoTCloud = require('knot-cloud');
const cloud = new KNoTCloud(
  'knot-test.cesar.org.br',
  3000,
  '78159106-41ca-4022-95e8-2511695ce64c',
  'd5265dbc4576a88f8654a8fc2c4d46a6d7b85574',
);

async function main() {
  await cloud.connect();
  await cloud.requestData('7e133545550e496a', [1]);
  await cloud.close();
}
main();
```

### setMetadata(id, metadata): Promise&lt;Void&gt;

Sets the device metadata. It will update the entire object with the contents of metadata. To update a single item inside metadata, fetch it first, using `getDevice()`.

##### Arguments

* `id` **String** device ID (KNoT ID).
* `metadata` **Any** device metadata.

#### Example

```javascript
const KNoTCloud = require('knot-cloud');
const cloud = new KNoTCloud(
  'knot-test.cesar.org.br',
  3000,
  '78159106-41ca-4022-95e8-2511695ce64c',
  'd5265dbc4576a88f8654a8fc2c4d46a6d7b85574',
);

async function main() {
  await cloud.connect();
  await cloud.setMetadata('7e133545550e496a', { room: { name: 'Lula Cardoso Ayres', location: 'Tiradentes' } });
  await cloud.close();
}
main();
```

### subscribe(id): Promise&lt;Void&gt;

Subscribes to data published by a device identified by `id`. To listen to the publish events, register a callback with `on()`.

##### Argument

* `id` **String** device ID (KNoT ID).

#### Example

```javascript
const KNoTCloud = require('knot-cloud');
const cloud = new KNoTCloud(
  'knot-test.cesar.org.br',
  3000,
  '78159106-41ca-4022-95e8-2511695ce64c',
  'd5265dbc4576a88f8654a8fc2c4d46a6d7b85574',
);

async function main() {
  await cloud.connect();
  await cloud.subscribe('7e133545550e496a');
  await cloud.close();
}
main();
```

### on(callback)

Registers a callback to receive device updates after `subcribe()`. A single callback will receive the updates for all devices the user is subscribed to.

##### Argument

* `callback` **Function** callback called with device updates. Receives:
  * `event` **Object** published event, object in the following format:
    * `source` **String** device ID (KNoT ID).
    * `data` **Object** data published by the device, in the following format:
      * `sensor_id` **Number** sensor ID.
      * `value` **String|Boolean|Number** value published.
    * `timestamp` **Date** moment of publication.

#### Example

```javascript
const KNoTCloud = require('knot-cloud');
const cloud = new KNoTCloud(
  'knot-test.cesar.org.br',
  3000,
  '78159106-41ca-4022-95e8-2511695ce64c',
  'd5265dbc4576a88f8654a8fc2c4d46a6d7b85574',
);

async function main() {
  await cloud.connect();
  await cloud.subscribe('7e133545550e496a');
  cloud.on((data) => {
    console.log(data);
  });
}
main();

// { data: { sensor_id: 2, value: 21 },
//   timestamp: '2018-08-25T17:46:41.337Z',
//   source: '7e133545550e496a' }
```
