import { JsonlDB, JsonlDBOptions } from "@alcalzone/jsonl-db";
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

export type ErrorCallback = (err?: Error) => void;

export class MqttJsonlStore {
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

	/** Adds a packet to the store, a packet is anything that has a messageId property.
	 * The callback is called when the packet has been stored. */
	public put(packet: DbPacket, cb: ErrorCallback): void {
		this.db.set(this.getId(packet), packet);
		cb();
	}

	/** Creates a new stream with all the packets in the store. */
	public createStream(): Readable {
		return Readable.from(this.db.values());
	}

	/** Removes a packet from the store, a packet is anything that has a messageId property.
	 * The callback is called when the packet has been removed. */
	public del(packet: DbPacket, cb: ErrorCallback): void {
		this.db.delete(this.getId(packet));
		cb();
	}

	public close(cb: ErrorCallback): void {
		this.db
			.close()
			.then(() => cb())
			.catch(cb);
	}

	public get(packet: DbPacket, cb: (err?: Error, packet?: DbPacket) => void): void {
		const storedPacket = this.db.get(this.getId(packet));
		if (storedPacket) {
			cb(undefined, storedPacket);
		} else {
			cb(new Error("missing packet"));
		}
	}
}
