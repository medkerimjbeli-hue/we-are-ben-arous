import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Hand } from 'lucide-react';
import type { Catalog } from '../../types';
import { tr } from '../../lib/localize';
import { useLang } from '../../hooks/useLang';
import { locationsInDelegation } from '../../data/selectors';
import { loadDelegations, toSvgPath } from '../map/geo';

/**
 * Draggable arc carousel of the 12 delegations. Each card's artwork is the delegation's real boundary
 * (from Map Tunisia), so the visual stays truthful even before photography is available.
 */
export function DelegationCarousel({ catalog }: { catalog: Catalog }) {
  const { t } = useTranslation();
  const { lang, to, dir } = useLang();
  const items = catalog.delegations;
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paths, setPaths] = useState<Record<string, string>>({});
  const start = useRef<number | null>(null);
  const n = items.length;
  const sign = dir === 'rtl' ? -1 : 1;

  useEffect(() => {
    loadDelegations().then((fc) => setPaths(Object.fromEntries(fc.features.map((f) => [f.properties.id, toSvgPath(f.geometry)])))).catch(() => {});
  }, []);

  const go = (d: number) => setIndex((i) => (i + d + n) % n);
  const onDown = (e: React.PointerEvent) => { start.current = e.clientX; setDragging(true); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); };
  const onMove = (e: React.PointerEvent) => { if (start.current != null) setDrag(e.clientX - start.current); };
  const onUp = () => {
    if (start.current == null) return;
    if (Math.abs(drag) > 60) go((drag < 0 ? 1 : -1) * sign);
    start.current = null; setDrag(0); setDragging(false);
  };
  const current = items[index];
  const count = locationsInDelegation(catalog, current.id).length;

  return (
    <section aria-roledescription="carousel" aria-label={t('home.carouselTitle')} className="relative"
      onKeyDown={(e) => { if (e.key === 'ArrowRight') go(sign); if (e.key === 'ArrowLeft') go(-sign); }}>
      <div className="relative h-[300px] touch-pan-y select-none overflow-hidden sm:h-[380px]" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}>
        {items.map((d, i) => {
          let off = i - index;
          if (off > n / 2) off -= n;
          if (off < -n / 2) off += n;
          const pos = off * sign + (drag / 260) * 1;
          const abs = Math.abs(pos);
          if (abs > 3.2) return null;
          const x = pos * 46, rot = pos * 12, y = abs * abs * 7, scale = 1 - abs * 0.1;
          return (
            <div key={d.id} aria-hidden={i !== index}
              className="absolute left-1/2 top-4 w-[52vw] max-w-[270px] sm:top-6"
              style={{ transform: `translateX(-50%) translateX(${x}%) translateY(${y}%) rotate(${rot}deg) scale(${scale})`, zIndex: 10 - Math.round(abs * 2), transition: dragging ? 'none' : 'transform .6s cubic-bezier(.2,.7,.2,1), opacity .6s', opacity: abs > 2.6 ? 0 : 1 }}>
              <button type="button" tabIndex={-1} onClick={() => i !== index && setIndex(i)}
                className={`block aspect-[4/5] w-full overflow-hidden rounded-[2rem] border text-start ${i === index ? 'border-primary/80 shadow-[0_30px_80px_-20px_rgba(240,0,46,.55)]' : 'border-line'} bg-[radial-gradient(circle_at_50%_35%,#3a0010,#0d0d0d_70%)]`}>
                <svg viewBox="0 0 100 100" className="mx-auto mt-6 h-[62%] w-[80%]" aria-hidden>
                  {paths[d.id] && <path d={paths[d.id]} fill={i === index ? '#F0002E' : '#4a0010'} stroke="#fff" strokeWidth={0.6} strokeLinejoin="round" />}
                </svg>
                <div className="px-5 pb-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-muted">{String(i + 1).padStart(2, '0')} / {n}</p>
                  <p className="truncate font-display text-lg font-extrabold" dir="auto">{tr(d.name, lang)}</p>
                </div>
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex flex-col items-center text-center" aria-live="polite">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => go(-1 * sign)} aria-label={t('common.previous')} className="grid h-11 w-11 place-items-center rounded-full border border-line hover:border-white">
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary" aria-hidden><Hand className="h-5 w-5" /></span>
          <button type="button" onClick={() => go(1 * sign)} aria-label={t('common.next')} className="grid h-11 w-11 place-items-center rounded-full border border-line hover:border-white">
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">{t('home.carouselHint')}</p>
        <h3 className="mt-5 font-display text-3xl font-extrabold sm:text-4xl" dir="auto">{tr(current.name, lang)}</h3>
        <p className="mt-1 text-muted">{count ? t('home.discoveries', { count }) : t('home.noDiscoveriesYet')}</p>
        <Link to={to(`explore/ben-arous/${current.slug}`)} className="btn btn-ghost mt-5">{t('home.exploreDelegation', { name: tr(current.name, lang) })}</Link>
      </div>
    </section>
  );
}
