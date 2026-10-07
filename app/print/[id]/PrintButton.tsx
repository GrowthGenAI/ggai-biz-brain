'use client';
import { useEffect } from 'react';

export default function PrintButton() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 1500);
    return () => clearTimeout(t);
  }, []);
  return (
    <button onClick={() => window.print()} style={{ background: '#1F2A44', color: '#fff', border: 0, borderRadius: 8, padding: '8px 14px', fontWeight: 600, cursor: 'pointer' }}>
      Download PDF
    </button>
  );
}
