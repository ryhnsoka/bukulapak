import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { getDb, requireDb } from './firebase';

export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);
export const MAX_RAW_PHOTO_BYTES = 2 * 1024 * 1024;
export const MAX_PHOTOS = 5;

const MAX_FULL_DATA_URL_BYTES = 180_000;
const MAX_THUMB_DATA_URL_BYTES = 40_000;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Gagal membaca gambar ${file.name}.`));
    };
    img.src = objectUrl;
  });
}

function encodeCanvas(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number
): string {
  const dataUrl = canvas.toDataURL(mime, quality);
  if (mime === 'image/webp' && !dataUrl.startsWith('data:image/webp')) {
    return canvas.toDataURL('image/jpeg', quality);
  }
  return dataUrl;
}

async function compressWithinLimit(
  file: File,
  initialMaxWidth: number,
  initialQuality: number,
  maxBytes: number
): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error(`${file.name}: format harus JPG, PNG, atau WebP.`);
  }
  if (file.size > MAX_RAW_PHOTO_BYTES) {
    throw new Error(`${file.name}: ukuran melebihi 2MB.`);
  }

  const img = await loadImageFromFile(file);
  let targetWidth = Math.min(initialMaxWidth, img.naturalWidth || initialMaxWidth);
  let quality = initialQuality;

  for (let pass = 0; pass < 6; pass++) {
    const ratio = (img.naturalWidth || targetWidth) > 0
      ? targetWidth / (img.naturalWidth || targetWidth)
      : 1;
    const width = Math.max(120, Math.round((img.naturalWidth || targetWidth) * Math.min(1, ratio)));
    const height = Math.max(120, Math.round((img.naturalHeight || targetWidth) * Math.min(1, ratio)));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Browser tidak mendukung pemrosesan gambar.');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = encodeCanvas(canvas, 'image/webp', quality);
    if (dataUrl.length <= maxBytes) {
      return dataUrl;
    }

    if (quality > 0.5) {
      quality = Math.max(0.45, quality - 0.12);
    } else {
      targetWidth = Math.round(targetWidth * 0.78);
    }
  }

  throw new Error(`Foto ${file.name} terlalu detail untuk dikompresi. Coba pilih foto lain.`);
}

export function compressBookPhoto(file: File): Promise<string> {
  return compressWithinLimit(file, 900, 0.78, MAX_FULL_DATA_URL_BYTES);
}

export function compressBookThumb(file: File): Promise<string> {
  return compressWithinLimit(file, 360, 0.72, MAX_THUMB_DATA_URL_BYTES);
}

export async function uploadListingPhotos(
  listingId: string,
  userId: string,
  files: File[]
): Promise<{ thumbUrl: string; photoUrls: string[] }> {
  const db = requireDb();
  if (files.length < 1 || files.length > MAX_PHOTOS) {
    throw new Error(`Jumlah foto harus antara 1 sampai ${MAX_PHOTOS} foto.`);
  }

  const thumbUrl = await compressBookThumb(files[0]);
  const photoUrls = await Promise.all(files.map((f) => compressBookPhoto(f)));

  const batch = writeBatch(db);
  photoUrls.forEach((dataUrl, index) => {
    const photoRef = doc(db, 'listings', listingId, 'photos', String(index));
    batch.set(photoRef, {
      index,
      data_url: dataUrl,
      user_id: userId,
      created_at: serverTimestamp(),
    });
  });
  await batch.commit();

  await updateDoc(doc(db, 'listings', listingId), {
    images: [thumbUrl],
    photos_count: photoUrls.length,
  });

  return { thumbUrl, photoUrls };
}

export async function getListingPhotos(listingId: string): Promise<string[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'listings', listingId, 'photos'), orderBy('index', 'asc'))
  );
  return snap.docs
    .map((d) => String(d.data()?.data_url ?? ''))
    .filter(Boolean);
}
