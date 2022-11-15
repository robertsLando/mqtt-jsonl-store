# mqtt-jsonl-store

JSONL store for in-flight MQTT.js packets. Powered by [jsonl-db](https://github.com/AlCalzone/jsonl-db).

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
