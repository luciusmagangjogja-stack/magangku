const maximumImageBytes = 5 * 1024 * 1024;
const maximumDimension = 12000;

export interface InspectedImage {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
  width: number;
  height: number;
  fileSize: number;
}

function dimensionsForJpeg(bytes: DataView) {
  const start = bytes.byteOffset;
  const limit = start + bytes.byteLength;
  let offset = start + 2;
  const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

  while (offset + 3 < limit) {
    if (bytes.getUint8(offset) !== 0xff) throw new Error("invalid");
    while (offset < limit && bytes.getUint8(offset) === 0xff) offset += 1;
    const marker = bytes.getUint8(offset);
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > limit) throw new Error("invalid");
    const segmentLength = bytes.getUint16(offset);
    if (segmentLength < 2 || offset + segmentLength > limit) throw new Error("invalid");
    if (frameMarkers.has(marker)) {
      if (segmentLength < 7) throw new Error("invalid");
      return { height: bytes.getUint16(offset + 3), width: bytes.getUint16(offset + 5) };
    }
    offset += segmentLength;
  }

  throw new Error("invalid");
}

function dimensionsForWebp(bytes: DataView) {
  const start = bytes.byteOffset;
  const chunk = start + 12;
  if (bytes.byteLength < 30) throw new Error("invalid");
  const type = String.fromCharCode(bytes.getUint8(chunk), bytes.getUint8(chunk + 1), bytes.getUint8(chunk + 2), bytes.getUint8(chunk + 3));

  if (type === "VP8X") {
    return {
      width: 1 + bytes.getUint8(chunk + 12) + (bytes.getUint8(chunk + 13) << 8) + (bytes.getUint8(chunk + 14) << 16),
      height: 1 + bytes.getUint8(chunk + 15) + (bytes.getUint8(chunk + 16) << 8) + (bytes.getUint8(chunk + 17) << 16),
    };
  }

  if (type === "VP8L" && bytes.getUint8(chunk + 8) === 0x2f) {
    const first = bytes.getUint8(chunk + 9);
    const second = bytes.getUint8(chunk + 10);
    const third = bytes.getUint8(chunk + 11);
    const fourth = bytes.getUint8(chunk + 12);
    return {
      width: 1 + first + ((second & 0x3f) << 8),
      height: 1 + (second >>> 6) + (third << 2) + ((fourth & 0x0f) << 10),
    };
  }

  if (type === "VP8 ") {
    const frame = chunk + 8;
    if (bytes.getUint8(frame + 3) !== 0x9d || bytes.getUint8(frame + 4) !== 0x01 || bytes.getUint8(frame + 5) !== 0x2a) {
      throw new Error("invalid");
    }
    return {
      width: bytes.getUint16(frame + 6, true) & 0x3fff,
      height: bytes.getUint16(frame + 8, true) & 0x3fff,
    };
  }

  throw new Error("invalid");
}

function inspectBytes(buffer: ArrayBuffer): Omit<InspectedImage, "fileSize"> {
  const bytes = new DataView(buffer);
  if (bytes.byteLength >= 24 && bytes.getUint32(0) === 0x89504e47 && bytes.getUint32(4) === 0x0d0a1a0a) {
    if (bytes.getUint32(8) !== 13 || bytes.getUint32(12) !== 0x49484452) throw new Error("invalid");
    return {
      mimeType: "image/png",
      extension: "png",
      width: bytes.getUint32(16),
      height: bytes.getUint32(20),
    };
  }

  if (bytes.byteLength >= 4 && bytes.getUint8(0) === 0xff && bytes.getUint8(1) === 0xd8) {
    return { ...dimensionsForJpeg(bytes), mimeType: "image/jpeg", extension: "jpg" };
  }

  if (
    bytes.byteLength >= 20 &&
    bytes.getUint32(0, true) === 0x46464952 &&
    bytes.getUint32(8, false) === 0x57454250
  ) {
    return { ...dimensionsForWebp(bytes), mimeType: "image/webp", extension: "webp" };
  }

  throw new Error("invalid");
}

export async function inspectImageUpload(file: File): Promise<InspectedImage> {
  if (file.size < 1 || file.size > maximumImageBytes) {
    throw new Error("Ukuran gambar harus antara 1 byte dan 5 MiB.");
  }

  let image: Omit<InspectedImage, "fileSize">;
  try {
    image = inspectBytes(await file.arrayBuffer());
  } catch {
    throw new Error("File bukan gambar JPEG, PNG, atau WebP yang valid.");
  }

  if (file.type !== image.mimeType) {
    throw new Error("Format file tidak sesuai dengan tipe gambar sebenarnya.");
  }
  if (
    image.width < 1 || image.height < 1 ||
    image.width > maximumDimension || image.height > maximumDimension
  ) {
    throw new Error("Dimensi gambar tidak didukung.");
  }

  return { ...image, fileSize: file.size };
}