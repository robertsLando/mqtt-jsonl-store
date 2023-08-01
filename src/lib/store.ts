import { JsonlDB, JsonlDBOptions } from "@alcalzone/jsonl-db";
import type { DoneCallback, IStore, PacketCallback } from "mqtt";
import { Packet } from "mqtt-packet";
import { Readable } from "stream";
import { promisify } from "util";

export interface MqttJsonlStoreOptions extends JsonlDBOptions<Packet> {
	maxSize: number;

	// clean inflight messages when close is called (default true)
	clean: boolean;
}

function isObject(val: any): val is Record<string, any> {
	return typeof val === "object" && !Array.isArray(val) && val !== null;
}

/**
 * Normalize options for the JsonlDB.
 * Taken from https://github.com/ioBroker/ioBroker.js-controller/blob/646eade552634015c5aa215b1f7b0f9ecfa1c8f7/packages/db-states-jsonl/src/lib/states/statesInMemJsonlDB.js#L52
 */
function normalizeJsonlOptions(conf: JsonlDBOptions<Packet> = {}): JsonlDBOptions<Packet> {
	const ret: JsonlDBOptions<Packet> = {
		autoCompress: {
			sizeFactor: 10, // Compress when the number of uncompressed entries has grown a lot: uncompressedSize >= size * sizeFactor
			sizeFactorMinimumSize: 50000, // Compress when the number of uncompressed entries is at least this large
			intervalMs: 1000 * 60 * 60 * 4, // Compress at least every 4 hours
			intervalMinChanges: 1000, // the minimum count of changes for auto-compression based on time
		},
		ignoreReadErrors: true, // ignore invalid lines found in db file
		throttleFS: {
			intervalMs: 60 * 1000, // write to the database file no more then every 60 seconds
			maxBufferedCommands: 2000, // force a write when there are more then 2000 commands in the buffer
		},
		lockfile: {
			// 5 retries starting at 250ms add up to just above 2s,
			// so the DB has 3 more seconds to load all data if it wants to stay within the 5s connectionTimeout
			retries: 5,
			retryMinTimeoutMs: 250,
			// This makes sure the DB stays locked for maximum 2s even if the process crashes
			staleMs: 2000,
		},
	};

	// Be really careful what we allow here. Incorrect settings may cause problems in production.
	if (isObject(conf.autoCompress)) {
		const ac = conf.autoCompress;
		// Letting the DB grow more than 100x is risky
		if (typeof ac.sizeFactor === "number" && ac.sizeFactor >= 2 && ac.sizeFactor <= 100) {
			ret.autoCompress!.sizeFactor = ac.sizeFactor;
		}
		// Also we should definitely compress once the DB has reached 200k lines or it might grow too big
		if (
			typeof ac.sizeFactorMinimumSize === "number" &&
			ac.sizeFactorMinimumSize >= 0 &&
			ac.sizeFactorMinimumSize <= 200000
		) {
			ret.autoCompress!.sizeFactorMinimumSize = ac.sizeFactorMinimumSize;
		}
	}
	if (isObject(conf.throttleFS)) {
		const thr = conf.throttleFS;
		// Don't write more often than every second and write at least once every hour
		if (typeof thr.intervalMs === "number" && thr.intervalMs >= 1000 && thr.intervalMs <= 3600000) {
			ret.throttleFS!.intervalMs = thr.intervalMs;
		}
		// Don't keep too much in memory - 100k changes are more than enough
		if (
			typeof thr.maxBufferedCommands === "number" &&
			thr.maxBufferedCommands >= 0 &&
			thr.maxBufferedCommands <= 100000
		) {
			ret.throttleFS!.maxBufferedCommands = thr.maxBufferedCommands;
		}
	}

	return ret;
}

export class MqttJsonlStore implements IStore {
	public db: JsonlDB<Packet>;

	constructor(path: string, options?: MqttJsonlStoreOptions) {
		this.db = new JsonlDB(path, normalizeJsonlOptions(options));
	}

	private getId(packet: Partial<Packet>): string {
		return packet.messageId!.toString();
	}

	public open(): Promise<void> {
		return this.db.open();
	}

	/**
	 * Adds a packet to the store, a packet is anything that has a messageId property.
	 * The callback is called when the packet has been stored.
	 */
	public put(packet: Packet, cb?: DoneCallback): this {
		this.db.set(this.getId(packet), packet);
		if (cb) {
			cb();
		}

		return this;
	}

	/** Creates a new stream with all the packets in the store. */
	public createStream(): Readable {
		return Readable.from(this.db.values());
	}

	/**
	 * Removes a packet from the store, a packet is anything that has a messageId property.
	 * The callback is called when the packet has been removed.
	 */
	public del(packet: Pick<Packet, "messageId">, cb: PacketCallback): this {
		let storedPacket: Packet | undefined;
		const id = this.getId(packet);
		if (this.db.has(id)) {
			storedPacket = this.db.get(id);
			this.db.delete(id);
		}
		cb(undefined, storedPacket);

		return this;
	}

	public close(cb: DoneCallback): void {
		this.db
			.close()
			.then(() => cb())
			.catch(cb);
	}

	public closeAsync(): Promise<void> {
		return promisify(this.close.bind(this))();
	}

	public get(packet: Pick<Packet, "messageId">, cb: PacketCallback): this {
		const storedPacket = this.db.get(this.getId(packet));
		if (storedPacket) {
			cb(undefined, storedPacket);
		} else {
			cb(new Error("missing packet"));
		}

		return this;
	}
}
