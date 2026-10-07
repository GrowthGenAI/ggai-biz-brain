import type { BrandKit, CarouselSlide } from '@/lib/types';

export function isDark(hex: string) {
  const h = (hex || '#000000').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
}

export function fontHref(b: BrandKit) {
  const fams = Array.from(new Set([b.fonts.heading, b.fonts.body].filter(Boolean)));
  if (!fams.length) return '';
  return `https://fonts.googleapis.com/css2?${fams.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;600;700`).join('&')}&display=swap`;
}

/** One carousel slide drawn at full LinkedIn size: 1080 × 1350. */
export default function Slide({ slide, brand, n, total }: { slide: CarouselSlide; brand: BrandKit; n: number; total: number }) {
  const c = brand.colors;
  const head = `'${brand.fonts.heading}', Georgia, serif`;
  const body = `'${brand.fonts.body}', system-ui, sans-serif`;
  const dark = slide.kind !== 'content';
  const bg = dark ? c.primary : c.background;
  const fg = dark ? (isDark(c.primary) ? '#FFFFFF' : c.text) : c.text;
  const name = brand.founderName || brand.brandName;
  const dense = (slide.bullets?.length || 0) > 4 || (slide.body || '').length > 170;

  const base: React.CSSProperties = {
    width: 1080, height: 1350, background: bg, color: fg, position: 'relative', overflow: 'hidden',
    fontFamily: body, display: 'flex', flexDirection: 'column', padding: '96px 96px 80px', boxSizing: 'border-box',
  };

  const footer = (
    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 28, opacity: 0.85 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {brand.headshotUrl && slide.kind === 'content' && (
          <img src={brand.headshotUrl} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
        )}
        <span style={{ fontWeight: 600 }}>{brand.handle || name}</span>
      </div>
      <span>{n} / {total}</span>
    </div>
  );

  if (slide.kind === 'cover') {
    return (
      <div style={base}>
        <div style={{ position: 'absolute', right: -160, top: -160, width: 560, height: 560, borderRadius: '50%', background: c.secondary, opacity: 0.9 }} />
        <div style={{ position: 'absolute', right: 120, top: 260, width: 90, height: 90, borderRadius: '50%', background: c.accent }} />
        {brand.logoUrl && <img src={brand.logoUrl} alt="" style={{ height: 70, alignSelf: 'flex-start', position: 'relative' }} />}
        <div style={{ marginTop: 'auto', position: 'relative' }}>
          <div style={{ fontFamily: head, fontSize: 104, lineHeight: 1.04, fontWeight: 700, letterSpacing: '-0.02em' }}>{slide.heading}</div>
          {slide.body && <div style={{ fontSize: 40, lineHeight: 1.35, marginTop: 36, color: c.secondary, maxWidth: 820 }}>{slide.body}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 70, position: 'relative' }}>
          {brand.headshotUrl && <img src={brand.headshotUrl} alt="" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: `5px solid ${c.secondary}` }} />}
          <div style={{ fontSize: 30 }}>
            <div style={{ fontWeight: 700 }}>{name}</div>
            <div style={{ opacity: 0.8 }}>{brand.role || brand.tagline}</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 30, opacity: 0.8 }}>Swipe →</div>
        </div>
      </div>
    );
  }

  if (slide.kind === 'cta') {
    return (
      <div style={{ ...base, alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', left: -200, bottom: -200, width: 600, height: 600, borderRadius: '50%', background: c.secondary, opacity: 0.25 }} />
        {brand.headshotUrl && <img src={brand.headshotUrl} alt="" style={{ width: 260, height: 260, borderRadius: '50%', objectFit: 'cover', border: `8px solid ${c.secondary}`, position: 'relative' }} />}
        <div style={{ fontFamily: head, fontSize: 84, lineHeight: 1.08, fontWeight: 700, marginTop: 60, position: 'relative' }}>{slide.heading}</div>
        {slide.body && (
          <div style={{ fontSize: 44, lineHeight: 1.35, marginTop: 40, background: c.secondary, color: isDark(c.secondary) ? '#fff' : c.text, padding: '24px 40px', borderRadius: 24, fontWeight: 600, position: 'relative' }}>
            {slide.body}
          </div>
        )}
        <div style={{ fontSize: 32, marginTop: 50, opacity: 0.85, position: 'relative' }}>
          {name}
          {brand.handle ? ` · ${brand.handle}` : ''}
        </div>
      </div>
    );
  }

  return (
    <div style={base}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <div style={{ width: 84, height: 84, borderRadius: 22, background: c.accent, color: isDark(c.accent) ? '#fff' : c.text, display: 'grid', placeItems: 'center', fontSize: 42, fontWeight: 700 }}>
          {n - 1}
        </div>
        <div style={{ height: 6, flex: 1, background: c.secondary, borderRadius: 3, opacity: 0.7 }} />
      </div>
      {slide.imageUrl && (
        <img src={slide.imageUrl} alt="" style={{ width: '100%', height: 430, objectFit: 'cover', borderRadius: 32, marginTop: 56 }} />
      )}
      <div style={{ fontFamily: head, fontSize: slide.imageUrl ? 70 : 84, lineHeight: 1.08, fontWeight: 700, color: c.primary, marginTop: slide.imageUrl ? 50 : 110 }}>
        {slide.heading}
      </div>
      {slide.body && <div style={{ fontSize: dense ? 36 : 42, lineHeight: 1.45, marginTop: 36 }}>{slide.body}</div>}
      {slide.bullets?.length ? (
        <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: dense ? 18 : 24 }}>
          {slide.bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 22, fontSize: dense ? 34 : 40, lineHeight: 1.35 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: c.accent, marginTop: 18, flex: 'none' }} />
              <span>{b}</span>
            </div>
          ))}
        </div>
      ) : null}
      {footer}
    </div>
  );
}
