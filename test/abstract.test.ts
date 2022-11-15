import type { Stats } from "fs";
import { stat } from "fs/promises";
import type { MqttJsonlStore } from "../src";

export async function exists(path: string): Promise<Stats | false> {
	try {
		const stats = await stat(path);
		return stats;
	} catch (e) {
		return false;
	}
}

// Ported from https://github.com/mqttjs/MQTT.js/blob/main/test/abstract_store.js
export default function abstractTest(
	createStore: () => Promise<MqttJsonlStore>,
	destroyStore: (store: MqttJsonlStore) => Promise<void>,
): void {
	let store: MqttJsonlStore;

	// eslint-disable-next-line
	beforeEach(async () => {
		store = await createStore();
	});

	afterEach(async () => {
		await destroyStore(store);
	});

	it("should put and stream in-flight packets", (done) => {
		const packet = {
			topic: "hello",
			payload: "world",
			qos: 1,
			messageId: 42,
		};

		store.put(packet, () => {
			store.createStream().on("data", (data) => {
				expect(data).toEqual(packet);
				done();
			});
		});
	});

	it("should support destroying the stream", (done) => {
		const packet = {
			topic: "hello",
			payload: "world",
			qos: 1,
			messageId: 42,
		};

		store.put(packet, () => {
			const stream = store.createStream();
			stream.on("close", done);
			stream.destroy();
		});
	});

	it("should add and del in-flight packets", (done) => {
		const packet = {
			topic: "hello",
			payload: "world",
			qos: 1,
			messageId: 42,
		};

		store.put(packet, () => {
			store.del(packet, () => {
				store
					.createStream()
					.on("data", () => {
						done(new Error("this should never happen"));
					})
					.on("end", done);
			});
		});
	});

	it("should replace a packet when doing put with the same messageId", (done) => {
		const packet1 = {
			cmd: "publish", // added
			topic: "hello",
			payload: "world",
			qos: 2,
			messageId: 42,
		};
		const packet2 = {
			cmd: "pubrel", // added
			qos: 2,
			messageId: 42,
		};

		store.put(packet1, () => {
			store.put(packet2, () => {
				store.createStream().on("data", (data) => {
					expect(data).toEqual(packet2);
					done();
				});
			});
		});
	});

	it("should return the original packet on del", (done) => {
		const packet = {
			topic: "hello",
			payload: "world",
			qos: 1,
			messageId: 42,
		};

		store.put(packet, () => {
			store.del({ messageId: 42 }, (err, deleted) => {
				if (err) {
					throw err;
				}
				expect(deleted).toEqual(packet);
				done();
			});
		});
	});

	it("should get a packet with the same messageId", (done) => {
		const packet = {
			topic: "hello",
			payload: "world",
			qos: 1,
			messageId: 42,
		};

		store.put(packet, () => {
			store.get({ messageId: 42 }, (err, fromDb) => {
				if (err) {
					throw err;
				}
				expect(fromDb).toEqual(packet);
				done();
			});
		});
	});
}
