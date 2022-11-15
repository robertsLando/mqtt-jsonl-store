import abstractTest from "../../test/abstract.test";
import { Manager } from "./manager";
import { emptyTmpDir, ensureTmpDir, tmpDir } from "./store.test";

describe("mqtt jsonl store manager", () => {
	let manager: Manager;

	beforeEach(async () => {
		await ensureTmpDir();
		manager = new Manager(tmpDir);
		await manager.open();
	});

	describe("incoming", () => {
		abstractTest(
			async () => manager.incoming,
			async () => {
				await manager.close();
				await emptyTmpDir();
			},
		);
	});

	describe("outgoing", () => {
		abstractTest(
			async () => manager.outgoing,
			async () => {
				await manager.close();
				await emptyTmpDir();
			},
		);
	});
});
