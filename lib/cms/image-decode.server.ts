import "server-only";

import sharp from "sharp";
import { inspectImageUpload } from "./image-upload";

const maximumImagePixels = 40_000_000;

export async function decodeImageUpload(file: File) {
  const inspected = await inspectImageUpload(file);
  if (inspected.width * inspected.height > maximumImagePixels) {
    throw new Error("Resolusi gambar melebihi batas yang aman.");
  }

  try {
    await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: maximumImagePixels }).stats();
  } catch {
    throw new Error("Isi file gambar rusak atau tidak dapat dibaca.");
  }

  return inspected;
}