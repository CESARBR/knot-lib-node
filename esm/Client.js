import _ from 'lodash';
import request from 'request';
import meshblu from 'meshblu';
import isBase64 from 'is-base64';

function createConnection(hostname, port, uuid, token) {
  return meshblu.createConnection({
    server: hostname,
    port,
    uuid,
    token,
  });
}

function connect(hostname, port, uuid, token) {
  return new Promise((resolve, reject) => {
    const connection = createConnection(hostname, port, uuid, token);

    connection.on('ready', () => {
      resolve(connection);
    });

    connection.on('notReady', () => {
      connection.close(() => {});
      reject(new Error('Connection not authorized'));
    });
  });
}

function toGatewayUuid(uuid) {
  return `${uuid.substr(0, uuid.length - 4)}0000`;
}

function mapData(data) {
  const newData = _.omit(data, [
    'uuid',
    'source',
    '_id',
  ]);
  newData.data = _.omit(newData.data, [
    'uuid',
    'token',
  ]);
  return newData;
}

function mapDevice(device) {
  return _.omit(device, [
    'uuid',
    '_id',
    'owner',
    'type',
    'ipAddress',
    'token',
    'meshblu',
    'discoverWhitelist',
    'configureWhitelist',
    'socketid',
    'secure',
    'get_data',
    'set_data',
  ]);
}

function isRegistered(device) {
  return device.schema && device.id && device.name;
}

function getDevices(connection) {
  return new Promise((resolve, reject) => {
    if (!connection) {
      reject(new Error('Not connected'));
      return;
    }

    connection.devices({ gateways: ['*'] }, (result) => {
      if (result.error) {
        reject(result.error);
        return;
      }

      resolve(result);
    });
  });
}

async function getDeviceUuid(connection, id) {
  const devices = await getDevices(connection);
  const device = devices.find(d => d.id.toLowerCase() === id.toLowerCase());
  if (!device) {
    throw new Error('Not found');
  }
  return device.uuid;
}

function parseValue(value) {
  if (isNaN(value)) { // eslint-disable-line no-restricted-globals
    if (value === 'true' || value === 'false') {
      return (value === 'true');
    }
    if (!isBase64(value)) {
      throw new Error('Supported types are boolean, number or Base64 strings');
    }
  } else if (typeof value === 'boolean') {
    return value;
  }

  return parseFloat(value);
}

function parseSetDataInput(data) {
  if (!_.isArrayLikeObject(data)) {
    throw new Error('data must be an array');
  }

  const parsedData = [];
  for (let i = 0; i < data.length; i += 1) {
    const item = data[i];
    if (item.sensorId === null
      || item.sensorId === undefined
      || item.value === null
      || item.value === undefined) {
      throw new Error('data must contain only { sensorId, value } objects');
    }
    const parsedValue = parseValue(item.value); // throws if value is invalid
    parsedData.push({ sensor_id: item.sensorId, value: parsedValue });
  }
  return parsedData;
}

function parseRequestDataInput(sensors) {
  if (!_.isArrayLikeObject(sensors)) {
    throw new Error('sensors must be an array');
  }

  return _.map(sensors, sensorId => ({ sensor_id: sensorId }));
}

class Client {
  constructor(hostname, port, uuid, token) {
    this.hostname = hostname;
    this.port = port;
    this.uuid = uuid;
    this.token = token;
    this.subscriptions = [];
    this.uuidIdMap = {};
  }

  async connect() {
    if (this.connection) {
      return;
    }

    this.connection = await connect(this.hostname, this.port, this.uuid, this.token);
  }

  async close() {
    return new Promise((resolve) => {
      if (!this.connection) {
        resolve();
        return;
      }

      this.connection.close(() => {
        this.connection = null;
        resolve();
      });
    });
  }

  async getDevices() {
    const devices = await getDevices(this.connection);
    return devices.filter(isRegistered).map(mapDevice);
  }

  async getDevice(id) {
    const devices = await this.getDevices();
    const device = devices.find(d => d.id.toLowerCase() === id.toLowerCase());
    if (!device) {
      throw new Error('Not found');
    }
    return device;
  }

  async getData(id, limit = 10, start = '', finish = '') {
    const uuid = await getDeviceUuid(this.connection, id);
    return new Promise((resolve, reject) => {
      request.get({
        url: `http://${this.hostname}:${this.port}/data/${uuid}?limit=${limit}&start=${start}&finish=${finish}`,
        headers: {
          meshblu_auth_uuid: this.uuid,
          meshblu_auth_token: this.token,
        },
        json: true,
      }, (err, res, body) => {
        if (err || res.statusCode !== 200) {
          reject(err || new Error(`Status ${res.statusCode}`));
        } else {
          resolve(_.map(body.data, mapData));
        }
      });
    });
  }

  async setData(id, data) {
    const parsedData = parseSetDataInput(data); // throws if invalid
    const uuid = await getDeviceUuid(this.connection, id);
    return new Promise((resolve) => {
      this.connection.update({
        uuid,
        set_data: parsedData,
      }, () => {
        resolve();
      });
    });
  }

  async requestData(id, sensors) {
    const parsedSensors = parseRequestDataInput(sensors);
    const uuid = await getDeviceUuid(this.connection, id);
    return new Promise((resolve) => {
      this.connection.update({
        uuid,
        get_data: parsedSensors,
      }, () => {
        resolve();
      });
    });
  }

  async setMetadata(id, metadata) {
    const uuid = await getDeviceUuid(this.connection, id);
    return new Promise((resolve) => {
      this.connection.update({
        uuid,
        metadata,
      }, () => {
        resolve();
      });
    });
  }

  async subscribe(id) {
    const uuid = await getDeviceUuid(this.connection, id);
    const gatewayUuid = toGatewayUuid(uuid);
    return new Promise((resolve, reject) => {
      this.connection.subscribe({
        uuid: gatewayUuid,
        type: ['sent'],
      }, (result) => {
        if (result.error) {
          reject(result.error);
        } else {
          this.uuidIdMap[uuid] = id;
          this.subscriptions.push(uuid);
          resolve();
        }
      });
    });
  }

  on(callback) {
    if (!this.connection) {
      throw new Error('Not connected');
    }
    this.connection.on('message', (data) => {
      if (callback
          && data.payload
          && _.indexOf(this.subscriptions, data.payload.source) !== -1) {
        callback(_.set(mapData(data.payload), 'source', this.uuidIdMap[data.payload.source]));
      }
    });
  }
}

export { Client }; // eslint-disable-line import/prefer-default-export
