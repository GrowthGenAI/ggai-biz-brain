'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import OutputView from '@/components/OutputView';
import type { BrandKit, Output } from '@/lib/types';

export default function View({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [out, setOut] = useState<Output | null>(null);
  const [brand, setBrand] = useState<BrandKit | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    fetch(`/api/history/${id}`).then(async (r) => (r.ok ? setOut(await r.json()) : setErr('Not found.')));
    fetch('/api/brand').then((r) => r.json()).then(setBrand);
  }, [id]);
  return (
    <div className="stack">
      <Link href="/history" className="muted">← History</Link>
      {err && <div className="err">{err}</div>}
      {out && brand ? <OutputView out={out} brand={brand} /> : !err && <span className="spinner" />}
    </div>
  );
}
