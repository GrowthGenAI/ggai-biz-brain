'use client';
import { useEffect, useRef } from 'react';

type N = { id: string; links: string[] };

/** A slowly turning cloud of the founder's notes. Notes being read glow. */
export default function BrainField({ notes, active = [], busy }: { notes: N[]; active?: string[]; busy: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({ active, busy });
  state.current = { active, busy };

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    // Real notes first; quiet background stars fill the cloud when the brain is small.
    const pad = Math.max(0, 90 - notes.length);
    const list = [...notes, ...Array.from({ length: pad }, (_, i) => ({ id: `~${i}`, links: [`~${(i * 7 + 3) % pad}`] }))];
    let seed = 11;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const pts = list.map((n) => {
      const u = rnd() * 2 - 1, t = rnd() * Math.PI * 2, r = 0.55 + rnd() * 0.45;
      return { id: n.id, x: Math.sqrt(1 - u * u) * Math.cos(t) * r, y: u * r, z: Math.sqrt(1 - u * u) * Math.sin(t) * r };
    });
    const idx = new Map(pts.map((p, i) => [p.id, i]));
    const edges: [number, number][] = [];
    list.forEach((n, i) => n.links.forEach((l) => { const j = idx.get(l); if (j !== undefined && j > i) edges.push([i, j]); }));

    let raf = 0, a = 0;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = c.clientWidth, h = c.clientHeight;
      if (c.width !== w * dpr) { c.width = w * dpr; c.height = h * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const { active: act, busy: b } = state.current;
      a += b ? 0.006 : 0.002;
      const R = Math.min(w, h) * 0.42;
      const proj = pts.map((p) => {
        const x = p.x * Math.cos(a) - p.z * Math.sin(a), z = p.x * Math.sin(a) + p.z * Math.cos(a);
        const s = 1 / (1.6 - z * 0.6);
        return { sx: w / 2 + x * R * s, sy: h / 2 + p.y * R * s, s, z };
      });
      ctx.lineWidth = 0.6;
      for (const [i, j] of edges) {
        const hot = act.includes(pts[i].id) || act.includes(pts[j].id);
        ctx.strokeStyle = hot ? 'rgba(242,179,61,0.55)' : 'rgba(150,170,230,0.14)';
        ctx.beginPath(); ctx.moveTo(proj[i].sx, proj[i].sy); ctx.lineTo(proj[j].sx, proj[j].sy); ctx.stroke();
      }
      const t = performance.now() / 600;
      proj.forEach((q, i) => {
        const hot = act.includes(pts[i].id);
        const r = (hot ? 4.5 + Math.sin(t + i) * 1.2 : 2.6) * q.s;
        ctx.fillStyle = hot ? 'rgba(242,179,61,0.95)' : `rgba(170,190,255,${0.35 + (q.z + 1) * 0.3})`;
        if (hot) { ctx.shadowColor = '#F2B33D'; ctx.shadowBlur = 14; } else ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(q.sx, q.sy, r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [notes]);

  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />;
}
