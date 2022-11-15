import { JsonlDB, JsonlDBOptions } from "@alcalzone/jsonl-db";
import type { Store } from "mqtt";
import { Readable } from "stream";

export interface DbPacket {
	messageId: number;
	[key: string]: any;
}

export interface MqttJsonlStoreOptions extends JsonlDBOptions<DbPacket> {
	maxSize: number;

	// clean inflight messages when close is called (default true)
	clean: boolean;
}

export type ErrorCallback = (err?: Error | null) => void;

export type PacketCallback = (err?: Error | null, packet?: DbPacket) => void;

export class MqttJsonlStore implements Store {
	public db: JsonlDB<DbPacket>;

	constructor(path: string, options?: MqttJsonlStoreOptions) {
		this.db = new JsonlDB(path, options);
	}

	private getId(packet: DbPacket): string {
		return packet.messageId.toString();
	}

	public open(): Promise<void> {
		return this.db.open();
	}

	/**
	 * Adds a packet to the store, a packet is anything that has a messageId property.
	 * The callback is called when the packet has been stored.
	 */
	public put(packet: DbPacket, cb?: ErrorCallback): this {
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
	public del(packet: DbPacket, cb: PacketCallback): this {
		let storedPacket: DbPacket | undefined;
		const id = this.getId(packet);
		if (this.db.has(id)) {
			storedPacket = this.db.get(id);
			this.db.delete(id);
		}
		cb(null, storedPacket);

		return this;
	}

	public close(cb: ErrorCallback): void {
		this.db
			.close()
			.then(() => cb())
			.catch(cb);
	}

	public get(packet: DbPacket, cb: PacketCallback): this {
		const storedPacket = this.db.get(this.getId(packet));
		if (storedPacket) {
			cb(null, storedPacket);
		} else {
			cb(new Error("missing packet"));
		}

		return this;
	}
}
