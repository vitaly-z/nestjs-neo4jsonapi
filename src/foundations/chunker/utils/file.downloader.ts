import { randomUUID } from "crypto";
import * as fs from "fs/promises";

export async function downloadFile(params: { url: string; extension: string }): Promise<string> {
  const response = await fetch(params.url);
  if (!response.ok) {
    throw new Error(`Failed to fetch the file: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const tempFilePath = `/tmp/temp-file.${randomUUID()}.${params.extension}`;

  await fs.writeFile(tempFilePath, Buffer.from(buffer));

  return tempFilePath;
}

export async function downloadFileAsBuffer(params: { url: string; extension: string }): Promise<Buffer> {
  const response = await fetch(params.url);
  if (!response.ok) {
    throw new Error(`Failed to fetch the file: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  return Buffer.from(arrayBuffer);
}
