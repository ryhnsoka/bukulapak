export interface IsbnValidationResult {
  valid: boolean;
  normalized: string;
  format?: 'ISBN-10' | 'ISBN-13';
  error?: string;
}

/**
 * Menghapus spasi dan tanda hubung serta mengubah huruf akhir ke kapital.
 */
export function normalizeIsbn(raw: string): string {
  return raw.replace(/[\s-]+/g, '').toUpperCase();
}

/**
 * Memvalidasi format dan digit pemeriksa (checksum) ISBN-10 maupun ISBN-13.
 */
export function validateIsbn(raw: string): IsbnValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, normalized: '', error: 'ISBN wajib diisi.' };
  }

  const normalized = normalizeIsbn(trimmed);

  if (/[^0-9Xx\s-]/.test(trimmed)) {
    return {
      valid: false,
      normalized,
      error:
        'ISBN hanya boleh berisi angka, tanda hubung (-), atau huruf X di digit terakhir ISBN-10.',
    };
  }

  if (normalized.length === 10) {
    if (!/^[0-9]{9}[0-9X]$/.test(normalized)) {
      return {
        valid: false,
        normalized,
        error: 'Format ISBN-10 tidak valid (9 angka + 1 angka/X).',
      };
    }

    let sum = 0;
    for (let i = 0; i < 10; i++) {
      const ch = normalized[i];
      const digit = ch === 'X' ? 10 : Number(ch);
      sum += (10 - i) * digit;
    }

    if (sum % 11 !== 0) {
      return {
        valid: false,
        normalized,
        error:
          'Digit pemeriksa (checksum) ISBN-10 tidak valid; periksa kembali angka ISBN di buku.',
      };
    }

    return { valid: true, normalized, format: 'ISBN-10' };
  }

  if (normalized.length === 13) {
    if (!/^[0-9]{13}$/.test(normalized)) {
      return {
        valid: false,
        normalized,
        error: 'ISBN-13 hanya boleh berisi 13 digit angka.',
      };
    }

    if (!normalized.startsWith('978') && !normalized.startsWith('979')) {
      return {
        valid: false,
        normalized,
        error: 'ISBN-13 buku harus diawali 978 atau 979.',
      };
    }

    let sum = 0;
    for (let i = 0; i < 13; i++) {
      const weight = i % 2 === 0 ? 1 : 3;
      sum += weight * Number(normalized[i]);
    }

    if (sum % 10 !== 0) {
      return {
        valid: false,
        normalized,
        error:
          'Digit pemeriksa (checksum) ISBN-13 tidak valid; periksa kembali angka ISBN di buku.',
      };
    }

    return { valid: true, normalized, format: 'ISBN-13' };
  }

  return {
    valid: false,
    normalized,
    error: 'ISBN harus terdiri dari 10 atau 13 digit angka.',
  };
}
