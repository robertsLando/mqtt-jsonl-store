import abstractTest from "../../test/abstract.test";
import { emptyTmpDir, ensureTmpDir, tmpDir } from "../../test/utils";
import { Manager } from "./manager";

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
