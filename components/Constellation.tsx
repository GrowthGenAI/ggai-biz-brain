'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Note } from '@/lib/types';

const COLORS: Record<string, string> = { Foundation: '#F2B33D', Wiki: '#7FB2FF', Documents: '#E8603C', Drafts: '#9BE3B4' };

/** A small force-directed map of the notes and their [[links]]. */
export default function Constellation({ notes }: { notes: Note[] }) {
  const W = 900, H = 420;
  const { nodes, edges } = useMemo(() => {
    const ids = new Map(notes.map((n, i) => [n.id, i]));
    const edges: [number, number][] = [];
    notes.forEach((n, i) => n.links.forEach((l) => { const j = ids.get(l); if (j !== undefined && j !== i) edges.push([i, j]); }));
    const deg = notes.map((_, i) => edges.filter(([a, b]) => a === i || b === i).length);
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const pos = notes.map(() => ({ x: W / 2 + (rnd() - 0.5) * W * 0.7, y: H / 2 + (rnd() - 0.5) * H * 0.7, vx: 0, vy: 0 }));
    for (let step = 0; step < 260; step++) {
      for (let i = 0; i < pos.length; i++) {
        for (let j = i + 1; j < pos.length; j++) {
          const dx = pos[i].x - pos[j].x, dy = pos[i].y - pos[j].y;
          const d2 = Math.max(dx * dx + dy * dy, 25);
          const f = (notes.length < 15 ? 160 : 420) / d2;
          pos[i].vx += dx * f; pos[i].vy += dy * f; pos[j].vx -= dx * f; pos[j].vy -= dy * f;
        }
      }
      for (const [a, b] of edges) {
        const dx = pos[b].x - pos[a].x, dy = pos[b].y - pos[a].y;
        pos[a].vx += dx * 0.01; pos[a].vy += dy * 0.01; pos[b].vx -= dx * 0.01; pos[b].vy -= dy * 0.01;
      }
      for (const p of pos) {
        p.vx += (W / 2 - p.x) * 0.006; p.vy += (H / 2 - p.y) * 0.006;
        p.x += Math.max(-8, Math.min(8, p.vx)); p.y += Math.max(-8, Math.min(8, p.vy));
        p.vx *= 0.6; p.vy *= 0.6;
        p.x = Math.max(16, Math.min(W - 16, p.x)); p.y = Math.max(16, Math.min(H - 16, p.y));
      }
    }
    return { nodes: notes.map((n, i) => ({ ...pos[i], n, r: 4 + Math.min(10, deg[i]) })), edges };
  }, [notes]);

  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => setHover(null), [notes]);
  if (!notes.length) return <div className="constellation" style={{ display: 'grid', placeItems: 'center', color: '#9fb0d0' }}>Your knowledge map appears here after you upload your vault.</div>;

  const lit = (i: number) => hover === null || hover === i || edges.some(([a, b]) => (a === hover && b === i) || (b === hover && a === i));

  return (
    <svg className="constellation" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      {edges.map(([a, b], k) => (
        <line key={k} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke="#9fb0d0" strokeOpacity={hover === null ? 0.25 : a === hover || b === hover ? 0.8 : 0.06} />
      ))}
      {nodes.map((p, i) => (
        <g key={p.n.id} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
          <circle cx={p.x} cy={p.y} r={p.r} fill={COLORS[p.n.folder] || '#C9D3E6'} opacity={lit(i) ? 1 : 0.2} />
          {(hover === i || p.r > 9) && (
            <text x={p.x + p.r + 4} y={p.y + 4} fontSize={hover === i ? 13 : 10} fill="#E8ECF5" opacity={lit(i) ? 1 : 0.3}>{p.n.title}</text>
          )}
        </g>
      ))}
    </svg>
  );
}
