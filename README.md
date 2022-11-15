# mqtt-jsonl-store

JSONL store for in-flight MQTT.js packets. Powered by [jsonl-db](https://github.com/robertsLando/mqtt-jsonl-store).

[![Test and Release](https://github.com/robertsLando/mqtt-jsonl-store/actions/workflows/test-and-release.yml/badge.svg)](https://github.com/robertsLando/mqtt-jsonl-store/actions/workflows/test-and-release.yml)

[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/robertsLando/mqtt-jsonl-store.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/robertsLando/mqtt-jsonl-store/context:javascript)
[![node](https://img.shields.io/node/v/@robertsLando/mqtt-jsonl-store.svg) ![npm](https://img.shields.io/npm/v/@robertsLando/mqtt-jsonl-store.svg)](https://www.npmjs.com/package/@robertsLando/mqtt-jsonl-store)

## Installation

```bash
npm install mqtt-jsonl-store
```

## Usage

```js
const mqtt = require("mqtt");
const { Manager } = require("mqtt-jsonl-store");

const manager = new Manager("path/to/store");

async function main() {
 await manager.open();
 const client = mqtt.connect("mqtt://localhost", {
  incomingStore: manager.incoming,
  outgoingStore: manager.outgoing,
 });
}

main();
```
