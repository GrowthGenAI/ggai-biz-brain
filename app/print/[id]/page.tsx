import Slide, { fontHref } from '@/components/Slide';
import { getOutput } from '@/lib/history';
import { getBrand } from '@/lib/brand';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';

export default async function Print({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [out, brand] = await Promise.all([getOutput(id), getBrand()]);
  if (!out || out.kind !== 'carousel') return <p style={{ padding: 40 }}>Carousel not found.</p>;
  const slides = out.data.slides || [];
  const href = fontHref(brand);
  return (
    <div>
      {href && <link rel="stylesheet" href={href} />}
      <style>{`
        @page { size: 1080px 1350px; margin: 0; }
        html, body { background: #555; margin: 0; }
        .pg { width: 1080px; height: 1350px; margin: 0 auto 24px; page-break-after: always; break-after: page; }
        .wrap { padding-top: 80px; }
        .tools { position: fixed; top: 16px; right: 16px; z-index: 5; display: flex; gap: 8px; align-items: center; background: #fff; padding: 10px 14px; border-radius: 12px; font: 14px system-ui; box-shadow: 0 4px 20px rgba(0,0,0,.2); }
        @media print { html, body { background: none; } .tools { display: none; } .wrap { padding-top: 0; } .pg { margin: 0; overflow: hidden; } .pg:last-child { page-break-after: auto; break-after: auto; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      `}</style>
      <div className="tools">
        <span>Save as PDF: choose <b>Save as PDF</b>, margins <b>None</b>, tick <b>Background graphics</b>.</span>
        <PrintButton />
      </div>
      <div className="wrap">
        {slides.map((s: any, i: number) => (
          <div className="pg" key={i}>
            <Slide slide={s} brand={brand} n={i + 1} total={slides.length} />
          </div>
        ))}
      </div>
    </div>
  );
}
