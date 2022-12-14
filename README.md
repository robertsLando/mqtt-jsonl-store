# mqtt-jsonl-store

JSONL store for in-flight MQTT.js packets. Powered by [jsonl-db](https://github.com/AlCalzone/jsonl-db).

[![CI](https://github.com/robertsLando/mqtt-jsonl-store/actions/workflows/ci.yml/badge.svg)](https://github.com/robertsLando/mqtt-jsonl-store/actions/workflows/ci.yml)

[![node](https://img.shields.io/node/v/mqtt-jsonl-store.svg) ![npm](https://img.shields.io/npm/v/mqtt-jsonl-store.svg)](https://www.npmjs.com/package/mqtt-jsonl-store)

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
