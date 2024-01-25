import { join } from "path";
import abstractTest from "../../test/abstract.test";
import { emptyTmpDir, ensureTmpDir, tmpDir } from "../../test/utils";
import { Manager } from "./manager";

describe("mqtt jsonl store manager", () => {
	let manager: Manager;

	test("should throw an error when path doesn't exists", () => {
		expect(() => new Manager(join(__dirname, "not-existing"))).toThrow(/ENOENT/);
	});

	test("should throw an error when path isn't a directory", () => {
		expect(() => new Manager(join(__filename))).toThrow(/not a directory/);
	});

	describe("incoming", () => {
		abstractTest(
			async () => {
				await ensureTmpDir();
				manager = new Manager(tmpDir);
				await manager.open();
				return manager.incoming;
			},
			async () => {
				await manager.close();
				await emptyTmpDir();
			},
		);
	});

	describe("outgoing", () => {
		abstractTest(
			async () => {
				await ensureTmpDir();
				manager = new Manager(tmpDir);
				await manager.open();
				return manager.outgoing;
			},
			async () => {
				await manager.close();
				await emptyTmpDir();
			},
		);
	});
});
