import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function getStorageMode() {
  return (process.env.OBJECT_STORAGE_MODE || "local").toLowerCase();
}

function getLocalStorageRoot() {
  return path.resolve(process.cwd(), process.env.OBJECT_STORAGE_ROOT || ".data/object-storage");
}

function assertLocalMode() {
  if (getStorageMode() !== "local") {
    throw new Error(
      `Unsupported OBJECT_STORAGE_MODE "${getStorageMode()}". Only "local" is implemented in alpha.`,
    );
  }
}

function resolveObjectPath(key: string) {
  return path.join(getLocalStorageRoot(), key.replace(/^\/+/, ""));
}

export function isObjectStorageConfigured() {
  return getStorageMode() === "local" || Boolean(process.env.OBJECT_STORAGE_MODE);
}

export async function putObject(
  key: string,
  body: Uint8Array | string,
) {
  assertLocalMode();

  const objectPath = resolveObjectPath(key);
  await mkdir(path.dirname(objectPath), { recursive: true });
  await writeFile(objectPath, body);

  return {
    key,
    path: objectPath,
  };
}

export async function getObjectBuffer(key: string) {
  assertLocalMode();
  return readFile(resolveObjectPath(key));
}

export async function putJsonObject<T>(key: string, value: T) {
  return putObject(key, JSON.stringify(value, null, 2));
}

export async function getJsonObject<T>(key: string): Promise<T> {
  const buffer = await getObjectBuffer(key);
  return JSON.parse(buffer.toString("utf8")) as T;
}
