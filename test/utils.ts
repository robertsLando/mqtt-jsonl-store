import type { Stats } from "fs";
import { mkdir, readdir, rm, stat } from "fs/promises";
import { join } from "path";

export async function exists(path: string): Promise<Stats | false> {
	try {
		const stats = await stat(path);
		return stats;
	} catch (e) {
		return false;
	}
}

export const tmpDir = join(__dirname, "../", ".test");

export async function emptyTmpDir(): Promise<void> {
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
