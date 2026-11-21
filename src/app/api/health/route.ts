import { NextResponse } from 'next/server';
import { isFirebaseConfigured } from '@/lib/firebase';

export async function GET() {
  return NextResponse.json({
    status: isFirebaseConfigured ? 'ok' : 'unconfigured',
    app: 'BukuLapak',
    backend: 'firebase',
    firebaseConfigured: isFirebaseConfigured,
  });
}
