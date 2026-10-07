'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { HistoryItem } from '@/lib/types';

export default function History() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  useEffect(() => { fetch('/api/history').then((r) => r.json()).then(setItems); }, []);
  return (
    <div>
      <h1>History</h1>
      <p className="sub">Everything you have made, newest first.</p>
      <div className="card hist">
        {items === null && <span className="spinner" />}
        {items?.length === 0 && <p className="muted">Nothing yet. Make something in the Studio.</p>}
        {items?.map((i) => (
          <Link key={i.id} href={`/view/${i.id}`}>
            <span><span className="cmd-label" style={{ fontSize: 10 }}>{i.kind.toUpperCase()}</span> {i.title}</span>
            <span className="muted" style={{ whiteSpace: 'nowrap' }}>{new Date(i.createdAt).toLocaleDateString()}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
