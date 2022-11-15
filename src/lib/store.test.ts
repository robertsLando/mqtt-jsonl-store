import Aedes from "aedes";

import { once } from "events";
import { mkdir, readdir, rm } from "fs/promises";
import { connect } from "mqtt";
import { createServer, Server, Socket } from "net";
import { tmpdir } from "os";
import { join } from "path";
import { promisify } from "util";
import { Manager, MqttJsonlStore } from "..";
import abstractTest, { exists } from "../../test/abstract.test";

export const tmpDir = join(tmpdir(), "mqtt-jsonl-store");

export async function emptyTmpDir() {
	const files = await readdir(tmpDir);
	await Promise.all(files.map((file) => rm(join(tmpDir, file), { recursive: true, force: true })));
	await rm(tmpDir, { recursive: true, force: true });
}

export async function ensureTmpDir(): Promise<string> {
	if (await exists(tmpDir)) {
		await emptyTmpDir();
	}

	await mkdir(tmpDir);

	return tmpDir;
}

describe("mqtt jsonl store", () => {
	abstractTest(
		async () => {
			await ensureTmpDir();
			const store = new MqttJsonlStore(join(tmpDir, "/store.jsonl"));
			await store.open();
			return store;
		},
		async (store) => {
			await promisify(store.close.bind(store))();
			await emptyTmpDir();
		},
	);
});

describe("mqtt client", () => {
	let broker: Aedes;
	let manager: Manager;
	let tmpDir: string;
	let server: Server;
	const port = 8883;
	let destroyServer: () => Promise<void>;

	beforeEach(async () => {
		broker = new Aedes();
		server = createServer(broker.handle as any);
		server.listen(port);

		const connections: Socket[] = [];

		server.on("connection", (socket) => {
			connections.push(socket);
		});

		destroyServer = async () => {
			await Promise.all(connections.map((socket) => promisify(socket.end.bind(socket))));
			await promisify(server.close).call(server);
		};

		await once(server, "listening");

		tmpDir = await ensureTmpDir();
		manager = new Manager(tmpDir);
		await manager.open();
	});

	afterEach(async () => {
		await promisify(broker.close.bind(broker))();
		await destroyServer();
		await manager.close();
		await emptyTmpDir();
	});

	it("should resend messages", (done) => {
		// connect client to broker
		const client = connect({
			port,
			incomingStore: manager.incoming,
			outgoingStore: manager.outgoing,
		});

		// publish a message while client isn't connected
		// this should not be received because qos is 0
		client.publish("not", "received", { qos: 0 });
		// this should be received because qos is 1
		client.publish("hello", "world", { qos: 1 });

		let closed = false;

		broker.on("client", (c: any) => {
			if (!closed) {
				closed = true;
				// first time client connect
				// force close connection (not clean)
				c.conn.destroy();
			} else {
				// second time client connect
				broker.on("publish", (packet, c) => {
					// when client is defined (not a broker message)
					if (c) {
						expect(packet.topic).toBe("hello");
						expect(packet.payload.toString()).toBe("world");
						client.end();
						done();
					}
				});
			}
		});
	});
});
