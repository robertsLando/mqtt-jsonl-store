import abstractTest from "../../test/abstract.test";
import { Manager } from "./manager";
import { ensureTmpDir } from "./store.test";

describe("mqtt jsonl store manager", () => {
	let manager: Manager;
	let tmpDir: string;

	beforeEach(async () => {
		tmpDir = await ensureTmpDir();
		manager = new Manager(tmpDir);
		await manager.open();
	});

	afterEach(async () => {
		await manager.close();
	});

	describe("incoming", () => {
		abstractTest(async () => manager.incoming);
	});

	describe("outgoing", () => {
		abstractTest(async () => manager.outgoing);
	});
});
