import Aedes from "aedes";
import * as mqtt from "mqtt";
import { createServer } from "net";
import { tmpdir } from "os";
import { join } from "path";
import { Manager } from "./src";

async function setup(): Promise<void> {
	const port = 1883;
	const broker = new Aedes();
	const server = createServer(broker.handle);
	server.listen(port, () => {
		console.log("server listening on port", port);
	});

	const tmpDir = join(tmpdir(), "mqtt-jsonl-store-test");
	const manager = new Manager(tmpDir);
	await manager.open();

	const client = mqtt.connect({
		port,
		incomingStore: manager.incoming,
		outgoingStore: manager.outgoing,
	});

	client.on("connect", () => {
		console.log("client connected");
	});

	client.publish("hello", "world", { qos: 1 });

	broker.on("client", (c) => {
		console.log("client", c.id);
	});

	broker.on("publish", (packet, c) => {
		console.log("publish", packet, c);
	});
}

setup();
