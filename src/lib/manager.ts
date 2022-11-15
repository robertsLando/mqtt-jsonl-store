import { mkdirSync, statSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { MqttJsonlStore, MqttJsonlStoreOptions } from "./store";

export interface ManagerOptions {
	incoming: MqttJsonlStoreOptions;
	outgoing: MqttJsonlStoreOptions;
}

export class Manager {
	public incoming: MqttJsonlStore;
	public outgoing: MqttJsonlStore;

	constructor(path: string, options?: ManagerOptions | MqttJsonlStoreOptions) {
		if (!path) {
			path = join(homedir(), ".mqtt-jsonl-store");
			mkdirSync(path);
		} else {
			// check path exists and is a directory
			const stat = statSync(path);
			if (!stat.isDirectory()) {
				throw new Error(`Path ${path} is not a directory`);
			}
		}
		const incomingOptions: MqttJsonlStoreOptions =
			(options as ManagerOptions)?.incoming || (options as MqttJsonlStoreOptions);
		const outgoingOptions: MqttJsonlStoreOptions =
			(options as ManagerOptions)?.outgoing || (options as MqttJsonlStoreOptions);

		this.incoming = new MqttJsonlStore(join(path, "incoming.jsonl"), incomingOptions);
		this.outgoing = new MqttJsonlStore(join(path, "outgoing.jsonl"), outgoingOptions);
	}

	public async open(): Promise<void> {
		await this.incoming.open();
		await this.outgoing.open();
	}

	public async close(): Promise<void> {
		await this.incoming.db.close();
		await this.outgoing.db.close();
	}
}
