import { getStore } from '@netlify/blobs';
import { NextResponse } from 'next/server';

export async function GET() {
    console.log('blobs-test: start');
    const store = getStore({ name: 'daily-answers' });
    console.log('blobs-test: got store');

    const timeout = new Promise((_, rej) =>
        setTimeout(() => rej(new Error('blobs get timed out after 8s')), 8000)
    );

    await Promise.race([store.setJSON('test', { ok: true }), timeout]);
    console.log('blobs-test: wrote');
    const v = await Promise.race([store.get('test', { type: 'json' }), timeout]);
    console.log('blobs-test: read', v);
    return NextResponse.json({ v });
}